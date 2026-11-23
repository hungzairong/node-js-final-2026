const { dataSource } = require("../db/data-source");
const { MoreThan } = require("typeorm");
const appError = require("../utils/appError");

const coachesController = {

    // GET /api/coaches 取得教練分類列表(不用登入)
    async getCoaches(req, res, next) {
        // 回傳教練列表，支援分頁。per 是每頁筆數、page 是第幾頁（從 1 開始）。 

        // 分頁要真的有作用：回第 page 頁、每頁最多 per 筆；該頁沒資料就回空陣列（仍是成功），不算錯誤。
        const per = Number(req.query.per);
        const page = Number(req.query.page);
        if (!Number.isInteger(per) || per <= 0 || !Number.isInteger(page) || page <= 0) {
            return next(appError(400, "欄位未填寫正確"));
        }
        // 取得教練分類列表
        const coaches = await dataSource.getRepository("Coach").find({
            relations: { user: true },
            order: { user: { name: "ASC" } },
            skip: (page - 1) * per, // 跳過前幾筆
            take: per, // 每頁幾筆
        });
      
        res.json({ status: "success", data: coaches.map((coach) => ({
            id: coach.id,
            user_id: coach.user_id,
            name: coach.user.name,
        })) });
    },

    // GET /api/coaches/{coachId} 取得指定教練詳細資料(不用登入)
    async getCoach(req, res, next) {
        const coach = await dataSource.getRepository("Coach").findOne({
            where: { id: req.params.coachId },
            relations: { user: true },
        });
        if (!coach) {
            return next(appError(400, "找不到教練"));
        }

        const links = await dataSource.getRepository("CoachLinkSkill").find({
            where: { coach_id: coach.id },
            relations: { skill: true },
        });

        res.json({
            status: "success",
            data: {
                user: { name: coach.user.name },
                coach: {
                    id: coach.id,
                    experience_years: coach.experience_years,
                    description: coach.description,
                    profile_image_url: coach.profile_image_url,
                    skills: links.map((link) => link.skill.name),
                },
            },
        });
    },

    // GET /api/coaches/{coachId}/courses 取得指定教練"未結束"開設的課程列表(不用登入)
    async getCoachCourses(req, res, next) {
        const coach = await dataSource.getRepository("Coach").findOne({
            where: { id: req.params.coachId },
            relations: { user: true },
        });
        if (!coach) {
            return next(appError(400, "找不到教練"));
        }

        const courses = await dataSource.getRepository("Course").find({
            where: { user_id: coach.user_id, end_at: MoreThan(new Date()) },
            relations: { skill: true },
        });

        res.json({
            status: "success",
            data: courses.map((course) => ({
                id: course.id,
                name: course.name,
                description: course.description,
                start_at: course.start_at,
                end_at: course.end_at,
                max_participants: course.max_participants,
                coach_name: coach.user.name,
                skill_name: course.skill.name,
            })),
        });
    },
};

module.exports = coachesController;
