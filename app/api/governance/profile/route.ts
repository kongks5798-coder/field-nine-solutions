/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 52: GOVERNANCE USER PROFILE API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * PRODUCTION DATA ONLY - No simulation, no mock
 * 실제 데이터베이스에서 사용자 투자 프로필 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════════
// TIER CALCULATION - Based on total assets
// ═══════════════════════════════════════════════════════════════════════════════

function calculateTier(totalAssets: number): 'Pioneer' | 'Sovereign' | 'Emperor' {
  if (totalAssets >= 50000) return 'Emperor';
  if (totalAssets >= 10000) return 'Sovereign';
  return 'Pioneer';
}

function calculateInvestmentStyle(riskTolerance: number, preferredApy: number): 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE' {
  if (riskTolerance < 30 || preferredApy < 8) return 'CONSERVATIVE';
  if (riskTolerance > 70 || preferredApy > 12) return 'AGGRESSIVE';
  return 'BALANCED';
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET: Fetch user investment profile from database
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check Supabase configuration
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('[Governance Profile API] Supabase not configured');
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Authenticate user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check supabaseAdmin availability
    if (!supabaseAdmin) {
      console.error('[Governance Profile API] supabaseAdmin not available');
      return NextResponse.json(
        { success: false, error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    // Fetch wallet data (KAUS balance) with error handling
    let wallet = null;
    try {
      const { data } = await supabaseAdmin
        .from('wallets')
        .select('balance, currency')
        .eq('user_id', user.id)
        .single();
      wallet = data;
    } catch (walletErr) {
      console.warn('[Governance Profile API] Wallet fetch error:', walletErr);
    }

    // Fetch user investment settings with error handling
    let investmentProfile = null;
    try {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      investmentProfile = data;
    } catch (profileErr) {
      console.warn('[Governance Profile API] Profile fetch error:', profileErr);
    }

    // Fetch staking data with error handling
    let stakingData: Array<{ amount: number; pool_id: string; apy: number }> | null = null;
    try {
      const { data } = await supabaseAdmin
        .from('staking_positions')
        .select('amount, pool_id, apy')
        .eq('user_id', user.id)
        .eq('status', 'active');
      stakingData = data;
    } catch (stakingErr) {
      console.warn('[Governance Profile API] Staking fetch error:', stakingErr);
    }

    // Calculate totals
    const kausBalance = Number(wallet?.balance || 0);
    const stakedAssets = stakingData?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;
    const totalAssets = kausBalance + stakedAssets;
    const liquidAssets = kausBalance;

    // Get risk tolerance from profile or default
    const riskTolerance = investmentProfile?.risk_tolerance ?? 50;
    const preferredApy = investmentProfile?.preferred_apy ?? 10;

    // Calculate derived values
    const tier = calculateTier(totalAssets);
    const investmentStyle = calculateInvestmentStyle(riskTolerance, preferredApy);

    const profile = {
      id: user.id,
      tier,
      investmentStyle,
      riskTolerance,
      preferredApy,
      totalAssets,
      stakedAssets,
      liquidAssets,
      createdAt: user.created_at,
      stakingPositions: stakingData || [],
    };

    return NextResponse.json({
      success: true,
      profile,
    });

  } catch (error) {
    console.error('[Governance Profile API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch investment profile' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH: Update user investment preferences
// ═══════════════════════════════════════════════════════════════════════════════

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { riskTolerance, preferredApy } = body;

    // Validate inputs
    if (riskTolerance !== undefined && (riskTolerance < 0 || riskTolerance > 100)) {
      return NextResponse.json(
        { error: 'riskTolerance must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (preferredApy !== undefined && (preferredApy < 0 || preferredApy > 50)) {
      return NextResponse.json(
        { error: 'preferredApy must be between 0 and 50' },
        { status: 400 }
      );
    }

    // Update profile
    const updateData: Record<string, unknown> = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    if (riskTolerance !== undefined) updateData.risk_tolerance = riskTolerance;
    if (preferredApy !== undefined) updateData.preferred_apy = preferredApy;

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .upsert(updateData, { onConflict: 'user_id' });

    if (updateError) {
      console.error('[Governance Profile API] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update investment preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Investment preferences updated',
    });

  } catch (error) {
    console.error('[Governance Profile API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update investment preferences' },
      { status: 500 }
    );
  }
}
