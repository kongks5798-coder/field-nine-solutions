/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 74: ADMIN REVENUE DASHBOARD API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Real-time revenue metrics for the Boss's view
 * - Energy trading volume (kWh)
 * - KAUS exchange amount
 * - New signups
 * - Transaction history
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Get Supabase admin client
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET() {
  try {
    const supabase = getSupabase();

    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured',
      }, { status: 500 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Fetch today's KAUS transactions
    const { data: todayTx, error: txError } = await supabase
      .from('kaus_transactions')
      .select('from_amount, to_amount, fee, type, created_at')
      .gte('created_at', todayStart)
      .eq('status', 'COMPLETED');

    // Calculate today's metrics
    let todayKwhVolume = 0;
    let todayKausExchanged = 0;
    let todayFees = 0;
    let txCount = 0;

    if (todayTx && !txError) {
      todayTx.forEach(tx => {
        if (tx.type === 'EXCHANGE' && tx.from_amount) {
          todayKwhVolume += tx.from_amount;
          todayKausExchanged += tx.to_amount || 0;
          todayFees += tx.fee || 0;
          txCount++;
        }
      });
    }

    // Fetch new signups today
    const { count: todaySignups } = await supabase
      .from('user_wallets')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart);

    // Fetch total users
    const { count: totalUsers } = await supabase
      .from('user_wallets')
      .select('*', { count: 'exact', head: true });

    // Fetch total KAUS in circulation
    const { data: walletsData } = await supabase
      .from('user_wallets')
      .select('kaus_balance, kwh_balance');

    let totalKaus = 0;
    let totalKwh = 0;
    if (walletsData) {
      walletsData.forEach(w => {
        totalKaus += w.kaus_balance || 0;
        totalKwh += w.kwh_balance || 0;
      });
    }

    // Weekly comparison data
    const { data: weekTx } = await supabase
      .from('kaus_transactions')
      .select('from_amount, to_amount, created_at')
      .gte('created_at', weekStart)
      .eq('status', 'COMPLETED');

    let weekKwhVolume = 0;
    if (weekTx) {
      weekTx.forEach(tx => {
        if (tx.from_amount) weekKwhVolume += tx.from_amount;
      });
    }

    // Hourly breakdown for chart
    const hourlyData = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

      const hourTx = todayTx?.filter(tx => {
        const txTime = new Date(tx.created_at);
        return txTime >= hourStart && txTime < hourEnd;
      }) || [];

      let hourVolume = 0;
      let hourKaus = 0;
      hourTx.forEach(tx => {
        hourVolume += tx.from_amount || 0;
        hourKaus += tx.to_amount || 0;
      });

      hourlyData.push({
        hour: hourStart.getHours(),
        kwhVolume: hourVolume,
        kausExchanged: hourKaus,
        transactions: hourTx.length,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        realtime: {
          todayKwhVolume: Math.round(todayKwhVolume * 100) / 100,
          todayKausExchanged: Math.round(todayKausExchanged * 100) / 100,
          todayFees: Math.round(todayFees * 100) / 100,
          todayTransactions: txCount,
          todaySignups: todaySignups || 0,
        },
        totals: {
          totalUsers: totalUsers || 0,
          totalKausCirculation: Math.round(totalKaus * 100) / 100,
          totalKwhBalance: Math.round(totalKwh * 100) / 100,
        },
        weeklyComparison: {
          weekKwhVolume: Math.round(weekKwhVolume * 100) / 100,
          avgDailyVolume: Math.round((weekKwhVolume / 7) * 100) / 100,
        },
        hourlyChart: hourlyData,
      },
      timestamp: now.toISOString(),
    });

  } catch (error) {
    console.error('[Admin Revenue API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    }, { status: 500 });
  }
}
