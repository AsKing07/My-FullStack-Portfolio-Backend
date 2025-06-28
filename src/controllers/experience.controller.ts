import { ExpType, PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

/**
 * @desc Get all experiences (paginated)
 * @route GET /api/experiences
 * @access Public
 */
export const getExperiences = asyncHandler(async (req: Request, res: Response) => {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [experiences, total] = await Promise.all([
        prisma.experience.findMany({
            orderBy: { startDate: 'desc' },
            skip,
            take: limitNum,
            include: { user: { select: { id: true, name: true, email: true } } }
        }),
        prisma.experience.count()
    ]);

    res.status(200).json({
        success: true,
        data: {
         items:   experiences,
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
 * @desc Get experience by ID
 * @route GET /api/experiences/:id
 * @access Public
 */
export const getExperienceById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw createError('ID manquant', 400);

    const experience = await prisma.experience.findUnique({
        where: { id },
        include: { user: { select: { id: true, name: true, email: true } } }
    });

    if (!experience) throw createError('Expérience non trouvée', 404);

    res.status(200).json({ success: true, data: {
        items: experience
    } });
});

/**
 * @desc Create a new experience
 * @route POST /api/experiences
 * @access Private
 */
export const createExperience = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        title, company, location, description, technologies,
        type, startDate, endDate, current
    } = req.body;

    if (!title || !company || !startDate) {
        throw createError('Champs requis manquants', 400);
    }

    if(endDate && !startDate) {
        throw createError('La date de début est requise si une date de fin est fournie', 400);
    }


        if (endDate && new Date(endDate) < new Date(startDate)) {
        throw createError('La date de fin ne peut pas être antérieure à la date de début', 400);
    }

      if(type && !Object.values(ExpType).includes(type)) {

        throw createError('Type d\'expérience invalide. Doit être une des valeurs suivantes : FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP', 400);
    }


    const experience = await prisma.experience.create({
        data: {
            title: title,
            company,
            location: location ?? null,
            description : description ?? null,
            technologies: technologies ?? null,
            type: type,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
            current: current ?? false,
            userId: req.user!.id
        }
    });

    res.status(201).json({ success: true, data: {
        items: experience
    } });
});

/**
 * @desc Update an experience
 * @route PUT /api/experiences/:id
 * @access Private
 */
export const updateExperience = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const {
        title, company, location, description, technologies,
        type, startDate, endDate, current
    } = req.body;

    if (!id) throw createError('ID manquant', 400);
    if (!title || !company || !startDate) throw createError('Champs requis manquants. Doit avoir au minimum les champs suivants : title, company, startDate', 400);
    
    
    const experience = await prisma.experience.findUnique({ where: { id } });
    if (!experience) throw createError('Expérience non trouvée', 404);

    if(endDate && !startDate && !experience.startDate) {
        throw createError('La date de début est requise si une date de fin est fournie', 400);
    }
        if (endDate && new Date(endDate) < new Date(startDate)) {
        throw createError('La date de fin ne peut pas être antérieure à la date de début', 400);
    }

 if(type && !Object.values(ExpType).includes(type)) {
        throw createError('Type d\'expérience invalide. Doit être une des valeurs suivantes : FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP', 400);
    }



    const updated = await prisma.experience.update({
        where: { id },
        data: {
            title: title?? experience.title,
            company: company ?? experience.company, 
            location: location ?? experience.location,
            description: description ?? experience.description,
            technologies: technologies ?? experience.technologies,
            type: type ?? experience.type,
            startDate: startDate ? new Date(startDate) : experience.startDate,
            endDate: endDate ? new Date(endDate) : experience.endDate,
            current: current ?? experience.current
        }
    });

    res.status(200).json({ 
        message: 'Expérience mise à jour avec succès',
        success: true, data: {
            items: updated
        } });
});

/**
 * @desc Delete an experience
 * @route DELETE /api/experiences/:id
 * @access Private
 */
export const deleteExperience = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (!id) throw createError('ID manquant', 400);


    const experience = await prisma.experience.findUnique({ where: { id } });
    if (!experience) throw createError('Expérience non trouvée', 404);
    // if (experience.userId !== req.user!.id) throw createError('Non autorisé', 403);

    await prisma.experience.delete({ where: { id } });

    res.status(204).send();
});