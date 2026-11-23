const { dataSource } = require("../db/data-source");
const { IsNull } = require("typeorm");
const appError = require("../utils/appError");

const coursesController = {

    // GET /api/courses 取得全站"進行中"的課程列表(不用登入)
    // 口徑：start_at <= now < end_at
    async searchCourses(req, res, next) {
        const now = new Date();
        const courses = await dataSource
            .getRepository("Course")
            .createQueryBuilder("course")
            .leftJoinAndSelect("course.user", "user")
            .leftJoinAndSelect("course.skill", "skill")
            .where("course.start_at <= :now", { now })
            .andWhere("course.end_at > :now", { now })
            .getMany();
    
        const data = courses.map((course) => ({
            id: course.id,
            name: course.name,
            description: course.description,
            start_at: course.start_at,
            end_at: course.end_at,
            max_participants: course.max_participants,
            coach_name: course.user.name,
            skill_name: course.skill.name,
        }));
        res.json({ status: "success", data });
    },
    // POST /api/courses/:courseId 報名課程
    // 檢查順序：課程存在 → 是否已報名過（含已取消）→ 剩餘堂數 → 課程名額
    // 同時報名：先鎖使用者、再鎖課程。下一個請求要等這次提交後才能檢查。
    async buyCourse(req, res, next) {
        const { courseId } = req.params;
        const userId = req.user.id;

        try {
            await dataSource.transaction(async (manager) => {
                // 鎖的順序固定：先使用者、再課程。以後別的地方也要鎖時，用同一個順序。
                const user = await manager
                    .createQueryBuilder("User", "user")  // 鎖使用者
                    .setLock("pessimistic_write")  // 鎖模式：悲觀鎖
                    .where("user.id = :userId", { userId })  // 鎖使用者id
                    .getOne(); // 取得使用者資料



                if (!user) {
                    throw appError(401, "無效的 token");
                }
                // 鎖課程
                const course = await manager
                    .createQueryBuilder("Course", "course")  // 鎖課程
                    .setLock("pessimistic_write")  // 鎖模式：悲觀鎖
                    .where("course.id = :courseId", { courseId })  // 鎖課程id
                    .getOne(); // 取得課程資料
                if (!course) {
                    throw appError(400, "課程不存在"); // 課程不存在
                }
                // 取得報名課程紀錄表
                const courseBookingRepo = manager.getRepository("CourseBooking");
                // 取得購買方案紀錄表
                const creditPurchaseRepo = manager.getRepository("CreditPurchase");
                // 取得報名課程紀錄表的資料
                const courseBooking = await courseBookingRepo.findOne({ where: { user_id: userId, course_id: courseId } });
                if (courseBooking) {
                    throw appError(400, "已經報名過此課程"); // 已經報名過此課程
                }
                // 取得購買方案紀錄表的資料
                const creditPurchases = await creditPurchaseRepo.find({ where: { user_id: userId } });
                // 總堂數 = 購買方案紀錄表的總堂數
                const totalCourse = creditPurchases.reduce((acc, curr) => acc + curr.purchased_credits, 0);

                // 已報名的堂數 = 報名課程紀錄表的已報名堂數
                const bookedCourse = await courseBookingRepo.count({
                    where: { user_id: userId, cancelled_at: IsNull() },
                });

                // 總堂數 - 已報名的堂數 <= 0 --> 已無可使用堂數
                if (totalCourse - bookedCourse <= 0) {
                    throw appError(400, "已無可使用堂數");
                }
                // 已報名人數 = 報名課程紀錄表的已報名人數
                const participantCount = await courseBookingRepo.count({
                    where: { course_id: courseId, cancelled_at: IsNull() },
                });
                // 已報名人數 >= 課程最大參加人數 --> 已達最大參加人數，無法參加
                if (participantCount >= course.max_participants) {
                    throw appError(400, "已達最大參加人數，無法參加");
                }

                await courseBookingRepo.save({ user_id: userId, course_id: courseId });
            });
        } catch (error) {
            return next(error);
        }

        res.status(201).json({ status: "success", data: null });
    },

    // DELETE /api/courses/:courseId 取消報名（軟刪除：只標 cancelled_at）
    async cancelCourse(req, res, next) {
        const { courseId } = req.params;
        const courseBookingRepo = dataSource.getRepository("CourseBooking");
        const booking = await courseBookingRepo.findOne({
            where: {
                user_id: req.user.id,
                course_id: courseId,
                cancelled_at: IsNull(),
            },
        });
        if (!booking) {
            return next(appError(400, "已經沒有可取消的報名"));
        }

        booking.cancelled_at = new Date();
        await courseBookingRepo.save(booking);
        res.json({ status: "success", data: null });
    },

};

module.exports = coursesController;
