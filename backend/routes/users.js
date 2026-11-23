const router = require("express").Router();
const usersController = require("../controllers/users");
const isAuth = require("../middlewares/isAuth");

router.get("/profile", isAuth, usersController.getProfile);

router.post("/signup", usersController.signup);
router.post("/login", usersController.login);
router.put("/profile", isAuth, usersController.putProfile);
router.put("/password", isAuth, usersController.putPassword);


// M5-2 + M5-3 需登入
router.get("/credit-package", isAuth, usersController.getCreditPackage);

router.get("/courses", isAuth, usersController.getCourses);

module.exports = router;
