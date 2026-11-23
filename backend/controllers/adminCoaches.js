const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isInteger } = require("../utils/validUtils");

const adminCoachesController = {

    // 升級為教練 post /api/admin/coaches/{userId}  
    // 安全性註記（課程簡化）：這支 API 是 public、不需要登入就能呼叫。
    async upgradeToCoach(req, res, next) {

        // 1.取得userId
        const { userId } = req.params;

        // 2.取得req.bod
        const { experience_years, description, profile_image_url } = req.body;

        // 3.檢查欄位是否符合規則 年資要是integer且大於0，描述要是string，
        // 圖片url要是string且profile_image_url 是選填：
        // 可以整個不給、也可以給空字串，都會過。但只要有給非空的值，就必須以 https 開頭
        if (
            !isInteger(experience_years) ||
            experience_years < 0 ||
            !isValidString(description)
        ) {
            return next(appError(400, "欄位未填寫正確"));
        }
        if (
            profile_image_url &&
            profile_image_url !== "" &&
            (typeof profile_image_url !== "string" ||
                !profile_image_url.startsWith("https"))
        ) {
            return next(appError(400, "欄位未填寫正確"));
        }
        // 4.檢查是否為會員
        const userRepo = dataSource.getRepository("User");
        const user = await userRepo.findOneBy({ id: userId });
        if (!user) {
            return next(appError(404, "會員不存在"));
        }
        // 5.檢查是否為教練
        if (user.role === "COACH") {
            return next(appError(400, "會員已經是教練"));
        }
        // 6.更新會員角色為教練
        await userRepo.update(userId, { role: "COACH" });
        // 7.創建教練資料
        const coachRepo = dataSource.getRepository("Coach");
        const coach = await coachRepo.save({
            user_id: userId,
            experience_years,
            description: description.trim(),
            profile_image_url: profile_image_url || null,
        });


        // 8.回傳
        res.status(201).json({
            status: "success",
            data: {
                user: { name: user.name, role: "COACH" },
                coach
            }
        });
    },

    // GET /api/admin/coaches  只有教練本人能看
    async getProfile(req, res, next) {
        const coach = await dataSource.getRepository("Coach").findOneBy({
            user_id: req.user.id,
        });
        if (!coach) {
            return next(appError(400, "使用者尚未成為教練"));
        }

        const links = await dataSource.getRepository("CoachLinkSkill").find({
            where: { coach_id: coach.id },
        });

        res.json({
            status: "success",
            data: {
                experience_years: coach.experience_years,
                description: coach.description,
                profile_image_url: coach.profile_image_url,
                skill_ids: links.map((link) => link.skill_id),
            },
        });
    },

    // PUT /api/admin/coaches M3-3 自行練習
    async putProfile(req, res, next) {
        // 更新自己的年資、介紹、大頭貼與技能清單


        const { experience_years, description, profile_image_url, skill_ids } = req.body;


        // 需要登入，而且登入的人必須已經是教練 COACH
        if (!req.user.role === "COACH") {
            return next(appError(400, "使用者尚未成為教練"));
        }
        // 檢查欄位是否符合規則 年資要是integer且大於0，描述要是string，
        if (!isInteger(experience_years) || experience_years < 0 || !isValidString(description)) {
            return next(appError(400, "欄位未填寫正確"));
        }
        // 圖片url要是string且profile_image_url 必填 && https 開頭：
        if (profile_image_url && !isValidString(profile_image_url) || !profile_image_url.startsWith("https")) {
            return next(appError(400, "欄位未填寫正確"));
        }

        // 找出教練資料
        const coachRepo = dataSource.getRepository("Coach");
        const findCoach = await coachRepo.findOneBy({ user_id: req.user.id });
        const coachId = findCoach.id;
        // 更新教練資料
        await coachRepo.update(coachId, {
            experience_years,
            description: description.trim(),
            profile_image_url: profile_image_url,
        });
        // 更新技能清單  -   
        const coachLinkSkillRepo = dataSource.getRepository("CoachLinkSkill");
        await coachLinkSkillRepo.delete({ coach_id: coachId });
        const newSkillIds = skill_ids.map((skill_id) => ({ coach_id: coachId, skill_id: skill_id }));
        await coachLinkSkillRepo.save(newSkillIds);
        // 回傳
        res.status(200).json({
            status: "success",
            data: {
                experience_years,
                description: description.trim(),
                profile_image_url,
                skill_ids: newSkillIds.map((skill) => skill.skill_id),
            }
        });
    },

    // GET /api/admin/coaches/courses M3-4 自行練習 取得本教練的開設課程清
    async getCourses(req, res, next) {
        // 先取得USERID，然後取得課程
        const userId = req.user.id;
        const courses = await dataSource.getRepository("Course").find({
            where: { user_id: userId },
        });
        const now = new Date();
        res.json({
            status: "success",
            data: courses.map((course) => {
                let status = "已結束";
                if (course.start_at > now) {
                    status = "尚未開始";
                } else if (course.end_at > now) {
                    status = "進行中";
                }
                return {
                    id: course.id,
                    name: course.name,
                    status,
                    start_at: course.start_at,
                    end_at: course.end_at,
                    description: course.description,
                    max_participants: course.max_participants,
                    meeting_url: course.meeting_url,
                    participants: 0,
                };
            }),
        });
    },
    // POST /api/admin/coaches/courses M3-5 自行練習 教練開設課程
    async postCourse(req, res, next) {
        const { skill_id, name, description, start_at, end_at, max_participants, meeting_url } = req.body;

        // 全部欄位都是必填，缺一個、或是空字串，就回「欄位未填寫正確」。
        if (!isValidString(skill_id) || !isValidString(name) || !isValidString(description) || !isValidString(start_at) || !isValidString(end_at) || !isValidString(meeting_url)) {
            return next(appError(400, "欄位未填寫正確"));
        }
        // meeting_url 必須以 https 開頭，否則一樣回「欄位未填寫正確」。
        if (meeting_url && !meeting_url.startsWith("https")) {
            return next(appError(400, "欄位未填寫正確"));
        }
        // max_participants 必須是「數字型別」的 0 以上整數——送字串 "10" 會被擋下來。
        if (!isInteger(max_participants) || max_participants < 0) {
            return next(appError(400, "欄位未填寫正確"));
        }

        // 成功回 201，測試讀的是 data.course.id
        const course = await dataSource.getRepository("Course").save({
            user_id: req.user.id,
            skill_id: skill_id,
            name,
            description,
            start_at,
            end_at,
            max_participants,
            meeting_url,
            description,
        });
        res.status(201).json({
            status: "success",
            data: { course },
        });
    },
    // GET /api/admin/coaches/courses/:courseId M3-6 自行練習 取得單一課程
    async getCourse(req, res, next) {
        const courseId = req.params.courseId;
        const course = await dataSource.getRepository("Course").findOneBy({ id: courseId });
        if (!course || course.user_id !== req.user.id) {
            return next(appError(400, "課程不存在"));
        }
        res.json({
            status: "success",
            data: {
                id: course.id,
                name: course.name,
                description: course.description,
                skill_id: course.skill_id,
                start_at: course.start_at,
                end_at: course.end_at,
                max_participants: course.max_participants,
                meeting_url: course.meeting_url,
            },
        });
    },
    // PUT /api/admin/coaches/courses/:courseId M3-7 自行練習 更新單一課程
    async putCourse(req, res, next) {
        const courseId = req.params.courseId;
        const { skill_id, name, description, start_at, end_at, max_participants, meeting_url } = req.body;
        if (!isValidString(skill_id) || !isValidString(name) || !isValidString(description) || !isValidString(start_at) || !isValidString(end_at) || !isValidString(meeting_url)) {
            return next(appError(400, "欄位未填寫正確"));
        }
        if (meeting_url && !meeting_url.startsWith("https")) {
            return next(appError(400, "欄位未填寫正確"));
        }
        if (!isInteger(max_participants) || max_participants < 0) {
            return next(appError(400, "欄位未填寫正確"));
        }
        if (!isValidString(start_at) || !isValidString(end_at)) {
            return next(appError(400, "欄位未填寫正確"));
        }
        const course = await dataSource.getRepository("Course").findOneBy({ id: courseId });
        if (!course || course.user_id !== req.user.id) {
            return next(appError(400, "課程不存在"));
        }

        await dataSource.getRepository("Course").update(courseId, {
            skill_id,
            name,
            description,
            start_at,
            end_at,
            max_participants,
            meeting_url,
        });
        res.status(200).json({
            status: "success",
            data: {
                course: {
                    id: course.id,
                    user_id: course.user_id,
                    skill_id: course.skill_id,
                    name: course.name,
                    description: course.description,
                    start_at: course.start_at,
                    end_at: course.end_at,
                    max_participants: course.max_participants,
                    meeting_url: course.meeting_url,
                    created_at: course.created_at,
                    updated_at: course.updated_at,
                },
            },
        });
    },
};
module.exports = adminCoachesController;
