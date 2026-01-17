/**
 * Google Sheets Operations Data Integration
 * 무신사 파트너센터 데이터를 Google Sheets에서 관리
 *
 * 시트 구조:
 * 1. 주문현황 (Orders): 일자별 주문 상태
 * 2. 클레임현황 (Claims): 환불/교환 요청
 * 3. 상품현황 (Products): 판매중/품절/판매중지
 * 4. 목표설정 (Goals): 월별 매출 목표
 */

import { getSheets } from './client';

// ============================================
// Types
// ============================================

export interface OrderStatusRow {
  date: string;              // 날짜 (YYYY-MM-DD)
  paymentComplete: number;   // 결제완료
  preparing: number;         // 상품준비중
  shipping: number;          // 배송중
  delivered: number;         // 배송완료
  confirmed: number;         // 구매확정
  urgentShipping: number;    // 긴급출고 필요 (24시간 초과)
}

export interface ClaimStatusRow {
  date: string;
  refundRequest: number;     // 환불요청
  refundComplete: number;    // 환불완료
  exchangeRequest: number;   // 교환요청
  exchangeComplete: number;  // 교환완료
  urgentClaims: number;      // 긴급처리 필요
}

export interface ProductStatusRow {
  date: string;
  onSale: number;            // 판매중
  soldOut: number;           // 품절
  suspended: number;         // 판매중지
  total: number;             // 전체 상품수
}

export interface MonthlyGoal {
  month: string;             // YYYY-MM
  salesTarget: number;       // 매출 목표
  ordersTarget: number;      // 주문 목표
  currentSales: number;      // 현재 매출 (자동 계산용)
  currentOrders: number;     // 현재 주문수
  notes: string;             // 메모
}

export interface OperationsConfig {
  spreadsheetId: string;
  ordersSheet?: string;
  claimsSheet?: string;
  productsSheet?: string;
  goalsSheet?: string;
}

// ============================================
// 환경 변수에서 설정 가져오기
// ============================================

const DEFAULT_CONFIG: OperationsConfig = {
  spreadsheetId: process.env.GOOGLE_SALES_SPREADSHEET_ID || '',
  ordersSheet: process.env.GOOGLE_ORDERS_SHEET || '주문현황',
  claimsSheet: process.env.GOOGLE_CLAIMS_SHEET || '클레임현황',
  productsSheet: process.env.GOOGLE_PRODUCTS_SHEET || '상품현황',
  goalsSheet: process.env.GOOGLE_GOALS_SHEET || '목표설정',
};

// ============================================
// Helper Functions
// ============================================

function parseNumber(value: string | number | undefined): number {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  const cleaned = value.toString().replace(/[,원₩\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// ============================================
// 주문 현황 조회
// ============================================

/**
 * 오늘 주문 현황 조회
 * 시트 형식: 날짜 | 결제완료 | 상품준비 | 배송중 | 배송완료 | 구매확정 | 긴급출고
 */
export async function getTodayOrders(
  config: Partial<OperationsConfig> = {}
): Promise<OrderStatusRow | null> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!cfg.spreadsheetId) {
    console.warn('[Operations] GOOGLE_SALES_SPREADSHEET_ID가 설정되지 않았습니다.');
    return null;
  }

  try {
    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: cfg.spreadsheetId,
      range: `${cfg.ordersSheet}!A:G`,
    });

    const rows = response.data.values || [];
    if (rows.length < 2) return null;

    const today = getTodayString();

    // 오늘 날짜의 행 찾기 (최신 데이터 우선)
    for (let i = rows.length - 1; i >= 1; i--) {
      const row = rows[i];
      if (row[0] === today || row[0]?.startsWith(today)) {
        return {
          date: row[0],
          paymentComplete: parseNumber(row[1]),
          preparing: parseNumber(row[2]),
          shipping: parseNumber(row[3]),
          delivered: parseNumber(row[4]),
          confirmed: parseNumber(row[5]),
          urgentShipping: parseNumber(row[6]),
        };
      }
    }

    // 오늘 데이터가 없으면 가장 최근 데이터 반환
    const lastRow = rows[rows.length - 1];
    return {
      date: lastRow[0] || '',
      paymentComplete: parseNumber(lastRow[1]),
      preparing: parseNumber(lastRow[2]),
      shipping: parseNumber(lastRow[3]),
      delivered: parseNumber(lastRow[4]),
      confirmed: parseNumber(lastRow[5]),
      urgentShipping: parseNumber(lastRow[6]),
    };
  } catch (error) {
    console.error('[Operations] 주문 현황 조회 실패:', error);
    return null;
  }
}

// ============================================
// 클레임 현황 조회
// ============================================

/**
 * 오늘 클레임 현황 조회
 * 시트 형식: 날짜 | 환불요청 | 환불완료 | 교환요청 | 교환완료 | 긴급처리
 */
