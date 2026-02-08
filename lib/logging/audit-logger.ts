/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 78: CENTRALIZED AUDIT LOGGING SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Bank-grade logging for all financial operations.
 * Every KAUS transaction, every API call, every error - LOGGED.
 *
 * Features:
 * - Structured JSON logs
 * - Transaction audit trail
 * - Error tracking with stack traces
 * - Performance metrics
 * - User activity tracking
 */

// ═══════════════════════════════════════════════════════════════════════════════
// LOG TYPES & LEVELS
// ═══════════════════════════════════════════════════════════════════════════════

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export type LogCategory =
  | 'api'
  | 'auth'
  | 'payment'
  | 'kaus'
  | 'energy'
  | 'blockchain'
  | 'system'
  | 'security'
  | 'performance';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  action: string;
  message: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

export interface TransactionLog extends LogEntry {
  category: 'kaus' | 'payment';
  transactionId: string;
  transactionType: string;
  amount: number;
  currency: string;
  balanceBefore?: number;
  balanceAfter?: number;
  status: 'initiated' | 'pending' | 'completed' | 'failed' | 'reversed';
}

export interface SecurityLog extends LogEntry {
  category: 'security';
  eventType: 'login' | 'logout' | 'failed_auth' | 'rate_limit' | 'suspicious_activity';
  threatLevel?: 'low' | 'medium' | 'high' | 'critical';
  blocked?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT LOGGER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class AuditLogger {
  private static instance: AuditLogger;
  private buffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL_MS = 5000;

  private constructor() {
    // Start flush interval in production
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      this.startFlushInterval();
    }
  }

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  private formatLog(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      environment: process.env.NODE_ENV || 'development',
      service: 'field-nine',
      version: '1.0.0',
    });
  }

  private output(entry: LogEntry): void {
    const formatted = this.formatLog(entry);

    // Console output with color coding
    switch (entry.level) {
      case 'debug':
        if (process.env.NODE_ENV !== 'production') {
          console.debug(`[DEBUG] ${formatted}`);
        }
        break;
      case 'info':
        console.log(`[INFO] ${formatted}`);
        break;
      case 'warn':
        console.warn(`[WARN] ${formatted}`);
        break;
      case 'error':
        console.error(`[ERROR] ${formatted}`);
        break;
      case 'critical':
        console.error(`[CRITICAL] ${formatted}`);
        // TODO: Send to alerting service (PagerDuty, Slack, etc.)
        break;
    }

    // Buffer for batch persistence
    this.buffer.push(entry);

    if (this.buffer.length >= this.BUFFER_SIZE) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const logsToFlush = [...this.buffer];
    this.buffer = [];

    // TODO: Persist to database or external logging service
    // For now, logs are output to console
    // In production, send to Supabase logs table or external service

    if (process.env.ENABLE_LOG_PERSISTENCE === 'true') {
      try {
        // await supabase.from('audit_logs').insert(logsToFlush);
        console.log(`[AuditLogger] Flushed ${logsToFlush.length} logs`);
      } catch (error) {
        console.error('[AuditLogger] Failed to persist logs:', error);
        // Re-add failed logs to buffer
        this.buffer = [...logsToFlush, ...this.buffer];
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC LOGGING METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  log(level: LogLevel, category: LogCategory, action: string, message: string, metadata?: Record<string, unknown>): void {
    this.output({
      timestamp: new Date().toISOString(),
      level,
      category,
      action,
      message,
      metadata,
    });
  }

  debug(category: LogCategory, action: string, message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', category, action, message, metadata);
  }

  info(category: LogCategory, action: string, message: string, metadata?: Record<string, unknown>): void {
    this.log('info', category, action, message, metadata);
  }

  warn(category: LogCategory, action: string, message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', category, action, message, metadata);
  }

  error(category: LogCategory, action: string, message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.output({
      timestamp: new Date().toISOString(),
      level: 'error',
      category,
      action,
      message,
      metadata,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    });
  }

  critical(category: LogCategory, action: string, message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.output({
      timestamp: new Date().toISOString(),
      level: 'critical',
      category,
      action,
      message,
      metadata,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SPECIALIZED LOGGING METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Log a financial transaction
   */
  transaction(log: Omit<TransactionLog, 'timestamp' | 'level'>): void {
    this.output({
      ...log,
      timestamp: new Date().toISOString(),
      level: log.status === 'failed' ? 'error' : 'info',
    });
  }

  /**
   * Log a security event
   */
  security(log: Omit<SecurityLog, 'timestamp' | 'level'>): void {
    const level: LogLevel =
      log.threatLevel === 'critical'
        ? 'critical'
        : log.threatLevel === 'high'
        ? 'error'
        : log.threatLevel === 'medium'
        ? 'warn'
        : 'info';

    this.output({
      ...log,
      timestamp: new Date().toISOString(),
      level,
    });
  }

  /**
   * Log API request/response
   */
  api(
    action: string,
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    metadata?: Record<string, unknown>
  ): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    this.output({
      timestamp: new Date().toISOString(),
      level,
      category: 'api',
      action,
      message: `${method} ${path} - ${statusCode}`,
      duration,
      metadata: {
        method,
        path,
        statusCode,
        ...metadata,
      },
    });
  }

  /**
   * Log performance metrics
   */
  performance(action: string, duration: number, metadata?: Record<string, unknown>): void {
    const level: LogLevel = duration > 5000 ? 'warn' : duration > 10000 ? 'error' : 'info';

    this.output({
      timestamp: new Date().toISOString(),
      level,
      category: 'performance',
      action,
      message: `${action} completed in ${duration}ms`,
      duration,
      metadata,
    });
  }

  /**
   * Start a timer and return a function to log completion
   */
  startTimer(action: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.performance(action, duration);
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const auditLogger = AuditLogger.getInstance();

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function logKausTransaction(
  userId: string,
  transactionId: string,
  type: string,
  amount: number,
  status: 'initiated' | 'pending' | 'completed' | 'failed' | 'reversed',
  balanceBefore?: number,
  balanceAfter?: number,
  metadata?: Record<string, unknown>
): void {
  auditLogger.transaction({
    category: 'kaus',
    action: 'transaction',
    message: `KAUS ${type}: ${amount} KAUS`,
    userId,
    transactionId,
    transactionType: type,
    amount,
    currency: 'KAUS',
    balanceBefore,
    balanceAfter,
    status,
    metadata,
  });
}

export function logPaymentEvent(
  userId: string,
  transactionId: string,
  type: string,
  amount: number,
  currency: string,
  status: 'initiated' | 'pending' | 'completed' | 'failed' | 'reversed',
  metadata?: Record<string, unknown>
): void {
  auditLogger.transaction({
    category: 'payment',
    action: 'payment_event',
    message: `Payment ${type}: ${amount} ${currency}`,
    userId,
    transactionId,
    transactionType: type,
    amount,
    currency,
    status,
    metadata,
  });
}

export function logSecurityEvent(
  eventType: 'login' | 'logout' | 'failed_auth' | 'rate_limit' | 'suspicious_activity',
  message: string,
  userId?: string,
  ip?: string,
  threatLevel?: 'low' | 'medium' | 'high' | 'critical',
  blocked?: boolean,
  metadata?: Record<string, unknown>
): void {
  auditLogger.security({
    category: 'security',
    action: eventType,
    message,
    eventType,
    userId,
    ip,
    threatLevel,
    blocked,
    metadata,
  });
}

export function logApiCall(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string,
  metadata?: Record<string, unknown>
): void {
  auditLogger.api('api_call', method, path, statusCode, duration, { userId, ...metadata });
}

export default auditLogger;
