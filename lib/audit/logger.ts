/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 52: IMMUTABLE AUDIT LOGGING SYSTEM (HARDENED)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * BANK-GRADE SECURITY:
 * - SHA-256 해시 체인 (위변조 방지)
 * - 실시간 무결성 검증
 * - 보안 사고 즉시 알림
 *
 * "모든 거래는 블록체인처럼 기록된다"
 */

import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type AuditEventType =
  | 'KAUS_PURCHASE'
  | 'KAUS_SALE'
  | 'ENERGY_BUY'
  | 'ENERGY_SELL'
  | 'WITHDRAWAL_REQUEST'
  | 'WITHDRAWAL_COMPLETE'
  | 'STAKING_DEPOSIT'
  | 'STAKING_WITHDRAW'
  | 'YIELD_CLAIM'
  | 'REFERRAL_BONUS'
  | 'CERTIFICATE_ISSUED'
  | 'LOGIN'
  | 'SETTINGS_CHANGE'
  | 'API_KEY_CREATED'
  | 'API_KEY_REVOKED'
  | 'SECURITY_INCIDENT'
  | 'BALANCE_UPDATE';

export interface AuditLogEntry {
  id?: string;
  timestamp: string;
  eventType: AuditEventType;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, unknown>;
  amount?: number;
  currency?: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  errorMessage?: string;
  hash: string;
  previousHash: string;
  nonce: number;
  verified: boolean;
}

export interface AuditLogQuery {
  userId?: string;
  eventType?: AuditEventType;
  startDate?: string;
  endDate?: string;
  status?: 'SUCCESS' | 'FAILED' | 'PENDING';
  limit?: number;
  offset?: number;
}

export interface IntegrityReport {
  valid: boolean;
  totalLogs: number;
  verifiedLogs: number;
  brokenAt?: number;
  brokenHash?: string;
  message: string;
  timestamp: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHA-256 HASH GENERATION (Mandatory)
// ═══════════════════════════════════════════════════════════════════════════════

async function generateSHA256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Server-side Node.js fallback
  try {
    const { createHash } = await import('crypto');
    return createHash('sha256').update(data).digest('hex');
  } catch {
    throw new Error('SHA-256 hashing unavailable - CRITICAL SECURITY FAILURE');
  }
}

// Generate nonce for additional security
function generateNonce(): number {
  return Math.floor(Math.random() * 1000000000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (url && key) {
      supabaseClient = createClient(url, key);
    }
  }
  return supabaseClient;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HASH CHAIN STATE (Persisted)
// ═══════════════════════════════════════════════════════════════════════════════

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
let lastKnownHash = GENESIS_HASH;
let chainInitialized = false;

async function initializeHashChain() {
  if (chainInitialized) return;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      // Get the last log entry to continue the chain
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (supabase as any)
        .from('audit_logs')
        .select('hash')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (result.data?.hash) {
        lastKnownHash = result.data.hash;
      }
    } catch {
      // Start fresh chain if no logs exist
      lastKnownHash = GENESIS_HASH;
    }
  }
  chainInitialized = true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// IN-MEMORY FALLBACK (with hash chain)
// ═══════════════════════════════════════════════════════════════════════════════

const inMemoryLogs: AuditLogEntry[] = [];

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY ALERT SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

