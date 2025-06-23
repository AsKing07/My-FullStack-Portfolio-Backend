const express = require('express');

import { getCategories, getCategoryBySlug, updateCategory, createCategory, deleteCategory } from '../controllers/category.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();


// Routes publiques
router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);

// Routes protégées
router.post('/', authenticate, createCategory);
router.put('/:id', authenticate, updateCategory);
router.delete('/:id', authenticate, deleteCategory);

export default router;