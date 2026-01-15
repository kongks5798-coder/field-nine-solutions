/**
 * External Data Client
 * 로컬 서버 (무신사 크롤러) 및 외부 데이터 소스 연동
 */

// ============================================
// Types
// ============================================

/** 무신사 랭킹 데이터 */
export interface MusinsaRanking {
  overallRank: number;
  categoryRank: number;
  category: string;
  previousRank?: number;
  change: 'up' | 'down' | 'same';
  changeAmount: number;
  updatedAt: Date;
}

/** 무신사 매출 데이터 */
export interface MusinsaSales {
  totalSales: number;
  todaySales: number;
  weekSales: number;
  monthSales: number;
  settlementAmount: number;
  pendingSettlement: number;
  updatedAt: Date;
}

/** 무신사 상품 데이터 */
export interface MusinsaProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  rank?: number;
  salesCount: number;
  reviewCount: number;
  rating: number;
}

/** CS/클레임 데이터 */
export interface CSReport {
  totalCases: number;
  pendingCases: number;
  urgentCases: number;
  todayCases: number;
  categories: {
    delivery: number;
    quality: number;
    exchange: number;
    refund: number;
    other: number;
  };
  updatedAt: Date;
}

/** 서버 상태 데이터 */
export interface ServerStatus {
  name: string;
  status: 'online' | 'offline' | 'warning';
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage?: number;
  temperature?: number;
  uptime: number; // seconds
  updatedAt: Date;
}

/** 재무 데이터 */
export interface FinancialData {
  monthlyRevenue: number;
  monthlyExpense: number;
  operatingMargin: number;
  previousMonthRevenue: number;
  targetRevenue: number;
  fixedExpenses: {
    labor: number;
    rent: number;
    logistics: number;
    other: number;
  };
  updatedAt: Date;
}

/** 생산 데이터 */
export interface ProductionData {
  brand: string;
  item: string;
  status: 'sampling' | 'production' | 'shipping' | 'completed';
  progress: number; // 0-100
  quantity: number;
  dueDate: Date;
  notes?: string;
}

// ============================================
// Mock Data (연동 실패 시 사용)
// ============================================

const MOCK_MUSINSA_RANKING: MusinsaRanking = {
  overallRank: 8,
  categoryRank: 2,
  category: '아우터',
  previousRank: 10,
  change: 'up',
  changeAmount: 2,
  updatedAt: new Date(),
};

const MOCK_MUSINSA_SALES: MusinsaSales = {
  totalSales: 124500000,
  todaySales: 4200000,
  weekSales: 28500000,
  monthSales: 124500000,
  settlementAmount: 98000000,
  pendingSettlement: 26500000,
  updatedAt: new Date(),
};

const MOCK_CS_REPORT: CSReport = {
  totalCases: 45,
  pendingCases: 18,
  urgentCases: 3,
  todayCases: 15,
  categories: {
    delivery: 15,
    quality: 8,
    exchange: 12,
    refund: 7,
    other: 3,
  },
  updatedAt: new Date(),
};

const MOCK_SERVER_STATUS: ServerStatus = {
  name: 'RTX 5090 Server',
  status: 'online',
  cpuUsage: 45,
  memoryUsage: 62,
  gpuUsage: 38,
  temperature: 62,
  uptime: 864000, // 10 days
  updatedAt: new Date(),
};

const MOCK_FINANCIAL_DATA: FinancialData = {
  monthlyRevenue: 124500000,
  monthlyExpense: 109200000,
  operatingMargin: 12.4,
  previousMonthRevenue: 108260000,
  targetRevenue: 120000000,
  fixedExpenses: {
    labor: 25000000,
    rent: 8000000,
    logistics: 7000000,
    other: 5000000,
  },
  updatedAt: new Date(),
};

const MOCK_PRODUCTION_DATA: ProductionData[] = [
  {
    brand: 'Aura Sydney',
    item: 'S/S 컬렉션',
    status: 'sampling',
    progress: 80,
    quantity: 500,
    dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    notes: '샘플링 80% 완료',
  },
  {
    brand: 'Filluminate',
    item: '24FW 리오더',
    status: 'shipping',
    progress: 95,
    quantity: 1200,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    notes: '공장 출고 대기',
  },
];

// ============================================
// API Helpers
// ============================================

async function localFetch<T>(
  endpoint: string,
  options?: RequestInit & { useMock?: boolean }
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_LOCAL_API_URL || 'http://localhost:8000';
  const secretKey = process.env.LOCAL_API_SECRET_KEY;

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(secretKey && { 'X-API-Key': secretKey }),
        ...options?.headers,
      },
      // 타임아웃 설정 (5초)
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`[External Data] ${endpoint} 요청 실패:`, error);
    throw error;
  }
}

// ============================================
// Musinsa Data Functions
// ============================================

/**
 * 무신사 실시간 랭킹 가져오기
 */
