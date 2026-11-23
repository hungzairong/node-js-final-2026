const { EntitySchema } = require("typeorm");
// 方案紀錄表
module.exports = new EntitySchema({
  name: "CreditPackage",
  tableName: "credit_packages",
  columns: {
    id: { type: "uuid", primary: true, generated: "uuid" },
    name: { type: "varchar", length: 100, nullable: false, unique: true },
    credit_amount: { type: "integer", nullable: false, default: 0 },
    price: { type: "integer", nullable: false, default: 0 },
    created_at: { type: "timestamptz", createDate: true },
  },
});
