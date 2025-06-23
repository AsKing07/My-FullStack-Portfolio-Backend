const express = require('express');
import { authenticate } from '../middleware/auth';

import {
    getContacts,
    getContactById,
    createContact,
    markAsRead,
    replyToContact,
    deleteContact

}from '../controllers/contact.controller';

const router = express.Router();
//Routes publiques
router.post('/', createContact);

//Routes protégées
router.get('/', authenticate, getContacts);
router.get('/:id', authenticate, getContactById);
router.put('/:id', authenticate, markAsRead);
router.patch('/:id', authenticate, replyToContact);
router.delete('/:id', authenticate, deleteContact);

export default router;


