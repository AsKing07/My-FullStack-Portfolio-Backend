import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
    statusCode?: number;
    status?: string;
    isOperational?: boolean;
}

export const errorHandler = (
    err: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let error: CustomError = { ...err };
    error.message = err.message;

    // Log de l'erreur
    console.error('Error:', err);

    // Erreur de validation Prisma
    if (err.name === 'PrismaClientValidationError') {
        const message = 'Données invalides';
        error = createError(message, 400);
    }

    // Erreur de contrainte unique Prisma
    if (err.message.includes('Unique constraint')) {
        const message = 'Ressource déjà existante';
        error = createError(message, 409);
    }

    // Erreur JWT
    if (err.name === 'JsonWebTokenError') {
        const message = 'Token invalide';
        error = createError(message, 401);
    }

    // Erreur JWT expiré
    if (err.name === 'TokenExpiredError') {
        const message = 'Token expiré';
        error = createError(message, 401);
    }

    // Erreur de syntaxe JSON
    if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
        const message = 'Format JSON invalide';
        error = createError(message, 400);
    }

    // Réponse d'erreur
    res.status(error.statusCode || 500).json({
        success: false,
        error: {
            message: error.message || 'Erreur serveur interne',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
};

export const createError = (message: string, statusCode: number): CustomError => {
    const error: CustomError = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};

// Wrapper pour les fonctions async
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);