import { PrismaClient, ContactStatus } from '@prisma/client';
import { Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

/**
 * @desc Obtenir tous les messages de contact (paginated)
 * @route GET /api/contacts
 * @access Private (Admin)
 */
export const getContacts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = '1', limit = '10', status } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) where.status = status;

    const [contacts, total] = await Promise.all([
        prisma.contact.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum
        }),
        prisma.contact.count({ where })
    ]);

    res.json({
        success: true,
        data: {
          items:  contacts,
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
 * @desc Obtenir un message de contact par ID
 * @route GET /api/contacts/:id
 * @access Private (Admin)
 */
export const getContactById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (!id) throw createError('ID manquant', 400);

    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) throw createError('Message non trouvé', 404);

    res.json({ success: true, data: {
        items: contact
    } });
});

/**
 * @desc Créer un message de contact (public)
 * @route POST /api/contacts
 * @access Public
 */
export const createContact = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, subject, message, phone, company, website, userId } = req.body;
    if (!name || !email || !message) {
        throw createError('Nom, email et message sont requis', 400);
    }

    const contact = await prisma.contact.create({
        data: {
            name,
            email,
            subject,
            message,
            phone,
            company,
            website,
            userId: userId ?? null
        }
    });

    // Envoyer une notification email à toi-même
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const emailContent = `
Nouveau message de contact reçu !

📧 De: ${name} (${email})
${phone ? `📱 Téléphone: ${phone}` : ''}
${company ? `🏢 Entreprise: ${company}` : ''}
${website ? `🌐 Site web: ${website}` : ''}
📝 Sujet: ${subject || 'Aucun sujet'}

💬 Message:
${message}

---
Envoyé depuis votre portfolio
Date: ${new Date().toLocaleString('fr-FR')}
        `;

        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: process.env.CONTACT_EMAIL, // ou process.env.SMTP_USER
            subject: `🔔 Nouveau message de contact - ${name}`,
            text: emailContent
        });
    } catch (emailError) {
        // Log l'erreur mais ne pas faire échouer la création du contact
        console.error('Erreur lors de l\'envoi de la notification email:', emailError);
    }

    res.status(201).json({
        success: true,
        message: 'Message envoyé avec succès',
        data: {
            items: contact
        }
    });
});

/**
 * @desc Marquer un message comme lu
 * @route PATCH /api/contacts/:id/read
 * @access Private (Admin)
 */
export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (!id) throw createError('ID manquant', 400);

    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) throw createError('Message non trouvé', 404);

    const updated = await prisma.contact.update({
        where: { id },
        data: { read: true, status: ContactStatus.READ }
    });

    res.json({
        success: true,
        message: 'Message marqué comme lu',
        data: {
            items: updated
        }
    });
});

/**
 * @desc Répondre à un message de contact (envoi d'email)
 * @route POST /api/contacts/:id/reply
 * @access Private (Admin)
 */
export const replyToContact = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { reply } = req.body;
    if (!id || !reply) throw createError('ID et réponse requis', 400);

    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) throw createError('Message non trouvé', 404);

    // Configurer le transporteur nodemailer
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    // Envoyer l'email
    await transporter.sendMail({
        from: process.env.CONTACT_EMAIL,
        replyTo: process.env.CONTACT_EMAIL,
        to: contact.email,
        subject: `Réponse à votre message${contact.subject ? ' : ' + contact.subject : ''}`,
        text: reply
    });

    // Mettre à jour le statut du message
    await prisma.contact.update({
        where: { id },
        data: { status: ContactStatus.REPLIED }
    });

    res.json({
        success: true,
        message: 'Réponse envoyée avec succès'
    });
});

/**
 * @desc Supprimer un message de contact
 * @route DELETE /api/contacts/:id
 * @access Private (Admin)
 */
export const deleteContact = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (!id) throw createError('ID manquant', 400);

    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) throw createError('Message non trouvé', 404);

    await prisma.contact.delete({ where: { id } });

    res.json({
        success: true,
        message: 'Message supprimé avec succès'
    });
});