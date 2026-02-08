/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 54: REFERRAL LEADERBOARD API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * GET - Fetch global referral leaderboard (public)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReferralLeaderboard } from '@/lib/referral/engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Cap limit at 100
    const safeLimit = Math.min(Math.max(limit, 1), 100);

    const leaderboard = await getReferralLeaderboard(safeLimit);

    return NextResponse.json({
      success: true,
      leaderboard,
      total: leaderboard.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[REFERRAL LEADERBOARD] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
