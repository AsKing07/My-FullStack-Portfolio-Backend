import { Request, Response } from 'express';
import { PrismaClient, ProjectStatus } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { saveImage } from '@/utils/saveFile_utils';
import { stat } from 'fs';

const prisma = new PrismaClient();

// GET /api/projects
export const getProjects = asyncHandler(async (req: Request, res: Response) => {
    const {
        page = '1',
        limit = '10',
        category,
        featured
       
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
  status: 'PUBLISHED' 
    };

    if (category) {
        where.category = { slug: category };
    }
    if (featured === 'true') {
        where.featured = true;
    }

    const [projects, total] = await Promise.all([
        prisma.project.findMany({
            where,
            include: {
                category: { select: { id: true, name: true, slug: true, color: true } },
                user: { select: { name: true, avatarUrl: true } }
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
          items:  projects,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        }
    });
});

// GET /api/projects/all
//private route to get all projects, used by admin
export const getAllProjects = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        page = '1',
        limit = '10',
        category,
        featured
    } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
        userId: req.user!.id
    };

    if (category) {
        where.category = { slug: category };
    }
    if (featured === 'true') {
        where.featured = true;
    }

    const [projects, total] = await Promise.all([
        prisma.project.findMany({
            where,
            include: {
                category: { select: { id: true, name: true, slug: true, color: true } },
                user: { select: { name: true, avatarUrl: true } }
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
          items:  projects,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        }
    });
});


//

// GET /api/projects/:slug
export const getProject = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;
    if (!slug) throw createError('Slug manquant', 400);

    console.log('slug', slug);
    const project = await prisma.project.findUnique({
        where: { slug: slug },
        include: {
            category: true,
            user: { select: { name: true, avatarUrl: true } }
        }
    });

    if (!project ) {
        throw createError('Projet non trouvé', 404);
    }

    res.json({
        success: true,
        data: { items: project }
    });
});

//Post /api/projects/images
export const uploadProjectImages = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file && !req.files) {
        throw createError('Aucun fichier image fourni', 400);
    }
    if(req.file)
    {
        const imageUrl = await saveImage(req.file, 'projects');
        res.json({
            success: true,
            message: 'Image téléchargée avec succès',
            data: { items: imageUrl }
        });
    }
    else if(req.files)
    {
        const imagesUrls = [];
        let filesArray: any[] = [];
        if (Array.isArray(req.files)) {
            filesArray = req.files;
        } else if (typeof req.files === 'object' && req.files !== null) {
            // req.files is an object: { fieldname: File[] }
            filesArray = Object.values(req.files).flat();
        }
        for (const file of filesArray) {
            const imageUrl = await saveImage(file, 'projects');
            imagesUrls.push(imageUrl);
        }
        res.json({
            success: true,
            message: 'Images téléchargées avec succès',
            data: { items: imagesUrls }
        });
    }

})

// POST /api/projects
export const createProject = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        title, description, shortDesc, content, status, featured, priority,
        liveUrl, githubUrl, figmaUrl, image, gallery, technologies,
        startDate, endDate, categoryId
    } = req.body;

    if (!title || !description) {
        throw createError('Titre et description sont requis', 400);
    }

    if(status && !Object.values(ProjectStatus).includes(status)) {
        throw createError('Statut invalide', 400);
    }
    if(endDate && !startDate) {
        throw createError('Date de début requise si date de fin fournie', 400);
    }


    const slug = req.body.slug || generateSlug(title);

    const project = await prisma.project.create({
        data: {
            title,
            slug,
            description,
            shortDesc,
            content,
            status: status ?? ProjectStatus.PUBLISHED,
            featured: featured ?? false,
            priority: priority ?? 0,
            liveUrl,
            githubUrl,
            figmaUrl,
            image,
            gallery,
            technologies,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            userId: req.user!.id,
            categoryId
        },
        include: { category: true }
    });

    res.status(201).json({
        success: true,
        message: 'Projet créé avec succès',
        data: { items:project }
    });
});

// PUT /api/projects/:id
export const updateProject = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (!id) throw createError('ID manquant', 400);

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw createError('Projet non trouvé', 404);

    // Optionnel : vérifier que seul l'admin ou le créateur peut modifier
    // if (project.userId !== req.user.id) throw createError('Non autorisé', 403);

    const {
        title, description, shortDesc, content, status, featured, priority,
        liveUrl, githubUrl, figmaUrl, image, gallery, technologies,
        startDate, endDate, categoryId
    } = req.body;

    if (status && !Object.values(ProjectStatus).includes(status)) {
        throw createError('Statut invalide', 400);
    }
   
    if (endDate && !startDate && !project.startDate ) {
        throw createError('Date de début requise si date de fin fournie', 400);
    }
    if(endDate && !startDate && new Date(endDate) < new Date(project.startDate!))
    {
        throw createError('La date de fin ne peut pas être antérieure à la date de début', 400);

    }

    const updatedProject = await prisma.project.update({
        where: { id },
        data: {
            title: title ?? project.title,
            slug: req.body.slug || project.slug,
            description: description ?? project.description,
            shortDesc: shortDesc ?? project.shortDesc,
            content: content ?? project.content,
            status: status ?? project.status,
            featured: featured ?? project.featured,
            priority: priority ?? project.priority,
            liveUrl: liveUrl ?? project.liveUrl,
            githubUrl: githubUrl ?? project.githubUrl,
            figmaUrl: figmaUrl ?? project.figmaUrl,
            image: image ?? project.image,
            gallery: gallery ?? project.gallery,
            technologies: technologies ?? project.technologies,
            startDate: startDate ? new Date(startDate) : project.startDate,
            endDate: endDate ? new Date(endDate) : project.endDate,
            categoryId: categoryId ?? project.categoryId
        },
        include: { category: true }
    });

    res.json({
        success: true,
        message: 'Projet mis à jour avec succès',
        data: { items: updatedProject }
    });
});

// DELETE /api/projects/:id
export const deleteProject = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (!id) throw createError('ID manquant', 400);

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw createError('Projet non trouvé', 404);

    // Optionnel : vérifier que seul l'admin ou le créateur peut supprimer
    // if (project.userId !== req.user.id) throw createError('Non autorisé', 403);

    await prisma.project.delete({ where: { id } });

    res.json({
        success: true,
        message: 'Projet supprimé avec succès'
    });
});

// Bulk delete projects
export const bulkDeleteProjects = asyncHandler(async (req: AuthRequest, res: Response)  => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw createError('Aucun ID fourni', 400);
    }
    const deletedProjects = await prisma.project.deleteMany({
        where: {
            id: { in: ids }
        }
    });
    res.json({
        success: true,
        message: `${deletedProjects.count} projets supprimés avec succès`,
        data: { items: deletedProjects }
    });
});




// Génération de slug
const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};