const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString } = require("../utils/validUtils");

const skillController = {
  async getSkills(req, res, next) {
    const skills = await dataSource.getRepository("Skill").find({
      select: { id: true, name: true },
    });
    res.json({
      status: "success",
      data: skills,
    });
    return;
  },

  async postSkill(req, res, next) {
    const { name } = req.body;
    if (!isValidString(name)) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }

    const skillRepo = dataSource.getRepository("Skill");
    const findSkill = await skillRepo.findOneBy({ name: name.trim() });

    if (findSkill) {
      next(appError(409, "資料重複"));
      return;
    }

    const newSkill = await skillRepo.save({ name: name.trim() });
    // 那請問findOne 有 by 跟沒 by 差在哪呢
    // 自動用PK當條件  by可以自選欄位嗎? 我等等查 感謝
    res.json({
      status: "success",
      data: newSkill,
    });
    return;
  },

  async deleteSkill(req, res, next) {
    const { skillId } = req.params;
    const result = await dataSource.getRepository("Skill").delete(skillId); // drop

    if (result.affected === 0) {
      next(appError(400, "ID錯誤"));
      return;
    }

    res.json({
      status: "success",
    });
    return;
  },
};

module.exports = skillController;
