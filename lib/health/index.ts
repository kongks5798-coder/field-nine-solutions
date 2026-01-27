/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 59: HEALTH MODULE
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export {
  healthChecker,
  DependencyChecks,
} from './health-checker';

export type {
  HealthStatus,
  HealthCheckResult,
  SystemHealthReport,
  HealthCheckConfig,
} from './health-checker';

export { healthChecker as default } from './health-checker';
