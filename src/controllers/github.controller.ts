const {getGithubStats, getGithubProfile, getGithubRepos} = require('../services/github.service');
import { asyncHandler, createError } from '../middleware/errorHandler';
import { Request, Response } from 'express';

//@desc Récupérer les statistiques GitHub
//@route GET /api/github/stats/:username
//@access Public
export const getGithubStatsController = asyncHandler(async (req: Request, res: Response) => {
    try{
        const { username } = req.params;
      
        if (!username) {
            throw createError("Username is required", 400);
        }

        const stats = await getGithubStats(username);
         res.status(200).json({
            status: "success",
            data: {
                items: stats
            }
         });
    }
    catch (error) {
        throw createError("Error lors de la récupération des statis", 500);
    }
})  

//@desc Récupérer le profil GitHub
//@route GET /api/github/profile/:username
//@access Public
export const getGithubProfileController = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { username } = req.params;

        if (!username) {
            throw createError("Username is required", 400);
        }

        const profile = await getGithubProfile(username);
        res.status(200).json({
            status: "success",
            data: {
                items: profile
            }
        });
    } catch (error) {
        throw createError("Error lors de la récupération du profil GitHub", 500);
    }
});

//@desc Récupérer les dépôts GitHub
//@route GET /api/github/repos/:username
//@access Public
export const getGithubReposController = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { username } = req.params;
        const { page, per_page, sort, direction } = req.query;

        if (!username) {
            throw createError("Username is required", 400);
        }

        const options = {
            page: parseInt(page as string) || 1,
            per_page: parseInt(per_page as string) || 10,
            sort: sort as string || "updated",
            direction: direction as string || "desc"
        };

        const repos = await getGithubRepos(username, options);
        res.status(200).json({
            status: "success",
            data: {
                items: repos
            }
        });
    } catch (error) {
        throw createError("Error lors de la récupération des dépôts GitHub", 500);
    }
});