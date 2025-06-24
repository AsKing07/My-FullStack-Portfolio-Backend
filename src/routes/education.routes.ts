import express from 'express';
import { getEducations, getEducationById, createEducation, updateEducation, deleteEducation } from '@/controllers/education.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Routes publiques
router.get('/', getEducations);
router.get('/:id', getEducationById);

// Routes protégées
router.post('/', authenticate, createEducation);
router.put('/:id', authenticate, updateEducation);
router.delete('/:id', authenticate, deleteEducation);

export default router;