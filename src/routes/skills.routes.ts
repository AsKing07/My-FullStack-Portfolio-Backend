import express from 'express';
import { getSkills, getSkill, addSkill, updateSkill, deleteSkill } from '../controllers/skills.controller';

const router = express.Router();

import { authenticate } from '../middleware/auth';

//Routes publiques
router.get('/', getSkills);
router.get('/:id', getSkill);

//Routes protégées
router.post('/', authenticate, addSkill);
router.put('/:id', authenticate, updateSkill);
router.delete('/:id', authenticate, deleteSkill);

export default router;