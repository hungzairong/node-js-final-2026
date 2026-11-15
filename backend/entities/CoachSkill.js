const { EntitySchema } = require('typeorm')

/**
 * `COACH_SKILL`（教練和技能的對照）
 * coach_id + skill_id，一位教練可以有多個技能
 */
module.exports = new EntitySchema({
  name: 'CoachSkill',
  tableName: 'COACH_SKILL',
  columns: {
    coach_id: {
      type: 'uuid',
      primary: true,
    },
    skill_id: {
      type: 'uuid',
      primary: true,
    },
  },
})
