const express = require('express');
import { authenticate } from '../middleware/auth';

import { getProjects, getProject, createProject, updateProject, deleteProject } from '../controllers/projects.controller';

const router = express.Router();

// Routes publiques
router.get('/', getProjects);
router.get('/:slug', getProject);

// Routes protégées 
router.post('/', authenticate, createProject);
router.put('/:id', authenticate, updateProject);
router.delete('/:id', authenticate, deleteProject);

export default router;