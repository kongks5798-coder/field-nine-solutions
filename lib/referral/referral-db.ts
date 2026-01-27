/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 56: REFERRAL DATABASE SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Production-grade referral system with real Supabase integration
 * - Multi-tier referral tracking
 * - Commission distribution
 * - Fraud prevention
 * - Analytics
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  ReferralTier,
  ReferralUser,
  ReferralReward,
  Badge,
  LeaderboardEntry,
  Campaign,
  TIER_CONFIG,
  calculateTier,
} from './referral-engine';

// ============================================
// Types
// ============================================

export interface ReferralCodeDB {
  id: string;
  code: string;
  user_id: string;
  custom_alias?: string;
  total_uses: number;
  total_earnings: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReferralRelationDB {
  id: string;
  referrer_id: string;
  referee_id: string;
  code_used: string;
  tier: number; // 1 = direct, 2 = indirect
  status: 'pending' | 'active' | 'inactive' | 'fraudulent';
  created_at: string;
  activated_at?: string;
}

export interface ReferralRewardDB {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  currency: string;
  from_user_id?: string;
  description: string;
  description_ko: string;
  status: 'pending' | 'claimable' | 'claimed' | 'expired' | 'cancelled';
  earned_at: string;
  claimed_at?: string;
  expires_at?: string;
  metadata?: Record<string, unknown>;
}

export interface FraudCheck {
  passed: boolean;
  score: number;
  flags: string[];
  blockedReason?: string;
}

export interface ReferralAnalytics {
  totalReferrals: number;
  activeReferrals: number;
  conversionRate: number;
  averageEarningsPerReferral: number;
  topPerformingCampaign?: string;
  recentTrend: 'up' | 'down' | 'stable';
  dailyReferrals: { date: string; count: number }[];
}

// ============================================
// Supabase Client (Lazy Initialization)
// ============================================

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('Supabase credentials not configured');
    }

    supabase = createClient(url, key);
  }
  return supabase;
}

// ============================================
// Referral Code Operations
// ============================================

export class ReferralDBService {
  /**
   * Generate a unique referral code for a user
   */
  async generateCode(userId: string): Promise<ReferralCodeDB | null> {
    const db = getSupabase();

    // Check if user already has a code
    const { data: existing } = await db
      .from('referral_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (existing) {
      return existing as ReferralCodeDB;
    }

    // Generate new unique code
    const code = await this.generateUniqueCode();

    const { data, error } = await db
      .from('referral_codes')
      .insert({
        code,
        user_id: userId,
        total_uses: 0,
        total_earnings: 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[ReferralDB] Generate code error:', error);
      return null;
    }

    return data as ReferralCodeDB;
  }

  /**
   * Generate a unique code that doesn't exist in DB
   */
  private async generateUniqueCode(): Promise<string> {
    const db = getSupabase();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      const code = `FN${randomPart}`;

      const { data } = await db
        .from('referral_codes')
        .select('code')
        .eq('code', code)
        .single();

      if (!data) {
        return code;
      }

      attempts++;
    }

    // Fallback with timestamp
    return `FN${Date.now().toString(36).toUpperCase()}`;
  }

  /**
   * Validate a referral code
   */
  async validateCode(code: string): Promise<{
    valid: boolean;
    codeData?: ReferralCodeDB;
    ownerName?: string;
    error?: string;
  }> {
    const db = getSupabase();

    const { data, error } = await db
      .from('referral_codes')
      .select(`
        *,
        profiles:user_id (
          full_name
        )
      `)
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return { valid: false, error: 'Invalid or expired referral code' };
    }

