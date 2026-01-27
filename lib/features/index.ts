/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 62: FEATURE MANAGEMENT MODULE
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Feature Flags
export {
  featureFlags,
  isFeatureEnabled,
  useFeatureFlagContext,
} from './feature-flags';

export type {
  FeatureFlag,
  FeatureFlagRule,
  FeatureVariant,
  EvaluationContext,
  EvaluationResult,
  FeatureFlagStats,
} from './feature-flags';

// A/B Testing
export { abTesting } from './ab-testing';

export type {
  Experiment,
  ExperimentVariant,
  ExperimentMetric,
  AudienceRule,
  ExperimentAssignment,
  MetricEvent,
  VariantResults,
  ExperimentResults,
  UserContext,
} from './ab-testing';

// Default exports
export { featureFlags as default } from './feature-flags';