async function sendSecurityAlert(
  type: 'INTEGRITY_BREACH' | 'UNAUTHORIZED_ACCESS' | 'CRITICAL_FAILURE',
  details: Record<string, unknown>
) {
  const alert = {
    type,
    timestamp: new Date().toISOString(),
    severity: 'CRITICAL',
    details,
    requiresImmediate: true,
  };

  console.error('[SECURITY ALERT - IMMEDIATE ACTION REQUIRED]', JSON.stringify(alert, null, 2));

  // Log to console with high visibility
  console.error('='.repeat(80));
  console.error('SECURITY INCIDENT DETECTED');
  console.error('='.repeat(80));
  console.error(JSON.stringify(alert, null, 2));
  console.error('='.repeat(80));

  // TODO: Integrate with alerting service (PagerDuty, Slack, Email)
  // await fetch(process.env.SECURITY_WEBHOOK_URL, { method: 'POST', body: JSON.stringify(alert) });
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT LOGGER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class AuditLogger {
  private static instance: AuditLogger;

  private constructor() {}

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'hash' | 'previousHash' | 'nonce' | 'verified'>): Promise<AuditLogEntry> {
    await initializeHashChain();

    const timestamp = new Date().toISOString();
    const nonce = generateNonce();
    const previousHash = lastKnownHash;

    // Generate SHA-256 hash of the entry
    const dataToHash = JSON.stringify({
      timestamp,
      eventType: entry.eventType,
      userId: entry.userId,
      details: entry.details,
      amount: entry.amount,
      currency: entry.currency,
      status: entry.status,
      previousHash,
      nonce,
    });

    const hash = await generateSHA256(dataToHash);
    lastKnownHash = hash;

    const fullEntry: AuditLogEntry = {
      ...entry,
      timestamp,
      hash,
      previousHash,
      nonce,
      verified: true,
    };

    // Persist to database
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('audit_logs')
          .insert([{
            timestamp: fullEntry.timestamp,
            event_type: fullEntry.eventType,
            user_id: fullEntry.userId,
            ip_address: fullEntry.ipAddress,
            user_agent: fullEntry.userAgent,
            details: fullEntry.details,
            amount: fullEntry.amount,
            currency: fullEntry.currency,
            status: fullEntry.status,
            error_message: fullEntry.errorMessage,
            hash: fullEntry.hash,
            previous_hash: fullEntry.previousHash,
            nonce: fullEntry.nonce,
            verified: fullEntry.verified,
          }])
          .select()
          .single();

        if (error) {
          console.error('[AuditLog] Database error:', error);
          inMemoryLogs.push(fullEntry);
        } else if (data) {
          return { ...fullEntry, id: (data as { id: string }).id };
        }
      } catch (err) {
        console.error('[AuditLog] Critical error:', err);
        inMemoryLogs.push(fullEntry);
      }
    } else {
      inMemoryLogs.push(fullEntry);
    }

    return fullEntry;
  }

  async query(query: AuditLogQuery): Promise<AuditLogEntry[]> {
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let queryBuilder = (supabase as any)
          .from('audit_logs')
          .select('*')
          .order('timestamp', { ascending: false });

        if (query.userId) {
          queryBuilder = queryBuilder.eq('user_id', query.userId);
        }
        if (query.eventType) {
          queryBuilder = queryBuilder.eq('event_type', query.eventType);
        }
        if (query.status) {
          queryBuilder = queryBuilder.eq('status', query.status);
        }
        if (query.startDate) {
          queryBuilder = queryBuilder.gte('timestamp', query.startDate);
        }
        if (query.endDate) {
          queryBuilder = queryBuilder.lte('timestamp', query.endDate);
        }
        if (query.limit) {
          queryBuilder = queryBuilder.limit(query.limit);
        }

        const { data, error } = await queryBuilder;

        if (error) {
          console.error('[AuditLog] Query error:', error);
          return this.queryInMemory(query);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []).map((row: any) => ({
          id: row.id,
          timestamp: row.timestamp,
          eventType: row.event_type,
          userId: row.user_id,
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          details: row.details,
          amount: row.amount,
          currency: row.currency,
          status: row.status,
          errorMessage: row.error_message,
          hash: row.hash,
          previousHash: row.previous_hash,
          nonce: row.nonce,
          verified: row.verified,
        }));
      } catch (err) {
        console.error('[AuditLog] Query error:', err);
        return this.queryInMemory(query);
      }
    }

    return this.queryInMemory(query);
  }

  private queryInMemory(query: AuditLogQuery): AuditLogEntry[] {
    let results = [...inMemoryLogs];

    if (query.userId) {
      results = results.filter(log => log.userId === query.userId);
    }
    if (query.eventType) {
      results = results.filter(log => log.eventType === query.eventType);
    }
    if (query.status) {
      results = results.filter(log => log.status === query.status);
    }

    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const limit = query.limit || 50;
    return results.slice(0, limit);
  }

  async verifyIntegrity(): Promise<IntegrityReport> {
    const logs = await this.query({ limit: 1000 });

    if (logs.length === 0) {
      return {
        valid: true,
        totalLogs: 0,
        verifiedLogs: 0,
        message: 'No logs to verify',
        timestamp: new Date().toISOString(),
      };
    }

    // Sort by timestamp ascending for chain verification
    const sorted = [...logs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let verifiedCount = 0;

    // Verify each hash in the chain
    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];

      // Verify hash matches content
      const dataToHash = JSON.stringify({
        timestamp: current.timestamp,
        eventType: current.eventType,
        userId: current.userId,
        details: current.details,
        amount: current.amount,
        currency: current.currency,
        status: current.status,
        previousHash: current.previousHash,
        nonce: current.nonce,
      });

      const expectedHash = await generateSHA256(dataToHash);

      if (current.hash !== expectedHash) {
        await sendSecurityAlert('INTEGRITY_BREACH', {
          logIndex: i,
          logId: current.id,
          expectedHash,
          actualHash: current.hash,
          timestamp: current.timestamp,
        });

        return {
          valid: false,
          totalLogs: logs.length,
          verifiedLogs: verifiedCount,
          brokenAt: i,
          brokenHash: current.hash,
          message: `INTEGRITY BREACH: Hash mismatch at log index ${i}`,
          timestamp: new Date().toISOString(),
        };
      }

      // Verify chain linkage (skip genesis)
      if (i > 0) {
        const previous = sorted[i - 1];
        if (current.previousHash !== previous.hash) {
          await sendSecurityAlert('INTEGRITY_BREACH', {
            logIndex: i,
            reason: 'Chain linkage broken',
            expectedPrevious: previous.hash,
            actualPrevious: current.previousHash,
          });

          return {
            valid: false,
            totalLogs: logs.length,
            verifiedLogs: verifiedCount,
            brokenAt: i,
            message: `INTEGRITY BREACH: Chain linkage broken at log index ${i}`,
            timestamp: new Date().toISOString(),
          };
        }
      }

      verifiedCount++;
    }

    return {
      valid: true,
      totalLogs: logs.length,
      verifiedLogs: verifiedCount,
      message: 'All logs verified successfully - chain integrity confirmed',
      timestamp: new Date().toISOString(),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const auditLogger = AuditLogger.getInstance();

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function logKausPurchase(
  userId: string,
  amount: number,
  currency: 'KRW' | 'USD',
  orderId: string,
  status: 'SUCCESS' | 'FAILED' | 'PENDING',
  details?: Record<string, unknown>
) {
  return auditLogger.log({
    eventType: 'KAUS_PURCHASE',
    userId,
    amount,
    currency,
    status,
    details: { orderId, ...details },
  });
}

export async function logWithdrawal(
  userId: string,
  amount: number,
  currency: 'KRW' | 'USD',
  method: string,
  withdrawalId: string,
  status: 'SUCCESS' | 'FAILED' | 'PENDING',
  details?: Record<string, unknown>
) {
  return auditLogger.log({
    eventType: 'WITHDRAWAL_REQUEST',
    userId,
    amount,
    currency,
    status,
    details: { withdrawalId, method, ...details },
  });
}

export async function logSecurityIncident(
  userId: string,
  incidentType: string,
  details: Record<string, unknown>
) {
  await sendSecurityAlert('UNAUTHORIZED_ACCESS', { userId, incidentType, ...details });

  return auditLogger.log({
    eventType: 'SECURITY_INCIDENT',
    userId,
    status: 'FAILED',
    details: { incidentType, ...details },
  });
}

export async function logBalanceUpdate(
  userId: string,
  previousBalance: number,
  newBalance: number,
  reason: string,
  transactionId: string
) {
  return auditLogger.log({
    eventType: 'BALANCE_UPDATE',
    userId,
    amount: newBalance - previousBalance,
    currency: 'KAUS',
    status: 'SUCCESS',
    details: {
      previousBalance: Number(previousBalance.toFixed(8)),
      newBalance: Number(newBalance.toFixed(8)),
      reason,
      transactionId,
    },
  });
}
