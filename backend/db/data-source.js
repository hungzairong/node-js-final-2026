require('dotenv').config()
const { DataSource } = require('typeorm')
const Skill = require('../entities/Skill')
const CreditPackage = require('../entities/CreditPackage')

const dbConfig = require('../config/db')
const dataSource = new DataSource({
  type: 'postgres',
  host: dbConfig.host,
  port: Number(dbConfig.port),
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  synchronize: dbConfig.synchronize,
  ssl: dbConfig.ssl,
  entities: [
    // 今天的 entities 會一個一個長出來
    Skill,
    CreditPackage,
  ],
  migrations: ['db/migrations/*.js'], // 遷移檔案的存放位置

})


module.exports = { dataSource }
