/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 62: A/B TESTING FRAMEWORK
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Statistical experimentation framework:
 * - Experiment management
 * - Variant assignment
 * - Metrics tracking
 * - Statistical significance calculation
 */

import { logger } from '../observability';
import { cache, CacheTTL } from '../cache';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: ExperimentVariant[];
  metrics: ExperimentMetric[];
  targetAudience?: AudienceRule[];
  trafficAllocation: number; // 0-100, percentage of traffic included
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  description?: string;
  weight: number; // 0-100, percentage of experiment traffic
  isControl: boolean;
  config?: Record<string, unknown>;
}

export interface ExperimentMetric {
  id: string;
  name: string;
  type: 'conversion' | 'revenue' | 'engagement' | 'custom';
  goal: 'increase' | 'decrease';
  minimumDetectableEffect?: number; // percentage
}

export interface AudienceRule {
  attribute: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'in';
  value: string | number | string[];
}

export interface ExperimentAssignment {
  experimentId: string;
  variantId: string;
  userId: string;
  assignedAt: Date;
}

export interface MetricEvent {
  experimentId: string;
  variantId: string;
  userId: string;
  metricId: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface VariantResults {
  variantId: string;
  variantName: string;
  participants: number;
  conversions: number;
  conversionRate: number;
  revenue?: number;
  avgRevenue?: number;
  confidence?: number;
  improvement?: number;
  isWinner?: boolean;
}

export interface ExperimentResults {
  experimentId: string;
  experimentName: string;
  status: string;
  totalParticipants: number;
  variants: VariantResults[];
  statisticalSignificance: boolean;
  recommendedWinner?: string;
  runningDays: number;
}

export interface UserContext {
  userId: string;
  sessionId?: string;
  attributes?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPERIMENT STORE
// ═══════════════════════════════════════════════════════════════════════════════

class ExperimentStore {
  private experiments: Map<string, Experiment> = new Map();
  private assignments: Map<string, ExperimentAssignment> = new Map(); // key: `${experimentId}:${userId}`
  private events: MetricEvent[] = [];
  private maxEvents: number = 10000;

  constructor() {
    this.initializeDefaultExperiments();
  }

  private initializeDefaultExperiments() {
    const now = new Date();
    const experiments: Experiment[] = [
      {
        id: 'exp_checkout_flow',
        name: 'Checkout Flow Optimization',
        description: 'Test simplified vs detailed checkout flow',
        status: 'running',
        variants: [
          { id: 'control', name: 'Control', weight: 50, isControl: true },
          { id: 'simplified', name: 'Simplified Flow', weight: 50, isControl: false, config: { steps: 2 } },
        ],
        metrics: [
          { id: 'conversion', name: 'Checkout Conversion', type: 'conversion', goal: 'increase' },
          { id: 'revenue', name: 'Average Order Value', type: 'revenue', goal: 'increase' },
        ],
        trafficAllocation: 100,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'exp_pricing_display',
        name: 'Pricing Display Test',
        description: 'Test different pricing display formats',
        status: 'running',
        variants: [
          { id: 'control', name: 'Original', weight: 34, isControl: true },
          { id: 'monthly', name: 'Monthly Price', weight: 33, isControl: false },
          { id: 'savings', name: 'Show Savings', weight: 33, isControl: false },
        ],
        metrics: [
          { id: 'clicks', name: 'CTA Clicks', type: 'engagement', goal: 'increase' },
          { id: 'signups', name: 'Sign Ups', type: 'conversion', goal: 'increase' },
        ],
        trafficAllocation: 50,
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'exp_onboarding',
        name: 'Onboarding Experience',
        description: 'Test new onboarding wizard',
        status: 'draft',
        variants: [
          { id: 'control', name: 'Current Flow', weight: 50, isControl: true },
          { id: 'wizard', name: 'Guided Wizard', weight: 50, isControl: false },
        ],
        metrics: [
          { id: 'completion', name: 'Onboarding Completion', type: 'conversion', goal: 'increase' },
          { id: 'time', name: 'Time to Complete', type: 'custom', goal: 'decrease' },
        ],
        trafficAllocation: 100,
        createdAt: now,
        updatedAt: now,
      },
    ];

    experiments.forEach((exp) => this.experiments.set(exp.id, exp));

    // Generate sample data for running experiments
    this.generateSampleData();
  }

