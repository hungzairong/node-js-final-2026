require('dotenv').config()
const { DataSource } = require('typeorm')
const Skill = require('../entities/Skill')
const CreditPackage = require('../entities/CreditPackage')
const User = require('../entities/User')
const { get } = require('../config')

const dataSource = new DataSource({
  type: 'postgres',
  host: get('db.host'),
  port: Number(get('db.port')),
  username: get('db.username'),
  password: get('db.password'),
  database: get('db.database'),
  synchronize: get('db.synchronize'),
  ssl: get('db.ssl'),
  entities: [
    // 今天的 entities 會一個一個長出來
    Skill,
    CreditPackage,
    User,
  ],
  migrations: ['db/migrations/*.js'], // 遷移檔案的存放位置

})


module.exports = { dataSource }
