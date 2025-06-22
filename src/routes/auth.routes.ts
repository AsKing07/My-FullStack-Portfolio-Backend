import express from 'express';
import {
    register,
    login,
    refreshToken,
    getUser,
    getUserPublic,
    updateUser,
    updateResume,
    updatePassword
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import Joi from 'joi';
import {uploadMiddleware, uploadPdfMiddleware} from '../utils/saveFile_utils';

const router = express.Router();

// Schémas de validation
const registerSchema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required()
});

const updateProfileSchema = Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    title: Joi.string().max(100).optional(),
    subtitle: Joi.string().max(100).optional(),
    bio: Joi.string().max(1000).optional(),
    avatar: Joi.optional(),
   
    phone: Joi.string().max(20).optional(),
    location: Joi.string().max(100).optional(),
    website: Joi.string().uri().optional(),
    linkedin: Joi.string().uri().optional(),
    github: Joi.string().uri().optional(),
    twitter: Joi.string().uri().optional()
});

// Routes publiques
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refreshToken);
router.get('/user', getUserPublic);

// Routes protégées
router.get('/userByAdmin', authenticate, getUser);

router.put('/user', authenticate, validate(updateProfileSchema), uploadMiddleware('avatar'), updateUser);
router.put('/user/resume', authenticate, uploadPdfMiddleware('resume'), updateResume);

export default router;