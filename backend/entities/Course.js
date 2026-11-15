const { EntitySchema } = require('typeorm')

/**
 * `COURSE`（課程）
 * user_id 是開課的使用者 id，不是教練 id
 */
module.exports = new EntitySchema({
  name: 'Course',
  tableName: 'COURSE',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    user_id: {
      type: 'uuid',
      nullable: false,
    },
    skill_id: {
      type: 'uuid',
      nullable: false,
    },
    name: {
      type: 'varchar',
      length: 100,
      nullable: false,
    },
    description: {
      type: 'varchar',
      length: 1000,
      nullable: false,
    },
    start_at: {
      type: 'timestamp',
      nullable: false,
    },
    end_at: {
      type: 'timestamp',
      nullable: false,
    },
    max_participants: {
      type: 'int',
      nullable: false,
    },
    meeting_url: {
      type: 'varchar',
      length: 2048,
      nullable: false,
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
})
