import express from 'express';
import {
    register,
    login,
    refreshToken,
    getProfile,
    updateProfile
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import Joi from 'joi';

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
    name: Joi.string().min(2).max(50),
    bio: Joi.string().max(1000),
    avatar: Joi.string().uri(),
    location: Joi.string().max(100),
    website: Joi.string().uri(),
    linkedin: Joi.string().uri(),
    github: Joi.string().uri(),
    twitter: Joi.string().uri()
});

// Routes publiques
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refreshToken);

// Routes protégées
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);

export default router;