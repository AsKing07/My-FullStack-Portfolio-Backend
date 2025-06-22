const express = require('express');

const{
    getPosts,
    getPostsAdmin,
    getPostBySlug,
    createPost,
    updatePost,
    deletePost
} = require('../controllers/blog.controller');

import {authenticate} from '../middleware/auth';
const router = express.Router();
import {uploadMiddleware} from '../utils/saveFile_utils';


//Routes publiques
router.get('/', getPosts);
router.get('/:slug', getPostBySlug);

// Routes protégées (admin)
router.get('/admin', authenticate, getPostsAdmin);
router.post('/', authenticate, uploadMiddleware('image'), createPost);
router.put('/:id', authenticate, uploadMiddleware('image'), updatePost);
router.delete('/:id', authenticate, deletePost);


export default router;