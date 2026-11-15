const express = require('express')
const coachesController = require('../controllers/coaches')
const verifyToken = require('../middlewares/verifyToken')
const appError = require('../utils/appError')

const router = express.Router()


// 已登入還不夠，角色必須是教練
function requireCoach(req, res, next) {
    if (req.user?.role !== 'COACH') {
        next(appError(401, '使用者尚未成為教練'))
        return
    }
    next()
}

// /courses 要寫在 /:userId 前面，不然 courses 會被當成 userId
router.get('/courses', verifyToken, requireCoach, coachesController.getMyCourses)
router.post('/courses', verifyToken, requireCoach, coachesController.createCourse)
router.get('/courses/:courseId', verifyToken, coachesController.getMyCourse)
router.put('/courses/:courseId', verifyToken, coachesController.updateMyCourse)

router.get('/', verifyToken, requireCoach, coachesController.getMyCoach)
router.put('/', verifyToken, requireCoach, coachesController.updateMyCoach)

// 升級不用登入。:userId 前面要有冒號，才是網址上的會員 id
router.post('/:userId', coachesController.upgradeToCoach)


module.exports = router
