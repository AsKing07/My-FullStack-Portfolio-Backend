import { AuthRequest } from "@/middleware/auth";
import { asyncHandler, createError } from '../middleware/errorHandler';
import { Request, Response } from 'express';
import { saveImage, deleteImage } from "@/utils/saveFile_utils";
import { PostStatus } from "@prisma/client";
import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();

/**
 * @desc Récupère tous les articles publiés
 * @route GET /api/blog
 * @access Public
 */
const getPosts = asyncHandler(async (req: Request, res: Response)=>{
    const {
        published, limit = 10, page = 1,   
    } = req.query;

    const where: any = {
        status: 'PUBLISHED'
    };
    // if (typeof published === 'string' && published.toLowerCase() === 'draft') {
    //     where.status = 'DRAFT';
       
    // }
    // else if (typeof published === 'string' && published.toLowerCase() === 'archived') {
    //     where.status = 'ARCHIVED';
    // }

     const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    let options = {
        where: where,
        orderBy: {
            createdAt: 'desc' as const
        },
        select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            content: true,
            status: true,
            featured: true,
            metaTitle: true,
            metaDesc: true,
            image: true,
            readingTime: true,
            createdAt: true,
            updatedAt: true,
            publishedAt: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true
                }
            }
        },
        take: limitNum,
        skip: skip
     
    };

    if (page && typeof page === 'number') {
    
    }

    if (limit && typeof limit === 'number') {
       options.take = limit;
    
    }

    const [posts, total] = await Promise.all([
        prisma.blogPost.findMany(options ),
        prisma.blogPost.count({ where })
    ]);

    res.status(200).json({
        success: true,
        data:{
            items: posts,
            pagination:{
                page: pageNum, 
                limit: limitNum,
                total: total,
                pages: Math.ceil(total / options.take)
            }
        }
    });


})


/**
 * @desc Récupère tous les articles (admin - incluant les non publiés)
 * @route GET /api/blog/admin
 * @access Private (Admin Only)
 */
const getPostsAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        published, limit = 10, page = 1,
    } = req.query;
    const where: any = {
        userId: req.user?.id
    };
    if (typeof published === 'string' && published.toLowerCase() === 'draft') {
        where.status = 'DRAFT';
    } else if (typeof published === 'string' && published.toLowerCase() === 'archived') {
        where.status = 'ARCHIVED';
    } else if (typeof published === 'string' && published.toLowerCase() === 'published') {
        where.status = 'PUBLISHED';
    }
    console.log('where', where);
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    let options = {
        where: where,
        orderBy: {
            createdAt: 'desc' as const
        },
        select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            content: true,
            status: true,
            featured: true,
            metaTitle: true,
            metaDesc: true,
            image: true,
            readingTime: true,
            createdAt: true,
            updatedAt: true,
            publishedAt: true,
        },
        take: limitNum,
        skip: skip
    };
    if (page && typeof page === 'number') {
        options.skip = (page - 1) * limitNum;
    }
    if (limit && typeof limit === 'number') {
        options.take = limit;
    }
    const [posts, total] = await Promise.all([
        prisma.blogPost.findMany(options),
        prisma.blogPost.count({ where })
    ]);
    res.status(200).json({
        success: true,
        data: {
            items:posts,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: total,
                pages: Math.ceil(total / options.take)
            }
        }
    });
});

/**
 * @desc Récupère un article par son slug
 * @route GET /api/blog/:slug
 * @access Public
 */
const getPostBySlug = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;
    if (!slug) {
        throw createError('Slug manquant', 400);
    }
    const post = await prisma.blogPost.findUnique({
        where: { slug: slug as string },
        select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            content: true,
            status: true,
            featured: true,
            metaTitle: true,
            metaDesc: true,
            image: true,
            readingTime: true,
            createdAt: true,
            updatedAt: true,
            publishedAt: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true
                }
            }
        }
    });
    if (!post ) {
        throw createError('Article non trouvé', 404);
    }
    res.status(200).json({
        success: true,
        data: {
            items: post
        }
    });
});

/**
 * @desc Crée un nouvel article
 * @route POST /api/blog
 * @access Private (Admin Only)
 */
