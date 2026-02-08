/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 58: ADMIN FINANCE STATS API
 * ═══════════════════════════════════════════════════════════════════════════════
 * 금융 통계 대시보드 데이터
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { toFinancialPrecision } from '@/lib/payment/kaus-purchase';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const TOTAL_KAUS_SUPPLY = 10_000_000_000; // 100억 KAUS

// ═══════════════════════════════════════════════════════════════════════════════
// GET: Finance Stats
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      // Return default stats
      return NextResponse.json({
        success: true,
        stats: {
          totalKausSupply: TOTAL_KAUS_SUPPLY,
          totalKausCirculating: 0,
          totalWithdrawals24h: 0,
          totalDeposits24h: 0,
          pendingWithdrawals: 0,
          pendingWithdrawalAmount: 0,
        },
        message: 'Database not configured',
      });
    }

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get total circulating KAUS (sum of all user balances)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: users } = await (supabase as any)
      .from('users')
      .select('kaus_balance, total_staked');

    let totalCirculating = 0;
    let totalStaked = 0;
    if (users) {
      for (const user of users) {
        totalCirculating += user.kaus_balance || 0;
        totalStaked += user.total_staked || 0;
      }
    }

    // Get 24h deposits (purchases)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: deposits } = await (supabase as any)
      .from('transactions')
      .select('amount')
      .eq('type', 'PURCHASE')
      .gte('created_at', yesterday.toISOString());

    let totalDeposits24h = 0;
    if (deposits) {
      for (const d of deposits) {
        totalDeposits24h += d.amount || 0;
      }
    }

    // Get 24h withdrawals (completed)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: completedWithdrawals } = await (supabase as any)
      .from('transactions')
      .select('amount')
      .eq('type', 'WITHDRAWAL')
      .gte('created_at', yesterday.toISOString());

    let totalWithdrawals24h = 0;
    if (completedWithdrawals) {
      for (const w of completedWithdrawals) {
        totalWithdrawals24h += w.amount || 0;
      }
    }

    // Get pending withdrawals
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pendingWithdrawals, count: pendingCount } = await (supabase as any)
      .from('withdrawals')
      .select('amount', { count: 'exact' })
      .eq('status', 'PENDING');

    let pendingWithdrawalAmount = 0;
    if (pendingWithdrawals) {
      for (const w of pendingWithdrawals) {
        pendingWithdrawalAmount += w.amount || 0;
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalKausSupply: TOTAL_KAUS_SUPPLY,
        totalKausCirculating: toFinancialPrecision(totalCirculating + totalStaked),
        totalWithdrawals24h: toFinancialPrecision(totalWithdrawals24h),
        totalDeposits24h: toFinancialPrecision(totalDeposits24h),
        pendingWithdrawals: pendingCount || 0,
        pendingWithdrawalAmount: toFinancialPrecision(pendingWithdrawalAmount),
        totalStaked: toFinancialPrecision(totalStaked),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Admin Finance Stats] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
