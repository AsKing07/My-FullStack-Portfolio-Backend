require('dotenv').config(); 
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { createError } from '@/middleware/errorHandler';
import multer from 'multer';

/**
 * @desc Sauvegarde une image sur le disque et retourne son URL
 * @param {Express.Multer.File} file - Fichier image à sauvegarder
 * @param {string} entity - Dossier cible (ex: 'user', 'blog', etc.)
 * @returns {Promise<string>} - URL publique de l'image
 */
export const saveImage = async (file: Express.Multer.File, entity: string): Promise<string> => {
    if (!file) {
        throw createError('Aucun fichier fourni', 400);
    }

    const uploadDir = path.join(process.cwd(), 'uploads', entity);
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    fs.writeFileSync(filePath, file.buffer);

    const domain = process.env.DOMAIN || 'http://localhost:3000';
    return `${domain}/uploads/${entity}/${uniqueFilename}`;
};

/**
 * @desc Supprime une image du disque à partir de son URL publique
 * @param {string} url - URL publique de l'image à supprimer
 * @returns {Promise<void>}
 */
export const deleteImage = async (url: string): Promise<void> => {
    try {
        // Extraire le chemin relatif à partir de l'URL
        const uploadsIndex = url.indexOf('/uploads/');
        if (uploadsIndex === -1) {
            throw createError('URL invalide pour la suppression', 400);
        }
        const relativePath = url.substring(uploadsIndex + 1); // retire le slash initial
        const filePath = path.join(__dirname, '..', relativePath);

        // Vérifier si le fichier existe
        if (!fs.existsSync(filePath)) {
            throw createError('Fichier introuvable', 404);
        }

        // Supprimer le fichier
        fs.unlinkSync(filePath);
    } catch (error) {
        throw createError('Erreur lors de la suppression de l\'image', 500);
    }
};

/**
 * Multer config pour upload d'image en mémoire
 */
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(createError('Seules les images sont autorisées', 400));
        }
    }
});

/**
 * Middleware d'upload pour une entité donnée
 * @param param  Nom du champ (ex: 'image')
 */
export const uploadMiddleware = (param: string) => upload.single(param);
export const uploadImagesMiddleware =(param: string) => upload.array(param, 10); // 10 = nombre max de fichiers


/**
 * @desc Sauvegarde un fichier pdf sur le disque et retourne son URL
 * @param {Express.Multer.File} file - Fichier pdf à sauvegarder
 * @param {string} entity - Dossier cible (ex: 'user', 'blog', etc.)
 * @returns {Promise<string>} - URL publique du fichier
 */
export const savePdf = async (file: Express.Multer.File, entity: string): Promise<string> => {
    if (!file) {
        throw createError('Aucun fichier fourni', 400);
    }

    const uploadDir = path.join(process.cwd(), 'uploads', entity); // <-- correction ici aussi
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    fs.writeFileSync(filePath, file.buffer);

    const domain = process.env.DOMAIN || 'http://localhost:3000';
    return `${domain}/uploads/${entity}/${uniqueFilename}`;
};

/**
 * @desc Supprime un fichier pdf du disque à partir de son URL publique
 * @param {string} url - URL publique du fichier à supprimer
 * @returns {Promise<void>}
 */
export const deletePdf = async (url: string): Promise<void> => {
    try {
        // Extraire le chemin relatif à partir de l'URL
        const uploadsIndex = url.indexOf('/uploads/');
        if (uploadsIndex === -1) {
            throw createError('URL invalide pour la suppression', 400);
        }
        const relativePath = url.substring(uploadsIndex + 1); // retire le slash initial
        const filePath = path.join(__dirname, '..', relativePath);

        // Vérifier si le fichier existe
        if (!fs.existsSync(filePath)) {
            throw createError('Fichier introuvable', 404);
        }

        // Supprimer le fichier
        fs.unlinkSync(filePath);
    } catch (error) {
        throw createError('Erreur lors de la suppression du fichier', 500);
    }
};

/**
 * Multer config pour upload de pdf en mémoire
 */
export const uploadPdf = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: (req, file, cb) => {
        const filetypes = /pdf/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(createError('Seuls les fichiers PDF sont autorisés', 400));
        }
    }
});

/**
 * Middleware d'upload pour un fichier pdf
 */
export const uploadPdfMiddleware = (param : string) => uploadPdf.single(param);