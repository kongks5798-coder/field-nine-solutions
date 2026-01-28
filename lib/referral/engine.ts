/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 54: GLOBAL VIRAL & REFERRAL ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Field Nine Referral System:
 * - Unique invite codes per user
 * - 2% KAUS reward on VRD purchases & staking
 * - Real-time tracking & analytics
 * - Multi-tier referral bonuses
 *
 * "The Empire Multiplies Itself"
 */

import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ReferralCode {
  code: string;
  userId: string;
  createdAt: string;
  totalReferrals: number;
  totalEarnings: number;
  isActive: boolean;
}

export interface ReferralReward {
  id: string;
  referrerId: string;
  refereeId: string;
  type: 'VRD_PURCHASE' | 'KAUS_STAKE' | 'KAUS_PURCHASE' | 'SIGNUP_BONUS';
  amount: number;
  sourceAmount: number;
  status: 'pending' | 'paid' | 'failed';
  createdAt: string;
  paidAt?: string;
  transactionId?: string;
}

export interface ReferralStats {
  code: string;
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  conversionRate: number;
  topReferees: {
    userId: string;
    totalSpent: number;
    rewardGenerated: number;
  }[];
}

export interface ReferralLeaderboard {
  rank: number;
  code: string;
  userId: string;
  userName?: string;
  totalRevenue: number;
  totalReferrals: number;
  totalRewards: number;
  sovereignNumber?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const REFERRAL_CONFIG = {
  // Reward percentages
  VRD_PURCHASE_REWARD: 0.02,     // 2% of VRD purchase
  KAUS_STAKE_REWARD: 0.02,       // 2% of staked amount
  KAUS_PURCHASE_REWARD: 0.02,   // 2% of KAUS purchase
  SIGNUP_BONUS: 10,              // 10 KAUS for both referee and referrer
  REFERRER_BONUS: 10,            // 10 KAUS for referrer when new user signs up

  // Tier bonuses (multipliers based on referral count)
  TIER_BONUSES: {
    BRONZE: { minReferrals: 0, multiplier: 1.0 },
    SILVER: { minReferrals: 10, multiplier: 1.25 },
    GOLD: { minReferrals: 50, multiplier: 1.5 },
    PLATINUM: { minReferrals: 100, multiplier: 2.0 },
    DIAMOND: { minReferrals: 500, multiplier: 3.0 },
  },

  // Code generation
  CODE_LENGTH: 8,
  CODE_PREFIX: 'FN',
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, key);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CODE GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a unique referral code
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars (I, O, 0, 1)
  let code = REFERRAL_CONFIG.CODE_PREFIX;

  for (let i = 0; i < REFERRAL_CONFIG.CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

/**
 * Generate a sovereign-themed referral code
 */
export function generateSovereignCode(sovereignNumber: number): string {
  const prefix = 'SOV';
  const paddedNumber = sovereignNumber.toString().padStart(4, '0');
  const suffix = generateReferralCode().slice(-4);
  return `${prefix}${paddedNumber}${suffix}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE REFERRAL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create or get referral code for a user
 */
export async function getOrCreateReferralCode(userId: string): Promise<ReferralCode> {
  const supabase = getSupabaseAdmin();

  // Check if user already has a code
  const { data: existing } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) {
    return {
      code: existing.code,
      userId: existing.user_id,
      createdAt: existing.created_at,
      totalReferrals: existing.total_referrals || 0,
      totalEarnings: existing.total_earnings || 0,
      isActive: existing.is_active,
    };
  }

  // Get user's sovereign number for special code
  const { data: profile } = await supabase
    .from('profiles')
    .select('sovereign_number')
    .eq('user_id', userId)
    .single();

  // Generate new code
  const code = profile?.sovereign_number
    ? generateSovereignCode(profile.sovereign_number)
    : generateReferralCode();

  // Ensure uniqueness
  let finalCode = code;
  let attempts = 0;
  while (attempts < 10) {
    const { data: exists } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('code', finalCode)
      .single();

    if (!exists) break;
    finalCode = generateReferralCode();
    attempts++;
  }

  // Insert new code
  const { data: newCode, error } = await supabase
    .from('referral_codes')
    .insert({
      code: finalCode,
      user_id: userId,
      total_referrals: 0,
      total_earnings: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create referral code: ${error.message}`);
  }

  return {
    code: newCode.code,
    userId: newCode.user_id,
    createdAt: newCode.created_at,
    totalReferrals: 0,
    totalEarnings: 0,
    isActive: true,
  };
}

