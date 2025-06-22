import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { generateTokens } from '../middleware/auth';


const prisma = new PrismaClient();

// Types
interface LoginData {
    email: string;
    password: string;
}

interface RegisterData {
    name: string;
    email: string;
    password: string;
}



// @desc    Inscription
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password }: RegisterData = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        throw createError('Un utilisateur avec cet email existe déjà', 409);
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
        }
    });

    // Générer les tokens
    const token = generateTokens(user.id);

    res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        data: {
            user,
            token: token.accessToken,
            refreshToken: token.refreshToken
        }
    });
});

// @desc    Connexion
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password }: LoginData = req.body;

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw createError('Email ou mot de passe incorrect', 401);
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw createError('Email ou mot de passe incorrect', 401);
    }

    // Générer les tokens
    const token = generateTokens(user.id);

    res.json({
        success: true,
        message: 'Connexion réussie',
        data: {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token: token.accessToken,
            refreshToken: token.refreshToken
        }
    });
});


// @desc    Rafraîchir le token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken: token } = req.body;

    if (!token) {
        throw createError('Refresh token manquant', 400);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as any;

        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!user) {
            throw createError('Utilisateur non trouvé', 404);
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

        res.json({
            success: true,
            data: {
                accessToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        throw createError('Refresh token invalide', 401);
    }
});

// @desc    Obtenir le profil utilisateur
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
            id: true,         
            name: true,
            email: true,
            role: true,
            bio: true,
            avatar: true,
            location: true,
            website: true,
            linkedin: true,
            github: true,
            twitter: true,
            createdAt: true,
            updatedAt: true,

        }
    });

    res.json({
        success: true,
        data: { user }
    });
});

// @desc    Mettre à jour le profil
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const allowedFields = [
        'name', 'bio', 'avatar', 'location', 
        'website', 'linkedin', 'github', 'twitter'
    ];

    const updateData: any = {};

    // Filtrer les champs autorisés
    Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
            updateData[key] = req.body[key];
        }
    });

    const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: updateData,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            bio: true,
            avatar: true,
            location: true,
            website: true,
            linkedin: true,
            github: true,
            twitter: true,
            updatedAt: true
        }
    });

    res.json({
        success: true,
        message: 'Profil mis à jour avec succès',
        data: { user }
    });
});

export const updatePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        throw createError('Mot de passe actuel et nouveau mot de passe requis', 400);
    }
    const user = await prisma.user.findUnique({
        where: { id: req.user!.id }
    });
    if (!user) {
        throw createError('Utilisateur non trouvé', 404);
    }
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
        throw createError('Mot de passe actuel incorrect', 401);
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const updatedUser = await prisma.user.update({
        where: { id: req.user!.id },
        data: { password: hashedPassword },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            updatedAt: true
        }
    });
    res.json({
        success: true,
        message: 'Mot de passe mis à jour avec succès',
        data: { user: updatedUser }
    });
});