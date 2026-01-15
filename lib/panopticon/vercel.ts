/**
 * Vercel API Client
 * 배포 상태, 프로젝트 정보 조회
 */

// ============================================
// Types
// ============================================
export interface Deployment {
  id: string;
  url: string;
  name: string;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  createdAt: Date;
  buildingAt?: Date;
  ready?: Date;
  creator: {
    username: string;
    email: string;
  };
  meta?: {
    githubCommitRef?: string;
    githubCommitMessage?: string;
    githubCommitSha?: string;
  };
}

export interface Project {
  id: string;
  name: string;
  framework?: string;
  updatedAt: Date;
  latestDeployment?: Deployment;
}

export interface DomainInfo {
  name: string;
  verified: boolean;
  createdAt: Date;
}

// ============================================
// API Helpers
// ============================================
const VERCEL_API_BASE = 'https://api.vercel.com';

async function vercelFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = process.env.VERCEL_ACCESS_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token) {
    throw new Error('VERCEL_ACCESS_TOKEN 환경 변수가 설정되지 않았습니다.');
  }

  const url = new URL(`${VERCEL_API_BASE}${endpoint}`);
  if (teamId) {
    url.searchParams.set('teamId', teamId);
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vercel API 오류 (${response.status}): ${error}`);
  }

  return response.json();
}

// ============================================
// Deployment Functions
// ============================================

/**
 * 최신 배포 목록 가져오기
 */
export async function getDeployments(limit: number = 10): Promise<Deployment[]> {
  try {
    const projectId = process.env.VERCEL_PROJECT_ID;

    let endpoint = '/v6/deployments';
    if (projectId) {
      endpoint += `?projectId=${projectId}&limit=${limit}`;
    } else {
      endpoint += `?limit=${limit}`;
    }

    const data = await vercelFetch<{ deployments: any[] }>(endpoint);

    return data.deployments.map((d) => ({
      id: d.uid,
      url: d.url,
      name: d.name,
      state: d.state,
      createdAt: new Date(d.createdAt),
      buildingAt: d.buildingAt ? new Date(d.buildingAt) : undefined,
      ready: d.ready ? new Date(d.ready) : undefined,
      creator: {
        username: d.creator?.username || 'unknown',
        email: d.creator?.email || '',
      },
      meta: {
        githubCommitRef: d.meta?.githubCommitRef,
        githubCommitMessage: d.meta?.githubCommitMessage,
        githubCommitSha: d.meta?.githubCommitSha,
      },
    }));
  } catch (error) {
    console.error('[Vercel] 배포 목록 조회 실패:', error);
    return [];
  }
}

/**
 * 최신 배포 상태 가져오기
 */
export async function getLatestDeployment(): Promise<Deployment | null> {
  try {
    const deployments = await getDeployments(1);
    return deployments[0] || null;
  } catch (error) {
    console.error('[Vercel] 최신 배포 조회 실패:', error);
    return null;
  }
}

/**
 * 특정 배포 상세 정보
 */
export async function getDeploymentById(deploymentId: string): Promise<Deployment | null> {
  try {
    const data = await vercelFetch<any>(`/v13/deployments/${deploymentId}`);

    return {
      id: data.uid,
      url: data.url,
      name: data.name,
      state: data.readyState,
      createdAt: new Date(data.createdAt),
      buildingAt: data.buildingAt ? new Date(data.buildingAt) : undefined,
      ready: data.ready ? new Date(data.ready) : undefined,
      creator: {
        username: data.creator?.username || 'unknown',
        email: data.creator?.email || '',
      },
      meta: {
        githubCommitRef: data.meta?.githubCommitRef,
        githubCommitMessage: data.meta?.githubCommitMessage,
        githubCommitSha: data.meta?.githubCommitSha,
      },
    };
  } catch (error) {
    console.error('[Vercel] 배포 상세 조회 실패:', error);
    return null;
  }
}

// ============================================
// Project Functions
// ============================================

/**
 * 프로젝트 정보 가져오기
 */
export async function getProject(): Promise<Project | null> {
  try {
    const projectId = process.env.VERCEL_PROJECT_ID;

    if (!projectId) {
      throw new Error('VERCEL_PROJECT_ID 환경 변수가 설정되지 않았습니다.');
    }

    const data = await vercelFetch<any>(`/v9/projects/${projectId}`);

    const latestDeployment = data.latestDeployments?.[0];

    return {
      id: data.id,
      name: data.name,
      framework: data.framework,
      updatedAt: new Date(data.updatedAt),
      latestDeployment: latestDeployment
        ? {
            id: latestDeployment.uid,
            url: latestDeployment.url,
            name: latestDeployment.name,
            state: latestDeployment.readyState,
            createdAt: new Date(latestDeployment.createdAt),
            creator: {
              username: latestDeployment.creator?.username || 'unknown',
              email: latestDeployment.creator?.email || '',
            },
          }
        : undefined,
    };
  } catch (error) {
    console.error('[Vercel] 프로젝트 조회 실패:', error);
    return null;
  }
}

/**
 * 프로젝트 도메인 목록
 */
export async function getProjectDomains(): Promise<DomainInfo[]> {
  try {
    const projectId = process.env.VERCEL_PROJECT_ID;

    if (!projectId) {
      throw new Error('VERCEL_PROJECT_ID 환경 변수가 설정되지 않았습니다.');
    }

    const data = await vercelFetch<{ domains: any[] }>(
      `/v9/projects/${projectId}/domains`
    );

    return data.domains.map((d) => ({
      name: d.name,
      verified: d.verified,
      createdAt: new Date(d.createdAt),
    }));
  } catch (error) {
    console.error('[Vercel] 도메인 조회 실패:', error);
    return [];
  }
}

// ============================================
// Status & Health Check
// ============================================

/**
 * Vercel 연결 상태 확인
 */
export async function checkVercelConnection(): Promise<{
  connected: boolean;
  project?: string;
  latestDeploymentState?: string;
  error?: string;
}> {
  try {
    const project = await getProject();

    if (project) {
      return {
        connected: true,
        project: project.name,
        latestDeploymentState: project.latestDeployment?.state,
      };
    }

    return {
      connected: false,
      error: '프로젝트를 찾을 수 없습니다.',
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

/**
 * 배포 상태를 한글로 변환
 */
export function getDeploymentStateText(state: Deployment['state']): string {
  const stateMap: Record<Deployment['state'], string> = {
    BUILDING: '빌드 중',
    ERROR: '오류 발생',
    INITIALIZING: '초기화 중',
    QUEUED: '대기 중',
    READY: '배포 완료',
    CANCELED: '취소됨',
  };

  return stateMap[state] || state;
}

/**
 * 배포 상태에 따른 뱃지 타입
 */
export function getDeploymentBadgeType(
  state: Deployment['state']
): 'positive' | 'negative' | 'warning' | 'neutral' {
  switch (state) {
    case 'READY':
      return 'positive';
    case 'ERROR':
      return 'negative';
    case 'BUILDING':
    case 'INITIALIZING':
    case 'QUEUED':
      return 'warning';
    case 'CANCELED':
    default:
      return 'neutral';
  }
}
