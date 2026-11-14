function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({ status: 'success', data })
}

function sendFailed(res, statusCode, message) {
  return res.status(statusCode).json({ status: 'failed', message })
}

module.exports = { sendSuccess, sendFailed }
