const jwt = require('jsonwebtoken')
const { sendFailed } = require('../utils/response')

/**
 * JWT 守門員：驗 Authorization header 的 Bearer token
 */
function verifyToken(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return sendFailed(res, 401, '請先登入')
  }

  const token = header.slice('Bearer '.length)
  if (!token) {
    return sendFailed(res, 401, '請先登入')
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendFailed(res, 401, 'Token 已過期')
    }
    return sendFailed(res, 401, '無效的 token')
  }
}

module.exports = verifyToken
