const express = require('express')
const authController = require('../controllers/user')
const isAuth = require('../middlewares/isAuth')

const router = express.Router()

router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.get('/profile', isAuth, authController.getProfile)
router.put('/profile', isAuth, authController.updateProfile)
router.put('/password', isAuth, authController.updatePassword)

module.exports = router
