const app = require('../app')
const { dataSource } = require('../db/data-source')
const { port } = require('../config/web')

async function start() {
  try {
    await dataSource.initialize()
    console.log('資料庫連線成功')

    app.listen(port, () => {
      console.log(`server 跑起來了：http://localhost:${port}`)
    })
  } catch (err) {
    console.error('資料庫連線失敗', err)
    process.exit(1)   // 沒有資料庫就不營業
  }
}

start()
