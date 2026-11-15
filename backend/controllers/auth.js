const { dataSource } = require('../db/data-source')
const { sendSuccess, sendFailed } = require('../utils/response')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { get } = require('../config')

const PASSWORD_MESSAGE = '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'

const jwtSecret = get('secret.jwtSecret')
const jwtExpiresDay = get('secret.jwtExpiresDay')
function userRepo() {
  return dataSource.getRepository('User')
}

// 必填欄位
function requiredText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

// 密碼規則
function isValidPassword(password) {
  return typeof password === 'string'
    && password.length >= 8
    && password.length <= 16
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /[0-9]/.test(password)
}

// 生成 token
function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    jwtSecret,
    { expiresIn: jwtExpiresDay }
  )
}

// 註冊
const signup = async (req, res) => {
  const name = requiredText(req.body?.name)
  const email = requiredText(req.body?.email)
  const password = req.body?.password

  if (!name || !email || !password) {
    return sendFailed(res, 400, '欄位未填寫正確')
  }
  if (!isValidPassword(password)) {
    return sendFailed(res, 400, PASSWORD_MESSAGE)
  }

  const repo = userRepo()
  // const existingUser = await repo.findOne({ where: { email } })
  const existingUser = await repo.findOneBy({ email: email.toLowerCase().trim() })

  if (existingUser) {
    return sendFailed(res, 409, 'Email 已被使用')
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const newUser = repo.create({
    name,
    email,
    password: hashedPassword,
    role: 'USER',
  })
  const saved = await repo.save(newUser)
  return sendSuccess(res, { user: { id: saved.id, name: saved.name } }, 201)
}

// 登入
const login = async (req, res) => {
  const email = requiredText(req.body?.email)
  const password = req.body?.password

  if (!email || !password) {
    return sendFailed(res, 400, '欄位未填寫正確')
  }
  if (!isValidPassword(password)) {
    return sendFailed(res, 400, PASSWORD_MESSAGE)
  }

  const user = await userRepo().findOne({ where: { email } })
  const passwordOk = user && await bcrypt.compare(password, user.password)
  if (!passwordOk) {
    return sendFailed(res, 400, '使用者不存在或密碼輸入錯誤')
  }

  return sendSuccess(res, {
    token: signToken(user),
    user: { name: user.name },
  }, 201)
}

// 取得個人資料
const getProfile = async (req, res) => {
  const user = await userRepo().findOne({ where: { id: req.user.id } })
  if (!user) {
    return sendFailed(res, 401, '無效的 token')
  }
  return sendSuccess(res, { user: { name: user.name, email: user.email } })
}

// 更新個人資料
const updateProfile = async (req, res) => {
  const name = requiredText(req.body?.name)
  if (!name) {
    return sendFailed(res, 400, '欄位未填寫正確')
  }

  const user = await userRepo().findOne({ where: { id: req.user.id } })
  if (!user) {
    return sendFailed(res, 401, '無效的 token')
  }
  if (user.name === name) {
    return sendFailed(res, 400, '使用者名稱未變更')
  }

  user.name = name
  await userRepo().save(user)
  return sendSuccess(res, { user: { name: user.name } })
}

// 更新密碼
const updatePassword = async (req, res) => {
  const password = req.body?.password
  const newPassword = req.body?.new_password
  const confirmPassword = req.body?.confirm_new_password

  if (!password || !newPassword || !confirmPassword) {
    return sendFailed(res, 400, '欄位未填寫正確')
  }
  if (!isValidPassword(password) || !isValidPassword(newPassword) || !isValidPassword(confirmPassword)) {
    return sendFailed(res, 400, PASSWORD_MESSAGE)
  }
  if (newPassword === password) {
    return sendFailed(res, 400, '新密碼不能與舊密碼相同')
  }
  if (newPassword !== confirmPassword) {
    return sendFailed(res, 400, '新密碼與驗證新密碼不一致')
  }

  const user = await userRepo().findOne({ where: { id: req.user.id } })
  if (!user) {
    return sendFailed(res, 401, '無效的 token')
  }
  const passwordOk = await bcrypt.compare(password, user.password)
  if (!passwordOk) {
    return sendFailed(res, 400, '密碼輸入錯誤')
  }

  user.password = await bcrypt.hash(newPassword, 10)
  await userRepo().save(user)
  return sendSuccess(res, null)
}

module.exports = { signup, login, getProfile, updateProfile, updatePassword }
