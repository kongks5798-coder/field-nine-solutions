/**
 * Sales Alert Notification System
 * 매출 목표 달성, 이상 징후 감지, 실시간 알림
 */

import { getSalesDashboard, getTodaySales, getMonthSales } from '@/lib/google/sales-data';

// ============================================
// Types
// ============================================

export type AlertType =
  | 'target_achieved'      // 목표 달성
  | 'target_warning'       // 목표 미달 경고
  | 'high_refund'          // 환불 급증
  | 'low_sales'            // 매출 급감
  | 'channel_anomaly'      // 채널 이상
  | 'milestone'            // 마일스톤 달성
  | 'daily_summary';       // 일일 요약

export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

export interface SalesAlert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export interface AlertThresholds {
  dailyTarget: number;           // 일일 목표 매출
  weeklyTarget: number;          // 주간 목표 매출
  monthlyTarget: number;         // 월간 목표 매출
  refundRateWarning: number;     // 환불률 경고 임계값 (%)
  salesDropWarning: number;      // 매출 감소 경고 임계값 (%)
  milestones: number[];          // 마일스톤 금액들
}

export interface WebhookConfig {
  enabled: boolean;
  url: string;
  type: 'slack' | 'discord' | 'custom';
  events: AlertType[];
}

// ============================================
// Default Configuration
// ============================================

const DEFAULT_THRESHOLDS: AlertThresholds = {
  dailyTarget: 5000000,          // 500만원
  weeklyTarget: 30000000,        // 3000만원
  monthlyTarget: 100000000,      // 1억원
  refundRateWarning: 5,          // 5%
  salesDropWarning: 30,          // 전일 대비 30% 감소
  milestones: [10000000, 50000000, 100000000, 500000000, 1000000000],
};

// In-memory alert storage (production: use database)
let alerts: SalesAlert[] = [];
let thresholds: AlertThresholds = DEFAULT_THRESHOLDS;
let webhooks: WebhookConfig[] = [];

// ============================================
// Alert Generation Functions
// ============================================

function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createAlert(
  type: AlertType,
  priority: AlertPriority,
  title: string,
  message: string,
  data?: Record<string, unknown>,
  actionUrl?: string
): SalesAlert {
  const alert: SalesAlert = {
    id: generateAlertId(),
    type,
    priority,
    title,
    message,
    data,
    timestamp: new Date(),
    read: false,
    actionUrl,
  };

  alerts.unshift(alert);

  // Keep only last 100 alerts
  if (alerts.length > 100) {
    alerts = alerts.slice(0, 100);
  }

  // Trigger webhooks
  triggerWebhooks(alert);

  return alert;
}

// ============================================
// Sales Monitoring
// ============================================

