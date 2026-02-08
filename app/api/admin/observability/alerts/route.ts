/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 60: ALERTS API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Alert management and configuration endpoint
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Alert types
interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  metadata?: Record<string, unknown>;
}

interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
  };
  severity: 'critical' | 'warning' | 'info';
  cooldown: number; // seconds between alerts
  lastTriggered?: string;
}

// In-memory storage (in production, use database)
const alertsStore: Alert[] = [];
const alertRulesStore: AlertRule[] = [
  {
    id: 'rule-1',
    name: 'High Error Rate',
    enabled: true,
    condition: { metric: 'error_rate', operator: 'gt', threshold: 1 },
    severity: 'critical',
    cooldown: 300,
  },
  {
    id: 'rule-2',
    name: 'Circuit Breaker Open',
    enabled: true,
    condition: { metric: 'circuit_breaker_open', operator: 'gt', threshold: 0 },
    severity: 'critical',
    cooldown: 60,
  },
  {
    id: 'rule-3',
    name: 'High Memory Usage',
    enabled: true,
    condition: { metric: 'memory_usage', operator: 'gt', threshold: 85 },
    severity: 'warning',
    cooldown: 600,
  },
  {
    id: 'rule-4',
    name: 'Low Cache Hit Rate',
    enabled: true,
    condition: { metric: 'cache_hit_rate', operator: 'lt', threshold: 50 },
    severity: 'warning',
    cooldown: 300,
  },
  {
    id: 'rule-5',
    name: 'DDoS Detection',
    enabled: true,
    condition: { metric: 'blocked_ips', operator: 'gt', threshold: 5 },
    severity: 'critical',
    cooldown: 60,
  },
];

// Generate sample alerts for demo
function generateSampleAlerts(): Alert[] {
  const now = Date.now();
  return [
    {
      id: 'alert-1',
      type: 'critical',
      title: 'Circuit Breaker Opened',
      message: 'Stripe circuit breaker opened due to 5 consecutive failures',
      source: 'circuit-breaker',
      timestamp: new Date(now - 5 * 60000).toISOString(),
      acknowledged: false,
      metadata: { service: 'stripe', failures: 5 },
    },
    {
      id: 'alert-2',
      type: 'warning',
      title: 'High Memory Usage',
      message: 'Memory usage reached 78% (threshold: 85%)',
      source: 'health-check',
      timestamp: new Date(now - 15 * 60000).toISOString(),
      acknowledged: true,
      acknowledgedBy: 'admin',
      acknowledgedAt: new Date(now - 10 * 60000).toISOString(),
      metadata: { memoryUsage: 78 },
    },
    {
      id: 'alert-3',
      type: 'info',
      title: 'Cache Miss Rate Increased',
      message: 'Cache hit rate dropped to 65% in the last hour',
      source: 'cache-monitor',
      timestamp: new Date(now - 30 * 60000).toISOString(),
      acknowledged: false,
      metadata: { hitRate: 65 },
    },
    {
      id: 'alert-4',
      type: 'warning',
      title: 'Rate Limit Threshold',
      message: '3 IPs blocked due to rate limiting in the last hour',
      source: 'rate-limiter',
      timestamp: new Date(now - 45 * 60000).toISOString(),
      acknowledged: false,
      metadata: { blockedCount: 3 },
    },
  ];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const view = searchParams.get('view') || 'alerts'; // alerts | rules

    if (view === 'rules') {
      return NextResponse.json({
        rules: alertRulesStore,
        timestamp: new Date().toISOString(),
      });
    }

    // Get alerts
    const type = searchParams.get('type');
    const acknowledged = searchParams.get('acknowledged');

    let alerts = alertsStore.length > 0 ? [...alertsStore] : generateSampleAlerts();

    // Apply filters
    if (type && type !== 'all') {
      alerts = alerts.filter((a) => a.type === type);
    }

    if (acknowledged !== null) {
      const ack = acknowledged === 'true';
      alerts = alerts.filter((a) => a.acknowledged === ack);
    }

    // Sort by timestamp (newest first)
    alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Stats
    const stats = {
      total: alerts.length,
      critical: alerts.filter((a) => a.type === 'critical').length,
      warning: alerts.filter((a) => a.type === 'warning').length,
      info: alerts.filter((a) => a.type === 'info').length,
      unacknowledged: alerts.filter((a) => !a.acknowledged).length,
    };

    return NextResponse.json({
      alerts,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Alerts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, alertId, ruleId, ruleData } = body;

    switch (action) {
      case 'acknowledge': {
        const alert = alertsStore.find((a) => a.id === alertId);
        if (alert) {
          alert.acknowledged = true;
          alert.acknowledgedAt = new Date().toISOString();
          alert.acknowledgedBy = 'admin';
        }
        return NextResponse.json({ success: true, alert });
      }

      case 'dismiss': {
        const index = alertsStore.findIndex((a) => a.id === alertId);
        if (index !== -1) {
          alertsStore.splice(index, 1);
        }
        return NextResponse.json({ success: true });
      }

      case 'toggle-rule': {
        const rule = alertRulesStore.find((r) => r.id === ruleId);
        if (rule) {
          rule.enabled = !rule.enabled;
        }
        return NextResponse.json({ success: true, rule });
      }

      case 'update-rule': {
        const ruleIndex = alertRulesStore.findIndex((r) => r.id === ruleId);
        if (ruleIndex !== -1 && ruleData) {
          alertRulesStore[ruleIndex] = { ...alertRulesStore[ruleIndex], ...ruleData };
        }
        return NextResponse.json({ success: true, rule: alertRulesStore[ruleIndex] });
      }

      case 'create-alert': {
        const newAlert: Alert = {
          id: `alert-${Date.now()}`,
          type: body.type || 'info',
          title: body.title,
          message: body.message,
          source: body.source || 'manual',
          timestamp: new Date().toISOString(),
          acknowledged: false,
          metadata: body.metadata,
        };
        alertsStore.unshift(newAlert);
        return NextResponse.json({ success: true, alert: newAlert });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Alerts API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
