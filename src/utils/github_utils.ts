import { createError } from "@/middleware/errorHandler";


const axios = require('axios');

// Configuration de l'API GitHub

const githubApi = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'YourAppName', // Remplacez par le nom de votre application
        'Authorization': 'token ' + process.env.GITHUB_TOKEN // Assurez-vous que le token est stocké dans les variables d'environnement
    }
});

/**
 * Récupère les informations du profil GitHub
 * @param {string} username - Nom d'utilisateur GitHub
 * @returns {Promise<Object>} Les données du profil
 */
const getGithubProfile = async (username: string ) => {
    try {
        const response = await githubApi.get(`/users/${username}`);
        return response.data;
    } catch (error) {
     throw   createError('Erreur lors de la récupération du profil GitHub', 500);
      
    }
}

/**
 * Récupère les dépôts GitHub de l'utilisateur
 * @param {string} username - Nom d'utilisateur GitHub
 * @param {Object} options - Options de requête (page, per_page, sort, etc.)
 * @returns {Promise<Array>} Les dépôts de l'utilisateur
 */
const getGithubRepos = async (username: string, options: { page?: number; per_page?: number; sort?: string, direction?: string } = {}) => {
  const { page = 1, per_page = 10, sort = "updated", direction = "desc" } = options;
    try {
     const response = await githubApi.get(`/users/${username}/repos`, {
      params: { page, per_page, sort, direction },
    });
    return response.data;
    } catch (error) {
        throw createError('Erreur lors de la récupération des dépôts GitHub', 500);
    }
}


/**
 * Récupère les statistiques de contribution GitHub
 * @param {string} username - Nom d'utilisateur GitHub
 * @returns {Promise<Object>} Les statistiques de contribution
 */
const getGithubStats = async (username: string) => {
    try {
     // Récupérer le profil et les dépôts
    const [profile, repos] = await Promise.all([
      getGithubProfile(username),
      getGithubRepos(username, { per_page: 100 }),
    ]);

    // Calculer les statistiques
    const totalStars = repos.reduce((sum: number, repo: any) => sum + repo.stargazers_count, 0);
    
    // Créer un objet avec toutes les langues utilisées
    const languages: { [key: string]: number } = {};
    repos.forEach((repo: any) => {
        if (repo.language) {
            languages[repo.language] = (languages[repo.language] || 0) + 1;
        }
    });

    // Convertir l'objet languages en tableau trié
        const languagesArray = Object.entries(languages).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / repos.length) * 100),
    })).sort((a, b) => b.count - a.count);

     return {
      profile: {
        login: profile.login,
        name: profile.name,
        avatarUrl: profile.avatar_url,
        htmlUrl: profile.html_url,
        bio: profile.bio,
        publicRepos: profile.public_repos,
        followers: profile.followers,
        following: profile.following,
        createdAt: profile.created_at,
      },
      stats: {
        totalStars,
        totalRepos: repos.length,
        languages: languagesArray,
        topRepos: repos
          .sort((a: any, b: any) => b.stargazers_count - a.stargazers_count)
          .slice(0, 5)
          .map((repo: any) => ({
            name: repo.name,
            description: repo.description,
            url: repo.html_url,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            language: repo.language,
          })),
      },
    };
        
    } catch (error) {
        throw createError('Erreur lors de la récupération des statistiques GitHub', 500);
    }
}

module.exports = {
    getGithubProfile,
    getGithubRepos,
    getGithubStats
}