import { getCache, setCache, getCacheWithFallback } from './storage';

const GITHUB_REPO = 'fuck-algorithm/leetcode-76-minimum-window-substring';
const CACHE_KEY = 'github-stars';
const CACHE_EXPIRY = 60 * 60 * 1000; // 1小时

interface GitHubRepoResponse {
  stargazers_count: number;
}

export const getGitHubStars = async (): Promise<number> => {
  // 先尝试从缓存获取
  const cached = await getCache<number>(CACHE_KEY);
  if (cached !== null) {
    return cached;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`);
    if (!response.ok) {
      throw new Error('Failed to fetch');
    }
    const data: GitHubRepoResponse = await response.json();
    const stars = data.stargazers_count;
    
    // 缓存结果
    await setCache(CACHE_KEY, stars, CACHE_EXPIRY);
    return stars;
  } catch {
    // 获取失败，尝试返回过期的缓存
    const fallback = await getCacheWithFallback<number>(CACHE_KEY);
    return fallback ?? 0;
  }
};

export const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO}`;
