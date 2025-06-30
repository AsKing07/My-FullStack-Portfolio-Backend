import 'module-alias/register';
import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import next from 'next';

// Import des routes API
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/projects.routes';
import categoryRoutes from './routes/category.routes';
import skillRoutes from './routes/skills.routes';
import experienceRoutes from './routes/experience.routes';
import educationRoutes from './routes/education.routes';
import contactRoutes from './routes/contact.routes';
import blogRoutes from './routes/blog.routes';
import githubRoutes from './routes/github.routes';

// Import des middlewares
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { requestLogger } from './middleware/logger';
import { prisma } from './config/prisma';
import { corsMiddleware } from './middleware/cors';



class Server {
    private app: Application;
    private port: string | number;
    private nextApp: any;
    private handle: any;

    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3001;
        
        // Initialiser Next.js seulement en production pour éviter les problèmes de dev
        if (process.env.NODE_ENV === 'production') {
            const nextConfig = {
                distDir: 'build',
                trailingSlash: false,
                generateEtags: false,
                poweredByHeader: false
            };
            
            this.nextApp = next({ 
                dev: false, 
                dir: process.cwd(),
                conf: nextConfig
            });
            this.handle = this.nextApp.getRequestHandler();
        }
    }

    private async initializeNext(): Promise<void> {
        // Initialiser Next.js seulement en production
        if (process.env.NODE_ENV === 'production' && this.nextApp) {
            try {
                // Vérifier que le dossier build existe
                const buildPath = path.join(process.cwd(), 'build');
                console.log(`🔍 Vérification du dossier build: ${buildPath}`);
                
                // Lister le contenu du dossier racine
                console.log('📁 Contenu du dossier racine:');
                fs.readdirSync(process.cwd()).forEach((file: string) => {
                    console.log(`  - ${file}`);
                });
                
                // Vérifier si le dossier build existe
                if (fs.existsSync(buildPath)) {
                    console.log('✅ Dossier build trouvé');
                    console.log('📁 Contenu du dossier build:');
                    fs.readdirSync(buildPath).forEach((file: string) => {
                        const filePath = path.join(buildPath, file);
                        const stat = fs.statSync(filePath);
                        if (stat.isDirectory()) {
                            console.log(`  📁 ${file}/`);
                            // Lister quelques fichiers dans les sous-dossiers importants
                            if (['server', 'static'].includes(file)) {
                                try {
                                    const subFiles = fs.readdirSync(filePath).slice(0, 5);
                                    subFiles.forEach(subFile => {
                                        console.log(`    - ${subFile}`);
                                    });
                                    if (fs.readdirSync(filePath).length > 5) {
                                        console.log(`    ... et ${fs.readdirSync(filePath).length - 5} autres fichiers`);
                                    }
                                } catch (e) {
                                    console.log(`    (erreur lecture sous-dossier: ${e})`);
                                }
                            }
                        } else {
                            console.log(`  📄 ${file}`);
                        }
                    });
                    
                    // Vérifications spécifiques Next.js
                    const buildManifestPath = path.join(buildPath, 'build-manifest.json');
                    const pagesManifestPath = path.join(buildPath, 'server', 'pages-manifest.json');
                    
                    console.log(`🔍 Build manifest: ${fs.existsSync(buildManifestPath) ? '✅' : '❌'}`);
                    console.log(`🔍 Pages manifest: ${fs.existsSync(pagesManifestPath) ? '✅' : '❌'}`);
                    
                } else {
                    console.log('❌ Dossier build non trouvé');
                }
                
                await this.nextApp.prepare();
                console.log('✅ Next.js app préparée avec succès');
            } catch (error) {
                console.error('❌ Erreur lors de la préparation de Next.js:', error);
                throw error;
            }
        } else {
            console.log('ℹ️ Next.js désactivé en développement');
        }
    }

    private initializeMiddlewares(): void {
        // Sécurité avec Helmet
        this.app.use(helmet({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false,
        }));

        // Cors pour les requêtes cross-origin
        this.app.use(corsMiddleware);

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 150,
            message: {
                error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
            },
            standardHeaders: true,
            legacyHeaders: false,
        });

        const authLimiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 30,
            skipSuccessfulRequests: true,
        });

        this.app.use('/api/', limiter);
        this.app.use('/api/auth', authLimiter);

        // Parsing des requêtes
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Logger des requêtes (en développement)
        if (process.env.NODE_ENV === 'development') {
            this.app.use(requestLogger);
        }

        // Health check
        this.app.get('/health', (req: Request, res: Response) => {
            res.status(200).json({
                success: 'OK',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV,
            });
        });
    }

    private initializeRoutes(): void {
        // Routes API - IMPORTANT: Avant Next.js handler
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/projects', projectRoutes);
        this.app.use('/api/categories', categoryRoutes);
        this.app.use('/api/skills', skillRoutes);
        this.app.use('/api/experiences', experienceRoutes);
        this.app.use('/api/educations', educationRoutes);
        this.app.use('/api/contacts', contactRoutes);
        this.app.use('/api/blog', blogRoutes);
        this.app.use('/api/github', githubRoutes);
    }

    private initializeStaticServing(): void {
        // Servir les uploads
        this.app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

        // CORRECTION: Servir les assets Next.js depuis build/static
        this.app.use('/_next/static', express.static(path.join(process.cwd(), 'build', 'static'), {
            setHeaders: (res, filePath) => {
                console.log(`📦 Next.js asset: ${filePath}`);
                if (filePath.match(/\.(js|css|woff2?|ttf|eot)$/)) {
                    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                }
            }
        }));

        // Servir les autres fichiers statiques
        this.app.use('/static', express.static(path.join(process.cwd(), 'build', 'static'), {
            setHeaders: (res, filePath) => {
                console.log(`📦 Static file: ${filePath}`);
                if (filePath.match(/\.(png|jpg|jpeg|gif|ico|svg|webp)$/)) {
                    res.setHeader('Cache-Control', 'public, max-age=86400');
                }
            }
        }));
    }

    private initializeNextJsHandling(): void {
        // Utiliser le handler Next.js seulement en production
        if (process.env.NODE_ENV === 'production' && this.handle) {
            // Toutes les routes qui ne sont pas des API ou des fichiers statiques
            this.app.get('/{*any}', async (req: Request, res: Response, next) => {
                // Exclure les routes API et les fichiers statiques
                if (req.path.startsWith('/api/') || 
                    req.path.startsWith('/uploads/') || 
                    req.path.startsWith('/_next/') ||
                    req.path.startsWith('/static/') ||
                    req.path === '/health') {
                    return next();
                }
                
                try {
                    console.log(`🔄 Next.js handling: ${req.method} ${req.path}`);
                    await this.handle!(req, res);
                } catch (error) {
                    console.error('❌ Next.js handler error:', error);
                    // Fallback vers une page d'index statique
                    const indexPath = path.join(process.cwd(), 'build', 'index.html');
                    if (req.path === '/' && require('fs').existsSync(indexPath)) {
                        console.log('📄 Serving fallback index.html');
                        return res.sendFile(indexPath);
                    }
                    // Servir la page 404 Next.js si disponible
                    const notFoundPath = path.join(process.cwd(), 'build', 'server', 'pages', '404.html');
                    if (require('fs').existsSync(notFoundPath)) {
                        console.log('📄 Serving Next.js 404.html');
                        return res.status(404).sendFile(notFoundPath);
                    }
                    // Fallback final
                    res.status(404).json({
                        error: 'Page not found',
                        message: 'Cette route n\'existe pas.',
                        path: req.path,
                        timestamp: new Date().toISOString()
                    });
                }
            });
        } else {
            // En développement, servir une page d'index ou l'API info
            this.app.get('/{*/any}', (req: Request, res: Response, next) => {
                if (req.path.startsWith('/api/') || 
                    req.path.startsWith('/uploads/') || 
                    req.path.startsWith('/_next/') ||
                    req.path.startsWith('/static/') ||
                    req.path === '/health') {
                    return next();
                }
                
                // Servir l'index.html si la route est '/'
                if (req.path === '/') {
                    const indexPath = path.join(process.cwd(), 'build', 'index.html');
                    if (require('fs').existsSync(indexPath)) {
                        console.log('� Dev mode - serving index.html for:', req.path);
                        return res.sendFile(indexPath);
                    }
                }
                
                console.log(`🔄 Dev mode - serving API info for: ${req.path}`);
                res.json({
                    message: 'Portfolio API Server - Development Mode',
                    version: '1.0.0',
                    path: req.path,
                    note: 'In production, Next.js would handle this route',
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
        }
    }

    private initializeErrorHandling(): void {
        // Middleware pour les routes non trouvées
        this.app.use(notFound);
        // Middleware global de gestion d'erreurs
        this.app.use(errorHandler);
    }

    public async start(): Promise<void> { 
        try {
            // ÉTAPE 1: Préparer Next.js
            await this.initializeNext();
            
            // ÉTAPE 2: Connecter à la base de données
            await prisma.$connect();
            console.log('✅ Connexion à la base de données réussie');

            // ÉTAPE 3: Initialiser les middlewares et routes
            this.initializeMiddlewares();
            this.initializeRoutes();
            this.initializeStaticServing();
            this.initializeNextJsHandling();
            this.initializeErrorHandling();

            // ÉTAPE 4: Démarrer le serveur
            this.app.listen(this.port, () => {
                console.log(`🚀 Serveur Next.js SSR démarré sur le port ${this.port}`);
                console.log(`📍 Mode: ${process.env.NODE_ENV || 'production'}`);
                console.log(`🌐 URL: ${process.env.DOMAIN || 'http://localhost'}:${this.port}`);
                console.log(`📚 Health check: ${process.env.DOMAIN || 'http://localhost'}:${this.port}/health`);
                console.log(`📁 Build directory: build/`);
            });
        } catch (error) {
            console.error('❌ Impossible de démarrer le serveur:', error);
            process.exit(1);
        }
    }

    public getApp(): Application {
        return this.app;
    }
}

// Création et démarrage du serveur
const server = new Server();

// Gestion gracieuse de l'arrêt
process.on('SIGINT', async () => {
    await prisma.$disconnect();
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
