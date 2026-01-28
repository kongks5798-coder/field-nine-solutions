/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 55: TELEGRAM REVENUE ALERT BOT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Real-time revenue notifications to the Boss via Telegram.
 * Triggers: KAUS payment, High staking, New Sovereign registration
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_BOSS_CHAT_ID;
const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

// Revenue thresholds for alerts
export const ALERT_THRESHOLDS = {
  KAUS_PAYMENT_MIN: 0, // Alert on all KAUS payments
  STAKING_HIGH_VALUE: 1000000, // Alert when staking >= 1M KAUS
  DAILY_REVENUE_MILESTONE: [1000000, 5000000, 10000000, 50000000, 100000000], // KRW milestones
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type AlertType =
  | 'KAUS_PAYMENT'
  | 'STAKING_DEPOSIT'
  | 'NEW_SOVEREIGN'
  | 'REFERRAL_REWARD'
  | 'DAILY_MILESTONE'
  | 'SYSTEM_ALERT';

export interface RevenueAlert {
  type: AlertType;
  amount: number;
  currency: 'KRW' | 'USD' | 'KAUS';
  customerId?: string;
  sovereignNumber?: number;
  productName?: string;
  dailyTotal?: number;
  message?: string;
  timestamp?: Date;
}

export interface TelegramResponse {
  ok: boolean;
  result?: {
    message_id: number;
    chat: { id: number };
    date: number;
    text: string;
  };
  error_code?: number;
  description?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TELEGRAM API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Send a message via Telegram Bot API
 */
async function sendTelegramMessage(
  text: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<TelegramResponse> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('[Telegram] Bot not configured - skipping notification');
    return { ok: false, description: 'Bot not configured' };
  }

  try {
    const response = await fetch(
      `${TELEGRAM_API_URL}${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: parseMode,
          disable_web_page_preview: true,
        }),
      }
    );

    const data = await response.json();

    if (!data.ok) {
      console.error('[Telegram] API Error:', data.description);
    }

    return data as TelegramResponse;
  } catch (error) {
    console.error('[Telegram] Send failed:', error);
    return { ok: false, description: String(error) };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE FORMATTERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Format currency amount with proper symbols
 */
function formatAmount(amount: number, currency: 'KRW' | 'USD' | 'KAUS'): string {
  switch (currency) {
    case 'KRW':
      return `₩${amount.toLocaleString()}`;
    case 'USD':
      return `$${amount.toLocaleString()}`;
    case 'KAUS':
      return `${amount.toLocaleString()} KAUS`;
    default:
      return amount.toLocaleString();
  }
}

/**
 * Format daily total with milestone indicator
 */
function formatDailyTotal(total: number): string {
  if (total >= 100000000) return `₩${(total / 100000000).toFixed(1)}억`;
  if (total >= 10000000) return `₩${(total / 10000000).toFixed(1)}천만`;
  if (total >= 1000000) return `₩${(total / 1000000).toFixed(1)}백만`;
  return `₩${total.toLocaleString()}`;
}

/**
 * Get emoji based on alert type
 */
function getAlertEmoji(type: AlertType): string {
  switch (type) {
    case 'KAUS_PAYMENT':
      return '💰';
    case 'STAKING_DEPOSIT':
      return '🔒';
    case 'NEW_SOVEREIGN':
      return '👑';
    case 'REFERRAL_REWARD':
      return '🎁';
    case 'DAILY_MILESTONE':
      return '🎉';
    case 'SYSTEM_ALERT':
      return '⚠️';
    default:
      return '📢';
  }
}

/**
 * Get alert title based on type
 */
function getAlertTitle(type: AlertType): string {
  switch (type) {
    case 'KAUS_PAYMENT':
      return 'REVENUE';
    case 'STAKING_DEPOSIT':
      return 'STAKING';
    case 'NEW_SOVEREIGN':
      return 'NEW SOVEREIGN';
    case 'REFERRAL_REWARD':
      return 'REFERRAL';
    case 'DAILY_MILESTONE':
      return 'MILESTONE';
    case 'SYSTEM_ALERT':
      return 'SYSTEM';
    default:
      return 'ALERT';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALERT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Send a revenue alert to the Boss
 */
export async function sendRevenueAlert(alert: RevenueAlert): Promise<boolean> {
  const emoji = getAlertEmoji(alert.type);
  const title = getAlertTitle(alert.type);
  const timestamp = alert.timestamp || new Date();
  const timeStr = timestamp.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  let message = '';

  switch (alert.type) {
    case 'KAUS_PAYMENT':
      message = `${emoji} <b>[${title}]</b> ${formatAmount(alert.amount, alert.currency)} 입금 완료!

📦 상품: ${alert.productName || 'KAUS Product'}
🆔 고객: SOV-${String(alert.sovereignNumber || '????').padStart(4, '0')}
⏰ 시간: ${timeStr}

💵 오늘 총 매출: ${formatDailyTotal(alert.dailyTotal || 0)}`;
      break;

    case 'STAKING_DEPOSIT':
      message = `${emoji} <b>[${title}]</b> 고액 스테이킹 발생!

💎 스테이킹: ${formatAmount(alert.amount, 'KAUS')}
👤 Sovereign: SOV-${String(alert.sovereignNumber || '????').padStart(4, '0')}
⏰ 시간: ${timeStr}

🔐 현재 TVL 증가 중...`;
      break;

    case 'NEW_SOVEREIGN':
      message = `${emoji} <b>[${title}]</b> 새로운 시민 탄생!

👑 Sovereign #${alert.sovereignNumber}
${alert.customerId ? `📧 ${alert.customerId}` : ''}
⏰ 시간: ${timeStr}

🚀 제국이 확장되고 있습니다.`;
      break;

    case 'REFERRAL_REWARD':
      message = `${emoji} <b>[${title}]</b> 리퍼럴 보상 지급!

🎁 보상: ${formatAmount(alert.amount, 'KAUS')}
👤 추천인: SOV-${String(alert.sovereignNumber || '????').padStart(4, '0')}
⏰ 시간: ${timeStr}

🔗 바이럴 엔진 가동 중...`;
      break;

    case 'DAILY_MILESTONE':
      message = `${emoji} <b>[${title}]</b> 매출 마일스톤 달성!

🏆 달성: ${formatDailyTotal(alert.amount)}
📅 날짜: ${timestamp.toLocaleDateString('ko-KR')}

🎯 다음 목표를 향해 전진!`;
      break;

    case 'SYSTEM_ALERT':
      message = `${emoji} <b>[${title}]</b>

${alert.message || '시스템 알림'}
⏰ 시간: ${timeStr}`;
      break;

    default:
      message = `${emoji} <b>[ALERT]</b> ${alert.message || 'Unknown alert'}`;
  }

  const result = await sendTelegramMessage(message);
  return result.ok;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Send KAUS payment notification
 */
export async function notifyKAUSPayment(
  amount: number,
  currency: 'KRW' | 'USD',
  productName: string,
  sovereignNumber?: number,
  dailyTotal?: number
): Promise<boolean> {
  return sendRevenueAlert({
    type: 'KAUS_PAYMENT',
    amount,
    currency,
    productName,
    sovereignNumber,
    dailyTotal,
  });
}

/**
 * Send high-value staking notification
 */
export async function notifyHighStaking(
  amount: number,
  sovereignNumber: number
): Promise<boolean> {
  // Only alert for high-value staking
  if (amount < ALERT_THRESHOLDS.STAKING_HIGH_VALUE) {
    return true; // Skip but don't fail
  }

  return sendRevenueAlert({
    type: 'STAKING_DEPOSIT',
    amount,
    currency: 'KAUS',
    sovereignNumber,
  });
}

/**
 * Send new Sovereign registration notification
 */
export async function notifyNewSovereign(
  sovereignNumber: number,
  email?: string
): Promise<boolean> {
  return sendRevenueAlert({
    type: 'NEW_SOVEREIGN',
    amount: 0,
    currency: 'KRW',
    sovereignNumber,
    customerId: email,
  });
}

/**
 * Send referral reward notification
 */
export async function notifyReferralReward(
  rewardAmount: number,
  referrerSovereignNumber: number
): Promise<boolean> {
  return sendRevenueAlert({
    type: 'REFERRAL_REWARD',
    amount: rewardAmount,
    currency: 'KAUS',
    sovereignNumber: referrerSovereignNumber,
  });
}

/**
 * Send daily milestone notification
 */
export async function notifyDailyMilestone(
  milestone: number
): Promise<boolean> {
  return sendRevenueAlert({
    type: 'DAILY_MILESTONE',
    amount: milestone,
    currency: 'KRW',
  });
}

/**
 * Send system alert
 */
export async function notifySystemAlert(
  message: string
): Promise<boolean> {
  return sendRevenueAlert({
    type: 'SYSTEM_ALERT',
    amount: 0,
    currency: 'KRW',
    message,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// DAILY REVENUE TRACKER
// ═══════════════════════════════════════════════════════════════════════════════

let dailyRevenue = 0;
let lastResetDate = new Date().toDateString();
const achievedMilestones = new Set<number>();

/**
 * Track daily revenue and check for milestones
 */
export async function trackDailyRevenue(amount: number): Promise<number> {
  const today = new Date().toDateString();

  // Reset daily counter if new day
  if (today !== lastResetDate) {
    dailyRevenue = 0;
    lastResetDate = today;
    achievedMilestones.clear();
  }

  dailyRevenue += amount;

  // Check for milestone achievements
  for (const milestone of ALERT_THRESHOLDS.DAILY_REVENUE_MILESTONE) {
    if (dailyRevenue >= milestone && !achievedMilestones.has(milestone)) {
      achievedMilestones.add(milestone);
      await notifyDailyMilestone(milestone);
    }
  }

  return dailyRevenue;
}

/**
 * Get current daily revenue total
 */
export function getDailyRevenue(): number {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    return 0;
  }
  return dailyRevenue;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Test Telegram bot connection
 */
export async function testTelegramConnection(): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('[Telegram] ⚠️ Bot not configured');
    return false;
  }

  const result = await sendTelegramMessage(
    '🤖 <b>[FIELD NINE]</b> Revenue Alert Bot 연결됨!\n\n' +
    '✅ 시스템 상태: ONLINE\n' +
    '📊 매출 모니터링: ACTIVE\n' +
    `⏰ 연결 시간: ${new Date().toLocaleString('ko-KR')}`
  );

  if (result.ok) {
    console.log('[Telegram] ✅ Bot connected successfully');
  }

  return result.ok;
}

// Export default instance
export default {
  sendRevenueAlert,
  notifyKAUSPayment,
  notifyHighStaking,
  notifyNewSovereign,
  notifyReferralReward,
  notifyDailyMilestone,
  notifySystemAlert,
  trackDailyRevenue,
  getDailyRevenue,
  testTelegramConnection,
};
