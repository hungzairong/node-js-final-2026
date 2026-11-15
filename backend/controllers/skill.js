const { dataSource } = require('../db/data-source')
const { isUuid } = require('../utils/isUuid')
const { sendSuccess, sendFailed } = require('../utils/response')

function skillRepo() {
  return dataSource.getRepository('Skill')
}

// 新增技能
const createSkill = async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  if (!name) {
    return sendFailed(res, 400, '欄位未填寫正確')
  }

  const repo = skillRepo()
  const existing = await repo.findOne({ where: { name } })
  if (existing) {
    return sendFailed(res, 409, '資料重複')
  }

  const skill = repo.create({ name })
  const saved = await repo.save(skill)
  return sendSuccess(res, saved)
}

// 更新技能
const updateSkill = async (req, res) => {
  const { id } = req.params
  if (!isUuid(id)) {
    return sendFailed(res, 400, 'ID錯誤')
  }

  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  if (!name) {
    return sendFailed(res, 400, '欄位未填寫正確')
  }

  const repo = skillRepo()
  const skill = await repo.findOne({ where: { id } })
  if (!skill) {
    return sendFailed(res, 400, 'ID錯誤')
  }

  const duplicate = await repo.findOne({ where: { name } })
  if (duplicate && duplicate.id !== id) {
    return sendFailed(res, 409, '資料重複')
  }

  skill.name = name
  const saved = await repo.save(skill)
  return sendSuccess(res, saved)
}

// 刪除技能
const deleteSkill = async (req, res) => {
  const { id } = req.params
  if (!isUuid(id)) {
    return sendFailed(res, 400, 'ID錯誤')
  }

  const result = await skillRepo().delete(id)
  if (!result.affected) {
    return sendFailed(res, 400, 'ID錯誤')
  }

  return sendSuccess(res, result)
}

// 取得所有技能
const getSkills = async (req, res) => {
  const skills = await skillRepo().find({
    select: { id: true, name: true },
    order: { created_at: 'ASC' }
  })
  return sendSuccess(res, skills)
}

module.exports = { createSkill, updateSkill, deleteSkill, getSkills }