const createPost = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, slug, content, excerpt, status, featured, metaTitle, metaDesc, readingTime } = req.body;

    let featuredConverted = (featured === 'false' || featured === false) ? false : true;
    let readingTimeConverted = readingTime ? parseInt(readingTime) : null;

    if (!title || !slug || !content) {
        throw createError('Titre, slug et contenu sont requis', 400);
    }

    if (status && !Object.values(PostStatus).includes(status as PostStatus)) {
        throw createError('Statut invalide, doit être DRAFT, PUBLISHED ou ARCHIVED', 400);
    }

    let imageUrl: string | undefined;
    if (req.file) {
        imageUrl = await saveImage(req.file, 'blog');
    }

    const post = await prisma.blogPost.create({
        data: {
            ...req.body,
            image: imageUrl,
            featured: featuredConverted,
            readingTime: readingTimeConverted,
            status: status || 'DRAFT', 
            userId: req.user?.id
        },
        select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            content: true,
            status: true,
            featured: true,
            metaTitle: true,
            metaDesc: true,
            image: true,
            readingTime: true,
            createdAt: true,
            updatedAt: true,
            
        }
    });
    res.status(201).json({
        success: true,
        message: 'Article créé avec succès',
        data: {
            items: post
        }
    });
});

/**
 * @desc Publie un article
 * @route PUT /api/blog/:id/publish
 *  @access Private (Admin Only)
 */
const publishPost = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw createError('ID manquant', 400);
    }

    const post = await prisma.blogPost.findUnique({
        where: { id }
    });

    if (!post) {
        throw createError('Article non trouvé', 404);
    }

    if (post.status === 'PUBLISHED') {
        throw createError('L\'article est déjà publié', 400);
    }

    const updatedPost = await prisma.blogPost.update({
        where: { id },
        data: {
            status: 'PUBLISHED',
            publishedAt: new Date()
        },
        select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            content: true,
            status: true,
            featured: true,
            metaTitle: true,
            metaDesc: true,
            image: true,
            readingTime: true,
            createdAt: true,
            updatedAt: true,

        }
    });

    res.status(200).json({
        success: true,
        message: 'Article publié avec succès',
        data: {
            items: updatedPost
        }
    });
});


/**
 * @desc Met à jour un article
 * @route PUT /api/blog/:id
 * @access Private (Admin Only)
 */
const updatePost = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw createError('ID manquant', 400);
    }

    const post = await prisma.blogPost.findUnique({
        where: { id }
    });

    if (!post) {
        throw createError('Article non trouvé', 404);
    }

    const updatedData: any = { ...req.body };

    if (req.file ) {

        // If an image is provided, delete the old image if it exists
        if (post.image) {
            await deleteImage(post.image);
        }


        //Save the image to the uploads folder and get the url
        const imageUrl = await saveImage(req.file, 'blog');
        updatedData.image = imageUrl;
    }
    if (updatedData.featured) {
        updatedData.featured = (updatedData.featured === 'false' || updatedData.featured === false) ? false : true;
    }
    if (updatedData.readingTime) {
        updatedData.readingTime = parseInt(updatedData.readingTime);
    }

    
    if (updatedData.status && !Object.values(PostStatus).includes(updatedData.status as PostStatus)) {
        throw createError('Statut invalide, doit être DRAFT, PUBLISHED ou ARCHIVED', 400);
    }



    const updatedPost = await prisma.blogPost.update({
        where: { id },
        data: updatedData,
        select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            content: true,
            status: true,
            featured: true,
            metaTitle: true,
            metaDesc: true,
            image: true,
            readingTime: true,
            createdAt: true,
            updatedAt: true,
           
        }
    });

    res.status(200).json({
        success: true,
        message: 'Article mis à jour avec succès',
        data: {
            items: updatedPost
        }
    });
});


/**
 * @desc Supprime un article
 * @route DELETE /api/blog/:id
 * @access Private (Admin Only)
 */
const deletePost = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw createError('ID manquant', 400);
    }

    const post = await prisma.blogPost.findUnique({
        where: { id }
    });

    if (!post) {
        throw createError('Article non trouvé', 404);
    }

    // Delete the image if it exists
    if (post.image) {
        await deleteImage(post.image);
    }

    await prisma.blogPost.delete({
        where: { id }
    });

    res.status(200).json({
        success: true,
        message: 'Article supprimé avec succès'
    });
});




export {
    getPosts,
    getPostsAdmin,
    getPostBySlug,
    createPost,
    publishPost,
    updatePost,
    deletePost
};



