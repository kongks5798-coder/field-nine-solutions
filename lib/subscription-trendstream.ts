/**
 * TrendStream Subscription Management
 * 
 * 비즈니스 목적:
 * - 구독 플랜 관리 및 사용량 제한
 * - 사용자별 분석 횟수 추적
 * - 플랜별 기능 제한
 */
import { createClient } from '@/lib/supabase/server';

export type PlanId = 'free' | 'pro' | 'business';
export type BillingCycle = 'monthly' | 'yearly';

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  price_monthly: number;
  price_yearly: number;
  max_analyses_per_month: number;
  features: string[];
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: PlanId;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  billing_cycle: BillingCycle;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export interface UsageInfo {
  current_count: number;
  limit: number;
  period_start: string;
  period_end: string;
}

/**
 * 플랜별 제한 정보
 */
export const PLAN_LIMITS: Record<PlanId, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price_monthly: 0,
    price_yearly: 0,
    max_analyses_per_month: 10,
    features: ['기본 분석', '최근 10개 히스토리'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price_monthly: 29,
    price_yearly: 290,
    max_analyses_per_month: 100,
    features: ['무제한 분석', '전체 히스토리', '우선 지원'],
  },
  business: {
    id: 'business',
    name: 'Business',
    price_monthly: 99,
    price_yearly: 990,
    max_analyses_per_month: 1000,
    features: ['무제한 분석', 'API 접근', '전담 지원', '커스텀 리포트'],
  },
};

/**
 * 현재 사용자의 구독 정보 조회
 */
export async function getCurrentSubscription(userId: string): Promise<UserSubscription | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    return null;
  }

  return data as UserSubscription;
}

/**
 * 현재 사용자의 사용량 조회
 */
export async function getCurrentUsage(userId: string): Promise<UsageInfo> {
  const supabase = await createClient();
  
  // 현재 월의 시작일 계산
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // 사용량 조회
  const { data } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('period_start', periodStart.toISOString())
    .single();

  // 구독 정보 조회
  const subscription = await getCurrentSubscription(userId);
  const planId = subscription?.plan_id || 'free';
  const limit = PLAN_LIMITS[planId].max_analyses_per_month;

  return {
    current_count: data?.analyses_count || 0,
    limit,
    period_start: periodStart.toISOString(),
    period_end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
  };
}

/**
 * 분석 사용량 증가
 */
export async function incrementUsage(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  // 현재 월의 시작일
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // 사용량 증가 또는 생성
  const { error } = await supabase.rpc('increment_usage', {
    p_user_id: userId,
    p_period_start: periodStart.toISOString(),
  });

  if (error) {
    // RPC 함수가 없으면 직접 업데이트
    const { data: existing } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('period_start', periodStart.toISOString())
      .single();

    if (existing) {
      await supabase
        .from('usage_tracking')
        .update({ analyses_count: existing.analyses_count + 1 })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('usage_tracking')
        .insert({
          user_id: userId,
          period_start: periodStart.toISOString(),
          analyses_count: 1,
        });
    }
  }

  return true;
}

/**
 * 분석 가능 여부 확인
 */
export async function canPerformAnalysis(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  usage?: UsageInfo;
}> {
  const usage = await getCurrentUsage(userId);
  
  if (usage.current_count >= usage.limit) {
    return {
      allowed: false,
      reason: `월간 분석 한도(${usage.limit}회)를 초과했습니다.`,
      usage,
    };
  }

  return {
    allowed: true,
    usage,
  };
}

/**
 * 모든 플랜 조회
 */
export async function getAllPlans(): Promise<SubscriptionPlan[]> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price_monthly', { ascending: true });

  return (data || []) as SubscriptionPlan[];
}
