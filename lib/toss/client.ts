/**
 * K-UNIVERSAL Toss Payments Client
 * 한국 결제 시스템 - 토스페이먼츠 연동
 *
 * 테스트 키 (사업자 없이 개발 가능):
 * - Client Key: test_ck_... (프론트엔드용)
 * - Secret Key: test_sk_... (서버용)
 *
 * 발급: https://developers.tosspayments.com
 */

// ============================================
// 환경 변수
// ============================================

// 클라이언트 키 (브라우저 노출 가능)
export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k9g8gLzN97Eoq';

// 시크릿 키 (서버에서만 사용)
export const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';

// API Base URL
const TOSS_API_URL = 'https://api.tosspayments.com/v1';

// ============================================
// 타입 정의
// ============================================

export interface TossPaymentRequest {
  orderId: string;
  orderName: string;
  amount: number;
  customerName?: string;
  customerEmail?: string;
  successUrl: string;
  failUrl: string;
}

export interface TossPaymentConfirm {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface TossPaymentResult {
  success: boolean;
  paymentKey?: string;
  orderId?: string;
  status?: string;
  method?: string;
  totalAmount?: number;
  error?: string;
}

export interface TossPaymentInfo {
  paymentKey: string;
  orderId: string;
  orderName: string;
  status: 'READY' | 'IN_PROGRESS' | 'WAITING_FOR_DEPOSIT' | 'DONE' | 'CANCELED' | 'PARTIAL_CANCELED' | 'ABORTED' | 'EXPIRED';
  method: string;
  totalAmount: number;
  approvedAt?: string;
  receipt?: {
    url: string;
  };
}

// ============================================
// 서버 사이드 함수 (API Routes에서 사용)
// ============================================

/**
 * 결제 승인 (서버에서 호출)
 * 결제창에서 돌아온 후 최종 승인 처리
 */
export async function confirmPayment(params: TossPaymentConfirm): Promise<TossPaymentResult> {
  try {
    // Basic Auth 인코딩 (Secret Key + ':')
    const encodedKey = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64');

    const response = await fetch(`${TOSS_API_URL}/payments/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey: params.paymentKey,
        orderId: params.orderId,
        amount: params.amount,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || '결제 승인 실패',
      };
    }

    return {
      success: true,
      paymentKey: data.paymentKey,
      orderId: data.orderId,
      status: data.status,
      method: data.method,
      totalAmount: data.totalAmount,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '결제 승인 중 오류 발생',
    };
  }
}

/**
 * 결제 정보 조회
 */
export async function getPaymentInfo(paymentKey: string): Promise<TossPaymentInfo | null> {
  try {
    const encodedKey = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64');

    const response = await fetch(`${TOSS_API_URL}/payments/${paymentKey}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${encodedKey}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('결제 정보 조회 실패:', error);
    return null;
  }
}

/**
 * 결제 취소
 */
export async function cancelPayment(paymentKey: string, cancelReason: string): Promise<TossPaymentResult> {
  try {
    const encodedKey = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64');

    const response = await fetch(`${TOSS_API_URL}/payments/${paymentKey}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancelReason,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || '결제 취소 실패',
      };
    }

    return {
      success: true,
      paymentKey: data.paymentKey,
      status: data.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '결제 취소 중 오류 발생',
    };
  }
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 고유 주문 ID 생성
 */
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ORDER_${timestamp}_${random}`.toUpperCase();
}

/**
 * 금액 포맷팅 (원화)
 */
export function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
}
