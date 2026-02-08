/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 59: ENTERPRISE LOGGING SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Structured JSON logging for production observability
 * - Log levels: debug, info, warn, error, fatal
 * - Contextual metadata (request ID, user ID, etc.)
 * - Performance metrics
 * - Audit trail for compliance
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  duration?: number;
  statusCode?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  environment: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface AuditLogEntry {
  timestamp: string;
  action: string;
  userId?: string;
  resourceType: string;
  resourceId?: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  ip?: string;
  userAgent?: string;
  success: boolean;
  reason?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const SERVICE_NAME = process.env.SERVICE_NAME || 'field-nine';
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const MIN_LOG_LEVEL = (process.env.LOG_LEVEL || 'info') as LogLevel;
const ENABLE_CONSOLE = process.env.DISABLE_CONSOLE_LOG !== 'true';

// ═══════════════════════════════════════════════════════════════════════════════
// CORE LOGGER
// ═══════════════════════════════════════════════════════════════════════════════

class Logger {
  private context: LogContext = {};
  private namespace: string;

  constructor(namespace: string = 'app') {
    this.namespace = namespace;
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const child = new Logger(this.namespace);
    child.context = { ...this.context, ...context };
    return child;
  }

  /**
   * Create a namespaced logger
   */
  scope(namespace: string): Logger {
    return new Logger(`${this.namespace}:${namespace}`);
  }

  /**
   * Set context for this logger instance
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
  }

  /**
   * Format and output a log entry
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: SERVICE_NAME,
      environment: ENVIRONMENT,
      context: {
        namespace: this.namespace,
        ...this.context,
        ...context,
      },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // Output to console in JSON format
    if (ENABLE_CONSOLE) {
      const output = JSON.stringify(entry);

      switch (level) {
        case 'debug':
          console.debug(output);
          break;
        case 'info':
          console.info(output);
          break;
        case 'warn':
          console.warn(output);
          break;
        case 'error':
        case 'fatal':
          console.error(output);
          break;
      }
    }

    // In production, you could send to external logging service here
    // e.g., Datadog, Logtail, CloudWatch, etc.
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const err = error instanceof Error ? error : undefined;
    const ctx = error instanceof Error ? context : (error as LogContext);
    this.log('error', message, ctx, err);
  }

  fatal(message: string, error?: Error | unknown, context?: LogContext): void {
    const err = error instanceof Error ? error : undefined;
    const ctx = error instanceof Error ? context : (error as LogContext);
    this.log('fatal', message, ctx, err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT LOGGER
// ═══════════════════════════════════════════════════════════════════════════════

class AuditLogger {
  private context: Partial<AuditLogEntry> = {};

  /**
   * Set default context for audit logs
   */
  setContext(context: Partial<AuditLogEntry>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Log an audit event
   */
  log(entry: Omit<AuditLogEntry, 'timestamp'>): void {
    const fullEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      ...this.context,
      ...entry,
    };

    // Output as structured log
    console.info(JSON.stringify({
      type: 'audit',
      ...fullEntry,
    }));

    // In production, you would also:
    // 1. Send to Supabase audit_logs table
    // 2. Send to compliance logging service
    // 3. Trigger alerts for sensitive actions
  }

  /**
   * Log user authentication events
   */
  auth(action: 'login' | 'logout' | 'register' | 'password_change' | 'mfa_enable' | 'mfa_disable', params: {
    userId?: string;
    success: boolean;
    ip?: string;
    userAgent?: string;
    reason?: string;
  }): void {
    this.log({
      action: `auth.${action}`,
      resourceType: 'user',
      resourceId: params.userId,
      ...params,
    });
  }

  /**
   * Log data access events
   */
  access(resourceType: string, resourceId: string, action: 'read' | 'list' | 'export', params: {
    userId?: string;
    success: boolean;
    fields?: string[];
  }): void {
    this.log({
      action: `access.${action}`,
      resourceType,
      resourceId,
      ...params,
    });
  }

  /**
   * Log data modification events
   */
  modify(resourceType: string, resourceId: string, action: 'create' | 'update' | 'delete', params: {
    userId?: string;
    success: boolean;
    changes?: Record<string, { from: unknown; to: unknown }>;
    reason?: string;
  }): void {
    this.log({
      action: `modify.${action}`,
      resourceType,
      resourceId,
      ...params,
    });
  }

  /**
   * Log payment/transaction events
   */
  transaction(action: 'payment' | 'refund' | 'transfer' | 'withdrawal', params: {
    userId?: string;
    resourceId: string;
    amount?: number;
    currency?: string;
    success: boolean;
    reason?: string;
  }): void {
    this.log({
      action: `transaction.${action}`,
      resourceType: 'transaction',
      ...params,
    });
  }

  /**
   * Log admin actions
   */
  admin(action: string, params: {
    userId?: string;
    resourceType: string;
    resourceId?: string;
    success: boolean;
    reason?: string;
  }): void {
    this.log({
      action: `admin.${action}`,
      ...params,
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE LOGGER
// ═══════════════════════════════════════════════════════════════════════════════

class PerformanceLogger {
  private timers: Map<string, number> = new Map();

  /**
   * Start a performance timer
   */
  start(name: string): void {
    this.timers.set(name, performance.now());
  }

  /**
   * End a performance timer and log the duration
   */
  end(name: string, context?: LogContext): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      logger.warn(`Performance timer "${name}" was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    logger.info(`Performance: ${name}`, {
      ...context,
      duration: Math.round(duration * 100) / 100,
      unit: 'ms',
    });

    return duration;
  }

  /**
   * Measure async operation duration
   */
  async measure<T>(name: string, operation: () => Promise<T>, context?: LogContext): Promise<T> {
    this.start(name);
    try {
      const result = await operation();
      this.end(name, { ...context, success: true });
      return result;
    } catch (error) {
      this.end(name, { ...context, success: false });
      throw error;
    }
  }

  /**
   * Log a metric
   */
  metric(name: string, value: number, unit: string, context?: LogContext): void {
    console.info(JSON.stringify({
      type: 'metric',
      timestamp: new Date().toISOString(),
      name,
      value,
      unit,
      ...context,
    }));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST LOGGER MIDDLEWARE HELPER
// ═══════════════════════════════════════════════════════════════════════════════

export function createRequestLogger(request: Request): Logger {
  const requestId = crypto.randomUUID();
  const url = new URL(request.url);

  return logger.child({
    requestId,
    path: url.pathname,
    method: request.method,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  });
}

export function logRequestStart(log: Logger): void {
  log.info('Request started');
}

export function logRequestEnd(log: Logger, statusCode: number, duration: number): void {
  log.info('Request completed', { statusCode, duration });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCES
// ═══════════════════════════════════════════════════════════════════════════════

export const logger = new Logger();
export const auditLogger = new AuditLogger();
export const perfLogger = new PerformanceLogger();

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default logger;