/**
 * Validate a referral code and get referrer info
 */
export async function validateReferralCode(code: string): Promise<{
  valid: boolean;
  referrerId?: string;
  referrerName?: string;
  tier?: string;
}> {
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from('referral_codes')
    .select(`
      user_id,
      is_active,
      total_referrals,
      profiles!referral_codes_user_id_fkey (
        full_name,
        tier
      )
    `)
    .eq('code', code.toUpperCase())
    .single();

  if (!data || !data.is_active) {
    return { valid: false };
  }

  const profile = data.profiles as { full_name?: string; tier?: string } | null;

  return {
    valid: true,
    referrerId: data.user_id,
    referrerName: profile?.full_name || 'Sovereign',
    tier: profile?.tier || 'Pioneer',
  };
}

/**
 * Process referral reward for VRD purchase
 */
export async function processVRDPurchaseReward(
  orderId: string,
  refereeEmail: string,
  purchaseAmount: number,
  currency: 'KRW' | 'USD'
): Promise<{ success: boolean; rewardAmount?: number; referrerSovereignNumber?: number; error?: string }> {
  const supabase = getSupabaseAdmin();

  try {
    // Find referee by email
    const { data: referee } = await supabase
      .from('profiles')
      .select('user_id, referred_by')
      .eq('email', refereeEmail)
      .single();

    if (!referee?.referred_by) {
      return { success: true, rewardAmount: 0, referrerSovereignNumber: 0 }; // No referrer, skip
    }

    // Get referrer's sovereign number for Telegram notification
    const { data: referrerProfile } = await supabase
      .from('profiles')
      .select('sovereign_number')
      .eq('user_id', referee.referred_by)
      .single();

    const referrerSovereignNumber = referrerProfile?.sovereign_number || 0;

    // Get referrer's code info for tier multiplier
    const { data: referrerCode } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', referee.referred_by)
      .single();

    // Calculate reward with tier bonus
    const tierMultiplier = getTierMultiplier(referrerCode?.total_referrals || 0);
    const baseReward = purchaseAmount * REFERRAL_CONFIG.VRD_PURCHASE_REWARD;

    // Convert to KAUS (1 KAUS = 0.09 USD, ~124 KRW)
    const kausRate = currency === 'USD' ? 0.09 : 124;
    const rewardInKaus = Math.floor((baseReward / kausRate) * tierMultiplier);

    // Create reward record
    const { error: rewardError } = await supabase
      .from('referral_rewards')
      .insert({
        referrer_id: referee.referred_by,
        referee_id: referee.user_id,
        type: 'VRD_PURCHASE',
        amount: rewardInKaus,
        source_amount: purchaseAmount,
        source_currency: currency,
        order_id: orderId,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

    if (rewardError) {
      console.error('[Referral] Reward record error:', rewardError);
      return { success: false, error: rewardError.message };
    }

    // Credit KAUS to referrer immediately
    const { error: creditError } = await supabase.rpc('credit_kaus_balance', {
      p_user_id: referee.referred_by,
      p_amount: rewardInKaus,
      p_type: 'REFERRAL_REWARD',
      p_description: `VRD Purchase Referral Reward (Order: ${orderId})`,
    });

    if (creditError) {
      console.error('[Referral] Credit error:', creditError);
      // Mark reward as failed
      await supabase
        .from('referral_rewards')
        .update({ status: 'failed', error_message: creditError.message })
        .eq('order_id', orderId)
        .eq('referrer_id', referee.referred_by);

      return { success: false, error: creditError.message };
    }

    // Mark reward as paid
    await supabase
      .from('referral_rewards')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('order_id', orderId)
      .eq('referrer_id', referee.referred_by);

    // Update referrer's total earnings
    await supabase
      .from('referral_codes')
      .update({
        total_earnings: (referrerCode?.total_earnings || 0) + rewardInKaus,
      })
      .eq('user_id', referee.referred_by);

    console.log(`[Referral] Rewarded ${rewardInKaus} KAUS to ${referee.referred_by} for VRD purchase`);

    return { success: true, rewardAmount: rewardInKaus, referrerSovereignNumber };
  } catch (error) {
    console.error('[Referral] VRD reward error:', error);
    return { success: false, error: String(error), referrerSovereignNumber: 0 };
  }
}

/**
 * Process referral reward for KAUS staking
 */
export async function processStakingReward(
  userId: string,
  stakedAmount: number
): Promise<{ success: boolean; rewardAmount?: number; error?: string }> {
  const supabase = getSupabaseAdmin();

  try {
    // Get user's referrer
    const { data: user } = await supabase
      .from('profiles')
      .select('referred_by')
      .eq('user_id', userId)
      .single();

    if (!user?.referred_by) {
      return { success: true, rewardAmount: 0 };
    }

    // Get referrer's tier
    const { data: referrerCode } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', user.referred_by)
      .single();

    const tierMultiplier = getTierMultiplier(referrerCode?.total_referrals || 0);
    const rewardAmount = Math.floor(stakedAmount * REFERRAL_CONFIG.KAUS_STAKE_REWARD * tierMultiplier);

    // Create and process reward
    const { error: rewardError } = await supabase
      .from('referral_rewards')
      .insert({
        referrer_id: user.referred_by,
        referee_id: userId,
        type: 'KAUS_STAKE',
        amount: rewardAmount,
        source_amount: stakedAmount,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

    if (rewardError) {
      return { success: false, error: rewardError.message };
    }

    // Credit KAUS
    await supabase.rpc('credit_kaus_balance', {
      p_user_id: user.referred_by,
      p_amount: rewardAmount,
      p_type: 'REFERRAL_REWARD',
      p_description: `Staking Referral Reward (${stakedAmount} KAUS staked)`,
    });

    // Update referrer's earnings
    await supabase
      .from('referral_codes')
      .update({
        total_earnings: (referrerCode?.total_earnings || 0) + rewardAmount,
      })
      .eq('user_id', user.referred_by);

    return { success: true, rewardAmount };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Register a new referral (when user signs up with code)
 */
export async function registerReferral(
  refereeUserId: string,
  referralCode: string
): Promise<{ success: boolean; signupBonus?: number; error?: string }> {
  const supabase = getSupabaseAdmin();

  try {
    // Validate code
    const validation = await validateReferralCode(referralCode);
    if (!validation.valid || !validation.referrerId) {
      return { success: false, error: 'Invalid referral code' };
    }

    // Prevent self-referral
    if (validation.referrerId === refereeUserId) {
      return { success: false, error: 'Cannot refer yourself' };
    }

    // Check if already referred
    const { data: existingRef } = await supabase
      .from('profiles')
      .select('referred_by')
      .eq('user_id', refereeUserId)
      .single();

    if (existingRef?.referred_by) {
      return { success: false, error: 'User already has a referrer' };
    }

    // Update referee's profile
    await supabase
      .from('profiles')
      .update({
        referred_by: validation.referrerId,
        referral_code_used: referralCode.toUpperCase(),
        referred_at: new Date().toISOString(),
      })
      .eq('user_id', refereeUserId);

    // Increment referrer's count
    await supabase
      .from('referral_codes')
      .update({
        total_referrals: supabase.rpc('increment', { x: 1 }),
      })
      .eq('code', referralCode.toUpperCase());

    // Give signup bonus to BOTH referee and referrer (10 KAUS each)
    const signupBonus = REFERRAL_CONFIG.SIGNUP_BONUS;
    const referrerBonus = REFERRAL_CONFIG.REFERRER_BONUS;

    // Credit referee (new user)
    await supabase.rpc('credit_kaus_balance', {
      p_user_id: refereeUserId,
      p_amount: signupBonus,
      p_type: 'REFERRAL_BONUS',
      p_description: `Welcome bonus for using referral code ${referralCode}`,
    });

    // Credit referrer (existing user who shared the code)
    const referrerId = validation.referrerId;
    await supabase.rpc('credit_kaus_balance', {
      p_user_id: referrerId,
      p_amount: referrerBonus,
      p_type: 'REFERRAL_BONUS',
      p_description: `Referral bonus - new user joined with your code`,
    });

    console.log(`[Referral] ✅ New referral: ${refereeUserId} via ${referralCode}`);
    console.log(`[Referral] ✅ Bonuses credited: Referee +${signupBonus} KAUS, Referrer +${referrerBonus} KAUS`);

    return { success: true, signupBonus };
  } catch (error) {
    console.error('[Referral] Registration error:', error);
    return { success: false, error: String(error) };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS & LEADERBOARD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get referral statistics for a user
 */
export async function getReferralStats(userId: string): Promise<ReferralStats | null> {
  const supabase = getSupabaseAdmin();

  const { data: codeData } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!codeData) return null;

  // Get pending earnings
  const { data: pendingRewards } = await supabase
    .from('referral_rewards')
    .select('amount')
    .eq('referrer_id', userId)
    .eq('status', 'pending');

  const pendingEarnings = pendingRewards?.reduce((sum, r) => sum + r.amount, 0) || 0;

  // Get top referees
  const { data: referees } = await supabase
    .from('referral_rewards')
    .select('referee_id, amount')
    .eq('referrer_id', userId)
    .order('amount', { ascending: false })
    .limit(5);

  const topReferees = referees?.map(r => ({
    userId: r.referee_id,
    totalSpent: 0, // Would need to aggregate from orders
    rewardGenerated: r.amount,
  })) || [];

  return {
    code: codeData.code,
    totalReferrals: codeData.total_referrals,
    totalEarnings: codeData.total_earnings,
    pendingEarnings,
    conversionRate: codeData.total_referrals > 0 ? 0.15 : 0, // Placeholder
    topReferees,
  };
}

/**
 * Get global referral leaderboard
 */
export async function getReferralLeaderboard(limit: number = 10): Promise<ReferralLeaderboard[]> {
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from('referral_codes')
    .select(`
      code,
      user_id,
      total_referrals,
      total_earnings,
      profiles!referral_codes_user_id_fkey (
        full_name,
        sovereign_number
      )
    `)
    .eq('is_active', true)
    .order('total_earnings', { ascending: false })
    .limit(limit);

  if (!data) return [];

  return data.map((item, index) => {
    const profile = item.profiles as { full_name?: string; sovereign_number?: number } | null;
    return {
      rank: index + 1,
      code: item.code,
      userId: item.user_id,
      userName: profile?.full_name || `Sovereign #${profile?.sovereign_number || index + 1}`,
      totalRevenue: item.total_earnings * 124, // Convert KAUS to KRW estimate
      totalReferrals: item.total_referrals,
      totalRewards: item.total_earnings,
      sovereignNumber: profile?.sovereign_number,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get tier multiplier based on referral count
 */
function getTierMultiplier(totalReferrals: number): number {
  const tiers = REFERRAL_CONFIG.TIER_BONUSES;

  if (totalReferrals >= tiers.DIAMOND.minReferrals) return tiers.DIAMOND.multiplier;
  if (totalReferrals >= tiers.PLATINUM.minReferrals) return tiers.PLATINUM.multiplier;
  if (totalReferrals >= tiers.GOLD.minReferrals) return tiers.GOLD.multiplier;
  if (totalReferrals >= tiers.SILVER.minReferrals) return tiers.SILVER.multiplier;
  return tiers.BRONZE.multiplier;
}

/**
 * Get tier name based on referral count
 */
export function getTierName(totalReferrals: number): string {
  const tiers = REFERRAL_CONFIG.TIER_BONUSES;

  if (totalReferrals >= tiers.DIAMOND.minReferrals) return 'DIAMOND';
  if (totalReferrals >= tiers.PLATINUM.minReferrals) return 'PLATINUM';
  if (totalReferrals >= tiers.GOLD.minReferrals) return 'GOLD';
  if (totalReferrals >= tiers.SILVER.minReferrals) return 'SILVER';
  return 'BRONZE';
}

/**
 * Generate shareable referral link
 */
export function generateReferralLink(code: string, campaign?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://m.fieldnine.io';
  const params = new URLSearchParams({ ref: code });
  if (campaign) params.set('utm_campaign', campaign);

  return `${baseUrl}/join?${params.toString()}`;
}

/**
 * Generate social share text
 */
export function generateShareText(sovereignNumber: number, code: string): {
  twitter: string;
  instagram: string;
  general: string;
} {
  const link = generateReferralLink(code);

  return {
    twitter: `I am the ${sovereignNumber}${getOrdinalSuffix(sovereignNumber)} Sovereign of Field Nine. Join the empire and earn rewards together! 👑\n\n${link}\n\n#FieldNine #Sovereign #KAUS`,
    instagram: `I am the ${sovereignNumber}${getOrdinalSuffix(sovereignNumber)} Sovereign of Field Nine 👑\n\nJoin the empire with my link in bio!\n\n#FieldNine #Sovereign #KAUS #Web3 #Investment`,
    general: `I am the ${sovereignNumber}${getOrdinalSuffix(sovereignNumber)} Sovereign of Field Nine. Join me and earn rewards! ${link}`,
  };
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export default {
  generateReferralCode,
  getOrCreateReferralCode,
  validateReferralCode,
  processVRDPurchaseReward,
  processStakingReward,
  registerReferral,
  getReferralStats,
  getReferralLeaderboard,
  generateReferralLink,
  generateShareText,
  getTierName,
  REFERRAL_CONFIG,
};
