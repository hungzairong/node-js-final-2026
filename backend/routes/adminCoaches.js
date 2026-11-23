// /api/admin/coaches/{userId}

const router = require("express").Router();
const adminCoachesController = require("../controllers/adminCoaches");
const isAuth = require("../middlewares/isAuth");
const isCoach = require("../middlewares/isCoach");


// 升級成功後，重新登入會打這支確認進得了教練後台 GET /api/admin/coaches M3-2 自行練習
router.get("/", isAuth, isCoach, adminCoachesController.getProfile);

// PUT /api/admin/coaches M3-3 自行練習
router.put("/", isAuth, isCoach, adminCoachesController.putProfile);

// GET /api/admin/coaches/courses M3-4 自行練習 取得本教練的開設課程清單
router.get("/courses", isAuth, isCoach, adminCoachesController.getCourses);

// POST /api/admin/coaches/courses M3-5 自行練習 新增課程
router.post("/courses", isAuth, isCoach, adminCoachesController.postCourse);

// GET /api/admin/coaches/courses/:courseId M3-6 自行練習 取得單一課程
router.get("/courses/:courseId", isAuth, isCoach, adminCoachesController.getCourse);

// PUT /api/admin/coaches/courses/:courseId M3-6 自行練習 更新單一課程
router.put("/courses/:courseId", isAuth, isCoach, adminCoachesController.putCourse);

// M3-1 自行練習。必須放在 /courses 後面，不然 courses 會被當成 userId
router.post("/:userId", adminCoachesController.upgradeToCoach);



module.exports = router;
