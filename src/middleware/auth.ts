import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { asyncHandler, createError } from './errorHandler';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        currentPassword?: string;
        newPassword?: string;
    };
      body: any;
  params: any;
  query: any;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
  headers: any;
}

// Vérification du token JWT
export const authenticate = asyncHandler(async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    let token: string | undefined;

    // Récupération du token depuis l'header Authorization
    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Vérification de la présence du token
    if (!token) {
        return next(createError('Token d\'authentification manquant', 401));
    }

    try {
        // Vérification du token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        // Récupération de l'utilisateur
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                role: true,
                name: true
            }
        });

        if (!user) {
            return next(createError('Utilisateur non trouvé', 401));
        }

        // Ajout de l'utilisateur à la requête
        req.user = user;
        next();
    } catch (error) {
        return next(createError('Token invalide', 401));
    }
});

// Middleware pour vérifier les rôles
export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(createError('Accès non autorisé', 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(createError('Permissions insuffisantes', 403));
        }

        next();
    };
};

// Middleware pour les routes publiques avec utilisateur optionnel
export const optionalAuth = asyncHandler(async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    name: true
                }
            });

            if (user) {
                req.user = user;
            }
        } catch (error) {
            // Token invalide, mais on continue sans utilisateur
        }
    }

    next();
});

// Génération des tokens JWT

export const generateTokens = (userId: string) => {
const expiresInAccess: SignOptions['expiresIn'] =
  (process.env.JWT_EXPIRES_IN ?? '24h') as SignOptions['expiresIn'];

const expiresInRefresh: SignOptions['expiresIn'] =
  (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];

  
  if (!expiresInAccess || !expiresInRefresh ) {
    throw new Error('Les variables d’environnement JWT sont manquantes.');
  }

const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET as string,
    { expiresIn: expiresInAccess }
);

const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: expiresInRefresh }
);


    return { accessToken, refreshToken };
};



