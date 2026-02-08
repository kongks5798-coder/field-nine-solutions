/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 61: PERFORMANCE MODULE
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export {
  metricsStore,
  withPerformanceTracking,
  recordMetric,
  getPerformanceReport,
  getEndpointStats,
} from './metrics';

export type {
  APIMetric,
  EndpointStats,
  PerformanceReport,
} from './metrics';

export { metricsStore as default } from './metrics';
