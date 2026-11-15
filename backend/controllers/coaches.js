const { In } = require("typeorm");
const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isUuid } = require("../utils/isUuid");
const { isValidString, isInteger } = require("../utils/validUtils");

// 大頭貼可以不給。有給就必須是 https 開頭，回傳要存的網址
function optionalHttpsUrl(value) {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || !value.trim().startsWith("https")) return false;
  return value.trim();
}

// 更新教練資料時大頭貼必填，而且必須 https 開頭
function requiredHttpsUrl(value) {
  if (typeof value !== "string" || !value.trim().startsWith("https")) return false;
  return value.trim();
}

function courseStatus(startAt, endAt) {
  const now = Date.now();
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  if (now < start) return "尚未開始";
  if (now < end) return "進行中";
  return "已結束";
}

function readCourseBody(body) {
  const { skill_id, name, description, start_at, end_at, max_participants, meeting_url } = body ?? {};
  const meeting = typeof meeting_url === "string" ? meeting_url.trim() : "";
  if (!isUuid(skill_id) || !isValidString(name) || !isValidString(description)) return null;
  if (!isValidString(start_at) || !isValidString(end_at)) return null;
  if (Number.isNaN(new Date(start_at).getTime()) || Number.isNaN(new Date(end_at).getTime())) return null;
  if (!isInteger(max_participants) || max_participants < 0) return null;
  if (!meeting.startsWith("https")) return null;
  return {
    skill_id,
    name: name.trim(),
    description: description.trim(),
    start_at,
    end_at,
    max_participants,
    meeting_url: meeting,
  };
}

async function findMyCoach(userId) {
  return dataSource.getRepository("Coaches").findOneBy({ user_id: userId });
}

async function skillIdsOf(coachId) {
  const links = await dataSource.getRepository("CoachSkill").findBy({ coach_id: coachId });
  return links.map((link) => link.skill_id);
}

function coachProfile(coach, skillIds) {
  return {
    id: coach.id,
    experience_years: coach.experience_years,
    description: coach.description,
    profile_image_url: coach.profile_image_url,
    skill_ids: skillIds,
  };
}