  private generateSampleData() {
    const runningExperiments = Array.from(this.experiments.values()).filter(
      (e) => e.status === 'running'
    );

    runningExperiments.forEach((exp) => {
      // Generate sample assignments and events
      for (let i = 0; i < 100; i++) {
        const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
        const variant = this.selectVariant(exp.variants, userId, exp.id);

        // Record assignment
        const assignmentKey = `${exp.id}:${userId}`;
        this.assignments.set(assignmentKey, {
          experimentId: exp.id,
          variantId: variant.id,
          userId,
          assignedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        });

        // Record conversion event (with varying rates per variant)
        const baseRate = variant.isControl ? 0.1 : 0.12; // 10% control, 12% treatment
        if (Math.random() < baseRate) {
          this.events.push({
            experimentId: exp.id,
            variantId: variant.id,
            userId,
            metricId: exp.metrics[0].id,
            value: 1,
            timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          });
        }
      }
    });
  }

  private selectVariant(variants: ExperimentVariant[], userId: string, salt: string): ExperimentVariant {
    const hash = this.hashString(`${userId}:${salt}`);
    const bucket = hash % 100;

    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.weight;
      if (bucket < cumulative) {
        return variant;
      }
    }
    return variants[variants.length - 1];
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  getExperiment(id: string): Experiment | undefined {
    return this.experiments.get(id);
  }

  getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  setExperiment(experiment: Experiment): void {
    this.experiments.set(experiment.id, experiment);
  }

  deleteExperiment(id: string): boolean {
    return this.experiments.delete(id);
  }

  getAssignment(experimentId: string, userId: string): ExperimentAssignment | undefined {
    return this.assignments.get(`${experimentId}:${userId}`);
  }

  setAssignment(assignment: ExperimentAssignment): void {
    this.assignments.set(`${assignment.experimentId}:${assignment.userId}`, assignment);
  }

  getAssignmentsForExperiment(experimentId: string): ExperimentAssignment[] {
    return Array.from(this.assignments.values()).filter((a) => a.experimentId === experimentId);
  }

  recordEvent(event: MetricEvent): void {
    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }

