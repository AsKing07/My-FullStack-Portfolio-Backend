import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
    const error = createError(`Route ${req.originalUrl} non trouvée`, 404);
    next(error);
};