const coachesController = {
  // 把會員升級成教練。這支不用登入，userId 來自網址
  async upgradeToCoach(req, res, next) {
    const { userId } = req.params;
    const { experience_years, description, profile_image_url } = req.body ?? {};
    const imageUrl = optionalHttpsUrl(profile_image_url);

    if (!isInteger(experience_years) || experience_years < 0 || !isValidString(description) || imageUrl === false) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    if (!isUuid(userId)) {
      next(appError(400, "使用者不存在"));
      return;
    }

    const userRepo = dataSource.getRepository("User");
    const coachRepo = dataSource.getRepository("Coaches");
    const user = await userRepo.findOneBy({ id: userId });
    if (!user) {
      next(appError(400, "使用者不存在"));
      return;
    }
    const existingCoach = await coachRepo.findOneBy({ user_id: user.id });
    if (user.role !== "USER" || existingCoach) {
      next(appError(409, "使用者已經是教練"));
      return;
    }

    const savedCoach = await dataSource.transaction(async (manager) => {
      user.role = "COACH";
      await manager.getRepository("User").save(user);
      return manager.getRepository("Coaches").save({
        user_id: user.id,
        experience_years,
        description: description.trim(),
        profile_image_url: imageUrl,
      });
    });

    res.status(201).json({
      status: "success",
      data: {
        user: { name: user.name, role: "COACH" },
        coach: { id: savedCoach.id },
      },
    });
  },

  // 看自己的教練資料。人是 token 裡的 id
  async getMyCoach(req, res, next) {
    const coach = await findMyCoach(req.user.id);
    if (!coach) {
      next(appError(401, "使用者尚未成為教練"));
      return;
    }
    const skillIds = await skillIdsOf(coach.id);
    res.json({ status: "success", data: coachProfile(coach, skillIds) });
  },

  // 改年資、介紹、大頭貼，技能整批換成這次送來的
  async updateMyCoach(req, res, next) {
    const { experience_years, description, profile_image_url, skill_ids } = req.body ?? {};
    const imageUrl = requiredHttpsUrl(profile_image_url);
    const ids = Array.isArray(skill_ids) ? [...new Set(skill_ids)] : [];

    if (!isInteger(experience_years) || experience_years < 0 || !isValidString(description) || imageUrl === false || ids.length === 0 || ids.some((id) => !isUuid(id))) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }

    const coach = await findMyCoach(req.user.id);
    if (!coach) {
      next(appError(401, "使用者尚未成為教練"));
      return;
    }

    const skills = await dataSource.getRepository("Skill").findBy({ id: In(ids) });
    if (skills.length !== ids.length) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }

    await dataSource.transaction(async (manager) => {
      coach.experience_years = experience_years;
      coach.description = description.trim();
      coach.profile_image_url = imageUrl;
      await manager.getRepository("Coaches").save(coach);
      await manager.getRepository("CoachSkill").delete({ coach_id: coach.id });
      await manager.getRepository("CoachSkill").save(ids.map((skill_id) => ({
        coach_id: coach.id,
        skill_id,
      })));
    });

    res.json({ status: "success", data: coachProfile(coach, ids) });
  },

  // 自己開的課。沒開過課回空陣列
  async getMyCourses(req, res, next) {
    const courses = await dataSource.getRepository("Course").find({
      where: { user_id: req.user.id },
      order: { start_at: "ASC" },
    });
    res.json({
      status: "success",
      data: courses.map((course) => ({
        id: course.id,
        user_id: course.user_id,
        skill_id: course.skill_id,
        name: course.name,
        description: course.description,
        start_at: course.start_at,
        end_at: course.end_at,
        max_participants: course.max_participants,
        meeting_url: course.meeting_url,
        status: courseStatus(course.start_at, course.end_at),
        participants: 0,
      })),
    });
  },

  // 開新課。user_id 用 token 的使用者 id
  async createCourse(req, res, next) {
    const body = readCourseBody(req.body);
    if (!body) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    const skill = await dataSource.getRepository("Skill").findOneBy({ id: body.skill_id });
    if (!skill) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }

    const saved = await dataSource.getRepository("Course").save({
      ...body,
      user_id: req.user.id,
    });
    res.status(201).json({
      status: "success",
      data: { course: { id: saved.id } },
    });
  },

  // 查自己的某一堂課。不是自己的課也回課程不存在
  async getMyCourse(req, res, next) {
    const { courseId } = req.params;
    if (!isUuid(courseId)) {
      next(appError(400, "課程不存在"));
      return;
    }
    const course = await dataSource.getRepository("Course").findOneBy({
      id: courseId,
      user_id: req.user.id,
    });
    if (!course) {
      next(appError(400, "課程不存在"));
      return;
    }
    res.json({
      status: "success",
      data: {
        id: course.id,
        user_id: course.user_id,
        skill_id: course.skill_id,
        name: course.name,
        description: course.description,
        start_at: course.start_at,
        end_at: course.end_at,
        max_participants: course.max_participants,
        meeting_url: course.meeting_url,
      },
    });
  },

  // 改自己的某一堂課。先檢查欄位，再檢查是不是自己的課
  async updateMyCourse(req, res, next) {
    const body = readCourseBody(req.body);
    if (!body) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    const { courseId } = req.params;
    if (!isUuid(courseId)) {
      next(appError(400, "課程不存在"));
      return;
    }
    const courseRepo = dataSource.getRepository("Course");
    const course = await courseRepo.findOneBy({
      id: courseId,
      user_id: req.user.id,
    });
    if (!course) {
      next(appError(400, "課程不存在"));
      return;
    }
    const skill = await dataSource.getRepository("Skill").findOneBy({ id: body.skill_id });
    if (!skill) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }

    Object.assign(course, body);
    const saved = await courseRepo.save(course);
    res.json({
      status: "success",
      data: {
        id: saved.id,
        user_id: saved.user_id,
        skill_id: saved.skill_id,
        name: saved.name,
        description: saved.description,
        start_at: saved.start_at,
        end_at: saved.end_at,
        max_participants: saved.max_participants,
        meeting_url: saved.meeting_url,
      },
    });
  },
};

module.exports = coachesController;
