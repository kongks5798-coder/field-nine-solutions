/**
 * 구독 관리 유틸리티
 * 구독 플랜별 기능 제한 및 권한 확인
 */

export type PlanId = 'free' | 'premium' | 'team' | 'business' | 'enterprise';

export interface PlanLimits {
  maxStores: number;
  maxProducts: number;
  maxOrdersPerMonth: number;
  features: string[];
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    maxStores: 1,
    maxProducts: 100,
    maxOrdersPerMonth: 100,
    features: ['basic_dashboard', 'daily_sync'],
  },
  premium: {
    maxStores: 3,
    maxProducts: 1000,
    maxOrdersPerMonth: 10000,
    features: [
      'basic_dashboard',
      'daily_sync',
      'realtime_sync',
      'advanced_dashboard',
      'ai_forecast',
      'auto_actions',
    ],
  },
  team: {
    maxStores: 10,
    maxProducts: 10000,
    maxOrdersPerMonth: 100000,
    features: [
      'basic_dashboard',
      'daily_sync',
      'realtime_sync',
      'advanced_dashboard',
      'ai_forecast',
      'auto_actions',
      'team_collaboration',
      'advanced_permissions',
    ],
  },
  business: {
    maxStores: -1, // 무제한
    maxProducts: -1, // 무제한
    maxOrdersPerMonth: -1, // 무제한
    features: [
      'basic_dashboard',
      'daily_sync',
      'realtime_sync',
      'advanced_dashboard',
      'ai_forecast',
      'auto_actions',
      'team_collaboration',
      'advanced_permissions',
      'dedicated_instance',
      'custom_integration',
      'dedicated_csm',
      'sla_guarantee',
    ],
  },
  enterprise: {
    maxStores: -1, // 무제한
    maxProducts: -1, // 무제한
    maxOrdersPerMonth: -1, // 무제한
    features: [
      'basic_dashboard',
      'daily_sync',
      'realtime_sync',
      'advanced_dashboard',
      'ai_forecast',
      'auto_actions',
      'team_collaboration',
      'advanced_permissions',
      'dedicated_instance',
      'custom_integration',
      'dedicated_csm',
      'sla_guarantee',
      'on_premise_option',
      'custom_development',
    ],
  },
};

/**
 * 플랜이 특정 기능을 사용할 수 있는지 확인
 */
export function hasFeature(planId: PlanId, feature: string): boolean {
  const limits = PLAN_LIMITS[planId];
  if (!limits) return false;
  return limits.features.includes(feature);
}

/**
 * 플랜이 특정 제한을 초과했는지 확인
 */
export function checkLimit(
  planId: PlanId,
  limitType: 'stores' | 'products' | 'orders',
  currentCount: number
): { allowed: boolean; limit: number; exceeded: boolean } {
  const limits = PLAN_LIMITS[planId];
  if (!limits) {
    return { allowed: false, limit: 0, exceeded: true };
  }

  let limit: number;
  switch (limitType) {
    case 'stores':
      limit = limits.maxStores;
      break;
    case 'products':
      limit = limits.maxProducts;
      break;
    case 'orders':
      limit = limits.maxOrdersPerMonth;
      break;
    default:
      limit = 0;
  }

  // -1은 무제한
  if (limit === -1) {
    return { allowed: true, limit: -1, exceeded: false };
  }

  const exceeded = currentCount >= limit;
  return {
    allowed: !exceeded,
    limit,
    exceeded,
  };
}

/**
 * 플랜 이름을 플랜 ID로 변환
 */
export function planNameToId(planName: string): PlanId {
  const mapping: Record<string, PlanId> = {
    '무료': 'free',
    '프리미엄': 'premium',
    '팀': 'team',
    '사업': 'business',
    '기업': 'enterprise',
  };
  return mapping[planName] || 'free';
}
