import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { generateTokens } from '../middleware/auth';
import { deleteImage, deletePdf, saveImage, savePdf } from '@/utils/saveFile_utils';
import { it } from 'node:test';


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
         user,
            token: token.accessToken,
            refreshToken: token.refreshToken
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

    // Exclure le mot de passe de la réponse utilisateur
    const { password: _, ...userWithoutPassword } = user;

    res.json({
        success: true,
        message: 'Connexion réussie',
      user: userWithoutPassword,
            token: token.accessToken,
            refreshToken: token.refreshToken
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
             accessToken,
                refreshToken: newRefreshToken,
                user: user
        });
    } catch (error) {
        throw createError('Refresh token invalide', 401);
    }
});

// @desc    Obtenir le profil utilisateur par l'admin
// @route   GET /api/auth/userByAdmin
// @access  Private
export const getUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findFirst();

    res.json({
        success: true,
        data:  {
            items: user
        }
    });
});

// @desc    Obtenir le profil utilisateur publiquement
// @route   GET /api/auth/user
// @access  Public
export const getUserPublic = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findFirst({
        select:{
            email: true,
            name: true, 
            title: true,
            subtitle: true,
            bio: true,
            avatarUrl: true,
            location: true,
            website: true,
            linkedin: true,
            github: true,
            twitter: true,
            phone: true,
            resumeUrl: true
        }

    });

    res.json({
        success: true,
        data:  {
            items: user
        } 
    });
});



// @desc    Mettre à jour le profil utilisateur
// @route   PUT /api/auth/user
// @access  Private
export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const allowedFields = [
        'name', 'title', 'subtitle', 'bio', 'avatarUrl', 'location', 
        'website', 'linkedin', 'github', 'twitter', 'phone'
    ];

    const updateData: any = {};

    // Filtrer les champs autorisés
    Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
            updateData[key] = req.body[key];
        }
    });
    
    const user = await prisma.user.findFirst({
 
    });
    if (!user) {
        throw createError('Utilisateur non trouvé', 404);
    }

    if (req.file){
         updateData['avatarUrl'] = await saveImage(req.file, 'userAvatar');
         if(user.avatarUrl) {
            // Supprimer l'ancienne image si elle existe
            await deleteImage(user.avatarUrl);
        }

    }


    


    const updateUser = await prisma.user.update({
        where: { id: req.user!.id },
        data: updateData,
    });

    res.json({
        success: true, 
        message: 'Profil mis à jour avec succès',
        data: { items: updateUser }
    });
});

// @desc Mettre à jour le CV
// @route PUT /api/auth/user/resume
// @access Private
export const updateResume = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
        throw createError('Aucun fichier CV fourni', 400);
    }

        const user = await prisma.user.findFirst();
    if (!user) {
        throw createError('Utilisateur non trouvé', 404);
    }
    if (user.resumeUrl) {
        await deletePdf(user.resumeUrl);
    }



    const newResumeUrl = await savePdf(req.file, 'cv');

    const updateCv = await prisma.user.update({
        where: { id: req.user!.id },
        data: { resumeUrl: newResumeUrl },
        select:{
            resumeUrl: true
        }
    });
    res.json({
        success: true,
        message: 'CV mis à jour avec succès',
        data: { items: updateCv.resumeUrl }
    });
});


// @desc    Mettre à jour le mot de passe
// @route   PUT /api/auth/updatePassword
// @access  Private
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
        data: { items: updatedUser }
    });
});

