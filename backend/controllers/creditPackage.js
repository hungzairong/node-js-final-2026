const { dataSource } = require('../db/data-source')
const { isUuid } = require('../utils/isUuid')
const { sendSuccess, sendFailed } = require('../utils/response')

function creditPackageRepo() {
  return dataSource.getRepository('CreditPackage')
}

function requiredText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function isNonNegativeInt(value) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

// 新增購買方案
const createCreditPackage = async (req, res) => {
  const name = requiredText(req.body?.name)
  const { credit_amount, price } = req.body ?? {}
  if (!name || !isNonNegativeInt(credit_amount) || !isNonNegativeInt(price)) {
    return sendFailed(res, 400, '欄位未填寫正確')
  }

  const repo = creditPackageRepo()
  const existing = await repo.findOne({ where: { name } })
  if (existing) {
    return sendFailed(res, 409, '資料重複')
  }

  const pkg = repo.create({ name, credit_amount, price })
  const saved = await repo.save(pkg)
  return sendSuccess(res, saved)
}

// 刪除購買方案
const deleteCreditPackage = async (req, res) => {
  const { id } = req.params
  if (!isUuid(id)) {
    return sendFailed(res, 400, 'ID錯誤')
  }

  const result = await creditPackageRepo().delete(id)
  if (!result.affected) {
    return sendFailed(res, 400, 'ID錯誤')
  }

  return sendSuccess(res, result)
}

// 取得所有購買方案
const getCreditPackages = async (req, res) => {
  const packages = await creditPackageRepo().find()
  return sendSuccess(res, packages)
}

module.exports = { createCreditPackage, deleteCreditPackage, getCreditPackages }
