const {getGithubStats} = require('../services/github_service');
import { asyncHandler, createError } from '../middleware/async_handler';

//@desc Récupérer les statistiques GitHub
//@route GET /api/github/stats/:username
//@access Public
export const getGithubStatsController = asyncHandler(async (req, res) => {
    try{
        const { username } = req.params;
      
        if (!username) {
            throw createError("Username is required", 400);
        }

        const stats = await getGithubStats(username);
        res.status(200).json(stats);
    }
    catch (error) {
        throw createError("Error lors de la récupération des statis", 500);
    }
})  