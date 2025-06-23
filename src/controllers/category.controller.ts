const { PrismaClient } = require('@prisma/client');
const { asyncHandler, createError } = require('../middleware/errorHandler');
import { AuthRequest } from '../middleware/auth';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
    const { page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [categories, total] = await Promise.all([
        prisma.category.findMany({
            orderBy: {
                name: 'asc'
            },
            skip,
            take: limitNum
        }),
        prisma.category.count()
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            categories,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: total,
                pages: Math.ceil(total / limitNum)
            }
        }
    });
});


/**
 * @desc Récupère une catégorie par son slug
 * @route GET /api/categories/:slug
 * @access Public
 */
export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;

    if (!slug) {
        throw createError('Slug manquant', 400);
    }

    const category = await prisma.category.findUnique({
        where: { slug }
    });

    if (!category) {
        throw createError('Catégorie non trouvée', 404);
    }

    res.status(200).json({
        status: 'success',
        data: { category }
    });
});

/**
 * @desc Crée une nouvelle catégorie
 * @route POST /api/categories
 * @access Private (Admin)
 */
export const createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {name, slug} = req.body;

    if (!name) {
        throw createError('Nom de catégorie manquant', 400);
    }

    let existingCategory : any = null;
  if(slug)
  {
         existingCategory = await prisma.category.findUnique({
        where: { slug }
    });
    if (existingCategory) {
        throw createError('Une catégorie avec ce slug existe déjà', 400);
    }


  }

    existingCategory = await prisma.category.findUnique({
        where: { name }
    });
    if (existingCategory) {
        throw createError('Une catégorie avec ce nom existe déjà', 400);
    }

    const newCategory = await prisma.category.create({
        data: {
          ...req.body,
            slug: slug || generateSlug(name)
        }
    });

    res.status(201).json({
        status: 'success',
        data: { category: newCategory }
    });

});

/**
 * @desc Met à jour une catégorie
 * @route PUT /api/categories/:id
 * @access Private (Admin)
 */
export const updateCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, slug } = req.body;

    if (!id) {
        throw createError('ID manquant', 400);
    }
    const category = await prisma.category.findUnique({
        where: { id }
    });
    if (!category) {
        throw createError('Catégorie non trouvée', 404);
    }
    if (name && name !== category.name) {
        const existingCategory = await prisma.category.findUnique({
            where: { name }
        });
        if (existingCategory) {
            throw createError('Une catégorie avec ce nom existe déjà', 400);
        }
    }
    if (slug && slug !== category.slug) {
        const existingCategory = await prisma.category.findUnique({
            where: { slug }
        });
        if (existingCategory) {
            throw createError('Une catégorie avec ce slug existe déjà', 400);
        }
    }
    const updatedCategory = await prisma.category.update({
        where: { id },
        data: {
            ...req.body,
            slug: slug || generateSlug(name)
        }
    });
    res.status(200).json({
        status: 'success',
        data: { category: updatedCategory }
    });
});

/**
 * @desc Supprime une catégorie
 * @route DELETE /api/categories/:id
 * @access Private (Admin)
 */
export const deleteCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw createError('ID manquant', 400);
    }
    const category = await prisma.category.findUnique({
        where: { id }
    });
    if (!category) {
        throw createError('Catégorie non trouvée', 404);
    }
    await prisma.category.delete({
        where: { id }
    });
    res.status(200).json({
        status: 'success',
        message: 'Catégorie supprimée avec succès'
    });
});






// Fonction utilitaire pour générer un slug
const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};