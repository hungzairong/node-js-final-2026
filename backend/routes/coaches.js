const router = require("express").Router();
const coachesController = require("../controllers/coaches");



// GET/api/coaches 取得教練分類列表(不用登入)
router.get("/", coachesController.getCoaches);


// GET /api/coaches/{coachId}/courses 必須寫在 /:coachId 前面
router.get("/:coachId/courses", coachesController.getCoachCourses);
// GET /api/coaches/{coachId} 取得指定教練詳細資料(不用登入)
router.get("/:coachId", coachesController.getCoach);




module.exports = router;
