// CreditPackage entity
const { EntitySchema } = require('typeorm')

/**
 * `CREDIT_PACKAGE`（購買方案）
 * 欄位：`name` varchar(50) 必填且唯一
 *       `credit_amount` int 必填（堂數）
 *       `price` int 必填（價格）
 * 關聯：無
 */
module.exports = new EntitySchema({
  tableName: 'CREDIT_PACKAGE',
  name: 'CreditPackage',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    name: {
      type: 'varchar',
      length: 50,
      nullable: false,
      unique: true,
    },
    credit_amount: {
      type: 'int',
      nullable: false,
    },
    price: {
      type: 'int',
      nullable: false,
    },
  },
})