  getEventsForExperiment(experimentId: string): MetricEvent[] {
    return this.events.filter((e) => e.experimentId === experimentId);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// A/B TESTING SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

class ABTestingService {
  private store: ExperimentStore;

  constructor() {
    this.store = new ExperimentStore();
  }

  /**
   * Get variant assignment for a user in an experiment
   */
  async getVariant(experimentId: string, context: UserContext): Promise<ExperimentVariant | null> {
    const experiment = this.store.getExperiment(experimentId);

    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    // Check if user is in target audience
    if (experiment.targetAudience && !this.matchesAudience(context, experiment.targetAudience)) {
      return null;
    }

    // Check traffic allocation
    const trafficBucket = this.getBucket(context.userId, `${experimentId}:traffic`);
    if (trafficBucket >= experiment.trafficAllocation) {
      return null;
    }

    // Check for existing assignment
    let assignment = this.store.getAssignment(experimentId, context.userId);

    if (!assignment) {
      // Assign variant
      const variant = this.assignVariant(experiment, context.userId);
      assignment = {
        experimentId,
        variantId: variant.id,
        userId: context.userId,
        assignedAt: new Date(),
      };
      this.store.setAssignment(assignment);

      logger.info('User assigned to experiment variant', {
        experimentId,
        variantId: variant.id,
        userId: context.userId,
      });
    }

    return experiment.variants.find((v) => v.id === assignment.variantId) || null;
  }

  /**
   * Track a metric event for an experiment
   */
  async trackEvent(
    experimentId: string,
    metricId: string,
    context: UserContext,
    value: number = 1,
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    const assignment = this.store.getAssignment(experimentId, context.userId);

    if (!assignment) {
      logger.warn('Cannot track event: user not assigned to experiment', {
        experimentId,
        userId: context.userId,
      });
      return false;
    }

    const event: MetricEvent = {
      experimentId,
      variantId: assignment.variantId,
      userId: context.userId,
      metricId,
      value,
      timestamp: new Date(),
      metadata,
    };

    this.store.recordEvent(event);

    logger.info('Experiment event tracked', {
      experimentId,
      metricId,
      variantId: assignment.variantId,
    });

    return true;
  }

  /**
   * Get experiment results with statistical analysis
   */
  getResults(experimentId: string): ExperimentResults | null {
    const experiment = this.store.getExperiment(experimentId);
    if (!experiment) return null;

    const assignments = this.store.getAssignmentsForExperiment(experimentId);
    const events = this.store.getEventsForExperiment(experimentId);

    const variantResults: VariantResults[] = experiment.variants.map((variant) => {
      const variantAssignments = assignments.filter((a) => a.variantId === variant.id);
      const variantEvents = events.filter((e) => e.variantId === variant.id);
      const conversions = variantEvents.filter((e) => e.value > 0).length;

      return {
        variantId: variant.id,
        variantName: variant.name,
        participants: variantAssignments.length,
        conversions,
        conversionRate: variantAssignments.length > 0 ? conversions / variantAssignments.length : 0,
      };
    });

    // Calculate statistical significance
    const control = variantResults.find((v) =>
      experiment.variants.find((ev) => ev.id === v.variantId)?.isControl
    );

    variantResults.forEach((v) => {
      if (control && v.variantId !== control.variantId) {
        v.improvement = control.conversionRate > 0
          ? ((v.conversionRate - control.conversionRate) / control.conversionRate) * 100
          : 0;
        v.confidence = this.calculateConfidence(control, v);
        v.isWinner = v.confidence >= 95 && v.improvement > 0;
      }
    });

    const winner = variantResults.find((v) => v.isWinner);
    const startDate = experiment.startDate || experiment.createdAt;
    const runningDays = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      experimentId: experiment.id,
      experimentName: experiment.name,
      status: experiment.status,
      totalParticipants: assignments.length,
      variants: variantResults,
      statisticalSignificance: variantResults.some((v) => v.confidence && v.confidence >= 95),
      recommendedWinner: winner?.variantId,
      runningDays,
    };
  }

  /**
   * Get all experiments
   */
  getAllExperiments(): Experiment[] {
    return this.store.getAllExperiments();
  }

  /**
   * Create a new experiment
   */
  createExperiment(experiment: Omit<Experiment, 'createdAt' | 'updatedAt'>): Experiment {
    const now = new Date();
    const newExperiment: Experiment = {
      ...experiment,
      createdAt: now,
      updatedAt: now,
    };
    this.store.setExperiment(newExperiment);
    logger.info('Experiment created', { experimentId: experiment.id });
    return newExperiment;
  }

  /**
   * Update experiment status
   */
  updateStatus(experimentId: string, status: Experiment['status']): Experiment | null {
    const experiment = this.store.getExperiment(experimentId);
    if (!experiment) return null;

    experiment.status = status;
    experiment.updatedAt = new Date();

    if (status === 'running' && !experiment.startDate) {
      experiment.startDate = new Date();
    }
    if (status === 'completed') {
      experiment.endDate = new Date();
    }

    this.store.setExperiment(experiment);
    logger.info('Experiment status updated', { experimentId, status });

    return experiment;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private assignVariant(experiment: Experiment, userId: string): ExperimentVariant {
    const bucket = this.getBucket(userId, experiment.id);
    let cumulative = 0;

    for (const variant of experiment.variants) {
      cumulative += variant.weight;
      if (bucket < cumulative) {
        return variant;
      }
    }

    return experiment.variants[experiment.variants.length - 1];
  }

  private getBucket(identifier: string, salt: string): number {
    const hash = this.hashString(`${identifier}:${salt}`);
    return hash % 100;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private matchesAudience(context: UserContext, rules: AudienceRule[]): boolean {
    return rules.every((rule) => {
      const value = context.attributes?.[rule.attribute];
      if (value === undefined) return false;

      switch (rule.operator) {
        case 'equals':
          return value === rule.value;
        case 'contains':
          return String(value).includes(String(rule.value));
        case 'gt':
          return Number(value) > Number(rule.value);
        case 'lt':
          return Number(value) < Number(rule.value);
        case 'in':
          return Array.isArray(rule.value) && rule.value.includes(String(value));
        default:
          return false;
      }
    });
  }

  private calculateConfidence(control: VariantResults, treatment: VariantResults): number {
    // Simplified statistical significance calculation
    // In production, use proper statistical libraries
    const n1 = control.participants;
    const n2 = treatment.participants;

    if (n1 < 30 || n2 < 30) return 0; // Need minimum sample size

    const p1 = control.conversionRate;
    const p2 = treatment.conversionRate;
    const pooledP = (control.conversions + treatment.conversions) / (n1 + n2);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));

    if (se === 0) return 0;

    const z = Math.abs(p2 - p1) / se;

    // Convert z-score to confidence level (simplified)
    if (z >= 2.576) return 99;
    if (z >= 1.96) return 95;
    if (z >= 1.645) return 90;
    if (z >= 1.28) return 80;
    return Math.min(70, Math.round(z * 30));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const abTesting = new ABTestingService();

export default abTesting;
