import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// @desc    Obtenir tous les projets (public)
// @route   GET /api/projects
// @access  Public
export const getProjects = asyncHandler(async (req: Request, res: Response) => {
    const {
        page = '1',
        limit = '10',
        category,
        featured,
        status = 'PUBLISHED'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
        status: status as string
    };

    if (category) {
        where.category = {
            slug: category
        };
    }

    if (featured === 'true') {
        where.featured = true;
    }

    const [projects, total] = await Promise.all([
        prisma.project.findMany({
            where,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        color: true
                    }
                },
                user: {
                    select: {
                        name: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: [
                { featured: 'desc' },
                { priority: 'desc' },
                { createdAt: 'desc' }
            ],
            skip,
            take: limitNum
        }),
        prisma.project.count({ where })
    ]);

    res.json({
        success: true,
        data: {
            projects,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        }
    });
});

// @desc    Obtenir un projet par slug
// @route   GET /api/projects/:slug
// @access  Public
export const getProject = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;

    if (!slug) {
        throw createError('Slug manquant', 400);
    }

    const project = await prisma.project.findUnique({
        where: { slug: slug as string },
        include: {
            category: true,
            user: {
                select: {
                    name: true,
                    avatarUrl: true
                }
            }
        }
    });

    if (!project || project.status !== 'PUBLISHED') {
        throw createError('Projet non trouvé', 404);
    }

    res.json({
        success: true,
        data: { project }
    });
});

// @desc    Créer un projet
// @route   POST /api/projects
// @access  Private (Admin)
export const createProject = asyncHandler(async (req: AuthRequest, res: Response) => {
    const projectData = {
        ...req.body,
        userId: req.user!.id,
        slug: req.body.slug || generateSlug(req.body.title)
    };
    

    const project = await prisma.project.create({
        data: projectData,
        include: {
            category: true
        }
    });

    res.status(201).json({
        success: true,
        message: 'Projet créé avec succès',
        data: { project }
    });
});

// @desc    Mettre à jour un projet
// @route   PUT /api/projects/:id
// @access  Private (Admin)
export const updateProject = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw createError('ID manquant', 400);
    }


    const project = await prisma.project.findUnique({
        where: { id }
    });

    if (!project) {
        throw createError('Projet non trouvé', 404);
    }

    const updatedProject = await prisma.project.update({
        where: { id },
        data: req.body,
        include: {
            category: true
        }
    });

    res.json({
        success: true,
        message: 'Projet mis à jour avec succès',
        data: { project: updatedProject }
    });
});

// @desc    Supprimer un projet
// @route   DELETE /api/projects/:id
// @access  Private (Admin)
export const deleteProject = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw createError('ID manquant', 400);
    }
    const project = await prisma.project.findUnique({
        where: { id }
    });

    if (!project) {
        throw createError('Projet non trouvé', 404);
    }

    await prisma.project.delete({
        where: { id }
    });

    res.json({
        success: true,
        message: 'Projet supprimé avec succès'
    });
});

// Fonction utilitaire pour générer un slug
const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};