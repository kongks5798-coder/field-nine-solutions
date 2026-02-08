/**
 * K-UNIVERSAL Structured Logging System
 * Production-Grade Logging with Pino
 *
 * Features:
 * - Structured JSON logging
 * - Log levels (debug, info, warn, error)
 * - Context tracking (requestId, userId, action)
 * - Environment-aware formatting
 * - Sensitive data redaction
 *
 * @module lib/logging/logger
 */

import pino, { Logger as PinoLogger, LoggerOptions } from 'pino';

// ============================================
// Types
// ============================================

export interface LogContext {
  requestId?: string;
  userId?: string;
  action?: string;
  provider?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  child(bindings: LogContext): Logger;
}

// ============================================
// Sensitive Data Redaction
// ============================================

const SENSITIVE_KEYS = [
  'password',
  'secret',
  'token',
  'apiKey',
  'api_key',
  'authorization',
  'cookie',
  'creditCard',
  'credit_card',
  'cardNumber',
  'card_number',
  'cvv',
  'ssn',
  'socialSecurityNumber',
  'passportNumber',
  'passport_number',
];

function redactSensitiveData(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Redact potential tokens/keys in strings
    if (obj.length > 20 && /^(sk_|pk_|api_|bearer |token )/i.test(obj)) {
      return '[REDACTED]';
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveData);
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive.toLowerCase()))) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactSensitiveData(value);
      }
    }
    return result;
  }

  return obj;
}

// ============================================
// Logger Configuration
// ============================================

const isDevelopment = process.env.NODE_ENV !== 'production';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

const pinoConfig: LoggerOptions = {
  level: logLevel,
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      host: bindings.hostname,
      env: process.env.NODE_ENV || 'development',
      service: 'k-universal',
    }),
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  redact: {
    paths: SENSITIVE_KEYS.map(key => `*.${key}`),
    censor: '[REDACTED]',
  },
  // Pretty print in development
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
};

// ============================================
// Pino Instance
// ============================================

let pinoInstance: PinoLogger | null = null;

function getPinoInstance(): PinoLogger {
  if (!pinoInstance) {
    try {
      pinoInstance = pino(pinoConfig);
    } catch {
      // Fallback if pino-pretty not available
      pinoInstance = pino({
        ...pinoConfig,
        transport: undefined,
      });
    }
  }
  return pinoInstance;
}

// ============================================
// Logger Wrapper
// ============================================

class StructuredLogger implements Logger {
  private pino: PinoLogger;
  private defaultContext: LogContext;

  constructor(context: LogContext = {}) {
    this.pino = getPinoInstance();
    this.defaultContext = context;
  }

  private formatMessage(message: string, context?: LogContext): [Record<string, unknown>, string] {
    const mergedContext = {
      ...this.defaultContext,
      ...context,
    };

    // Redact sensitive data in context
    const safeContext = redactSensitiveData(mergedContext) as Record<string, unknown>;

    return [safeContext, message];
  }

  debug(message: string, context?: LogContext): void {
    const [ctx, msg] = this.formatMessage(message, context);
    this.pino.debug(ctx, msg);
  }

  info(message: string, context?: LogContext): void {
    const [ctx, msg] = this.formatMessage(message, context);
    this.pino.info(ctx, msg);
  }

  warn(message: string, context?: LogContext): void {
    const [ctx, msg] = this.formatMessage(message, context);
    this.pino.warn(ctx, msg);
  }

  error(message: string, context?: LogContext): void {
    const [ctx, msg] = this.formatMessage(message, context);
    this.pino.error(ctx, msg);
  }

  child(bindings: LogContext): Logger {
    return new StructuredLogger({
      ...this.defaultContext,
      ...bindings,
    });
  }
}

// ============================================
// Console Fallback Logger (for edge cases)
// ============================================

class ConsoleFallbackLogger implements Logger {
  private defaultContext: LogContext;

  constructor(context: LogContext = {}) {
    this.defaultContext = context;
  }

  private formatLog(level: string, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const mergedContext = { ...this.defaultContext, ...context };
    const safeContext = redactSensitiveData(mergedContext) as Record<string, unknown> | null;

    const logEntry = {
      timestamp,
      level,
      message,
      ...(safeContext || {}),
    };

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(logEntry));
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'production') {
      this.formatLog('debug', message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    this.formatLog('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.formatLog('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.formatLog('error', message, context);
  }

  child(bindings: LogContext): Logger {
    return new ConsoleFallbackLogger({
      ...this.defaultContext,
      ...bindings,
    });
  }
}

// ============================================
// Export Singleton Logger
// ============================================

let loggerInstance: Logger | null = null;

export function getLogger(context?: LogContext): Logger {
  if (!loggerInstance) {
    try {
      // Try to use Pino
      loggerInstance = new StructuredLogger(context);
    } catch {
      // Fallback to console logger
      loggerInstance = new ConsoleFallbackLogger(context);
    }
  }

  if (context) {
    return loggerInstance.child(context);
  }

  return loggerInstance;
}

// Default export for convenience
export const logger = getLogger();

// ============================================
// Specialized Loggers
// ============================================

export const webhookLogger = getLogger({ service: 'webhook' });
export const paymentLogger = getLogger({ service: 'payment' });
export const authLogger = getLogger({ service: 'auth' });
export const apiLogger = getLogger({ service: 'api' });

// ============================================
// Request Logging Middleware Helper
// ============================================

export function createRequestLogger(requestId: string, userId?: string): Logger {
  return getLogger({ requestId, userId });
}

// ============================================
// Audit Log Helper
// ============================================

export interface AuditLogEntry {
  action: string;
  actor: {
    userId?: string;
    ip?: string;
    userAgent?: string;
  };
  resource: {
    type: string;
    id?: string;
  };
  details?: Record<string, unknown>;
  result: 'success' | 'failure';
  timestamp?: string;
}

export function auditLog(entry: AuditLogEntry): void {
  const auditLogger = getLogger({ service: 'audit' });

  auditLogger.info(`audit_${entry.action}`, {
    action: entry.action,
    actorUserId: entry.actor.userId,
    actorIp: entry.actor.ip,
    resourceType: entry.resource.type,
    resourceId: entry.resource.id,
    result: entry.result,
    details: entry.details,
    auditTimestamp: entry.timestamp || new Date().toISOString(),
  });
}

// ============================================
// Performance Logging Helper
// ============================================

export function logDuration(
  action: string,
  startTime: number,
  context?: LogContext
): void {
  const duration = Date.now() - startTime;
  logger.info(`${action}_completed`, {
    ...context,
    duration,
    durationMs: duration,
  });
}

export function createTimer(action: string, context?: LogContext): () => void {
  const startTime = Date.now();
  return () => logDuration(action, startTime, context);
}
