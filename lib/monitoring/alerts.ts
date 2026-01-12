/**
 * K-UNIVERSAL Automated Alert System
 * Monitors critical metrics and sends alerts when thresholds are exceeded
 */

import { captureMessage } from './sentry';

interface AlertConfig {
  metric: string;
  threshold: number;
  comparison: 'gt' | 'lt'; // greater than or less than
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

// Alert configurations
const ALERT_CONFIGS: AlertConfig[] = [
  {
    metric: 'ocrSuccessRate',
    threshold: 95,
    comparison: 'lt',
    severity: 'critical',
    message: 'OCR success rate below 95% - immediate attention required',
  },
  {
    metric: 'errorRate',
    threshold: 1,
    comparison: 'gt',
    severity: 'critical',
    message: 'Error rate above 1% - system degradation detected',
  },
  {
    metric: 'avgResponseTime',
    threshold: 3000,
    comparison: 'gt',
    severity: 'warning',
    message: 'Average response time above 3s - performance degradation',
  },
  {
    metric: 'uptime',
    threshold: 99.5,
    comparison: 'lt',
    severity: 'warning',
    message: 'Uptime below 99.5% - infrastructure issues detected',
  },
];

export interface MetricsSnapshot {
  ocrSuccessRate: number;
  errorRate: number;
  avgResponseTime: number;
  uptime: number;
  [key: string]: number;
}

export class AlertManager {
  private lastAlerts: Map<string, number> = new Map();
  private alertCooldown = 300000; // 5 minutes

  /**
   * Check metrics against alert thresholds
   */
  checkMetrics(metrics: MetricsSnapshot): void {
    for (const config of ALERT_CONFIGS) {
      const value = metrics[config.metric];
      if (value === undefined) continue;

      const shouldAlert = this.shouldTriggerAlert(value, config);
      if (shouldAlert && this.canSendAlert(config.metric)) {
        this.sendAlert(config, value);
        this.updateLastAlertTime(config.metric);
      }
    }
  }

  /**
   * Determine if alert should be triggered
   */
  private shouldTriggerAlert(value: number, config: AlertConfig): boolean {
    if (config.comparison === 'gt') {
      return value > config.threshold;
    } else {
      return value < config.threshold;
    }
  }

  /**
   * Check if enough time has passed since last alert (cooldown)
   */
  private canSendAlert(metric: string): boolean {
    const lastAlert = this.lastAlerts.get(metric);
    if (!lastAlert) return true;

    const timeSinceLastAlert = Date.now() - lastAlert;
    return timeSinceLastAlert > this.alertCooldown;
  }

  /**
   * Send alert through configured channels
   */
  private sendAlert(config: AlertConfig, value: number): void {
    const alertMessage = `[${config.severity.toUpperCase()}] ${config.message} (Current: ${value})`;

    // Log to console
    console.error(alertMessage);

    // Send to Sentry
    captureMessage(alertMessage, config.severity === 'critical' ? 'error' : 'warning');

    // In production: Send to additional channels
    // - Slack webhook
    // - Discord webhook
    // - SMS (Twilio) for critical alerts
    // - Email
    // - PagerDuty

    if (config.severity === 'critical') {
      this.sendCriticalAlert(config, value);
    }
  }

  /**
   * Send critical alert through high-priority channels
   */
  private sendCriticalAlert(config: AlertConfig, value: number): void {
    // In production: Implement critical alert logic
    console.log('🚨 CRITICAL ALERT:', {
      metric: config.metric,
      threshold: config.threshold,
      actual: value,
      message: config.message,
      timestamp: new Date().toISOString(),
    });

    // Example: Send SMS, call PagerDuty, etc.
  }

  /**
   * Update last alert timestamp
   */
  private updateLastAlertTime(metric: string): void {
    this.lastAlerts.set(metric, Date.now());
  }

  /**
   * Auto-optimization attempt for OCR failures
   */
  static async attemptOCROptimization(failureRate: number): Promise<void> {
    console.log(`🔧 Attempting auto-optimization for OCR (failure rate: ${failureRate}%)`);

    // In production: Implement auto-optimization logic
    // 1. Switch to backup OCR provider
    // 2. Adjust image preprocessing
    // 3. Enable manual review queue
    // 4. Increase timeout thresholds
    // 5. Log detailed failure analytics

    captureMessage(
      `OCR auto-optimization triggered (failure rate: ${failureRate}%)`,
      'warning'
    );
  }
}

// Singleton instance
export const alertManager = new AlertManager();

/**
 * Check metrics and trigger alerts if needed
 */
export function monitorMetrics(metrics: MetricsSnapshot): void {
  alertManager.checkMetrics(metrics);

  // Special handling for OCR failures
  if (metrics.ocrSuccessRate < 95) {
    const failureRate = 100 - metrics.ocrSuccessRate;
    AlertManager.attemptOCROptimization(failureRate);
  }
}
