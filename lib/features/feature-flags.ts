/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 62: FEATURE FLAGS SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Enterprise-grade feature flag system with:
 * - Gradual rollouts
 * - User segmentation
 * - A/B testing integration
 * - Analytics tracking
 */

import { logger } from '../observability';
import { cache, CacheTTL } from '../cache';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  rules?: FeatureFlagRule[];
  variants?: FeatureVariant[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureFlagRule {
  id: string;
  type: 'user' | 'segment' | 'attribute' | 'environment';
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'in' | 'not_in';
  attribute: string;
  value: string | number | string[];
  enabled: boolean;
}

export interface FeatureVariant {
  key: string;
  name: string;
  weight: number; // 0-100, must sum to 100 across variants
  payload?: Record<string, unknown>;
}

export interface EvaluationContext {
  userId?: string;
  sessionId?: string;
  userAttributes?: Record<string, unknown>;
  environment?: string;
}

export interface EvaluationResult {
  enabled: boolean;
  variant?: string;
  payload?: Record<string, unknown>;
  reason: string;
}

export interface FeatureFlagStats {
  evaluations: number;
  enabled: number;
  disabled: number;
  variantDistribution: Record<string, number>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE FLAG STORE
// ═══════════════════════════════════════════════════════════════════════════════

class FeatureFlagStore {
  private flags: Map<string, FeatureFlag> = new Map();
  private stats: Map<string, FeatureFlagStats> = new Map();

  constructor() {
    // Initialize with default flags
    this.initializeDefaultFlags();
  }

  private initializeDefaultFlags() {
    const defaultFlags: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>[] = [
      {
        key: 'new_dashboard',
        name: 'New Dashboard UI',
        description: 'Enable the redesigned dashboard interface',
        enabled: true,
        rolloutPercentage: 100,
      },
      {
        key: 'dark_mode',
        name: 'Dark Mode',
        description: 'Enable dark mode theme option',
        enabled: true,
        rolloutPercentage: 100,
      },
      {
        key: 'ai_insights',
        name: 'AI Insights',
        description: 'Show AI-powered insights on dashboard',
        enabled: true,
        rolloutPercentage: 50,
      },
      {
        key: 'beta_features',
        name: 'Beta Features',
        description: 'Enable beta features for early adopters',
        enabled: false,
        rolloutPercentage: 10,
      },
      {
        key: 'advanced_analytics',
        name: 'Advanced Analytics',
        description: 'Enable advanced analytics dashboard',
        enabled: true,
        rolloutPercentage: 30,
      },
      {
        key: 'nft_marketplace_v2',
        name: 'NFT Marketplace V2',
        description: 'Enable new NFT marketplace experience',
        enabled: true,
        rolloutPercentage: 20,
      },
      {
        key: 'payment_retry',
        name: 'Payment Auto-Retry',
        description: 'Automatically retry failed payments',
        enabled: true,
        rolloutPercentage: 100,
      },
      {
        key: 'webhook_v2',
        name: 'Webhook API V2',
        description: 'Enable new webhook payload format',
        enabled: false,
        rolloutPercentage: 0,
      },
    ];

    const now = new Date();
    defaultFlags.forEach((flag) => {
      this.flags.set(flag.key, {
        ...flag,
        createdAt: now,
        updatedAt: now,
      });
      this.stats.set(flag.key, {
        evaluations: 0,
        enabled: 0,
        disabled: 0,
        variantDistribution: {},
      });
    });
  }

  get(key: string): FeatureFlag | undefined {
    return this.flags.get(key);
  }

  getAll(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  set(flag: FeatureFlag): void {
    this.flags.set(flag.key, flag);
    if (!this.stats.has(flag.key)) {
      this.stats.set(flag.key, {
        evaluations: 0,
        enabled: 0,
        disabled: 0,
        variantDistribution: {},
      });
    }
  }

  delete(key: string): boolean {
    this.stats.delete(key);
    return this.flags.delete(key);
  }

  recordEvaluation(key: string, enabled: boolean, variant?: string): void {
    const stats = this.stats.get(key);
    if (stats) {
      stats.evaluations++;
      if (enabled) {
        stats.enabled++;
      } else {
        stats.disabled++;
      }
      if (variant) {
        stats.variantDistribution[variant] = (stats.variantDistribution[variant] || 0) + 1;
      }
    }
  }

  getStats(key: string): FeatureFlagStats | undefined {
    return this.stats.get(key);
  }

  getAllStats(): Record<string, FeatureFlagStats> {
    const result: Record<string, FeatureFlagStats> = {};
    this.stats.forEach((stats, key) => {
      result[key] = stats;
    });
    return result;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE FLAG SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

class FeatureFlagService {
  private store: FeatureFlagStore;

  constructor() {
    this.store = new FeatureFlagStore();
  }

  /**
   * Evaluate a feature flag for a given context
   */
  async evaluate(key: string, context: EvaluationContext = {}): Promise<EvaluationResult> {
    // Try cache first
    const cacheKey = `ff:${key}:${context.userId || 'anon'}`;
    const cached = await cache.get<EvaluationResult>(cacheKey);
    if (cached) {
      return cached;
    }

    const flag = this.store.get(key);

    if (!flag) {
      logger.warn('Feature flag not found', { key });
      return { enabled: false, reason: 'flag_not_found' };
    }

    // Check if globally disabled
    if (!flag.enabled) {
      this.store.recordEvaluation(key, false);
      return { enabled: false, reason: 'globally_disabled' };
    }

    // Check rules
    if (flag.rules && flag.rules.length > 0) {
      const ruleResult = this.evaluateRules(flag.rules, context);
      if (ruleResult !== null) {
        this.store.recordEvaluation(key, ruleResult);
        const result = { enabled: ruleResult, reason: 'rule_match' };
        await cache.set(cacheKey, result, { ttl: CacheTTL.SHORT });
        return result;
      }
    }

    // Check rollout percentage
    const bucket = this.getBucket(context.userId || context.sessionId || 'default', key);
    const enabled = bucket < flag.rolloutPercentage;

    // Determine variant if applicable
    let variant: string | undefined;
    let payload: Record<string, unknown> | undefined;

    if (enabled && flag.variants && flag.variants.length > 0) {
      const variantResult = this.selectVariant(flag.variants, bucket);
      variant = variantResult?.key;
      payload = variantResult?.payload;
    }

    this.store.recordEvaluation(key, enabled, variant);

    const result: EvaluationResult = {
      enabled,
      variant,
      payload,
      reason: enabled ? 'rollout_match' : 'rollout_excluded',
    };

    await cache.set(cacheKey, result, { ttl: CacheTTL.SHORT });
    return result;
  }

  /**
   * Simple boolean check for a feature flag
   */
  async isEnabled(key: string, context: EvaluationContext = {}): Promise<boolean> {
    const result = await this.evaluate(key, context);
    return result.enabled;
  }

  /**
   * Get a feature flag configuration
   */
  getFlag(key: string): FeatureFlag | undefined {
    return this.store.get(key);
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlag[] {
    return this.store.getAll();
  }

  /**
   * Create or update a feature flag
   */
  setFlag(flag: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>): FeatureFlag {
    const existing = this.store.get(flag.key);
    const now = new Date();

    const updatedFlag: FeatureFlag = {
      ...flag,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    this.store.set(updatedFlag);
    logger.info('Feature flag updated', { key: flag.key, enabled: flag.enabled });

    // Invalidate cache
    cache.invalidatePattern(`ff:${flag.key}:*`);

    return updatedFlag;
  }

  /**
   * Delete a feature flag
   */
  deleteFlag(key: string): boolean {
    const deleted = this.store.delete(key);
    if (deleted) {
      logger.info('Feature flag deleted', { key });
      cache.invalidatePattern(`ff:${key}:*`);
    }
    return deleted;
  }

  /**
   * Toggle a feature flag on/off
   */
  toggleFlag(key: string): FeatureFlag | null {
    const flag = this.store.get(key);
    if (!flag) return null;

    flag.enabled = !flag.enabled;
    flag.updatedAt = new Date();
    this.store.set(flag);

    logger.info('Feature flag toggled', { key, enabled: flag.enabled });
    cache.invalidatePattern(`ff:${key}:*`);

    return flag;
  }

  /**
   * Update rollout percentage
   */
  setRollout(key: string, percentage: number): FeatureFlag | null {
    const flag = this.store.get(key);
    if (!flag) return null;

    flag.rolloutPercentage = Math.max(0, Math.min(100, percentage));
    flag.updatedAt = new Date();
    this.store.set(flag);

    logger.info('Feature flag rollout updated', { key, rolloutPercentage: flag.rolloutPercentage });
    cache.invalidatePattern(`ff:${key}:*`);

    return flag;
  }

  /**
   * Get statistics for a feature flag
   */
  getStats(key: string): FeatureFlagStats | undefined {
    return this.store.getStats(key);
  }

  /**
   * Get statistics for all feature flags
   */
  getAllStats(): Record<string, FeatureFlagStats> {
    return this.store.getAllStats();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private evaluateRules(rules: FeatureFlagRule[], context: EvaluationContext): boolean | null {
    for (const rule of rules) {
      if (!rule.enabled) continue;

      const result = this.evaluateRule(rule, context);
      if (result !== null) {
        return result;
      }
    }
    return null;
  }

  private evaluateRule(rule: FeatureFlagRule, context: EvaluationContext): boolean | null {
    let attributeValue: unknown;

    switch (rule.type) {
      case 'user':
        attributeValue = context.userId;
        break;
      case 'environment':
        attributeValue = context.environment || process.env.NODE_ENV;
        break;
      case 'attribute':
        attributeValue = context.userAttributes?.[rule.attribute];
        break;
      default:
        return null;
    }

    if (attributeValue === undefined) return null;

    switch (rule.operator) {
      case 'equals':
        return attributeValue === rule.value;
      case 'contains':
        return String(attributeValue).includes(String(rule.value));
      case 'gt':
        return Number(attributeValue) > Number(rule.value);
      case 'lt':
        return Number(attributeValue) < Number(rule.value);
      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(String(attributeValue));
      case 'not_in':
        return Array.isArray(rule.value) && !rule.value.includes(String(attributeValue));
      default:
        return null;
    }
  }

  private getBucket(identifier: string, salt: string): number {
    // Simple hash function for deterministic bucketing
    const hash = this.hashString(`${identifier}:${salt}`);
    return hash % 100;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private selectVariant(variants: FeatureVariant[], bucket: number): FeatureVariant | undefined {
    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.weight;
      if (bucket < cumulative) {
        return variant;
      }
    }
    return variants[variants.length - 1];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const featureFlags = new FeatureFlagService();

// Helper function for simple checks
export async function isFeatureEnabled(key: string, context?: EvaluationContext): Promise<boolean> {
  return featureFlags.isEnabled(key, context);
}

// React hook helper (for client components)
export function useFeatureFlagContext(userId?: string): EvaluationContext {
  return {
    userId,
    environment: process.env.NODE_ENV,
  };
}

export default featureFlags;