export async function getMusinsaRanking(): Promise<MusinsaRanking> {
  try {
    const data = await localFetch<MusinsaRanking>('/api/musinsa/ranking');
    return {
      ...data,
      updatedAt: new Date(data.updatedAt),
    };
  } catch {
    console.warn('[Musinsa] 랭킹 데이터 연동 실패, Mock 데이터 사용');
    return MOCK_MUSINSA_RANKING;
  }
}

/**
 * 무신사 매출 데이터 가져오기
 */
export async function getMusinsaSales(): Promise<MusinsaSales> {
  try {
    const data = await localFetch<MusinsaSales>('/api/musinsa/sales');
    return {
      ...data,
      updatedAt: new Date(data.updatedAt),
    };
  } catch {
    console.warn('[Musinsa] 매출 데이터 연동 실패, Mock 데이터 사용');
    return MOCK_MUSINSA_SALES;
  }
}

/**
 * 무신사 베스트 상품 목록
 */
export async function getMusinsaTopProducts(
  limit: number = 10
): Promise<MusinsaProduct[]> {
  try {
    const data = await localFetch<MusinsaProduct[]>(
      `/api/musinsa/products/top?limit=${limit}`
    );
    return data;
  } catch {
    console.warn('[Musinsa] 상품 데이터 연동 실패, 빈 배열 반환');
    return [];
  }
}

// ============================================
// CS/Claim Data Functions
// ============================================

/**
 * CS/클레임 리포트 가져오기
 */
export async function getCSReport(): Promise<CSReport> {
  try {
    const data = await localFetch<CSReport>('/api/cs/report');
    return {
      ...data,
      updatedAt: new Date(data.updatedAt),
    };
  } catch {
    console.warn('[CS] 리포트 연동 실패, Mock 데이터 사용');
    return MOCK_CS_REPORT;
  }
}

// ============================================
// Server Status Functions
// ============================================

/**
 * 로컬 서버 상태 가져오기
 */
export async function getServerStatus(): Promise<ServerStatus> {
  try {
    const data = await localFetch<ServerStatus>('/api/server/status');
    return {
      ...data,
      updatedAt: new Date(data.updatedAt),
    };
  } catch {
    console.warn('[Server] 상태 조회 실패, Mock 데이터 사용');
    return MOCK_SERVER_STATUS;
  }
}

// ============================================
// Financial Data Functions
// ============================================

/**
 * 재무 데이터 가져오기 (DB 또는 스프레드시트 연동)
 */
export async function getFinancialData(): Promise<FinancialData> {
  try {
    const data = await localFetch<FinancialData>('/api/finance/summary');
    return {
      ...data,
      updatedAt: new Date(data.updatedAt),
    };
  } catch {
    console.warn('[Finance] 재무 데이터 연동 실패, Mock 데이터 사용');
    return MOCK_FINANCIAL_DATA;
  }
}

// ============================================
// Production Data Functions
// ============================================

/**
 * 생산 현황 가져오기
 */
export async function getProductionData(): Promise<ProductionData[]> {
  try {
    const data = await localFetch<ProductionData[]>('/api/production/status');
    return data.map((item) => ({
      ...item,
      dueDate: new Date(item.dueDate),
    }));
  } catch {
    console.warn('[Production] 생산 데이터 연동 실패, Mock 데이터 사용');
    return MOCK_PRODUCTION_DATA;
  }
}

// ============================================
// Aggregated Dashboard Data
// ============================================

export interface DashboardData {
  financial: FinancialData;
  musinsa: {
    ranking: MusinsaRanking;
    sales: MusinsaSales;
  };
  cs: CSReport;
  server: ServerStatus;
  production: ProductionData[];
  isLive: boolean; // 실제 데이터 연동 여부
  lastUpdated: Date;
}

/**
 * 대시보드 전체 데이터 가져오기 (병렬 처리)
 */
export async function getDashboardData(): Promise<DashboardData> {
  const [financial, ranking, sales, cs, server, production] = await Promise.all([
    getFinancialData(),
    getMusinsaRanking(),
    getMusinsaSales(),
    getCSReport(),
    getServerStatus(),
    getProductionData(),
  ]);

  // 실제 데이터 연동 여부 판단 (최소 하나라도 실시간이면 true)
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const isLive =
    financial.updatedAt > fiveMinutesAgo ||
    ranking.updatedAt > fiveMinutesAgo ||
    sales.updatedAt > fiveMinutesAgo;

  return {
    financial,
    musinsa: { ranking, sales },
    cs,
    server,
    production,
    isLive,
    lastUpdated: now,
  };
}

// ============================================
// Connection Check
// ============================================

/**
 * 로컬 서버 연결 확인
 */
export async function checkLocalServerConnection(): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    await localFetch('/api/health');
    const latency = Date.now() - startTime;

    return {
      connected: true,
      latency,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : '연결 실패',
    };
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * 숫자를 한국 원화 형식으로 포맷
 */
export function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * 퍼센트 변화량 계산
 */
export function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/**
 * D-Day 계산
 */
export function calculateDDay(targetDate: Date): number {
  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
