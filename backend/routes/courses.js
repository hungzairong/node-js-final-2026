const router = require("express").Router();
const coursesController = require("../controllers/courses");
const isAuth = require("../middlewares/isAuth");



// GET /api/courses 取得全站"進行中"的課程列表(不用登入)
router.get("/", coursesController.searchCourses);

// POST /api/courses/:courseId 報名課程
router.post("/:courseId", isAuth, coursesController.buyCourse);

// DELETE /api/courses/:courseId 取消報名課程
router.delete("/:courseId", isAuth, coursesController.cancelCourse);

module.exports = router;