    return {
      valid: true,
      codeData: data as ReferralCodeDB,
      ownerName: (data as any).profiles?.full_name || 'Field Nine User',
    };
  }

  /**
   * Apply a referral code for a new user
   */
  async applyCode(
    code: string,
    newUserId: string,
    metadata?: Record<string, unknown>
  ): Promise<{
    success: boolean;
    referrerBonus: number;
    refereeBonus: number;
    error?: string;
  }> {
    const db = getSupabase();

    // Validate code
    const validation = await this.validateCode(code);
    if (!validation.valid || !validation.codeData) {
      return { success: false, referrerBonus: 0, refereeBonus: 0, error: validation.error };
    }

    // Fraud check
    const fraudCheck = await this.checkFraud(newUserId, validation.codeData.user_id);
    if (!fraudCheck.passed) {
      return {
        success: false,
        referrerBonus: 0,
        refereeBonus: 0,
        error: fraudCheck.blockedReason || 'Referral blocked by fraud detection',
      };
    }

    const referrerId = validation.codeData.user_id;
    const SIGNUP_BONUS = 500;
    const REFERRER_BONUS = 1000;

    try {
      // Create referral relationship
      await db.from('referral_relations').insert({
        referrer_id: referrerId,
        referee_id: newUserId,
        code_used: code.toUpperCase(),
        tier: 1,
        status: 'active',
        activated_at: new Date().toISOString(),
        metadata,
      });

      // Update code usage count
      await db
        .from('referral_codes')
        .update({
          total_uses: validation.codeData.total_uses + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', validation.codeData.id);

      // Create rewards for both parties
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

      // Referrer reward
      await db.from('referral_rewards').insert({
        user_id: referrerId,
        type: 'SIGNUP_BONUS',
        amount: REFERRER_BONUS,
        currency: 'KAUS',
        from_user_id: newUserId,
        description: 'New referral signup bonus',
        description_ko: '신규 추천인 가입 보너스',
        status: 'claimable',
        earned_at: now,
        expires_at: expiresAt,
      });

      // Referee reward
      await db.from('referral_rewards').insert({
        user_id: newUserId,
        type: 'SIGNUP_BONUS',
        amount: SIGNUP_BONUS,
        currency: 'KAUS',
        description: 'Welcome bonus for using referral code',
        description_ko: '추천 코드 사용 웰컴 보너스',
        status: 'claimable',
        earned_at: now,
        expires_at: expiresAt,
      });

      // Check for tier 2 referrals (indirect)
      await this.checkIndirectReferrals(referrerId, newUserId);

      return {
        success: true,
        referrerBonus: REFERRER_BONUS,
        refereeBonus: SIGNUP_BONUS,
      };
    } catch (error) {
      console.error('[ReferralDB] Apply code error:', error);
      return {
        success: false,
        referrerBonus: 0,
        refereeBonus: 0,
        error: 'Failed to apply referral code',
      };
    }
  }

  /**
   * Check and create indirect (tier 2) referral relationships
   */
  private async checkIndirectReferrals(referrerId: string, newUserId: string): Promise<void> {
    const db = getSupabase();

    // Find who referred the referrer
    const { data: referrerRelation } = await db
      .from('referral_relations')
      .select('referrer_id')
      .eq('referee_id', referrerId)
      .eq('tier', 1)
      .eq('status', 'active')
      .single();

    if (referrerRelation) {
      // Create tier 2 relationship
      await db.from('referral_relations').insert({
        referrer_id: referrerRelation.referrer_id,
        referee_id: newUserId,
        tier: 2,
        status: 'active',
        activated_at: new Date().toISOString(),
      });
    }
  }

  // ============================================
  // Reward Operations
  // ============================================

  /**
   * Get user's rewards
   */
  async getUserRewards(
    userId: string,
    status?: string,
    limit: number = 50
  ): Promise<ReferralRewardDB[]> {
    const db = getSupabase();

    let query = db
      .from('referral_rewards')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ReferralDB] Get rewards error:', error);
      return [];
    }

    return (data || []) as ReferralRewardDB[];
  }

  /**
   * Claim a reward
   */
  async claimReward(rewardId: string, userId: string): Promise<{
    success: boolean;
    amount?: number;
    error?: string;
  }> {
    const db = getSupabase();

    // Get and verify reward
    const { data: reward, error: fetchError } = await db
      .from('referral_rewards')
      .select('*')
      .eq('id', rewardId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !reward) {
      return { success: false, error: 'Reward not found' };
    }

    if (reward.status !== 'claimable') {
      return { success: false, error: `Reward is ${reward.status}` };
    }

    if (reward.expires_at && new Date(reward.expires_at) < new Date()) {
      // Mark as expired
      await db
        .from('referral_rewards')
        .update({ status: 'expired' })
        .eq('id', rewardId);
      return { success: false, error: 'Reward has expired' };
    }

    // Claim the reward
    const { error: updateError } = await db
      .from('referral_rewards')
      .update({
        status: 'claimed',
        claimed_at: new Date().toISOString(),
      })
      .eq('id', rewardId);

    if (updateError) {
      return { success: false, error: 'Failed to claim reward' };
    }

    // Update user's KAUS balance (if applicable)
    // This would integrate with the wallet system

    return { success: true, amount: reward.amount };
  }

  /**
   * Claim all available rewards
   */
  async claimAllRewards(userId: string): Promise<{
    success: boolean;
    totalClaimed: number;
    claimedCount: number;
    errors: string[];
  }> {
    const claimableRewards = await this.getUserRewards(userId, 'claimable');
    const errors: string[] = [];
    let totalClaimed = 0;
    let claimedCount = 0;

    for (const reward of claimableRewards) {
      const result = await this.claimReward(reward.id, userId);
      if (result.success && result.amount) {
        totalClaimed += result.amount;
        claimedCount++;
      } else if (result.error) {
        errors.push(`${reward.id}: ${result.error}`);
      }
    }

    return {
      success: errors.length === 0,
      totalClaimed,
      claimedCount,
      errors,
    };
  }

  // ============================================
  // Fraud Prevention
  // ============================================

  /**
   * Check for potential fraud
   */
  async checkFraud(newUserId: string, referrerId: string): Promise<FraudCheck> {
    const db = getSupabase();
    const flags: string[] = [];
    let score = 100;

    // Check 1: Self-referral
    if (newUserId === referrerId) {
      return {
        passed: false,
        score: 0,
        flags: ['SELF_REFERRAL'],
        blockedReason: 'Self-referral is not allowed',
      };
    }

    // Check 2: Same IP/device (would need additional tracking)
    // This is a placeholder - real implementation would check device fingerprints

    // Check 3: Referrer's recent activity
    const { data: recentReferrals } = await db
      .from('referral_relations')
      .select('created_at')
      .eq('referrer_id', referrerId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (recentReferrals && recentReferrals.length > 10) {
      flags.push('HIGH_VELOCITY');
      score -= 20;
    }

    // Check 4: Suspicious patterns
    const { data: fraudulentCount } = await db
      .from('referral_relations')
      .select('id')
      .eq('referrer_id', referrerId)
      .eq('status', 'fraudulent');

    if (fraudulentCount && fraudulentCount.length > 0) {
      flags.push('PREVIOUS_FRAUD');
      score -= 30;
    }

    // Check 5: Email domain check (if available)
    // Would check for disposable email domains

    return {
      passed: score >= 50,
      score,
      flags,
      blockedReason: score < 50 ? 'Suspicious activity detected' : undefined,
    };
  }

  /**
   * Mark a referral as fraudulent
   */
  async markFraudulent(relationId: string, reason: string): Promise<boolean> {
    const db = getSupabase();

    const { error } = await db
      .from('referral_relations')
      .update({
        status: 'fraudulent',
        metadata: { fraudReason: reason, markedAt: new Date().toISOString() },
      })
      .eq('id', relationId);

    if (error) {
      console.error('[ReferralDB] Mark fraudulent error:', error);
      return false;
    }

    // Cancel any pending rewards
    const { data: relation } = await db
      .from('referral_relations')
      .select('referrer_id, referee_id')
      .eq('id', relationId)
      .single();

    if (relation) {
      await db
        .from('referral_rewards')
        .update({ status: 'cancelled' })
        .eq('from_user_id', relation.referee_id)
        .eq('status', 'claimable');
    }

    return true;
  }

  // ============================================
  // User Profile & Stats
  // ============================================

  /**
   * Get user's referral profile
   */
  async getUserProfile(userId: string): Promise<ReferralUser | null> {
    const db = getSupabase();

    // Get user's referral code
    const { data: codeData } = await db
      .from('referral_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    // Get referral counts
    const { data: directReferrals } = await db
      .from('referral_relations')
      .select('*, referee:referee_id(full_name)')
      .eq('referrer_id', userId)
      .eq('tier', 1)
      .eq('status', 'active');

    const { data: indirectCount } = await db
      .from('referral_relations')
      .select('id')
      .eq('referrer_id', userId)
      .eq('tier', 2)
      .eq('status', 'active');

    // Get total earnings
    const { data: claimedRewards } = await db
      .from('referral_rewards')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'claimed');

    const { data: pendingRewards } = await db
      .from('referral_rewards')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'claimable');

    const totalEarnings = (claimedRewards || []).reduce((sum, r) => sum + r.amount, 0);
    const pendingAmount = (pendingRewards || []).reduce((sum, r) => sum + r.amount, 0);
    const totalReferrals = (directReferrals?.length || 0);

    // Get user info
    const { data: profile } = await db
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('user_id', userId)
      .single();

    return {
      id: userId,
      name: profile?.full_name || 'User',
      avatar: profile?.avatar_url || '👤',
      joinedAt: new Date(),
      referralCode: codeData?.code || '',
      tier: calculateTier(totalReferrals),
      totalReferrals,
      activeReferrals: totalReferrals,
      totalEarnings,
      pendingRewards: pendingAmount,
      lifetimeVolume: 0, // Would need trading data
      directReferrals: (directReferrals || []).map(r => ({
        id: r.referee_id,
        name: r.referee?.full_name || 'User',
        avatar: '👤',
        joinedAt: new Date(r.created_at),
        tradingVolume: 0,
        stakingAmount: 0,
        earnedForReferrer: 0,
        isActive: r.status === 'active',
        tier: 1,
      })),
      indirectReferrals: indirectCount?.length || 0,
    };
  }

  // ============================================
  // Leaderboard
  // ============================================

  /**
   * Get referral leaderboard
   */
  async getLeaderboard(
    period: 'all' | 'monthly' | 'weekly' = 'all',
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    const db = getSupabase();

    let startDate: Date | null = null;
    if (period === 'monthly') {
      startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - startDate.getDay());
      startDate.setHours(0, 0, 0, 0);
    }

    // This query would be optimized with a materialized view in production
    let query = db.rpc('get_referral_leaderboard', {
      start_date: startDate?.toISOString() || null,
      result_limit: limit,
    });

    const { data, error } = await query;

    if (error) {
      console.error('[ReferralDB] Leaderboard error:', error);
      return [];
    }

    return (data || []).map((entry: any, index: number) => ({
      rank: index + 1,
      userId: entry.user_id,
      name: entry.full_name || 'User',
      avatar: entry.avatar_url || '👤',
      tier: calculateTier(entry.total_referrals),
      totalReferrals: entry.total_referrals,
      totalEarnings: entry.total_earnings,
      monthlyReferrals: entry.monthly_referrals || 0,
      monthlyEarnings: entry.monthly_earnings || 0,
    }));
  }

  // ============================================
  // Analytics
  // ============================================

  /**
   * Get referral analytics for a user
   */
  async getUserAnalytics(userId: string): Promise<ReferralAnalytics> {
    const db = getSupabase();

    // Get total and active referrals
    const { data: totalData } = await db
      .from('referral_relations')
      .select('status')
      .eq('referrer_id', userId);

    const total = totalData?.length || 0;
    const active = totalData?.filter(r => r.status === 'active').length || 0;

    // Get daily referrals for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: dailyData } = await db
      .from('referral_relations')
      .select('created_at')
      .eq('referrer_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Group by date
    const dailyReferrals: { date: string; count: number }[] = [];
    const dateCounts = new Map<string, number>();

    for (const ref of dailyData || []) {
      const date = ref.created_at.split('T')[0];
      dateCounts.set(date, (dateCounts.get(date) || 0) + 1);
    }

    for (const [date, count] of dateCounts) {
      dailyReferrals.push({ date, count });
    }

    // Calculate trend
    const recentWeek = dailyReferrals.slice(-7).reduce((sum, d) => sum + d.count, 0);
    const previousWeek = dailyReferrals.slice(-14, -7).reduce((sum, d) => sum + d.count, 0);
    const recentTrend: 'up' | 'down' | 'stable' =
      recentWeek > previousWeek ? 'up' : recentWeek < previousWeek ? 'down' : 'stable';

    // Get earnings
    const { data: earningsData } = await db
      .from('referral_rewards')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'claimed');

    const totalEarnings = (earningsData || []).reduce((sum, r) => sum + r.amount, 0);

    return {
      totalReferrals: total,
      activeReferrals: active,
      conversionRate: total > 0 ? (active / total) * 100 : 0,
      averageEarningsPerReferral: active > 0 ? totalEarnings / active : 0,
      recentTrend,
      dailyReferrals: dailyReferrals.sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  /**
   * Get global referral stats (admin)
   */
  async getGlobalStats(): Promise<{
    totalUsers: number;
    totalReferrals: number;
    totalRewardsDistributed: number;
    activeCampaigns: number;
    fraudulentBlocked: number;
    conversionRate: number;
  }> {
    const db = getSupabase();

    const { count: totalUsers } = await db
      .from('referral_codes')
      .select('*', { count: 'exact', head: true });

    const { data: relationsData } = await db
      .from('referral_relations')
      .select('status');

    const totalReferrals = relationsData?.length || 0;
    const activeReferrals = relationsData?.filter(r => r.status === 'active').length || 0;
    const fraudulent = relationsData?.filter(r => r.status === 'fraudulent').length || 0;

    const { data: rewardsData } = await db
      .from('referral_rewards')
      .select('amount')
      .eq('status', 'claimed');

    const totalRewardsDistributed = (rewardsData || []).reduce((sum, r) => sum + r.amount, 0);

    const { count: activeCampaigns } = await db
      .from('referral_campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    return {
      totalUsers: totalUsers || 0,
      totalReferrals,
      totalRewardsDistributed,
      activeCampaigns: activeCampaigns || 0,
      fraudulentBlocked: fraudulent,
      conversionRate: totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0,
    };
  }
}

// ============================================
// Singleton Instance
// ============================================

export const referralDB = new ReferralDBService();

export default referralDB;
