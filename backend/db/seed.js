// 新增方案

const planRepo = () => {
  return dataSource.getRepository('Plan')
}

const seedPlans = async () => {
  const plans = [
    { name: 'Basic', price: 100, description: 'Basic plan' },
    { name: 'Pro', price: 200, description: 'Pro plan' },
    { name: 'Enterprise', price: 300, description: 'Enterprise plan' },
  ]
  const repo = planRepo()
  const existingPlans = await repo.find()
  if (existingPlans.length > 0) {
    return
  }
  const newPlans = repo.create(plans)
  await repo.save(newPlans)
}

module.exports = { seedPlans }