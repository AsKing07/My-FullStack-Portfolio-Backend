const express = require('express');

const{
    getPosts,
    getPostsAdmin,
    getPostBySlug,
    createPost,
    updatePost,
    deletePost,
    publishPost
} = require('../controllers/blog.controller');

import {authenticate} from '../middleware/auth';
const router = express.Router();
import {uploadMiddleware} from '../utils/saveFile_utils';


//Routes publiques
router.get('/', getPosts);


// Routes protégées (admin)
router.get('/admin', authenticate, getPostsAdmin);
router.post('/', authenticate, uploadMiddleware('image'), createPost);
router.put('/:id', authenticate, uploadMiddleware('image'), updatePost);
router.put('/:id/publish', authenticate, publishPost)
router.delete('/:id', authenticate, deletePost);


// Route dynamique à placer en dernier
router.get('/:slug', getPostBySlug);


export default router;