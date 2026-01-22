/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║                                                                       ║
 * ║     FIELD NINE - QUARANTINE PROTECTION SYSTEM                         ║
 * ║     Multi-Layer Security for Energy Trading                           ║
 * ║                                                                       ║
 * ║     Protects against:                                                 ║
 * ║       - Double-spending / replay attacks                              ║
 * ║       - Fraudulent attestations                                       ║
 * ║       - Market manipulation                                           ║
 * ║       - Anomalous trading patterns                                    ║
 * ║       - API abuse / DDoS                                              ║
 * ║                                                                       ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */

import { keccak256, encodePacked } from './crypto-utils';

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface QuarantineEvent {
  eventId: string;
  timestamp: number;
  type: QuarantineEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: {
    entityType: 'node' | 'user' | 'api_key' | 'ip_address' | 'transaction';
    entityId: string;
  };
  details: Record<string, unknown>;
  action: QuarantineAction;
  status: 'active' | 'resolved' | 'false_positive';
  expiresAt?: number;
}

export type QuarantineEventType =
  | 'double_spend_attempt'
  | 'replay_attack'
  | 'fraudulent_attestation'
  | 'anomalous_volume'
  | 'price_manipulation'
  | 'rate_limit_exceeded'
  | 'invalid_proof'
  | 'unauthorized_access'
  | 'suspicious_pattern'
  | 'compliance_violation';

export type QuarantineAction =
  | 'block'
  | 'throttle'
  | 'flag_for_review'
  | 'require_verification'
  | 'temporary_suspend'
  | 'permanent_ban'
  | 'alert_only';

export interface ThreatScore {
  entityId: string;
  score: number;              // 0-100 (higher = more suspicious)
  factors: ThreatFactor[];
  lastUpdated: number;
  history: ThreatHistoryEntry[];
}

export interface ThreatFactor {
  factor: string;
  weight: number;
  value: number;
  description: string;
}

export interface ThreatHistoryEntry {
  timestamp: number;
  score: number;
  event?: string;
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  confidence: number;
  anomalyType?: string;
  explanation: string;
  recommendedAction: QuarantineAction;
}

export interface RateLimitRule {
  ruleId: string;
  endpoint: string;
  windowMs: number;
  maxRequests: number;
  penaltyMs: number;
  bypassTiers: string[];
}

export interface QuarantineStats {
  totalEvents: number;
  activeQuarantines: number;
  blockedTransactions: number;
  resolvedEvents: number;
  falsePositives: number;
  threatScoreAverage: number;
  topThreats: Array<{
    entityId: string;
    score: number;
    eventCount: number;
  }>;
}

// ============================================================
// PROTECTION RULES
// ============================================================

const RATE_LIMIT_RULES: RateLimitRule[] = [
  {
    ruleId: 'verify-standard',
    endpoint: '/api/epo/verify',
    windowMs: 60000,          // 1 minute
    maxRequests: 100,
    penaltyMs: 300000,        // 5 minute penalty
    bypassTiers: ['enterprise', 'sovereign'],
  },
  {
    ruleId: 'swap-standard',
    endpoint: '/api/epo/swap',
    windowMs: 60000,
    maxRequests: 20,
    penaltyMs: 600000,        // 10 minute penalty
    bypassTiers: ['enterprise', 'sovereign'],
  },
  {
    ruleId: 'attest-standard',
    endpoint: '/api/epo/attest',
    windowMs: 60000,
    maxRequests: 10,
    penaltyMs: 900000,        // 15 minute penalty
    bypassTiers: ['sovereign'],
  },
  {
    ruleId: 'global-burst',
    endpoint: '*',
    windowMs: 1000,           // 1 second
    maxRequests: 50,
    penaltyMs: 60000,         // 1 minute penalty
    bypassTiers: [],
  },
];

const ANOMALY_THRESHOLDS = {
  volumeSpike: 5,             // 5x normal volume
  priceDeviation: 0.1,        // 10% price deviation
  frequencySpike: 10,         // 10x normal frequency
  geographicAnomaly: 2,       // 2 different continents in 1 hour
  patternScore: 0.8,          // Pattern similarity > 80%
};

const THREAT_WEIGHTS = {
  double_spend_attempt: 50,
  replay_attack: 40,
  fraudulent_attestation: 60,
  anomalous_volume: 20,
  price_manipulation: 35,
  rate_limit_exceeded: 10,
  invalid_proof: 30,
  unauthorized_access: 45,
  suspicious_pattern: 25,
  compliance_violation: 40,
};

