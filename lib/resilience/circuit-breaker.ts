/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 59: CIRCUIT BREAKER PATTERN
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Fault tolerance for external service calls:
 * - Circuit states: CLOSED, OPEN, HALF_OPEN
 * - Exponential backoff retry
 * - Fallback responses
 * - Health monitoring
 */

import { logger } from '../observability';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  successThreshold: number;
  requestTimeout: number;
  enabled: boolean;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure?: Date;
  lastSuccess?: Date;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  jitter: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CIRCUIT BREAKER
// ═══════════════════════════════════════════════════════════════════════════════

class CircuitBreaker {
  private name: string;
  private config: CircuitBreakerConfig;
  private state: CircuitState = 'CLOSED';
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      resetTimeout: config.resetTimeout ?? 30000,
      successThreshold: config.successThreshold ?? 2,
      requestTimeout: config.requestTimeout ?? 10000,
      enabled: config.enabled ?? true,
    };
  }

  async execute<T>(operation: () => Promise<T>, fallback?: () => T | Promise<T>): Promise<T> {
    if (!this.config.enabled) return operation();

    this.totalRequests++;

    if (this.state === 'OPEN') {
      if (this.lastFailureTime && Date.now() - this.lastFailureTime >= this.config.resetTimeout) {
        this.transitionTo('HALF_OPEN');
      } else {
        logger.warn(`Circuit breaker OPEN for ${this.name}`, { state: this.state });
        if (fallback) return fallback();
        throw new CircuitBreakerError(`Circuit breaker is OPEN for ${this.name}`);
      }
    }

    try {
      const result = await this.executeWithTimeout(operation);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      if (fallback) return fallback();
      throw error;
    }
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new TimeoutError(`Operation timed out after ${this.config.requestTimeout}ms`));
      }, this.config.requestTimeout);

      operation()
        .then((result) => { clearTimeout(timeoutId); resolve(result); })
        .catch((error) => { clearTimeout(timeoutId); reject(error); });
    });
  }

  private onSuccess(): void {
    this.lastSuccessTime = Date.now();
    this.successes++;
    this.totalSuccesses++;
    this.failures = 0;

    if (this.state === 'HALF_OPEN' && this.successes >= this.config.successThreshold) {
      this.transitionTo('CLOSED');
    }
  }

  private onFailure(error: unknown): void {
    this.lastFailureTime = Date.now();
    this.failures++;
    this.totalFailures++;
    this.successes = 0;

    logger.error(`Circuit breaker failure for ${this.name}`, error as Error, {
      failures: this.failures,
      threshold: this.config.failureThreshold,
    });

    if (this.state === 'HALF_OPEN') {
      this.transitionTo('OPEN');
    } else if (this.failures >= this.config.failureThreshold) {
      this.transitionTo('OPEN');
    }
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    logger.info(`Circuit breaker ${this.name} state change`, { from: oldState, to: newState });
    if (newState === 'CLOSED') { this.failures = 0; this.successes = 0; }
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailureTime ? new Date(this.lastFailureTime) : undefined,
      lastSuccess: this.lastSuccessTime ? new Date(this.lastSuccessTime) : undefined,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    logger.info(`Circuit breaker ${this.name} manually reset`);
  }

  trip(): void {
    this.transitionTo('OPEN');
    this.lastFailureTime = Date.now();
  }

  isAllowed(): boolean {
    if (!this.config.enabled) return true;
    if (this.state === 'CLOSED') return true;
    if (this.state === 'HALF_OPEN') return true;
    if (this.state === 'OPEN' && this.lastFailureTime) {
      return Date.now() - this.lastFailureTime >= this.config.resetTimeout;
    }
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RETRY UTILITY
// ═══════════════════════════════════════════════════════════════════════════════

export async function retry<T>(operation: () => Promise<T>, config: Partial<RetryConfig> = {}): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 30000, jitter = true } = config;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxRetries) break;

      let delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      if (jitter) delay = delay * (0.5 + Math.random());

      logger.info(`Retry attempt ${attempt + 1}/${maxRetries}`, { delay, error: lastError.message });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERRORS
// ═══════════════════════════════════════════════════════════════════════════════

export class CircuitBreakerError extends Error {
  constructor(message: string) { super(message); this.name = 'CircuitBreakerError'; }
}

export class TimeoutError extends Error {
  constructor(message: string) { super(message); this.name = 'TimeoutError'; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  get(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    let breaker = this.breakers.get(name);
    if (!breaker) {
      breaker = new CircuitBreaker(name, config);
      this.breakers.set(name, breaker);
    }
    return breaker;
  }

  getAll(): Map<string, CircuitBreaker> { return this.breakers; }

  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    for (const [name, breaker] of this.breakers) stats[name] = breaker.getStats();
    return stats;
  }

  resetAll(): void {
    for (const breaker of this.breakers.values()) breaker.reset();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGS & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const CircuitBreakerConfigs = {
  externalApi: { failureThreshold: 5, resetTimeout: 30000, successThreshold: 2, requestTimeout: 10000, enabled: true },
  database: { failureThreshold: 3, resetTimeout: 10000, successThreshold: 1, requestTimeout: 5000, enabled: true },
  thirdParty: { failureThreshold: 5, resetTimeout: 60000, successThreshold: 3, requestTimeout: 15000, enabled: true },
  blockchain: { failureThreshold: 3, resetTimeout: 45000, successThreshold: 2, requestTimeout: 30000, enabled: true },
  realtime: { failureThreshold: 10, resetTimeout: 5000, successThreshold: 1, requestTimeout: 2000, enabled: true },
};

export const circuitBreakerRegistry = new CircuitBreakerRegistry();

export const circuitBreakers = {
  stripe: circuitBreakerRegistry.get('stripe', CircuitBreakerConfigs.externalApi),
  supabase: circuitBreakerRegistry.get('supabase', CircuitBreakerConfigs.database),
  alchemy: circuitBreakerRegistry.get('alchemy', CircuitBreakerConfigs.blockchain),
  email: circuitBreakerRegistry.get('email', CircuitBreakerConfigs.thirdParty),
  sms: circuitBreakerRegistry.get('sms', CircuitBreakerConfigs.thirdParty),
  priceOracle: circuitBreakerRegistry.get('priceOracle', CircuitBreakerConfigs.realtime),
};

export { CircuitBreaker };
export default circuitBreakerRegistry;
