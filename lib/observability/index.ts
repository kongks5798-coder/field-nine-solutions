/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 59: OBSERVABILITY MODULE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Enterprise-grade observability for production systems
 */

// Logger exports
export {
  logger,
  auditLogger,
  perfLogger,
  createRequestLogger,
  logRequestStart,
  logRequestEnd,
} from './logger';

export type {
  LogLevel,
  LogContext,
  LogEntry,
  AuditLogEntry,
} from './logger';

// Event tracker exports
export {
  tracker,
  Events,
} from './event-tracker';

export type {
  EventCategory,
  TrackEvent,
  UserProperties,
  PageViewEvent,
  ConversionEvent,
  FeatureUsageEvent,
} from './event-tracker';

// Default exports
export { logger as default } from './logger';
