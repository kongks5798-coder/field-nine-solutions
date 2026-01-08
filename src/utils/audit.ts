/**
 * 감사 로그 유틸리티
 * 모든 접근 및 작업 기록
 */

import { storeAuthRecord } from '../services/blockchain';

export interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

/**
 * 감사 로그 생성 및 저장
 */
export async function logAuditEvent(
  userId: string,
  action: string,
  resource: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const log: AuditLog = {
      userId,
      action,
      resource,
      ipAddress: typeof window !== 'undefined' ? undefined : 'server',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    };

    // Supabase에 저장 (빠른 조회)
    // await supabase.from('audit_logs').insert(log);

    // 블록체인에 저장 (불변성)
    try {
      await storeAuthRecord(userId, action as any, {
        resource,
        ...metadata,
        audit: true,
      });
    } catch (error) {
      console.warn('[Audit] 블록체인 저장 실패 (무시됨):', error);
    }

    console.log('[Audit]', log);
  } catch (error) {
    console.error('[Audit] 감사 로그 저장 오류:', error);
    // 감사 로그 실패는 앱 동작을 막지 않음
  }
}

/**
 * 중요한 작업 감사 로그
 */
export async function logCriticalAction(
  userId: string,
  action: string,
  resource: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent(userId, `CRITICAL:${action}`, resource, {
    ...metadata,
    critical: true,
  });
}
