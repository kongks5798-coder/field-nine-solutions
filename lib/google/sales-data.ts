/**
 * Google Sheets Sales Data Integration
 * 구글 시트에서 매출 데이터를 읽어오는 모듈
 *
 * 지원하는 시트 형식:
 * - 일일 매출 시트: 날짜, 채널, 주문수, 매출액, 수수료, 순매출
 * - 월간 매출 시트: 월, 채널별 합계
 * - 상품별 매출 시트: 상품명, 판매수량, 매출액
 */

import { getSheets } from './client';

// ============================================
// Types
// ============================================

export interface DailySalesRow {
  date: string;           // 날짜 (YYYY-MM-DD)
  channel: string;        // 판매 채널 (무신사, 쿠팡, 자사몰 등)
  orderCount: number;     // 주문 수
  grossSales: number;     // 총 매출액
  commission: number;     // 수수료
  netSales: number;       // 순매출
  refundAmount: number;   // 환불액
  returns: number;        // 반품 건수
}

export interface MonthlySummary {
  month: string;          // YYYY-MM
  totalGrossSales: number;
  totalNetSales: number;
  totalOrders: number;
  totalReturns: number;
  byChannel: Record<string, {
    grossSales: number;
    netSales: number;
    orders: number;
  }>;
}

export interface ProductSales {
  productId: string;
  productName: string;
  category: string;
  quantitySold: number;
  grossSales: number;
  avgPrice: number;
}

export interface SalesDataConfig {
  spreadsheetId: string;
  dailySalesSheet?: string;
  monthlySalesSheet?: string;
  productSalesSheet?: string;
}

// ============================================
// 환경 변수에서 시트 ID 가져오기
// ============================================

const DEFAULT_CONFIG: SalesDataConfig = {
  spreadsheetId: process.env.GOOGLE_SALES_SPREADSHEET_ID || '',
  dailySalesSheet: process.env.GOOGLE_DAILY_SALES_SHEET || '일일매출',
  monthlySalesSheet: process.env.GOOGLE_MONTHLY_SALES_SHEET || '월간매출',
  productSalesSheet: process.env.GOOGLE_PRODUCT_SALES_SHEET || '상품별매출',
};

// ============================================
// Helper Functions
// ============================================

function parseNumber(value: string | number | undefined): number {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  // 콤마 제거하고 숫자로 변환
  const cleaned = value.toString().replace(/[,원₩\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseDate(value: string | undefined): string {
  if (!value) return '';
  // Google Sheets의 다양한 날짜 형식 처리
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toISOString().split('T')[0];
}

function getDateRange(period: 'today' | 'week' | 'month' | 'year'): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  let start: Date;

  switch (period) {
    case 'today':
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
  }

  return { start, end };
}

// ============================================
// Main Functions
// ============================================

/**
 * 일일 매출 데이터 조회
 * 시트 형식: 날짜 | 채널 | 주문수 | 매출액 | 수수료 | 순매출 | 환불액 | 반품수
 */
export async function getDailySales(
  config: Partial<SalesDataConfig> = {},
  dateRange?: { start: Date; end: Date }
): Promise<DailySalesRow[]> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!cfg.spreadsheetId) {
    console.warn('[Sales Data] GOOGLE_SALES_SPREADSHEET_ID가 설정되지 않았습니다.');
    return [];
  }

  try {
    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: cfg.spreadsheetId,
      range: `${cfg.dailySalesSheet}!A:H`,
    });

    const rows = response.data.values || [];
    if (rows.length < 2) return []; // 헤더만 있거나 비어있음

    // 첫 번째 행은 헤더, 나머지는 데이터
    const data: DailySalesRow[] = rows.slice(1).map((row) => ({
      date: parseDate(row[0]),
      channel: row[1] || '',
      orderCount: parseNumber(row[2]),
      grossSales: parseNumber(row[3]),
      commission: parseNumber(row[4]),
      netSales: parseNumber(row[5]),
      refundAmount: parseNumber(row[6]),
      returns: parseNumber(row[7]),
    }));

    // 날짜 범위 필터링
    if (dateRange) {
      return data.filter((row) => {
        const rowDate = new Date(row.date);
        return rowDate >= dateRange.start && rowDate <= dateRange.end;
      });
    }

    return data;
  } catch (error) {
    console.error('[Sales Data] 일일 매출 조회 실패:', error);
    return [];
  }
}

/**
 * 오늘 매출 조회
 */
