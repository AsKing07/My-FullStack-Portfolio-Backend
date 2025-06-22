import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Import des routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import projectRoutes from './routes/project.routes';
import categoryRoutes from './routes/category.routes';
import skillRoutes from './routes/skill.routes';
import experienceRoutes from './routes/experience.routes';
import educationRoutes from './routes/education.routes';
import contactRoutes from './routes/contact.routes';
import blogRoutes from './routes/blog.routes';
import uploadRoutes from './routes/upload.routes';

// Import des middlewares
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { requestLogger } from './middleware/logger';

// Configuration des variables d'environnement
config();

class Server {
    private app: Application;
    private port: string | number;

    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3001;

        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    private initializeMiddlewares(): void {
        // Sécurité avec Helmet
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            crossOriginEmbedderPolicy: false,
        }));

        // Configuration CORS
        const corsOptions = {
            origin: (origin: string | undefined, callback: Function) => {
                const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
                    'http://localhost:3000',
                    'http://localhost:3001',
                    'https://vercel.app',
                    'https://*.vercel.app'
                ];

                // Permettre les requêtes sans origin (mobile apps, etc.)
                if (!origin) return callback(null, true);

                if (allowedOrigins.includes(origin) || 
                    allowedOrigins.some(allowed => origin.includes(allowed.replace('*', '')))) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: [
                'Origin',
                'X-Requested-With',
                'Content-Type',
                'Accept',
                'Authorization',
                'Cache-Control',
                'X-File-Name'
            ],
        };

        this.app.use(cors(corsOptions));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limite à 100 requêtes par windowMs
            message: {
                error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
            },
            standardHeaders: true,
            legacyHeaders: false,
        });

        // Rate limiting spécifique pour les APIs sensibles
        const authLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // 5 tentatives de connexion max
            skipSuccessfulRequests: true,
        });

        this.app.use('/api/', limiter);
        this.app.use('/api/auth', authLimiter);

        // Compression des réponses
        this.app.use(compression());

        // Parsing des requêtes
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Servir les fichiers statiques
        this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

        // Logger des requêtes (en développement)
        if (process.env.NODE_ENV === 'development') {
            this.app.use(requestLogger);
        }

        // Health check
        this.app.get('/health', (req: Request, res: Response) => {
            res.status(200).json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV,
            });
        });
    }

    private initializeRoutes(): void {
        // Route de base
        this.app.get('/', (req: Request, res: Response) => {
            res.json({
                message: 'Portfolio API Server',
                version: '1.0.0',
                endpoints: {
                    auth: '/api/auth',
                    users: '/api/users',
                    projects: '/api/projects',
                    categories: '/api/categories',
                    skills: '/api/skills',
                    experiences: '/api/experiences',
                    educations: '/api/educations',
                    contacts: '/api/contacts',
                    blog: '/api/blog',
                    uploads: '/api/uploads',
                }
            });
        });

        // Routes API
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/users', userRoutes);
        this.app.use('/api/projects', projectRoutes);
        this.app.use('/api/categories', categoryRoutes);
        this.app.use('/api/skills', skillRoutes);
        this.app.use('/api/experiences', experienceRoutes);
        this.app.use('/api/educations', educationRoutes);
        this.app.use('/api/contacts', contactRoutes);
        this.app.use('/api/blog', blogRoutes);
        this.app.use('/api/uploads', uploadRoutes);
    }

    private initializeErrorHandling(): void {
        // Middleware pour les routes non trouvées
        this.app.use(notFound);

        // Middleware global de gestion d'erreurs
        this.app.use(errorHandler);
    }

    public start(): void {
        this.app.listen(this.port, () => {
            console.log(`🚀 Serveur démarré sur le port ${this.port}`);
            console.log(`📍 Mode: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 URL: http://localhost:${this.port}`);
            console.log(`📚 Health check: http://localhost:${this.port}/health`);

            if (process.env.NODE_ENV === 'development') {
                console.log(`🔧 Prisma Studio: npx prisma studio`);
            }
        });
    }

    public getApp(): Application {
        return this.app;
    }
}

// Création et démarrage du serveur
const server = new Server();

// Gestion gracieuse de l'arrêt
process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Arrêt du serveur...');
    process.exit(0);
});

// Démarrage du serveur
if (require.main === module) {
    server.start();
}

export default server;