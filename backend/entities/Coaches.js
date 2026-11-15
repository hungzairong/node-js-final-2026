// coaches entity
const { EntitySchema } = require('typeorm')

/**
 * `COACHES`（教練）
    id: uuid,
    user_id: uuid,
    experience_years: int,
    description: varchar 必填,
    profile_image_url: varchar 可空,
    created_at: timestamp 必填,
    updated_at: timestamp 必填,
 */
module.exports = new EntitySchema({ 
    tableName: 'coaches',
    name: 'Coaches',
    columns: {
        id: {
            type: 'uuid',
            primary: true,
            generated: 'uuid',
        },
        user_id: {
            type: 'uuid',
            nullable: false,
            unique: true,
        },
        experience_years: {
            type: 'int',
            nullable: false,
            default: 0,
        },
        description: {
            type: 'varchar',
            nullable: true,
        },
        profile_image_url: {
            type: 'varchar',
            length: 2048,
            nullable: true,
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
        },
        updated_at: {
            type: 'timestamp',
            updateDate: true,
        },
    },
    relations: {
        user: {
            type: 'one-to-one',
            target: 'User',
            joinColumn: {
                name: 'user_id',
            },
        }
    },
})
