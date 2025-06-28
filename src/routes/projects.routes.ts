import express from 'express';
import { authenticate } from '../middleware/auth';

import { getProjects, getAllProjects, getProject, createProject, updateProject, deleteProject, bulkDeleteProjects, uploadProjectImages } from '../controllers/projects.controller';
import { uploadMiddleware, uploadImagesMiddleware } from '@/utils/saveFile_utils';

const router = express.Router();

// Routes publiques
router.get('/', getProjects); //Que les projets publiés
router.get('/all', authenticate, getAllProjects); //Tous les projets, y compris ceux non publiés



// Routes protégées 
router.post('/', authenticate, createProject);
router.post('/image', authenticate, uploadMiddleware('images'), uploadProjectImages); // Note: This route handles one image at a time, not multiple images
router.post('/images', authenticate, uploadImagesMiddleware('images'), uploadProjectImages); // This route handles multiple images
router.delete('/bulk-delete', authenticate,bulkDeleteProjects)

//Routes dynamique à placer en dernier
router.get('/:slug', getProject);
router.put('/:id', authenticate, updateProject);
router.delete('/:id', authenticate, deleteProject);


export default router;