export async function getTodaySales(config?: Partial<SalesDataConfig>): Promise<{
  totalGrossSales: number;
  totalNetSales: number;
  totalOrders: number;
  byChannel: Record<string, { grossSales: number; netSales: number; orders: number }>;
}> {
  const range = getDateRange('today');
  const data = await getDailySales(config, range);

  const byChannel: Record<string, { grossSales: number; netSales: number; orders: number }> = {};
  let totalGrossSales = 0;
  let totalNetSales = 0;
  let totalOrders = 0;

  data.forEach((row) => {
    totalGrossSales += row.grossSales;
    totalNetSales += row.netSales;
    totalOrders += row.orderCount;

    if (!byChannel[row.channel]) {
      byChannel[row.channel] = { grossSales: 0, netSales: 0, orders: 0 };
    }
    byChannel[row.channel].grossSales += row.grossSales;
    byChannel[row.channel].netSales += row.netSales;
    byChannel[row.channel].orders += row.orderCount;
  });

  return { totalGrossSales, totalNetSales, totalOrders, byChannel };
}

/**
 * 이번 주 매출 조회
 */
export async function getWeekSales(config?: Partial<SalesDataConfig>) {
  const range = getDateRange('week');
  const data = await getDailySales(config, range);

  const byChannel: Record<string, { grossSales: number; netSales: number; orders: number }> = {};
  let totalGrossSales = 0;
  let totalNetSales = 0;
  let totalOrders = 0;

  data.forEach((row) => {
    totalGrossSales += row.grossSales;
    totalNetSales += row.netSales;
    totalOrders += row.orderCount;

    if (!byChannel[row.channel]) {
      byChannel[row.channel] = { grossSales: 0, netSales: 0, orders: 0 };
    }
    byChannel[row.channel].grossSales += row.grossSales;
    byChannel[row.channel].netSales += row.netSales;
    byChannel[row.channel].orders += row.orderCount;
  });

  return { totalGrossSales, totalNetSales, totalOrders, byChannel, data };
}

/**
 * 이번 달 매출 조회
 */
export async function getMonthSales(config?: Partial<SalesDataConfig>) {
  const range = getDateRange('month');
  const data = await getDailySales(config, range);

  const byChannel: Record<string, { grossSales: number; netSales: number; orders: number }> = {};
  const byDate: Record<string, { grossSales: number; netSales: number; orders: number }> = {};
  let totalGrossSales = 0;
  let totalNetSales = 0;
  let totalOrders = 0;
  let totalReturns = 0;
  let totalRefunds = 0;

  data.forEach((row) => {
    totalGrossSales += row.grossSales;
    totalNetSales += row.netSales;
    totalOrders += row.orderCount;
    totalReturns += row.returns;
    totalRefunds += row.refundAmount;

    // 채널별
    if (!byChannel[row.channel]) {
      byChannel[row.channel] = { grossSales: 0, netSales: 0, orders: 0 };
    }
    byChannel[row.channel].grossSales += row.grossSales;
    byChannel[row.channel].netSales += row.netSales;
    byChannel[row.channel].orders += row.orderCount;

    // 일자별
    if (!byDate[row.date]) {
      byDate[row.date] = { grossSales: 0, netSales: 0, orders: 0 };
    }
    byDate[row.date].grossSales += row.grossSales;
    byDate[row.date].netSales += row.netSales;
    byDate[row.date].orders += row.orderCount;
  });

  return {
    totalGrossSales,
    totalNetSales,
    totalOrders,
    totalReturns,
    totalRefunds,
    byChannel,
    byDate,
    data,
  };
}

/**
 * 상품별 매출 조회
 * 시트 형식: 상품ID | 상품명 | 카테고리 | 판매수량 | 매출액 | 평균단가
 */
export async function getProductSales(
  config: Partial<SalesDataConfig> = {},
  limit = 50
): Promise<ProductSales[]> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!cfg.spreadsheetId) {
    return [];
  }

  try {
    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: cfg.spreadsheetId,
      range: `${cfg.productSalesSheet}!A:F`,
    });

    const rows = response.data.values || [];
    if (rows.length < 2) return [];

    const data: ProductSales[] = rows.slice(1).map((row) => ({
      productId: row[0] || '',
      productName: row[1] || '',
      category: row[2] || '',
      quantitySold: parseNumber(row[3]),
      grossSales: parseNumber(row[4]),
      avgPrice: parseNumber(row[5]),
    }));

    // 매출액 기준 정렬
    data.sort((a, b) => b.grossSales - a.grossSales);

    return data.slice(0, limit);
  } catch (error) {
    console.error('[Sales Data] 상품별 매출 조회 실패:', error);
    return [];
  }
}

/**
 * 월별 매출 요약 조회
 * 시트 형식: 월 | 채널 | 총매출 | 순매출 | 주문수 | 반품수
 */
