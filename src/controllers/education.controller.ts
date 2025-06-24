import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

/**
 * @desc Get all educations (paginated)
 * @route GET /api/educations
 * @access Public
 */
export const getEducations = asyncHandler(async (req: Request, res: Response) => {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [educations, total] = await Promise.all([
        prisma.education.findMany({
            orderBy: { startDate: 'desc' },
            skip,
            take: limitNum,
            include: { user: { select: { id: true, name: true, email: true } } }
        }),
        prisma.education.count()
    ]);

    res.status(200).json({
        success: true,
        data: {
           items: educations,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        }
    });
});

/**
 * @desc Get education by ID
 * @route GET /api/educations/:id
 * @access Public
 */
export const getEducationById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw createError('ID manquant', 400);

    const education = await prisma.education.findUnique({
        where: { id },
        include: { user: { select: { id: true, name: true, email: true } } }
    });

    if (!education) throw createError('Formation non trouvée', 404);

    res.status(200).json({ success: true, data: {items:education} });
});

/**
 * @desc Create a new education
 * @route POST /api/educations
 * @access Private
 */
export const createEducation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        degree, school, field, location, description,
        grade, startDate, endDate, current
    } = req.body;

    if (!degree || !school || !startDate) {
        throw createError('Champs requis manquants', 400);
    }

    if (endDate && !startDate) {
        throw createError('La date de début est requise si une date de fin est fournie', 400);
    }

    if (endDate && new Date(endDate) < new Date(startDate)) {
        throw createError('La date de fin ne peut pas être antérieure à la date de début', 400);
    }

    const education = await prisma.education.create({
        data: {
            degree,
            school,
            field,
            location,
            description,
            grade,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
            current: current ?? false,
            userId: req.user!.id
        }
    });

    res.status(201).json({ success: true, data: {items:education} });
});

/**
 * @desc Update an education
 * @route PUT /api/educations/:id
 * @access Private
 */
export const updateEducation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const {
        degree, school, field, location, description,
        grade, startDate, endDate, current
    } = req.body;

    if (!id) throw createError('ID manquant', 400);
    if (!degree || !school || !startDate) throw createError('Champs requis manquants', 400);

    const education = await prisma.education.findUnique({ where: { id } });
    if (!education) throw createError('Formation non trouvée', 404);

    // Vérification de l'auteur
    // if (education.userId !== req.user!.id) throw createError('Non autorisé', 403);

    if (endDate && !startDate && !education.startDate) {
        throw createError('La date de début est requise si une date de fin est fournie', 400);
    }
    if(endDate && !startDate && new Date(endDate) < new Date(education.startDate))
    {
        throw createError('La date de fin ne peut pas être antérieure à la date de début', 400);
    }
    if (endDate && new Date(endDate) < new Date(startDate)) {
        throw createError('La date de fin ne peut pas être antérieure à la date de début', 400);
    }

    const updated = await prisma.education.update({
        where: { id },
        data: {
            degree: degree ?? education.degree,
            school: school ?? education.school,
            field: field ?? education.field,
            location: location ?? education.location,
            description: description ?? education.description,
            grade: grade ?? education.grade,
            startDate: startDate ? new Date(startDate) : education.startDate,
            endDate: endDate ? new Date(endDate) : education.endDate,
            current: current ?? education.current
        }
    });

    res.status(200).json({message:"Education modifiée avec succès",  success: true, data: {items:updated} });
});

/**
 * @desc Delete an education
 * @route DELETE /api/educations/:id
 * @access Private
 */
export const deleteEducation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (!id) throw createError('ID manquant', 400);


    const education = await prisma.education.findUnique({ where: { id } });
    if (!education) throw createError('Formation non trouvée', 404);
    // if (education.userId !== req.user!.id) throw createError('Non autorisé', 403);

    await prisma.education.delete({ where: { id } });
    res.status(204).json({ success: true });
});