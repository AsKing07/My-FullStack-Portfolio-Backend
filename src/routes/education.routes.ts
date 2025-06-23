import express from 'express';
import { getExperiences, getExperienceById, createExperience, updateExperience, deleteExperience } from '../controllers/experience.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Routes publiques
router.get('/', getExperiences);
router.get('/:id', getExperienceById);

// Routes protégées
router.post('/', authenticate, createExperience);
router.put('/:id', authenticate, updateExperience);
router.delete('/:id', authenticate, deleteExperience);

export default router;