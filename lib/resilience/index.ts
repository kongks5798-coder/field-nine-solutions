/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 59: RESILIENCE MODULE
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export {
  CircuitBreaker,
  circuitBreakerRegistry,
  circuitBreakers,
  CircuitBreakerConfigs,
  CircuitBreakerError,
  TimeoutError,
  retry,
} from './circuit-breaker';

export type {
  CircuitState,
  CircuitBreakerConfig,
  CircuitBreakerStats,
  RetryConfig,
} from './circuit-breaker';

export { circuitBreakerRegistry as default } from './circuit-breaker';
