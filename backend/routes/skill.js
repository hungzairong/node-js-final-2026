const express = require('express');
const skillController = require('../controllers/skill');

const router = express.Router();

router.get('/', skillController.getSkills);

router.post('/', skillController.createSkill);

router.put('/:id', skillController.updateSkill);

router.delete('/:id', skillController.deleteSkill);

module.exports = router;