export async function checkSalesAlerts(): Promise<SalesAlert[]> {
  const newAlerts: SalesAlert[] = [];

  try {
    const [todaySales, monthSales] = await Promise.all([
      getTodaySales(),
      getMonthSales(),
    ]);

    // 1. Daily Target Check
    const dailyProgress = (todaySales.totalGrossSales / thresholds.dailyTarget) * 100;

    if (todaySales.totalGrossSales >= thresholds.dailyTarget) {
      const existingAlert = alerts.find(
        a => a.type === 'target_achieved' &&
        new Date(a.timestamp).toDateString() === new Date().toDateString()
      );

      if (!existingAlert) {
        newAlerts.push(createAlert(
          'target_achieved',
          'high',
          '일일 목표 달성!',
          `오늘 매출이 목표 ${formatKRW(thresholds.dailyTarget)}을 달성했습니다. 현재 ${formatKRW(todaySales.totalGrossSales)} (${dailyProgress.toFixed(1)}%)`,
          { target: thresholds.dailyTarget, actual: todaySales.totalGrossSales, progress: dailyProgress }
        ));
      }
    } else if (dailyProgress < 50 && new Date().getHours() >= 18) {
      // 오후 6시 이후 50% 미달 시 경고
      const existingWarning = alerts.find(
        a => a.type === 'target_warning' &&
        new Date(a.timestamp).toDateString() === new Date().toDateString()
      );

      if (!existingWarning) {
        newAlerts.push(createAlert(
          'target_warning',
          'medium',
          '일일 목표 미달 경고',
          `현재 매출 ${formatKRW(todaySales.totalGrossSales)}로 목표 대비 ${dailyProgress.toFixed(1)}%입니다.`,
          { target: thresholds.dailyTarget, actual: todaySales.totalGrossSales, progress: dailyProgress }
        ));
      }
    }

    // 2. Monthly Target Check
    const monthlyProgress = (monthSales.totalGrossSales / thresholds.monthlyTarget) * 100;

    if (monthSales.totalGrossSales >= thresholds.monthlyTarget) {
      const existingMonthAlert = alerts.find(
        a => a.type === 'milestone' &&
        a.data?.milestone === thresholds.monthlyTarget &&
        new Date(a.timestamp).getMonth() === new Date().getMonth()
      );

      if (!existingMonthAlert) {
        newAlerts.push(createAlert(
          'milestone',
          'critical',
          '월간 목표 달성!',
          `이번 달 매출이 목표 ${formatKRW(thresholds.monthlyTarget)}을 달성했습니다!`,
          { milestone: thresholds.monthlyTarget, actual: monthSales.totalGrossSales }
        ));
      }
    }

    // 3. Refund Rate Check
    const refundRate = monthSales.totalOrders > 0
      ? (monthSales.totalReturns / monthSales.totalOrders) * 100
      : 0;

    if (refundRate > thresholds.refundRateWarning) {
      const existingRefundAlert = alerts.find(
        a => a.type === 'high_refund' &&
        Date.now() - new Date(a.timestamp).getTime() < 24 * 60 * 60 * 1000
      );

      if (!existingRefundAlert) {
        newAlerts.push(createAlert(
          'high_refund',
          'high',
          '환불률 급증 감지',
          `현재 환불률이 ${refundRate.toFixed(1)}%로 기준치(${thresholds.refundRateWarning}%)를 초과했습니다.`,
          { refundRate, threshold: thresholds.refundRateWarning, returns: monthSales.totalReturns },
          '/panopticon/musinsa'
        ));
      }
    }

    // 4. Milestone Checks
    for (const milestone of thresholds.milestones) {
      if (monthSales.totalGrossSales >= milestone) {
        const existingMilestone = alerts.find(
          a => a.type === 'milestone' &&
          a.data?.milestone === milestone &&
          new Date(a.timestamp).getFullYear() === new Date().getFullYear()
        );

        if (!existingMilestone) {
          newAlerts.push(createAlert(
            'milestone',
            'high',
            `매출 ${formatKRW(milestone)} 돌파!`,
            `축하합니다! 누적 매출이 ${formatKRW(milestone)}을 돌파했습니다.`,
            { milestone, actual: monthSales.totalGrossSales }
          ));
        }
      }
    }

    // 5. Channel Anomaly Check
    const channels = Object.entries(monthSales.byChannel);
    for (const [channel, data] of channels) {
      if (data.orders > 10 && data.grossSales === 0) {
        newAlerts.push(createAlert(
          'channel_anomaly',
          'critical',
          `${channel} 채널 이상 감지`,
          `${channel}에서 주문 ${data.orders}건이 있지만 매출이 기록되지 않았습니다.`,
          { channel, orders: data.orders, sales: data.grossSales }
        ));
      }
    }

  } catch (error) {
    console.error('[Sales Alerts] Check failed:', error);
  }

  return newAlerts;
}

// ============================================
// Webhook Integration
// ============================================

async function triggerWebhooks(alert: SalesAlert): Promise<void> {
  for (const webhook of webhooks) {
    if (!webhook.enabled || !webhook.events.includes(alert.type)) {
      continue;
    }

    try {
      const payload = formatWebhookPayload(webhook.type, alert);

      await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error(`[Webhook] Failed to send to ${webhook.url}:`, error);
    }
  }
}

