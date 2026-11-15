const express = require('express')
const adminController = require('../controllers/admin')
const isAuth = require('../middlewares/isAuth')
const requireCoach = require('../middlewares/isCoach')

const router = express.Router()




// /courses 要寫在 /:userId 前面，不然 courses 會被當成 userId
router.get('/courses', isAuth, requireCoach, adminController.getMyCourses)
router.post('/courses', isAuth, requireCoach, adminController.createCourse)
router.get('/courses/:courseId', isAuth, adminController.getMyCourse)
router.put('/courses/:courseId', isAuth, adminController.updateMyCourse)

router.get('/', isAuth, requireCoach, adminController.getMyCoach)
router.put('/', isAuth, requireCoach, adminController.updateMyCoach)

// 升級不用登入。:userId 前面要有冒號，才是網址上的會員 id
router.post('/:userId', adminController.upgradeToCoach)


module.exports = router
