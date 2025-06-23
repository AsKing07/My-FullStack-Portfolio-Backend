const express = require('express');

const router = express.Router();
const { getSkills, getSkill, addSkill, updateSkill, deleteSkill } = require('../controllers/skills.controller');

import { authenticate } from '../middleware/auth';

//Routes publiques
router.get('/', getSkills);
router.get('/:id', getSkill);

//Routes protégées
router.post('/', authenticate, addSkill);
router.put('/:id', authenticate, updateSkill);
router.delete('/:id', authenticate, deleteSkill);

export default router;