export async function getMonthlySummary(
  config: Partial<SalesDataConfig> = {},
  months = 12
): Promise<MonthlySummary[]> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!cfg.spreadsheetId) {
    return [];
  }

  try {
    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: cfg.spreadsheetId,
      range: `${cfg.monthlySalesSheet}!A:F`,
    });

    const rows = response.data.values || [];
    if (rows.length < 2) return [];

    // 월별로 그룹화
    const monthMap = new Map<string, MonthlySummary>();

    rows.slice(1).forEach((row) => {
      const month = row[0] || '';
      const channel = row[1] || '기타';
      const grossSales = parseNumber(row[2]);
      const netSales = parseNumber(row[3]);
      const orders = parseNumber(row[4]);
      const returns = parseNumber(row[5]);

      if (!monthMap.has(month)) {
        monthMap.set(month, {
          month,
          totalGrossSales: 0,
          totalNetSales: 0,
          totalOrders: 0,
          totalReturns: 0,
          byChannel: {},
        });
      }

      const summary = monthMap.get(month)!;
      summary.totalGrossSales += grossSales;
      summary.totalNetSales += netSales;
      summary.totalOrders += orders;
      summary.totalReturns += returns;

      if (!summary.byChannel[channel]) {
        summary.byChannel[channel] = { grossSales: 0, netSales: 0, orders: 0 };
      }
      summary.byChannel[channel].grossSales += grossSales;
      summary.byChannel[channel].netSales += netSales;
      summary.byChannel[channel].orders += orders;
    });

    // 최근 N개월 반환 (내림차순)
    const summaries = Array.from(monthMap.values());
    summaries.sort((a, b) => b.month.localeCompare(a.month));

    return summaries.slice(0, months);
  } catch (error) {
    console.error('[Sales Data] 월별 요약 조회 실패:', error);
    return [];
  }
}

/**
 * 전체 매출 대시보드 데이터
 */
export async function getSalesDashboard(config?: Partial<SalesDataConfig>) {
  const [today, week, month, products, monthlyHistory] = await Promise.all([
    getTodaySales(config),
    getWeekSales(config),
    getMonthSales(config),
    getProductSales(config, 10),
    getMonthlySummary(config, 6),
  ]);

  // 전월 대비 성장률 계산
  let monthOverMonthGrowth = 0;
  if (monthlyHistory.length >= 2) {
    const currentMonth = monthlyHistory[0].totalGrossSales;
    const lastMonth = monthlyHistory[1].totalGrossSales;
    if (lastMonth > 0) {
      monthOverMonthGrowth = ((currentMonth - lastMonth) / lastMonth) * 100;
    }
  }

  // 채널별 순위
  const channelRanking = Object.entries(month.byChannel)
    .map(([channel, data]) => ({ channel, ...data }))
    .sort((a, b) => b.grossSales - a.grossSales);

  return {
    today: {
      grossSales: today.totalGrossSales,
      netSales: today.totalNetSales,
      orders: today.totalOrders,
      byChannel: today.byChannel,
    },
    week: {
      grossSales: week.totalGrossSales,
      netSales: week.totalNetSales,
      orders: week.totalOrders,
    },
    month: {
      grossSales: month.totalGrossSales,
      netSales: month.totalNetSales,
      orders: month.totalOrders,
      returns: month.totalReturns,
      refunds: month.totalRefunds,
      growth: monthOverMonthGrowth,
    },
    topProducts: products,
    channelRanking,
    monthlyTrend: monthlyHistory,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 시트에 매출 데이터 추가 (수동 입력용)
 */
export async function appendSalesData(
  row: Omit<DailySalesRow, 'date'> & { date?: string },
  config?: Partial<SalesDataConfig>
) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!cfg.spreadsheetId) {
    throw new Error('GOOGLE_SALES_SPREADSHEET_ID가 설정되지 않았습니다.');
  }

  const sheets = await getSheets();
  const date = row.date || new Date().toISOString().split('T')[0];

  await sheets.spreadsheets.values.append({
    spreadsheetId: cfg.spreadsheetId,
    range: `${cfg.dailySalesSheet}!A:H`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        date,
        row.channel,
        row.orderCount,
        row.grossSales,
        row.commission,
        row.netSales,
        row.refundAmount,
        row.returns,
      ]],
    },
  });

  return { success: true, date };
}

/**
 * 시트 연결 테스트
 */
export async function testConnection(config?: Partial<SalesDataConfig>): Promise<{
  success: boolean;
  message: string;
  sheets?: string[];
}> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!cfg.spreadsheetId) {
    return {
      success: false,
      message: 'GOOGLE_SALES_SPREADSHEET_ID 환경변수가 설정되지 않았습니다.',
    };
  }

  try {
    const sheets = await getSheets();
    const response = await sheets.spreadsheets.get({
      spreadsheetId: cfg.spreadsheetId,
    });

    const sheetNames = response.data.sheets?.map(
      (sheet) => sheet.properties?.title || ''
    ) || [];

    return {
      success: true,
      message: `연결 성공: ${response.data.properties?.title}`,
      sheets: sheetNames,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '연결 실패',
    };
  }
}
