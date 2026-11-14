const express = require('express')
const authController = require('../controllers/auth')
const verifyToken = require('../middlewares/verifyToken')

const router = express.Router()

router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.get('/profile', verifyToken, authController.getProfile)
router.put('/profile', verifyToken, authController.updateProfile)
router.put('/password', verifyToken, authController.updatePassword)

module.exports = router
