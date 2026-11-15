const appError = require('../utils/appError')

// 已登入還不夠，角色必須是教練
function requireCoach(req, res, next) {
    if (req.user?.role !== 'COACH') {
        next(appError(401, '使用者尚未成為教練'))
        return
    }
    next()
}

module.exports = requireCoach