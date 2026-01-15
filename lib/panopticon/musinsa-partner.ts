/**
 * Musinsa Partner Center API Client
 * 무신사 파트너센터 공식 API 연동
 *
 * API 문서: https://partner.musinsa.com/api-docs (파트너 전용)
 */

// ============================================
// Types
// ============================================

export interface MusinsaPartnerAuth {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface MusinsaOrderItem {
  orderId: string;
  orderNo: string;
  productId: string;
  productName: string;
  brandName: string;
  optionName: string;
  quantity: number;
  price: number;
  salePrice: number;
  orderStatus: 'ORDERED' | 'PAID' | 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'CANCELED' | 'RETURNED' | 'EXCHANGED';
  orderedAt: Date;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export interface MusinsaSalesData {
  periodStart: Date;
  periodEnd: Date;
  totalOrders: number;
  totalSales: number;
  totalSettlement: number;
  commissionAmount: number;
  refundAmount: number;
  netSales: number;
}

export interface MusinsaProductRanking {
  productId: string;
  productName: string;
  categoryRank: number;
  overallRank: number;
  salesCount: number;
  reviewCount: number;
  rating: number;
  price: number;
}

export interface MusinsaSettlementInfo {
  settlementId: string;
  periodStart: Date;
  periodEnd: Date;
  totalAmount: number;
  commissionAmount: number;
  adjustmentAmount: number;
  netAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED';
  scheduledDate: Date;
  completedDate?: Date;
}

// ============================================
// API Client
// ============================================

const MUSINSA_API_BASE = 'https://api.partner.musinsa.com/v1';

class MusinsaPartnerClient {
  private apiKey: string | null = null;
  private apiSecret: string | null = null;
  private accessToken: string | null = null;

  constructor() {
    this.apiKey = process.env.MUSINSA_PARTNER_API_KEY || null;
    this.apiSecret = process.env.MUSINSA_PARTNER_SECRET || null;
  }

  /**
   * API 요청 헬퍼
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Musinsa Partner API key not configured');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    if (this.apiSecret) {
      headers['X-API-Secret'] = this.apiSecret;
    }

    const response = await fetch(`${MUSINSA_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Musinsa API Error: ${response.status} - ${error.message || 'Unknown error'}`
      );
    }

    return response.json();
  }

  /**
   * API 연결 확인
   */
  async checkConnection(): Promise<{ connected: boolean; error?: string }> {
    if (!this.apiKey) {
      return { connected: false, error: 'API key not configured' };
    }

    try {
      await this.request('/health');
      return { connected: true };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /**
   * 오늘 주문 목록 조회
   */
  async getTodayOrders(): Promise<MusinsaOrderItem[]> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const data = await this.request<{ orders: MusinsaOrderItem[] }>(
        `/orders?startDate=${startOfDay}&endDate=${endOfDay}`
      );

      return data.orders.map((order) => ({
        ...order,
        orderedAt: new Date(order.orderedAt),
        paidAt: order.paidAt ? new Date(order.paidAt) : undefined,
        shippedAt: order.shippedAt ? new Date(order.shippedAt) : undefined,
        deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : undefined,
      }));
    } catch (error) {
      console.error('[Musinsa Partner] Orders error:', error);
      return [];
    }
  }

