/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 56: REFERRAL API ENDPOINT (Enhanced)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * GET: Get user's referral code, stats, leaderboard, rewards, analytics
 * POST: Validate/register referral code, claim rewards
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  getOrCreateReferralCode,
  validateReferralCode,
  registerReferral,
  getReferralStats,
  getReferralLeaderboard,
  generateReferralLink,
  generateShareText,
  getTierName,
} from '@/lib/referral/engine';
import { referralDB } from '@/lib/referral/referral-db';
import { TIER_CONFIG } from '@/lib/referral/referral-engine';

export const runtime = 'nodejs';

// ═══════════════════════════════════════════════════════════════════════════════
// GET: Fetch referral data
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'code';

    // Authenticate for most actions
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    switch (action) {
      case 'code': {
        if (!user) {
          return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { status: 401 }
          );
        }

        const referralCode = await getOrCreateReferralCode(user.id);
        const stats = await getReferralStats(user.id);
        const tier = getTierName(referralCode.totalReferrals);

        // Get user's sovereign number
        const { data: profile } = await supabase
          .from('profiles')
          .select('sovereign_number, full_name')
          .eq('user_id', user.id)
          .single();

        const sovereignNumber = profile?.sovereign_number || 1;
        const shareText = generateShareText(sovereignNumber, referralCode.code);

        return NextResponse.json({
          success: true,
          referral: {
            code: referralCode.code,
            link: generateReferralLink(referralCode.code),
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generateReferralLink(referralCode.code))}`,
            tier,
            sovereignNumber,
            shareText,
          },
          stats: stats || {
            totalReferrals: 0,
            totalEarnings: 0,
            pendingEarnings: 0,
            conversionRate: 0,
          },
        });
      }

      case 'stats': {
        if (!user) {
          return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { status: 401 }
          );
        }

        const stats = await getReferralStats(user.id);
        return NextResponse.json({ success: true, stats });
      }

      case 'leaderboard': {
        const limit = parseInt(searchParams.get('limit') || '10');
        const leaderboard = await getReferralLeaderboard(limit);
        return NextResponse.json({ success: true, leaderboard });
      }

      case 'validate': {
        const code = searchParams.get('code');
        if (!code) {
          return NextResponse.json(
            { success: false, error: 'Code is required' },
            { status: 400 }
          );
        }

        const validation = await validateReferralCode(code);
        return NextResponse.json({ success: true, ...validation });
      }

      // ═══════════════════════════════════════════════════════════════════════════
      // PHASE 56: Enhanced Actions
      // ═══════════════════════════════════════════════════════════════════════════

      case 'rewards': {
        if (!user) {
          return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { status: 401 }
          );
        }

        const status = searchParams.get('status') || undefined;
        const rewards = await referralDB.getUserRewards(user.id, status);

        const summary = {
          total: rewards.length,
          claimable: rewards.filter(r => r.status === 'claimable').length,
          claimed: rewards.filter(r => r.status === 'claimed').length,
          pending: rewards.filter(r => r.status === 'pending').length,
          totalClaimableAmount: rewards
            .filter(r => r.status === 'claimable')
            .reduce((sum, r) => sum + r.amount, 0),
        };

        return NextResponse.json({
          success: true,
          rewards,
          summary,
        });
      }

      case 'analytics': {
        if (!user) {
          return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { status: 401 }
          );
        }

        const analytics = await referralDB.getUserAnalytics(user.id);
        return NextResponse.json({ success: true, analytics });
      }

      case 'tiers': {
        return NextResponse.json({
          success: true,
          tiers: Object.values(TIER_CONFIG),
        });
      }

      case 'profile': {
        if (!user) {
          return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { status: 401 }
          );
        }

        const profile = await referralDB.getUserProfile(user.id);
        if (!profile) {
          return NextResponse.json(
            { success: false, error: 'Profile not found' },
            { status: 404 }
          );
        }

        const tierInfo = TIER_CONFIG[profile.tier];

        return NextResponse.json({
          success: true,
          profile: {
            ...profile,
            tierInfo,
          },
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
            validActions: ['code', 'stats', 'leaderboard', 'validate', 'rewards', 'analytics', 'tiers', 'profile'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Referral API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST: Register referral
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, code } = body;

    switch (action) {
      case 'register': {
        if (!code) {
          return NextResponse.json(
            { success: false, error: 'Referral code is required' },
            { status: 400 }
          );
        }

        const result = await registerReferral(user.id, code);

        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Referral registered successfully',
          signupBonus: result.signupBonus,
        });
      }

      // ═══════════════════════════════════════════════════════════════════════════
      // PHASE 56: Claim Rewards
      // ═══════════════════════════════════════════════════════════════════════════

      case 'claim': {
        const { rewardId } = body;
        if (!rewardId) {
          return NextResponse.json(
            { success: false, error: 'Reward ID is required' },
            { status: 400 }
          );
        }

        const result = await referralDB.claimReward(rewardId, user.id);

        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          claimed: {
            amount: result.amount,
            currency: 'KAUS',
          },
          message: `Successfully claimed ${result.amount} KAUS!`,
          messageKo: `${result.amount} KAUS를 성공적으로 수령했습니다!`,
        });
      }

      case 'claim-all': {
        const result = await referralDB.claimAllRewards(user.id);

        return NextResponse.json({
          success: result.success,
          claimed: {
            totalAmount: result.totalClaimed,
            count: result.claimedCount,
            currency: 'KAUS',
          },
          errors: result.errors.length > 0 ? result.errors : undefined,
          message: `Successfully claimed ${result.totalClaimed} KAUS from ${result.claimedCount} rewards!`,
          messageKo: `${result.claimedCount}개의 보상에서 ${result.totalClaimed} KAUS를 성공적으로 수령했습니다!`,
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
            validActions: ['register', 'claim', 'claim-all'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Referral API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
