import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';

// Format de log personnalisé
morgan.token('body', (req: Request) => {
    return JSON.stringify(req.body);
});

morgan.token('query', (req: Request) => {
    return JSON.stringify(req.query);
});

// Logger de développement
export const requestLogger = morgan((tokens, req, res) => {
    return [
        '🌐',
        tokens.method?.(req, res),
        tokens.url?.(req, res),
        tokens.status?.(req, res),
        tokens.res?.(req, res, 'content-length'), '-',
        tokens['response-time']?.(req, res), 'ms',
        req.method === 'POST' || req.method === 'PUT'
            ? `Body: ${tokens.body ? tokens.body(req, res) : ''}` : '',
        Object.keys((req as Request).query).length > 0 ? 
            `Query: ${tokens.query ? tokens.query(req, res) : ''}` : ''
    ].filter(Boolean).join(' ');
});

// Logger de production
export const productionLogger = morgan('combined');