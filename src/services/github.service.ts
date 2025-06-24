import { createError } from "@/middleware/errorHandler";
import axios from "axios";

// --- Models TypeScript ---

export interface GithubOwner {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: string;
  site_admin: boolean;
}

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: GithubOwner;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  topics: string[];
  visibility: string;
  archived: boolean;
  disabled: boolean;
  license: any;
  [key: string]: any; // pour les autres champs non listés
}

export interface GithubProfile {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

// --- Axios instance ---

const githubApi = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Charbel SONON - Portfolio",
    Authorization: "token " + process.env.GITHUB_TOKEN,
  },
});

// --- Services ---

/**
 * Récupère le profil GitHub
 */
export const getGithubProfile = async (username: string): Promise<GithubProfile> => {
  try {
    const response = await githubApi.get<GithubProfile>(`/users/${username}`);
    return response.data;
  } catch (error) {
    throw createError("Erreur lors de la récupération du profil GitHub", 500);
  }
};

/**
 * Récupère les dépôts GitHub de l'utilisateur
 */
export const getGithubRepos = async (
  username: string,
  options: { page?: number; per_page?: number; sort?: string; direction?: string } = {}
): Promise<GithubRepo[]> => {
  const { page = 1, per_page = 10, sort = "updated", direction = "desc" } = options;
  try {
    const response = await githubApi.get<GithubRepo[]>(`/users/${username}/repos`, {
      params: { page, per_page, sort, direction },
    });
    return response.data;
  } catch (error) {
    throw createError("Erreur lors de la récupération des dépôts GitHub", 500);
  }
};

/**
 * Récupère les statistiques de contribution GitHub
 */
export const getGithubStats = async (username: string) => {
  try {
    const [profile, repos] = await Promise.all([
      getGithubProfile(username),
      getGithubRepos(username, { per_page: 100 }),
    ]);

    // Statistiques simples
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);

    // Contributions = issues + pull requests ouverts sur tous les repos
    const totalContributions = repos.reduce(
      (sum, repo) => sum + (repo.open_issues_count || 0),
      0
    );

    // Langages utilisés
    const languages: { [key: string]: number } = {};
    repos.forEach((repo) => {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    });
    const languagesArray = Object.entries(languages)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / repos.length) * 100),
      }))
      .sort((a, b) => b.percentage - a.percentage);

    // Top 5 repos par stars
    const topRepos = repos
      .slice()
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 5);

    // Total commits de l'année actuelle
    const now = new Date();
    const year = now.getFullYear();
    const since = new Date(year, 0, 1).toISOString();
    const until = new Date(year + 1, 0, 1).toISOString();

    let totalCommitsThisYear = 0;
    for (const repo of repos) {
      try {
        const res = await githubApi.get(`/repos/${repo.owner.login}/${repo.name}/commits`, {
          params: {
            since,
            until,
            per_page: 1,
          },
        });
        const link = res.headers.link;
        if (link) {
          const match = link.match(/&page=(\d+)>; rel="last"/);
          if (match) {
            totalCommitsThisYear += parseInt(match[1], 10);
          } else {
            totalCommitsThisYear += 1;
          }
        } else {
          totalCommitsThisYear += res.data.length;
        }
      } catch (e) {
        // Ignore les erreurs sur certains repos privés ou inaccessibles
      }
    }

    return {
      profile,
      stats: {
        totalStars,
        totalForks,
        totalContributions,
        totalCommitsThisYear,
        totalRepos: repos.length,
        languages: languagesArray,
        topRepos,
      },
    };
  } catch (error) {
    throw createError("Erreur lors de la récupération des statistiques GitHub", 500);
  }
};