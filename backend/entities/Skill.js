// Skill entity
const {EntitySchema } =require('typeorm')

/**
 * `SKILL`（技能）
 * 欄位：`name` varchar(50) 必填且唯一
 * 關聯：無
 */
module.exports = new EntitySchema({
    tableName: 'SKILL',
    name: 'Skill',
    columns: {
        id: {
            type: 'uuid',
            primary: true,
            generated: 'uuid', //不需要自己生成id，由typeorm生成
            },
        name: {
            type: 'varchar',
            length: 50,
            nullable: false,
            unique: true,
        },
    },
});
