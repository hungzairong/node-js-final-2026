// User entity
const {EntitySchema } =require('typeorm')

/**
 * `USER`（用戶）
 * 欄位：`name` varchar(50) 必填且唯一
 * 欄位：`email` varchar(50) 必填且唯一
 * 欄位：`password` varchar(50) 必填
 * 欄位：`role` varchar(50) 必填 預設為 'user'
 * 欄位：`createdAt` timestamp 必填 預設為 CURRENT_TIMESTAMP
 * 欄位：`updatedAt` timestamp 必填 預設為 CURRENT_TIMESTAMP
 * 欄位：`deletedAt` timestamp 可選
 * 關聯：無
 */
module.exports = new EntitySchema({
    tableName: 'USER',
    name: 'User',
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
        email: {
            type: 'varchar',
            length: 50,
            nullable: false,
            unique: true,
        },
        password: {
            type: 'varchar',
            length: 255,
            nullable: false,
        },
        role: {
            type: 'varchar',
            length: 50,
            nullable: false,
            default: 'USER',
        },
        createdAt: {
            type: 'timestamp',
            nullable: false,
            default: () => 'CURRENT_TIMESTAMP',
        },
        updatedAt: {
            type: 'timestamp',
            nullable: false,
            default: () => 'CURRENT_TIMESTAMP',
        },
        deletedAt: {
            type: 'timestamp',
            nullable: true,
        },
    },
});
