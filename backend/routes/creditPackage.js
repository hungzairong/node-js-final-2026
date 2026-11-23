const router = require("express").Router();
const isAuth = require("../middlewares/isAuth");
const creditPackageController = require("../controllers/creditPackage");

router.get("/", creditPackageController.getAll);
router.post("/", creditPackageController.create);
router.delete("/:creditPackageId", creditPackageController.remove);

// M5-1 購買堂數方案 需登入
router.post("/:creditPackageId", isAuth, creditPackageController.purchase);

module.exports = router;
