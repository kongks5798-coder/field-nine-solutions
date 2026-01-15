/**
 * GitHub API Client
 * 저장소 활동 모니터링
 */

// ============================================
// Types
// ============================================

export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  url: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  html_url: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  labels: Array<{ name: string; color: string }>;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  html_url: string;
}

export interface GitHubRepoStats {
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  openPRs: number;
  lastPush: Date | null;
}

// ============================================
// API Helpers
// ============================================

async function githubFetch<T>(endpoint: string): Promise<T> {
  const token = process.env.GITHUB_ACCESS_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY || 'kongks5798-coder/field-nine-solutions';

  if (!token) {
    throw new Error('GitHub access token not configured');
  }

  const response = await fetch(`https://api.github.com/repos/${repo}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Field-Nine-Panopticon',
    },
    next: { revalidate: 60 }, // 1분 캐시
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.json();
}

// ============================================
// Repository Functions
// ============================================

/**
 * 저장소 기본 정보 가져오기
 */
export async function getRepositoryInfo(): Promise<{
  name: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  lastPush: Date | null;
  isPrivate: boolean;
}> {
  try {
    const data = await githubFetch<{
      name: string;
      full_name: string;
      description: string | null;
      default_branch: string;
      stargazers_count: number;
      forks_count: number;
      watchers_count: number;
      open_issues_count: number;
      pushed_at: string;
      private: boolean;
    }>('');

    return {
      name: data.name,
      fullName: data.full_name,
      description: data.description,
      defaultBranch: data.default_branch,
      stars: data.stargazers_count,
      forks: data.forks_count,
      watchers: data.watchers_count,
      openIssues: data.open_issues_count,
      lastPush: data.pushed_at ? new Date(data.pushed_at) : null,
      isPrivate: data.private,
    };
  } catch (error) {
    console.error('[GitHub] Repository info error:', error);
    throw error;
  }
}

/**
 * 최근 커밋 가져오기
 */
export async function getRecentCommits(limit = 10): Promise<GitHubCommit[]> {
  try {
    const data = await githubFetch<
      Array<{
        sha: string;
        commit: {
          message: string;
          author: {
            name: string;
            email: string;
            date: string;
          };
        };
        html_url: string;
      }>
    >(`/commits?per_page=${limit}`);

    return data.map((item) => ({
      sha: item.sha,
      message: item.commit.message,
      author: {
        name: item.commit.author.name,
        email: item.commit.author.email,
        date: item.commit.author.date,
      },
      url: item.html_url,
    }));
  } catch (error) {
    console.error('[GitHub] Commits error:', error);
    return [];
  }
}

/**
 * 열린 PR 목록 가져오기
 */
export async function getOpenPullRequests(): Promise<GitHubPullRequest[]> {
  try {
    const data = await githubFetch<
      Array<{
        id: number;
        number: number;
        title: string;
        state: 'open' | 'closed';
        user: {
          login: string;
          avatar_url: string;
        };
        created_at: string;
        updated_at: string;
        merged_at: string | null;
        html_url: string;
      }>
    >('/pulls?state=open');

    return data.map((item) => ({
      id: item.id,
      number: item.number,
      title: item.title,
      state: item.merged_at ? 'merged' : item.state,
      user: item.user,
      created_at: item.created_at,
      updated_at: item.updated_at,
      merged_at: item.merged_at,
      html_url: item.html_url,
    }));
  } catch (error) {
    console.error('[GitHub] PRs error:', error);
    return [];
  }
}

/**
 * 열린 이슈 목록 가져오기
 */
export async function getOpenIssues(): Promise<GitHubIssue[]> {
  try {
    const data = await githubFetch<
      Array<{
        id: number;
        number: number;
        title: string;
        state: 'open' | 'closed';
        labels: Array<{ name: string; color: string }>;
        user: {
          login: string;
          avatar_url: string;
        };
        created_at: string;
        html_url: string;
        pull_request?: unknown;
      }>
    >('/issues?state=open');

    // PR이 아닌 순수 이슈만 필터링
    return data
      .filter((item) => !item.pull_request)
      .map((item) => ({
        id: item.id,
        number: item.number,
        title: item.title,
        state: item.state,
        labels: item.labels,
        user: item.user,
        created_at: item.created_at,
        html_url: item.html_url,
      }));
  } catch (error) {
    console.error('[GitHub] Issues error:', error);
    return [];
  }
}

/**
 * 저장소 통계 요약
 */
export async function getRepoStats(): Promise<GitHubRepoStats> {
  try {
    const [repoInfo, prs] = await Promise.all([
      getRepositoryInfo(),
      getOpenPullRequests(),
    ]);

    return {
      stars: repoInfo.stars,
      forks: repoInfo.forks,
      watchers: repoInfo.watchers,
      openIssues: repoInfo.openIssues,
      openPRs: prs.length,
      lastPush: repoInfo.lastPush,
    };
  } catch (error) {
    console.error('[GitHub] Stats error:', error);
    return {
      stars: 0,
      forks: 0,
      watchers: 0,
      openIssues: 0,
      openPRs: 0,
      lastPush: null,
    };
  }
}

/**
 * GitHub 연결 확인
 */
export async function checkGitHubConnection(): Promise<{
  connected: boolean;
  rateLimit?: {
    remaining: number;
    limit: number;
    resetAt: Date;
  };
  error?: string;
}> {
  const token = process.env.GITHUB_ACCESS_TOKEN;

  if (!token) {
    return { connected: false, error: 'Token not configured' };
  }

  try {
    const response = await fetch('https://api.github.com/rate_limit', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return { connected: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();

    return {
      connected: true,
      rateLimit: {
        remaining: data.rate.remaining,
        limit: data.rate.limit,
        resetAt: new Date(data.rate.reset * 1000),
      },
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}