function formatWebhookPayload(type: WebhookConfig['type'], alert: SalesAlert): unknown {
  const priorityEmoji = {
    low: 'ℹ️',
    medium: '⚠️',
    high: '🔔',
    critical: '🚨',
  };

  switch (type) {
    case 'slack':
      return {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${priorityEmoji[alert.priority]} *${alert.title}*\n${alert.message}`,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `📊 Field Nine Panopticon | ${new Date(alert.timestamp).toLocaleString('ko-KR')}`,
              },
            ],
          },
        ],
      };

    case 'discord':
      return {
        embeds: [
          {
            title: `${priorityEmoji[alert.priority]} ${alert.title}`,
            description: alert.message,
            color: alert.priority === 'critical' ? 0xff0000 :
                   alert.priority === 'high' ? 0xff9900 :
                   alert.priority === 'medium' ? 0xffff00 : 0x00ff00,
            timestamp: alert.timestamp,
            footer: {
              text: 'Field Nine Panopticon',
            },
          },
        ],
      };

    default:
      return {
        alert,
        source: 'field-nine-panopticon',
        timestamp: alert.timestamp,
      };
  }
}

// ============================================
// Alert Management
// ============================================

export function getAlerts(options?: {
  unreadOnly?: boolean;
  type?: AlertType;
  priority?: AlertPriority;
  limit?: number;
}): SalesAlert[] {
  let result = [...alerts];

  if (options?.unreadOnly) {
    result = result.filter(a => !a.read);
  }

  if (options?.type) {
    result = result.filter(a => a.type === options.type);
  }

  if (options?.priority) {
    result = result.filter(a => a.priority === options.priority);
  }

  if (options?.limit) {
    result = result.slice(0, options.limit);
  }

  return result;
}

export function markAlertRead(alertId: string): boolean {
  const alert = alerts.find(a => a.id === alertId);
  if (alert) {
    alert.read = true;
    return true;
  }
  return false;
}

export function markAllAlertsRead(): number {
  let count = 0;
  alerts.forEach(a => {
    if (!a.read) {
      a.read = true;
      count++;
    }
  });
  return count;
}

export function deleteAlert(alertId: string): boolean {
  const index = alerts.findIndex(a => a.id === alertId);
  if (index !== -1) {
    alerts.splice(index, 1);
    return true;
  }
  return false;
}

export function clearAlerts(): number {
  const count = alerts.length;
  alerts = [];
  return count;
}

// ============================================
// Configuration Management
// ============================================

export function getThresholds(): AlertThresholds {
  return { ...thresholds };
}

export function updateThresholds(newThresholds: Partial<AlertThresholds>): AlertThresholds {
  thresholds = { ...thresholds, ...newThresholds };
  return thresholds;
}

export function getWebhooks(): WebhookConfig[] {
  return [...webhooks];
}

export function addWebhook(config: Omit<WebhookConfig, 'enabled'> & { enabled?: boolean }): WebhookConfig {
  const webhook: WebhookConfig = {
    ...config,
    enabled: config.enabled ?? true,
  };
  webhooks.push(webhook);
  return webhook;
}

export function removeWebhook(url: string): boolean {
  const index = webhooks.findIndex(w => w.url === url);
  if (index !== -1) {
    webhooks.splice(index, 1);
    return true;
  }
  return false;
}

export function updateWebhook(url: string, updates: Partial<WebhookConfig>): WebhookConfig | null {
  const webhook = webhooks.find(w => w.url === url);
  if (webhook) {
    Object.assign(webhook, updates);
    return webhook;
  }
  return null;
}

// ============================================
// Daily Summary Generator
// ============================================

export async function generateDailySummary(): Promise<SalesAlert> {
  const dashboard = await getSalesDashboard();

  const summaryMessage = `
📊 일일 매출 리포트

💰 오늘 매출: ${formatKRW(dashboard.today.grossSales)} (${dashboard.today.orders}건)
📈 이번 주: ${formatKRW(dashboard.week.grossSales)} (${dashboard.week.orders}건)
📅 이번 달: ${formatKRW(dashboard.month.grossSales)} (${dashboard.month.orders}건)

${dashboard.month.growth >= 0 ? '📈' : '📉'} 전월 대비: ${dashboard.month.growth >= 0 ? '+' : ''}${dashboard.month.growth.toFixed(1)}%

🏆 Top 채널: ${dashboard.channelRanking[0]?.channel || 'N/A'}
  `.trim();

  return createAlert(
    'daily_summary',
    'low',
    '일일 매출 리포트',
    summaryMessage,
    {
      today: dashboard.today,
      week: dashboard.week,
      month: dashboard.month,
      topChannel: dashboard.channelRanking[0],
    }
  );
}

// ============================================
// Utility Functions
// ============================================

function formatKRW(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억원`;
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}만원`;
  }
  return `${amount.toLocaleString('ko-KR')}원`;
}

// ============================================
// Alert Statistics
// ============================================

export function getAlertStats(): {
  total: number;
  unread: number;
  byPriority: Record<AlertPriority, number>;
  byType: Record<AlertType, number>;
} {
  const stats = {
    total: alerts.length,
    unread: alerts.filter(a => !a.read).length,
    byPriority: {} as Record<AlertPriority, number>,
    byType: {} as Record<AlertType, number>,
  };

  alerts.forEach(alert => {
    stats.byPriority[alert.priority] = (stats.byPriority[alert.priority] || 0) + 1;
    stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
  });

  return stats;
}
