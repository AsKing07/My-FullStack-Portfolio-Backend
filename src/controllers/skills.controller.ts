const { PrismaClient } = require('@prisma/client');
const { asyncHandler, createError } = require('../middleware/errorHandler');
import { AuthRequest } from '../middleware/auth';
import { Request, Response } from 'express';


const prisma = new PrismaClient();

/**
 * @desc Récupère toutes les compétences
 * @route GET /api/skills
 * @access Public
 */
exports.getSkills = asyncHandler(async (req: Request, res: Response) => {
    const { page = '1', limit = '10', category } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (category) {
        where.category = {
            slug: category
        };
    }

    const [skills, total] = await Promise.all([
        prisma.skill.findMany({
            where,
            include: {
                category: {
                 
                }
            },
            orderBy: [
                { yearsExp: 'desc' },
                { createdAt: 'desc' }
            ],
            skip,
            take: limitNum
        }),
        prisma.skill.count({ where })
    ]);

    res.status(200).json({
        success: true,
        data: {
           items: skills,
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
 * @desc Récupère une compétence par son id
 * @route GET /api/skills/:id
 * @access Public
 */
exports.getSkill = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const skill = await prisma.skill.findUnique({
        where: {
            id: id
        },
        include: {
            category: {
               
            }
        }
    });

    if (!skill) {
        throw createError('Compétence non trouvée', 404);
    }

    res.status(200).json({
        success: true,
        data: {
           items: skill
        }
    });
});


/**
 * @desc ajoute une nouvelle compétence
 * @route POST /api/skills
 * @access Private (Admin)
 */
exports.addSkill = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, level, yearsExp, categoryId } = req.body;
    if (!name) {
        throw createError('Le champs nom est obligatoire', 400);
    }

    if(level && ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'].indexOf(level.toUpperCase()) === -1) {
        throw createError('Niveau invalide. Veuillez choisir entre BEGINNER, INTERMEDIATE, ADVANCED ou EXPERT', 400);
    }

    const existingSkill = await prisma.skill.findUnique({
        where: { [name.toLowerCase()]: name.toLowerCase() }
    });

    if (existingSkill) {
        throw createError('Une compétence avec ce nom existe déjà', 400);
    }

    if(typeof yearsExp !== 'undefined' && (typeof yearsExp !== 'number' || yearsExp < 0)) {
        throw createError('Années d\'expérience doivent être un nombre positif', 400);
    }




    const skill = await prisma.skill.create({
        data: {
           ...req.body,
            name: name.toLowerCase(),
            level: level ? level.toUpperCase() : 'INTERMEDIATE',
            categoryId: categoryId? categoryId : null,
            userId: req.user!.id
        }
    });

    res.status(201).json({
        message: 'Compétence ajoutée avec succès',
        success: true,
        data: {
           item:  skill
        }
    });
});

/**
 * @desc Met à jour une compétence
 * @route PUT /api/skills/:id
 * @access Private (Admin)
 */
exports.updateSkill = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, level, yearsExp, categoryId, icon } = req.body;

    if (!id) {
        throw createError('ID manquant', 400);
    }

    const skill = await prisma.skill.findUnique({
        where: { id }
    });

    if (!skill) {
        throw createError('Compétence non trouvée', 404);
    }

    if (name && name.toLowerCase() !== skill.name.toLowerCase()) {
        const existingSkill = await prisma.skill.findUnique({
            where: { name: name.toLowerCase() }
        });

        if (existingSkill) {
            throw createError('Une compétence avec ce nom existe déjà', 400);
        }
    }

    if( level && ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'].indexOf(level.toUpperCase()) === -1) {
        throw createError('Niveau invalide. Veuillez choisir entre BEGINNER, INTERMEDIATE, ADVANCED ou EXPERT', 400);
    }

    if (yearsExp && (typeof yearsExp !== 'number' || yearsExp < 0)) {
        throw createError('Années d\'expérience doivent être un nombre positif', 400);
    }





    const updatedSkill = await prisma.skill.update({
        where: { id },
        data: {
            name,
            level,
            yearsExp,
            categoryId,
            icon
        }
    });

    res.status(200).json({
        message: 'Compétence mise à jour avec succès',
        success: true,
        data: {
            items: updatedSkill
        }
    });



});

/**
 * @desc Supprime une compétence
 * @route DELETE /api/skills/:id
 * @access Private (Admin)
 */
exports.deleteSkill = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw createError('ID manquant', 400);
    }

    const skill = await prisma.skill.findUnique({
        where: { id }
    }); 
    if (!skill) {
        throw createError('Compétence non trouvée', 404);
    }
    await prisma.skill.delete({
        where: { id }
    });

    res.status(200).json({
        message: 'Compétence supprimée avec succès',
        success: true
    });
});