export async function getTodayClaims(
  config: Partial<OperationsConfig> = {}
): Promise<ClaimStatusRow | null> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!cfg.spreadsheetId) return null;

  try {
    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: cfg.spreadsheetId,
      range: `${cfg.claimsSheet}!A:F`,
    });

    const rows = response.data.values || [];
    if (rows.length < 2) return null;

    const today = getTodayString();

    for (let i = rows.length - 1; i >= 1; i--) {
      const row = rows[i];
      if (row[0] === today || row[0]?.startsWith(today)) {
        return {
          date: row[0],
          refundRequest: parseNumber(row[1]),
          refundComplete: parseNumber(row[2]),
          exchangeRequest: parseNumber(row[3]),
          exchangeComplete: parseNumber(row[4]),
          urgentClaims: parseNumber(row[5]),
        };
      }
    }

    const lastRow = rows[rows.length - 1];
    return {
      date: lastRow[0] || '',
      refundRequest: parseNumber(lastRow[1]),
      refundComplete: parseNumber(lastRow[2]),
      exchangeRequest: parseNumber(lastRow[3]),
      exchangeComplete: parseNumber(lastRow[4]),
      urgentClaims: parseNumber(lastRow[5]),
    };
  } catch (error) {
    console.error('[Operations] 클레임 현황 조회 실패:', error);
    return null;
  }
}

// ============================================
// 상품 현황 조회
// ============================================

/**
 * 상품 현황 조회
 * 시트 형식: 날짜 | 판매중 | 품절 | 판매중지 | 전체
 */
export async function getProductStatus(
  config: Partial<OperationsConfig> = {}
): Promise<ProductStatusRow | null> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!cfg.spreadsheetId) return null;

  try {
    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: cfg.spreadsheetId,
      range: `${cfg.productsSheet}!A:E`,
    });

    const rows = response.data.values || [];
    if (rows.length < 2) return null;

    const lastRow = rows[rows.length - 1];
    return {
      date: lastRow[0] || '',
      onSale: parseNumber(lastRow[1]),
      soldOut: parseNumber(lastRow[2]),
      suspended: parseNumber(lastRow[3]),
      total: parseNumber(lastRow[4]),
    };
  } catch (error) {
    console.error('[Operations] 상품 현황 조회 실패:', error);
    return null;
  }
}

// ============================================
// 목표 설정 조회
// ============================================

/**
 * 이번 달 목표 조회
 * 시트 형식: 월 | 매출목표 | 주문목표 | 현재매출 | 현재주문 | 메모
 */
export async function getCurrentMonthGoal(
  config: Partial<OperationsConfig> = {}
): Promise<MonthlyGoal | null> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!cfg.spreadsheetId) return null;

  try {
    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: cfg.spreadsheetId,
      range: `${cfg.goalsSheet}!A:F`,
    });

    const rows = response.data.values || [];
    if (rows.length < 2) return null;

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    for (let i = rows.length - 1; i >= 1; i--) {
      const row = rows[i];
      if (row[0] === currentMonth) {
        return {
          month: row[0],
          salesTarget: parseNumber(row[1]),
          ordersTarget: parseNumber(row[2]),
          currentSales: parseNumber(row[3]),
          currentOrders: parseNumber(row[4]),
          notes: row[5] || '',
        };
      }
    }

    return null;
  } catch (error) {
    console.error('[Operations] 목표 조회 실패:', error);
    return null;
  }
}

// ============================================
// 통합 운영 데이터 조회
// ============================================

/**
 * 대시보드용 통합 운영 데이터
 * 무신사 스크래핑 대신 사용
 */
export async function getOperationsDashboard(config?: Partial<OperationsConfig>) {
  const [orders, claims, products, goal] = await Promise.all([
    getTodayOrders(config),
    getTodayClaims(config),
    getProductStatus(config),
    getCurrentMonthGoal(config),
  ]);

  return {
    // 무신사 대시보드와 호환되는 형식
    urgentShipping: orders?.urgentShipping || 0,
    urgentClaims: claims?.urgentClaims || 0,
    domesticOrders: {
      paymentComplete: orders?.paymentComplete || 0,
      preparing: orders?.preparing || 0,
      shipping: orders?.shipping || 0,
      delivered: orders?.delivered || 0,
      confirmed: orders?.confirmed || 0,
      total: (orders?.paymentComplete || 0) + (orders?.preparing || 0) +
             (orders?.shipping || 0) + (orders?.delivered || 0),
    },
    globalOrders: {
      total: 0, // 글로벌 주문은 별도 관리 필요시 추가
    },
    products: {
      onSale: products?.onSale || 0,
      soldOut: products?.soldOut || 0,
      suspended: products?.suspended || 0,
      total: products?.total || 0,
    },
    claims: {
      refundRequest: claims?.refundRequest || 0,
      exchangeRequest: claims?.exchangeRequest || 0,
      total: (claims?.refundRequest || 0) + (claims?.exchangeRequest || 0),
    },
    goal: goal,
    sessionValid: true, // 시트 데이터는 항상 유효
    dataSource: 'google_sheets',
    lastUpdated: orders?.date || claims?.date || products?.date || new Date().toISOString(),
  };
}