// ============================================================
// QUARANTINE PROTECTION ENGINE
// ============================================================

export class QuarantineProtection {
  private static instance: QuarantineProtection;

  // Storage
  private quarantineEvents: Map<string, QuarantineEvent> = new Map();
  private threatScores: Map<string, ThreatScore> = new Map();
  private rateLimitCounters: Map<string, { count: number; windowStart: number }> = new Map();
  private usedNonces: Set<string> = new Set();
  private blockedEntities: Map<string, { blockedAt: number; expiresAt: number; reason: string }> = new Map();

  // Statistics
  private stats = {
    totalEvents: 0,
    blockedTransactions: 0,
    resolvedEvents: 0,
    falsePositives: 0,
  };

  private constructor() {
    this.initializeProtection();
  }

  static getInstance(): QuarantineProtection {
    if (!QuarantineProtection.instance) {
      QuarantineProtection.instance = new QuarantineProtection();
    }
    return QuarantineProtection.instance;
  }

  private initializeProtection(): void {
    // Clean up expired blocks periodically
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanupExpiredBlocks(), 60000);
    }
    console.log('[Quarantine] Protection system initialized');
  }

  // ============================================================
  // DOUBLE-SPEND PROTECTION
  // ============================================================

  /**
   * Check for double-spend attempt
   */
  checkDoubleSpend(
    watermarkId: string,
    transactionId: string
  ): { safe: boolean; event?: QuarantineEvent } {
    const nonceKey = `${watermarkId}:${transactionId}`;

    if (this.usedNonces.has(nonceKey)) {
      const event = this.createQuarantineEvent(
        'double_spend_attempt',
        'critical',
        { entityType: 'transaction', entityId: transactionId },
        { watermarkId, attemptedReuse: true },
        'block'
      );

      return { safe: false, event };
    }

    // Add to used nonces
    this.usedNonces.add(nonceKey);

    // Clean old nonces (keep last 1M)
    if (this.usedNonces.size > 1000000) {
      const toDelete = Array.from(this.usedNonces).slice(0, 100000);
      toDelete.forEach(n => this.usedNonces.delete(n));
    }

    return { safe: true };
  }

  /**
   * Verify transaction nonce hasn't been used
   */
  verifyNonce(nonce: string, entityId: string): boolean {
    const nonceHash = keccak256(encodePacked(['string', 'string'], [nonce, entityId]));

    if (this.usedNonces.has(nonceHash)) {
      this.createQuarantineEvent(
        'replay_attack',
        'high',
        { entityType: 'user', entityId },
        { nonce, attemptedReplay: true },
        'block'
      );
      return false;
    }

    this.usedNonces.add(nonceHash);
    return true;
  }

  // ============================================================
  // RATE LIMITING
  // ============================================================

  /**
   * Check rate limit for an entity
   */
  checkRateLimit(
    entityId: string,
    endpoint: string,
    tier: string = 'standard'
  ): { allowed: boolean; retryAfter?: number; event?: QuarantineEvent } {
    // Find applicable rule
    const rule = RATE_LIMIT_RULES.find(r =>
      (r.endpoint === endpoint || r.endpoint === '*') &&
      !r.bypassTiers.includes(tier)
    );

    if (!rule) {
      return { allowed: true };
    }

    const counterKey = `${entityId}:${rule.ruleId}`;
    const now = Date.now();

    let counter = this.rateLimitCounters.get(counterKey);

    // Reset window if expired
    if (!counter || now - counter.windowStart >= rule.windowMs) {
      counter = { count: 0, windowStart: now };
    }

    counter.count++;
    this.rateLimitCounters.set(counterKey, counter);

    if (counter.count > rule.maxRequests) {
      const event = this.createQuarantineEvent(
        'rate_limit_exceeded',
        'medium',
        { entityType: 'api_key', entityId },
        { endpoint, requestCount: counter.count, limit: rule.maxRequests },
        'throttle'
      );

      return {
        allowed: false,
        retryAfter: rule.penaltyMs,
        event,
      };
    }

    return { allowed: true };
  }

  // ============================================================
  // ANOMALY DETECTION
  // ============================================================

  /**
   * Detect anomalous trading volume
   */
  detectVolumeAnomaly(
    entityId: string,
    currentVolume: number,
    historicalAverage: number
  ): AnomalyDetectionResult {
    const ratio = currentVolume / (historicalAverage || 1);

    if (ratio > ANOMALY_THRESHOLDS.volumeSpike) {
      this.createQuarantineEvent(
        'anomalous_volume',
        ratio > 10 ? 'high' : 'medium',
        { entityType: 'user', entityId },
        { currentVolume, historicalAverage, ratio },
        'flag_for_review'
      );

      return {
        isAnomaly: true,
        confidence: Math.min(0.99, (ratio - ANOMALY_THRESHOLDS.volumeSpike) / 10),
        anomalyType: 'volume_spike',
        explanation: `Trading volume is ${ratio.toFixed(1)}x higher than historical average`,
        recommendedAction: ratio > 10 ? 'temporary_suspend' : 'flag_for_review',
      };
    }

    return {
      isAnomaly: false,
      confidence: 0,
      explanation: 'Volume within normal range',
      recommendedAction: 'alert_only',
    };
  }

  /**
   * Detect price manipulation attempts
   */
  detectPriceManipulation(
    swapRate: number,
    marketRate: number,
    volume: number
  ): AnomalyDetectionResult {
    const deviation = Math.abs(swapRate - marketRate) / marketRate;

    if (deviation > ANOMALY_THRESHOLDS.priceDeviation && volume > 10000) {
      this.createQuarantineEvent(
        'price_manipulation',
        deviation > 0.2 ? 'critical' : 'high',
        { entityType: 'transaction', entityId: `SWAP-${Date.now()}` },
        { swapRate, marketRate, deviation, volume },
        'block'
      );

      return {
        isAnomaly: true,
        confidence: Math.min(0.99, deviation / 0.3),
        anomalyType: 'price_manipulation',
        explanation: `Swap rate deviates ${(deviation * 100).toFixed(1)}% from market rate`,
        recommendedAction: 'block',
      };
    }

    return {
      isAnomaly: false,
      confidence: 0,
      explanation: 'Price within acceptable range',
      recommendedAction: 'alert_only',
    };
  }

  /**
   * Detect fraudulent attestation
   */
  validateAttestation(
    nodeId: string,
    kwhClaimed: number,
    nodeCapacity: number,
    timeWindowHours: number
  ): AnomalyDetectionResult {
    // Maximum possible production = capacity * hours
    const maxPossible = nodeCapacity * timeWindowHours;

    // Allow 10% buffer for measurement variance
    if (kwhClaimed > maxPossible * 1.1) {
      this.createQuarantineEvent(
        'fraudulent_attestation',
        'critical',
        { entityType: 'node', entityId: nodeId },
        { kwhClaimed, maxPossible, timeWindowHours },
        'block'
      );

      return {
        isAnomaly: true,
        confidence: 0.95,
        anomalyType: 'over_attestation',
        explanation: `Claimed ${kwhClaimed} kWh exceeds maximum possible ${maxPossible} kWh`,
        recommendedAction: 'block',
      };
    }

    return {
      isAnomaly: false,
      confidence: 0,
      explanation: 'Attestation within valid range',
      recommendedAction: 'alert_only',
    };
  }

  // ============================================================
  // THREAT SCORING
  // ============================================================

  /**
   * Calculate threat score for an entity
   */
  calculateThreatScore(entityId: string): ThreatScore {
    let existing = this.threatScores.get(entityId);

    if (!existing) {
      existing = {
        entityId,
        score: 0,
        factors: [],
        lastUpdated: Date.now(),
        history: [],
      };
    }

    // Get all events for this entity
    const entityEvents = Array.from(this.quarantineEvents.values())
      .filter(e => e.source.entityId === entityId && e.status === 'active');

    // Calculate score based on events
    const factors: ThreatFactor[] = [];
    let totalScore = 0;

    for (const event of entityEvents) {
      const weight = THREAT_WEIGHTS[event.type] || 10;
      const severityMultiplier = {
        low: 0.5,
        medium: 1,
        high: 1.5,
        critical: 2,
      }[event.severity];

      const factorScore = weight * severityMultiplier;
      totalScore += factorScore;

      factors.push({
        factor: event.type,
        weight,
        value: factorScore,
        description: `${event.type} (${event.severity})`,
      });
    }

    // Decay old history entries
    const now = Date.now();
    const decayedHistory = existing.history
      .filter(h => now - h.timestamp < 7 * 24 * 60 * 60 * 1000) // Keep 7 days
      .map(h => ({
        ...h,
        score: h.score * Math.exp(-(now - h.timestamp) / (24 * 60 * 60 * 1000)), // Exponential decay
      }));

    // Add current score to history
    decayedHistory.push({ timestamp: now, score: totalScore });

    // Final score is capped at 100
    const finalScore = Math.min(100, totalScore + decayedHistory.reduce((s, h) => s + h.score * 0.1, 0));

    const threatScore: ThreatScore = {
      entityId,
      score: Math.round(finalScore * 100) / 100,
      factors,
      lastUpdated: now,
      history: decayedHistory.slice(-100), // Keep last 100 entries
    };

    this.threatScores.set(entityId, threatScore);
    return threatScore;
  }

  /**
   * Check if entity is blocked
   */
  isBlocked(entityId: string): { blocked: boolean; reason?: string; expiresAt?: number } {
    const block = this.blockedEntities.get(entityId);

    if (!block) {
      return { blocked: false };
    }

    if (Date.now() > block.expiresAt) {
      this.blockedEntities.delete(entityId);
      return { blocked: false };
    }

    return {
      blocked: true,
      reason: block.reason,
      expiresAt: block.expiresAt,
    };
  }

  /**
   * Block an entity
   */
  blockEntity(entityId: string, reason: string, durationMs: number): void {
    this.blockedEntities.set(entityId, {
      blockedAt: Date.now(),
      expiresAt: Date.now() + durationMs,
      reason,
    });
  }

  // ============================================================
  // QUARANTINE EVENT MANAGEMENT
  // ============================================================

  /**
   * Create a quarantine event
   */
  private createQuarantineEvent(
    type: QuarantineEventType,
    severity: QuarantineEvent['severity'],
    source: QuarantineEvent['source'],
    details: Record<string, unknown>,
    action: QuarantineAction
  ): QuarantineEvent {
    const eventId = `QE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const event: QuarantineEvent = {
      eventId,
      timestamp: Date.now(),
      type,
      severity,
      source,
      details,
      action,
      status: 'active',
    };

    // Auto-expire based on severity
    const expiryMs = {
      low: 24 * 60 * 60 * 1000,      // 1 day
      medium: 7 * 24 * 60 * 60 * 1000, // 1 week
      high: 30 * 24 * 60 * 60 * 1000,  // 1 month
      critical: 365 * 24 * 60 * 60 * 1000, // 1 year
    }[severity];

    event.expiresAt = Date.now() + expiryMs;

    this.quarantineEvents.set(eventId, event);
    this.stats.totalEvents++;

    // Auto-block for critical events
    if (severity === 'critical') {
      this.blockEntity(source.entityId, `Critical event: ${type}`, 24 * 60 * 60 * 1000);
      this.stats.blockedTransactions++;
    }

    // Update threat score
    this.calculateThreatScore(source.entityId);

    return event;
  }

  /**
   * Resolve a quarantine event
   */
  resolveEvent(eventId: string, resolution: 'resolved' | 'false_positive'): boolean {
    const event = this.quarantineEvents.get(eventId);

    if (!event) {
      return false;
    }

    event.status = resolution;

    if (resolution === 'resolved') {
      this.stats.resolvedEvents++;
    } else {
      this.stats.falsePositives++;
    }

    // Recalculate threat score
    this.calculateThreatScore(event.source.entityId);

    return true;
  }

  /**
   * Clean up expired blocks
   */
  private cleanupExpiredBlocks(): void {
    const now = Date.now();

    for (const [entityId, block] of this.blockedEntities) {
      if (now > block.expiresAt) {
        this.blockedEntities.delete(entityId);
      }
    }

    for (const [eventId, event] of this.quarantineEvents) {
      if (event.expiresAt && now > event.expiresAt && event.status === 'active') {
        event.status = 'resolved';
        this.stats.resolvedEvents++;
      }
    }
  }

  // ============================================================
  // COMPREHENSIVE TRANSACTION VALIDATION
  // ============================================================

  /**
   * Validate a transaction through all protection layers
   */
  async validateTransaction(params: {
    entityId: string;
    transactionId: string;
    transactionType: 'verify' | 'swap' | 'attest';
    watermarkId?: string;
    volume?: number;
    swapRate?: number;
    marketRate?: number;
    nodeId?: string;
    nodeCapacity?: number;
    timeWindowHours?: number;
    apiKey: string;
    tier?: string;
  }): Promise<{
    allowed: boolean;
    reason?: string;
    threatScore: number;
    warnings: string[];
    events: QuarantineEvent[];
  }> {
    const warnings: string[] = [];
    const events: QuarantineEvent[] = [];

    // 1. Check if entity is blocked
    const blockCheck = this.isBlocked(params.entityId);
    if (blockCheck.blocked) {
      return {
        allowed: false,
        reason: `Entity blocked: ${blockCheck.reason}`,
        threatScore: 100,
        warnings,
        events,
      };
    }

    // 2. Check rate limit
    const rateCheck = this.checkRateLimit(
      params.apiKey,
      `/api/epo/${params.transactionType}`,
      params.tier
    );
    if (!rateCheck.allowed) {
      if (rateCheck.event) events.push(rateCheck.event);
      return {
        allowed: false,
        reason: `Rate limit exceeded. Retry after ${rateCheck.retryAfter}ms`,
        threatScore: this.calculateThreatScore(params.entityId).score,
        warnings,
        events,
      };
    }

    // 3. Check double-spend (for verify/swap)
    if (params.watermarkId && params.transactionType !== 'attest') {
      const doubleSpendCheck = this.checkDoubleSpend(params.watermarkId, params.transactionId);
      if (!doubleSpendCheck.safe) {
        if (doubleSpendCheck.event) events.push(doubleSpendCheck.event);
        return {
          allowed: false,
          reason: 'Double-spend attempt detected',
          threatScore: 100,
          warnings,
          events,
        };
      }
    }

    // 4. Check for price manipulation (for swaps)
    if (params.transactionType === 'swap' && params.swapRate && params.marketRate) {
      const priceCheck = this.detectPriceManipulation(
        params.swapRate,
        params.marketRate,
        params.volume || 0
      );
      if (priceCheck.isAnomaly && priceCheck.recommendedAction === 'block') {
        return {
          allowed: false,
          reason: priceCheck.explanation,
          threatScore: this.calculateThreatScore(params.entityId).score,
          warnings,
          events,
        };
      }
      if (priceCheck.isAnomaly) {
        warnings.push(priceCheck.explanation);
      }
    }

    // 5. Validate attestation (for attest)
    if (params.transactionType === 'attest' && params.nodeId && params.nodeCapacity) {
      const attestCheck = this.validateAttestation(
        params.nodeId,
        params.volume || 0,
        params.nodeCapacity,
        params.timeWindowHours || 24
      );
      if (attestCheck.isAnomaly && attestCheck.recommendedAction === 'block') {
        return {
          allowed: false,
          reason: attestCheck.explanation,
          threatScore: this.calculateThreatScore(params.entityId).score,
          warnings,
          events,
        };
      }
      if (attestCheck.isAnomaly) {
        warnings.push(attestCheck.explanation);
      }
    }

    // 6. Calculate final threat score
    const threatScore = this.calculateThreatScore(params.entityId);

    // Block if threat score is too high
    if (threatScore.score > 80) {
      return {
        allowed: false,
        reason: `Threat score too high: ${threatScore.score}`,
        threatScore: threatScore.score,
        warnings,
        events,
      };
    }

    // Warn if threat score is elevated
    if (threatScore.score > 50) {
      warnings.push(`Elevated threat score: ${threatScore.score}`);
    }

    return {
      allowed: true,
      threatScore: threatScore.score,
      warnings,
      events,
    };
  }

  // ============================================================
  // STATISTICS & REPORTING
  // ============================================================

  /**
   * Get quarantine statistics
   */
  getStats(): QuarantineStats {
    const activeQuarantines = Array.from(this.quarantineEvents.values())
      .filter(e => e.status === 'active').length;

    const topThreats = Array.from(this.threatScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(t => ({
        entityId: t.entityId,
        score: t.score,
        eventCount: Array.from(this.quarantineEvents.values())
          .filter(e => e.source.entityId === t.entityId).length,
      }));

    const avgThreatScore = topThreats.length > 0
      ? topThreats.reduce((s, t) => s + t.score, 0) / topThreats.length
      : 0;

    return {
      totalEvents: this.stats.totalEvents,
      activeQuarantines,
      blockedTransactions: this.stats.blockedTransactions,
      resolvedEvents: this.stats.resolvedEvents,
      falsePositives: this.stats.falsePositives,
      threatScoreAverage: Math.round(avgThreatScore * 100) / 100,
      topThreats,
    };
  }

  /**
   * Get active quarantine events
   */
  getActiveEvents(): QuarantineEvent[] {
    return Array.from(this.quarantineEvents.values())
      .filter(e => e.status === 'active')
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get threat score for an entity
   */
  getThreatScore(entityId: string): ThreatScore | undefined {
    return this.threatScores.get(entityId);
  }
}

// Singleton export
export const quarantineProtection = QuarantineProtection.getInstance();
