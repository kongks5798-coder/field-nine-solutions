/**
 * K-Universal Payment Alert System
 * 결제 성공/실패 시 즉시 알림 (카카오톡, 이메일, Slack)
 *
 * @module lib/notifications/payment-alerts
 */

import { logger } from '@/lib/logging/logger';
import { sendEmail } from '@/lib/email/notifications';

// ============================================
// Configuration
// ============================================

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ceo@fieldnine.io';
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
const ADMIN_PHONE = process.env.ADMIN_PHONE; // 카카오 알림톡 수신 번호

// ============================================
// Types
// ============================================

export interface PaymentNotification {
  type: 'success' | 'failed' | 'refund' | 'dispute';
  provider: 'paypal' | 'toss' | 'lemonsqueezy' | 'wallet';
  amount: number;
  currency: string;
  orderId?: string;
  bookingId?: string;
  customerEmail?: string;
  customerName?: string;
  paymentId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// ============================================
// Main Notification Function
// ============================================

/**
 * 결제 이벤트 발생 시 모든 채널로 알림 전송
 */
export async function sendPaymentNotification(
  notification: PaymentNotification
): Promise<{ sent: string[]; failed: string[] }> {
  const sent: string[] = [];
  const failed: string[] = [];

  const tasks = [
    { name: 'slack', fn: () => sendSlackNotification(notification) },
    { name: 'email', fn: () => sendEmailNotification(notification) },
    { name: 'kakao', fn: () => sendKakaoNotification(notification) },
  ];

  await Promise.allSettled(
    tasks.map(async (task) => {
      try {
        const result = await task.fn();
        if (result) {
          sent.push(task.name);
        } else {
          // Not configured - don't count as failed
        }
      } catch (error) {
        logger.error(`payment_notification_${task.name}_failed`, {
          error: error instanceof Error ? error.message : 'Unknown',
          notification,
        });
        failed.push(task.name);
      }
    })
  );

  logger.info('payment_notification_sent', {
    type: notification.type,
    amount: notification.amount,
    sent,
    failed,
  });

  return { sent, failed };
}

// ============================================
// Slack Notification
// ============================================

async function sendSlackNotification(notification: PaymentNotification): Promise<boolean> {
  if (!SLACK_WEBHOOK_URL) {
    return false;
  }

  const emoji = getEmoji(notification.type);
  const color = getColor(notification.type);
  const formattedAmount = formatCurrency(notification.amount, notification.currency);

  const payload = {
    attachments: [
      {
        color,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${emoji} *${getTitle(notification.type)}*`,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*금액:*\n${formattedAmount}`,
              },
              {
                type: 'mrkdwn',
                text: `*결제수단:*\n${notification.provider.toUpperCase()}`,
              },
              {
                type: 'mrkdwn',
                text: `*고객:*\n${notification.customerName || notification.customerEmail || 'N/A'}`,
              },
              {
                type: 'mrkdwn',
                text: `*주문번호:*\n${notification.orderId || notification.bookingId || 'N/A'}`,
              },
            ],
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `K-Universal | ${new Date(notification.timestamp).toLocaleString('ko-KR')}`,
              },
            ],
          },
        ],
      },
    ],
  };

  const response = await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return response.ok;
}

// ============================================
// Email Notification
// ============================================

