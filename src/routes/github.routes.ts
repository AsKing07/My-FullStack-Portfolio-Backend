
import express from 'express';

import  { getGithubStatsController, getGithubProfileController, getGithubReposController } from '@/controllers/github.controller';



const router = express.Router();

// Route publique pour récupérer les statistiques GitHub
router.get('/stats/:username', getGithubStatsController);

// Route publique pour récupérer le profil GitHub
router.get('/profile/:username', getGithubProfileController);

// Route publique pour récupérer les dépôts GitHub
router.get('/repos/:username', getGithubReposController);


export default router;