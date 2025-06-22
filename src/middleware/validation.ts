import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createError } from './errorHandler';

export const validate = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: true
        });

        if (error) {
            const message = error.details
                .map(detail => detail.message)
                .join(', ');
            return next(createError(message, 400));
        }

        next();
    };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: true
        });

        if (error) {
            const message = error.details
                .map(detail => detail.message)
                .join(', ');
            return next(createError(message, 400));
        }

        req.query = value;
        next();
    };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.params, {
            abortEarly: false
        });

        if (error) {
            const message = error.details
                .map(detail => detail.message)
                .join(', ');
            return next(createError(message, 400));
        }

        next();
    };
};