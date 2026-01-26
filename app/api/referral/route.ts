/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 54: REFERRAL API ENDPOINT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * GET: Get user's referral code, stats, and leaderboard
 * POST: Validate/register referral code
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

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
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

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
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
