/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 54: REFERRAL SUMMARY API (Admin)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * GET - Fetch referral system summary statistics
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, key);
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // Get total codes and referrals
    const { data: codesData, error: codesError } = await supabase
      .from('referral_codes')
      .select('total_referrals, total_earnings, is_active')
      .eq('is_active', true);

    if (codesError) {
      console.error('[REFERRAL SUMMARY] Codes error:', codesError);
    }

    // Calculate totals
    const totalCodes = codesData?.length || 0;
    const totalReferrals = codesData?.reduce((sum, c) => sum + (c.total_referrals || 0), 0) || 0;
    const totalRewardsIssued = codesData?.reduce((sum, c) => sum + Number(c.total_earnings || 0), 0) || 0;

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayRewards } = await supabase
      .from('referral_rewards')
      .select('amount')
      .gte('created_at', today.toISOString())
      .eq('status', 'paid');

    const todayReferrals = todayRewards?.length || 0;
    const todayRewardsAmount = todayRewards?.reduce((sum, r) => sum + Number(r.amount || 0), 0) || 0;

    // Calculate tier distribution
    const tierDistribution: Record<string, number> = {
      DIAMOND: 0,
      PLATINUM: 0,
      GOLD: 0,
      SILVER: 0,
      BRONZE: 0,
    };

    codesData?.forEach((code) => {
      const referrals = code.total_referrals || 0;
      if (referrals >= 500) tierDistribution.DIAMOND++;
      else if (referrals >= 100) tierDistribution.PLATINUM++;
      else if (referrals >= 50) tierDistribution.GOLD++;
      else if (referrals >= 10) tierDistribution.SILVER++;
      else tierDistribution.BRONZE++;
    });

    return NextResponse.json({
      success: true,
      totalCodes,
      totalReferrals,
      totalRewardsIssued: Math.round(totalRewardsIssued * 100) / 100,
      todayReferrals,
      todayRewards: Math.round(todayRewardsAmount * 100) / 100,
      tierDistribution,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[REFERRAL SUMMARY] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch summary',
        totalCodes: 0,
        totalReferrals: 0,
        totalRewardsIssued: 0,
        todayReferrals: 0,
        todayRewards: 0,
        tierDistribution: {
          DIAMOND: 0,
          PLATINUM: 0,
          GOLD: 0,
          SILVER: 0,
          BRONZE: 0,
        },
      },
      { status: 500 }
    );
  }
}
