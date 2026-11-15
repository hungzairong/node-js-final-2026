const express = require('express')
const cors = require('cors')
const skillRoutes = require('./routes/skill')
const creditPackageRoutes = require('./routes/creditPackage')
const userRoutes = require('./routes/user')
const adminRoutes = require('./routes/admin')
const app = express()

app.use(cors())          // W3：前端在 3000、我們在 8080，沒它前端全被擋
app.use(express.json())

// M0：健康檢查——回純文字 OK，不是 JSON；路徑不在 /api 底下
app.get('/healthcheck', (req, res) => {
  res.status(200).send('OK')
})

app.use('/api/coaches/skill', skillRoutes)
app.use('/api/credit-package', creditPackageRoutes)
app.use('/api/users', userRoutes)
app.use('/api/admin/coaches', adminRoutes)

// 404（W3）
app.use((req, res) => {
  res.status(404).json({ status: 'failed', message: '無此路由' })
})

// 錯誤處理守門員（W4：四個參數）
app.use((err, req, res, next) => {
  console.error(err)
  const status = err.status || 500
  const message = status === 500 ? '伺服器錯誤' : err.message
  res.status(status).json({ status: 'failed', message })
})

module.exports = app