// ============================================
// 데이터 입력 함수들
// ============================================

/**
 * 주문 현황 입력
 */
export async function appendOrderStatus(
  data: Omit<OrderStatusRow, 'date'> & { date?: string },
  config?: Partial<OperationsConfig>
) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!cfg.spreadsheetId) {
    throw new Error('GOOGLE_SALES_SPREADSHEET_ID가 설정되지 않았습니다.');
  }

  const sheets = await getSheets();
  const date = data.date || getTodayString();

  await sheets.spreadsheets.values.append({
    spreadsheetId: cfg.spreadsheetId,
    range: `${cfg.ordersSheet}!A:G`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        date,
        data.paymentComplete,
        data.preparing,
        data.shipping,
        data.delivered,
        data.confirmed,
        data.urgentShipping,
      ]],
    },
  });

  return { success: true, date };
}

/**
 * 클레임 현황 입력
 */
export async function appendClaimStatus(
  data: Omit<ClaimStatusRow, 'date'> & { date?: string },
  config?: Partial<OperationsConfig>
) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!cfg.spreadsheetId) {
    throw new Error('GOOGLE_SALES_SPREADSHEET_ID가 설정되지 않았습니다.');
  }

  const sheets = await getSheets();
  const date = data.date || getTodayString();

  await sheets.spreadsheets.values.append({
    spreadsheetId: cfg.spreadsheetId,
    range: `${cfg.claimsSheet}!A:F`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        date,
        data.refundRequest,
        data.refundComplete,
        data.exchangeRequest,
        data.exchangeComplete,
        data.urgentClaims,
      ]],
    },
  });

  return { success: true, date };
}

/**
 * 상품 현황 입력
 */
export async function appendProductStatus(
  data: Omit<ProductStatusRow, 'date'> & { date?: string },
  config?: Partial<OperationsConfig>
) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!cfg.spreadsheetId) {
    throw new Error('GOOGLE_SALES_SPREADSHEET_ID가 설정되지 않았습니다.');
  }

  const sheets = await getSheets();
  const date = data.date || getTodayString();

  await sheets.spreadsheets.values.append({
    spreadsheetId: cfg.spreadsheetId,
    range: `${cfg.productsSheet}!A:E`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        date,
        data.onSale,
        data.soldOut,
        data.suspended,
        data.total,
      ]],
    },
  });

  return { success: true, date };
}

/**
 * 시트 탭 존재 여부 확인 및 생성
 */
export async function ensureSheetsExist(config?: Partial<OperationsConfig>): Promise<{
  success: boolean;
  created: string[];
  existing: string[];
}> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!cfg.spreadsheetId) {
    return { success: false, created: [], existing: [] };
  }

  const requiredSheets = [
    cfg.ordersSheet,
    cfg.claimsSheet,
    cfg.productsSheet,
    cfg.goalsSheet,
  ].filter(Boolean) as string[];

  try {
    const sheets = await getSheets();
    const response = await sheets.spreadsheets.get({
      spreadsheetId: cfg.spreadsheetId,
    });

    const existingSheets = response.data.sheets?.map(
      (sheet) => sheet.properties?.title || ''
    ) || [];

    const created: string[] = [];
    const existing: string[] = [];

    for (const sheetName of requiredSheets) {
      if (existingSheets.includes(sheetName)) {
        existing.push(sheetName);
      } else {
        // 시트 생성
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: cfg.spreadsheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: { title: sheetName },
              },
            }],
          },
        });
        created.push(sheetName);

        // 헤더 추가
        const headers = getHeadersForSheet(sheetName);
        if (headers.length > 0) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: cfg.spreadsheetId,
            range: `${sheetName}!A1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [headers] },
          });
        }
      }
    }

    return { success: true, created, existing };
  } catch (error) {
    console.error('[Operations] 시트 생성 실패:', error);
    return { success: false, created: [], existing: [] };
  }
}

function getHeadersForSheet(sheetName: string): string[] {
  switch (sheetName) {
    case '주문현황':
      return ['날짜', '결제완료', '상품준비', '배송중', '배송완료', '구매확정', '긴급출고'];
    case '클레임현황':
      return ['날짜', '환불요청', '환불완료', '교환요청', '교환완료', '긴급처리'];
    case '상품현황':
      return ['날짜', '판매중', '품절', '판매중지', '전체'];
    case '목표설정':
      return ['월', '매출목표', '주문목표', '현재매출', '현재주문', '메모'];
    default:
      return [];
  }
}