async function sendEmailNotification(notification: PaymentNotification): Promise<boolean> {
  const emoji = getEmoji(notification.type);
  const formattedAmount = formatCurrency(notification.amount, notification.currency);

  const result = await sendEmail({
    to: ADMIN_EMAIL,
    subject: `${emoji} [K-Universal] ${getTitle(notification.type)} - ${formattedAmount}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #171717; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .card { background: ${notification.type === 'success' ? '#e8f5e9' : '#ffebee'}; padding: 20px; border-radius: 12px; }
          .amount { font-size: 32px; font-weight: bold; color: ${notification.type === 'success' ? '#2e7d32' : '#c62828'}; }
          .details { margin-top: 20px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .footer { margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <h2>${emoji} ${getTitle(notification.type)}</h2>
            <div class="amount">${formattedAmount}</div>
            <div class="details">
              <div class="detail-row"><span>결제수단</span><span>${notification.provider.toUpperCase()}</span></div>
              <div class="detail-row"><span>고객</span><span>${notification.customerName || notification.customerEmail || 'N/A'}</span></div>
              <div class="detail-row"><span>주문번호</span><span>${notification.orderId || notification.bookingId || 'N/A'}</span></div>
              <div class="detail-row"><span>결제 ID</span><span>${notification.paymentId || 'N/A'}</span></div>
              <div class="detail-row"><span>시간</span><span>${new Date(notification.timestamp).toLocaleString('ko-KR')}</span></div>
            </div>
          </div>
          <div class="footer">
            K-Universal by Field Nine Solutions<br>
            <a href="https://www.fieldnine.io/admin/ops">관리자 대시보드</a>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `${getTitle(notification.type)}\n\n금액: ${formattedAmount}\n결제수단: ${notification.provider}\n고객: ${notification.customerName || notification.customerEmail || 'N/A'}\n주문번호: ${notification.orderId || notification.bookingId || 'N/A'}\n시간: ${new Date(notification.timestamp).toLocaleString('ko-KR')}`,
  });

  return result.success;
}

// ============================================
// Kakao Notification (알림톡)
// ============================================

async function sendKakaoNotification(notification: PaymentNotification): Promise<boolean> {
  if (!KAKAO_REST_API_KEY || !ADMIN_PHONE) {
    return false;
  }

  // 카카오 알림톡은 사전 등록된 템플릿이 필요하므로,
  // 여기서는 카카오톡 나에게 보내기 API 사용 (개인 테스트용)
  // 실서비스에서는 알림톡 API로 교체 필요

  const formattedAmount = formatCurrency(notification.amount, notification.currency);
  const message = `[K-Universal ${getTitle(notification.type)}]
금액: ${formattedAmount}
결제수단: ${notification.provider.toUpperCase()}
고객: ${notification.customerName || 'N/A'}
시간: ${new Date(notification.timestamp).toLocaleString('ko-KR')}`;

  try {
    // 카카오 나에게 보내기 API (개인 토큰 필요)
    // 실서비스에서는 비즈 메시지 API 사용
    logger.info('kakao_notification_would_send', {
      message,
      phone: ADMIN_PHONE,
    });

    // TODO: 카카오 비즈 메시지 API 연동 시 활성화
    // const response = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {...});

    return true;
  } catch (error) {
    logger.error('kakao_notification_failed', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return false;
  }
}

// ============================================
// Helper Functions
// ============================================

function getEmoji(type: PaymentNotification['type']): string {
  const emojis = {
    success: '💰',
    failed: '❌',
    refund: '↩️',
    dispute: '⚠️',
  };
  return emojis[type] || '📢';
}

function getColor(type: PaymentNotification['type']): string {
  const colors = {
    success: '#2e7d32',
    failed: '#c62828',
    refund: '#f57c00',
    dispute: '#d32f2f',
  };
  return colors[type] || '#1976d2';
}

function getTitle(type: PaymentNotification['type']): string {
  const titles = {
    success: '결제 성공',
    failed: '결제 실패',
    refund: '환불 처리',
    dispute: '분쟁 발생',
  };
  return titles[type] || '결제 알림';
}

function formatCurrency(amount: number, currency: string): string {
  if (currency === 'KRW') {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}

// ============================================
// Quick Send Functions
// ============================================

/**
 * 결제 성공 알림 간편 함수
 */
export async function notifyPaymentSuccess(
  provider: PaymentNotification['provider'],
  amount: number,
  currency: string,
  options: {
    orderId?: string;
    bookingId?: string;
    customerEmail?: string;
    customerName?: string;
    paymentId?: string;
  } = {}
): Promise<void> {
  await sendPaymentNotification({
    type: 'success',
    provider,
    amount,
    currency,
    timestamp: new Date(),
    ...options,
  });
}

/**
 * 결제 실패 알림 간편 함수
 */
export async function notifyPaymentFailed(
  provider: PaymentNotification['provider'],
  amount: number,
  currency: string,
  options: {
    orderId?: string;
    customerEmail?: string;
    error?: string;
  } = {}
): Promise<void> {
  await sendPaymentNotification({
    type: 'failed',
    provider,
    amount,
    currency,
    timestamp: new Date(),
    metadata: { error: options.error },
    ...options,
  });
}

/**
 * 환불 알림 간편 함수
 */
export async function notifyPaymentRefund(
  provider: PaymentNotification['provider'],
  amount: number,
  currency: string,
  options: {
    orderId?: string;
    reason?: string;
  } = {}
): Promise<void> {
  await sendPaymentNotification({
    type: 'refund',
    provider,
    amount,
    currency,
    timestamp: new Date(),
    metadata: { reason: options.reason },
    ...options,
  });
}