  /**
   * 기간별 매출 데이터 조회
   */
  async getSalesData(
    startDate: Date,
    endDate: Date
  ): Promise<MusinsaSalesData | null> {
    try {
      const data = await this.request<MusinsaSalesData>(
        `/sales/summary?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      return {
        ...data,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
      };
    } catch (error) {
      console.error('[Musinsa Partner] Sales error:', error);
      return null;
    }
  }

  /**
   * 이번 달 매출 조회
   */
  async getMonthSales(): Promise<MusinsaSalesData | null> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return this.getSalesData(startOfMonth, endOfMonth);
  }

  /**
   * 오늘 매출 조회
   */
  async getTodaySales(): Promise<{
    totalSales: number;
    orderCount: number;
  }> {
    try {
      const orders = await this.getTodayOrders();
      const paidOrders = orders.filter(
        (o) => o.orderStatus !== 'CANCELED' && o.orderStatus !== 'RETURNED'
      );

      return {
        totalSales: paidOrders.reduce((sum, o) => sum + o.salePrice * o.quantity, 0),
        orderCount: paidOrders.length,
      };
    } catch (error) {
      console.error('[Musinsa Partner] Today sales error:', error);
      return { totalSales: 0, orderCount: 0 };
    }
  }

  /**
   * 상품 랭킹 조회
   */
  async getProductRankings(
    category?: string,
    limit = 10
  ): Promise<MusinsaProductRanking[]> {
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (category) params.set('category', category);

      const data = await this.request<{ products: MusinsaProductRanking[] }>(
        `/products/rankings?${params.toString()}`
      );

      return data.products;
    } catch (error) {
      console.error('[Musinsa Partner] Rankings error:', error);
      return [];
    }
  }

  /**
   * 정산 정보 조회
   */
  async getSettlementInfo(): Promise<MusinsaSettlementInfo[]> {
    try {
      const data = await this.request<{ settlements: MusinsaSettlementInfo[] }>(
        '/settlements?limit=5'
      );

      return data.settlements.map((s) => ({
        ...s,
        periodStart: new Date(s.periodStart),
        periodEnd: new Date(s.periodEnd),
        scheduledDate: new Date(s.scheduledDate),
        completedDate: s.completedDate ? new Date(s.completedDate) : undefined,
      }));
    } catch (error) {
      console.error('[Musinsa Partner] Settlement error:', error);
      return [];
    }
  }

  /**
   * 대기 중인 정산 금액 조회
   */
  async getPendingSettlement(): Promise<number> {
    try {
      const settlements = await this.getSettlementInfo();
      return settlements
        .filter((s) => s.status === 'PENDING' || s.status === 'PROCESSING')
        .reduce((sum, s) => sum + s.netAmount, 0);
    } catch (error) {
      console.error('[Musinsa Partner] Pending settlement error:', error);
      return 0;
    }
  }

  /**
   * 브랜드 전체 랭킹 조회
   */
  async getBrandRanking(): Promise<{
    overallRank: number;
    categoryRank: number;
    category: string;
    change: 'up' | 'down' | 'same';
    changeAmount: number;
  } | null> {
    try {
      const data = await this.request<{
        overallRank: number;
        categoryRank: number;
        category: string;
        previousRank: number;
      }>('/brand/ranking');

      const changeAmount = data.previousRank - data.categoryRank;

      return {
        overallRank: data.overallRank,
        categoryRank: data.categoryRank,
        category: data.category,
        change: changeAmount > 0 ? 'up' : changeAmount < 0 ? 'down' : 'same',
        changeAmount: Math.abs(changeAmount),
      };
    } catch (error) {
      console.error('[Musinsa Partner] Brand ranking error:', error);
      return null;
    }
  }
}

// Singleton instance
let clientInstance: MusinsaPartnerClient | null = null;

export function getMusinsaPartnerClient(): MusinsaPartnerClient {
  if (!clientInstance) {
    clientInstance = new MusinsaPartnerClient();
  }
  return clientInstance;
}

// ============================================
// Convenience Functions
// ============================================

/**
 * 무신사 파트너 API 연결 확인
 */
export async function checkMusinsaPartnerConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  return getMusinsaPartnerClient().checkConnection();
}

/**
 * 무신사 대시보드용 데이터 통합 조회
 */
export async function getMusinsaDashboardData(): Promise<{
  ranking: {
    overall: number;
    category: number;
    categoryName: string;
    change: 'up' | 'down' | 'same';
    changeAmount: number;
  };
  sales: {
    todaySales: number;
    todayOrders: number;
    monthSales: number;
    settlementPending: number;
  };
  isLive: boolean;
}> {
  const client = getMusinsaPartnerClient();

  try {
    const [brandRanking, todaySales, monthSales, pendingSettlement] = await Promise.all([
      client.getBrandRanking(),
      client.getTodaySales(),
      client.getMonthSales(),
      client.getPendingSettlement(),
    ]);

    return {
      ranking: brandRanking ? {
        overall: brandRanking.overallRank,
        category: brandRanking.categoryRank,
        categoryName: brandRanking.category,
        change: brandRanking.change,
        changeAmount: brandRanking.changeAmount,
      } : {
        overall: 0,
        category: 0,
        categoryName: '아우터',
        change: 'same' as const,
        changeAmount: 0,
      },
      sales: {
        todaySales: todaySales.totalSales,
        todayOrders: todaySales.orderCount,
        monthSales: monthSales?.totalSales || 0,
        settlementPending: pendingSettlement,
      },
      isLive: true,
    };
  } catch (error) {
    console.error('[Musinsa Partner] Dashboard data error:', error);

    // Return mock data on failure
    return {
      ranking: {
        overall: 8,
        category: 2,
        categoryName: '아우터',
        change: 'up',
        changeAmount: 2,
      },
      sales: {
        todaySales: 4200000,
        todayOrders: 12,
        monthSales: 124500000,
        settlementPending: 26500000,
      },
      isLive: false,
    };
  }
}
