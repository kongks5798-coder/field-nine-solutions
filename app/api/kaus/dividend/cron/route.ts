/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 78: RWA DAILY DIVIDEND CRON JOB
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 매일 정오(KST) 실행 - 실제 에너지 발전 수익을 유저 kaus_balance에 자동 정산
 *
 * Vercel Cron: 0 3 * * * (UTC 03:00 = KST 12:00)
 *
 * Tasks:
 * 1. 영동 태양광 발전소 일일 수익 조회
 * 2. 테슬라 V2G 배터리 수익 조회
 * 3. 유저별 지분에 따른 배당금 계산
 * 4. kaus_balance에 자동 정산
 * 5. 감사 로그 기록
 *
 * @route POST /api/kaus/dividend/cron
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchYeongdongForecast } from '@/lib/energy/yeongdong-live';
import { fetchTeslaLiveData, calculateV2GEarnings } from '@/lib/tesla/live-api';
import { auditLogger } from '@/lib/audit/logger';
import { toFinancialPrecision, KAUS_PRICE_KRW } from '@/lib/payment/kaus-purchase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Cron secret for security
const CRON_SECRET = process.env.CRON_SECRET || 'cron-secret-key';

// RWA Configuration
const RWA_CONFIG = {
  // Total asset value backing KAUS
  totalAssetValueUSD: 10_000_000, // $10M empire

  // Revenue distribution (daily)
  yeongdongRevenueShare: 0.40, // 40% to KAUS holders
  teslaV2GRevenueShare: 0.35, // 35% to KAUS holders
  operationalReserve: 0.25, // 25% for operations

  // Minimum threshold for dividend
  minDividendKAUS: 0.01,

  // KAUS per kWh from real energy
  kausPerKwhGenerated: 0.1,
};

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
// HELPER: Calculate user's share of daily revenue
// ═══════════════════════════════════════════════════════════════════════════════

function calculateUserDividend(
  userBalance: number,
  totalCirculatingKAUS: number,
  dailyRevenueKAUS: number
): number {
  if (totalCirculatingKAUS <= 0 || userBalance <= 0) return 0;

  const userShare = userBalance / totalCirculatingKAUS;
  const dividend = dailyRevenueKAUS * userShare;

  return toFinancialPrecision(dividend);
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST: Run Daily Dividend Distribution
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = request.headers.get('x-cron-secret');

  if (authHeader !== `Bearer ${CRON_SECRET}` && cronSecret !== CRON_SECRET) {
    return NextResponse.json({
      success: false,
      error: 'Unauthorized',
    }, { status: 401 });
  }

  const startTime = Date.now();
  const now = new Date();
  const distributionId = `DIV-${now.toISOString().split('T')[0]}-${Date.now().toString(36).toUpperCase()}`;

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Database unavailable',
      }, { status: 503 });
    }

    const results = {
      usersProcessed: 0,
      totalDividendDistributed: 0,
      yeongdongRevenue: 0,
      teslaV2GRevenue: 0,
      totalRevenueKAUS: 0,
      errors: [] as string[],
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: Fetch Real Energy Revenue Data
    // ═══════════════════════════════════════════════════════════════════════════

    // Yeongdong Solar Farm daily earnings
    const yeongdongData = await fetchYeongdongForecast();
    const yeongdongDailyKRW = yeongdongData.todayEarningsKRW;
    const yeongdongRevenueKAUS = toFinancialPrecision(
      (yeongdongDailyKRW / KAUS_PRICE_KRW) * RWA_CONFIG.yeongdongRevenueShare
    );
    results.yeongdongRevenue = yeongdongRevenueKAUS;

    // Tesla V2G daily earnings
    const teslaData = await fetchTeslaLiveData();
    const v2gEarnings = calculateV2GEarnings(teslaData, yeongdongData.smpPrice);
    const teslaRevenueKAUS = toFinancialPrecision(
      (v2gEarnings.dailyEarnings / KAUS_PRICE_KRW) * RWA_CONFIG.teslaV2GRevenueShare
    );
    results.teslaV2GRevenue = teslaRevenueKAUS;

    // Total revenue for distribution
    const totalRevenueKAUS = toFinancialPrecision(yeongdongRevenueKAUS + teslaRevenueKAUS);
    results.totalRevenueKAUS = totalRevenueKAUS;

    if (totalRevenueKAUS < RWA_CONFIG.minDividendKAUS) {
      return NextResponse.json({
        success: true,
        message: 'Revenue below minimum threshold, skipping distribution',
        revenue: totalRevenueKAUS,
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: Get Total Circulating KAUS
    // ═══════════════════════════════════════════════════════════════════════════

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: balanceStats, error: statsError } = await (supabase as any)
      .from('users')
      .select('kaus_balance')
      .gt('kaus_balance', 0);

    if (statsError) {
      results.errors.push(`Failed to fetch balance stats: ${statsError.message}`);
      throw new Error('Cannot calculate circulating supply');
    }

    const totalCirculatingKAUS = balanceStats.reduce(
      (sum: number, user: { kaus_balance: number }) => sum + (user.kaus_balance || 0),
      0
    );

    if (totalCirculatingKAUS <= 0) {
      return NextResponse.json({
        success: true,
        message: 'No circulating KAUS, skipping distribution',
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: Distribute Dividends to All Holders
    // ═══════════════════════════════════════════════════════════════════════════

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: holders, error: holdersError } = await (supabase as any)
      .from('users')
      .select('id, email, kaus_balance, total_dividends_earned')
      .gt('kaus_balance', RWA_CONFIG.minDividendKAUS);

    if (holdersError) {
      results.errors.push(`Failed to fetch holders: ${holdersError.message}`);
      throw new Error('Cannot fetch KAUS holders');
    }

    for (const holder of holders) {
      try {
        const dividend = calculateUserDividend(
          holder.kaus_balance,
          totalCirculatingKAUS,
          totalRevenueKAUS
        );

        if (dividend < RWA_CONFIG.minDividendKAUS) continue;

        const currentBalance = toFinancialPrecision(holder.kaus_balance || 0);
        const newBalance = toFinancialPrecision(currentBalance + dividend);
        const totalDividends = toFinancialPrecision((holder.total_dividends_earned || 0) + dividend);

        // Update user balance
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('users')
          .update({
            kaus_balance: newBalance,
            total_dividends_earned: totalDividends,
            last_dividend_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('id', holder.id);

        // Record dividend transaction
        const txId = `TX-DIV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('transactions')
          .insert({
            id: txId,
            user_id: holder.id,
            type: 'RWA_DIVIDEND',
            amount: dividend,
            balance_before: currentBalance,
            balance_after: newBalance,
            reference_id: distributionId,
            verified: true,
            metadata: {
              yeongdongShare: toFinancialPrecision(dividend * (yeongdongRevenueKAUS / totalRevenueKAUS)),
              teslaV2GShare: toFinancialPrecision(dividend * (teslaRevenueKAUS / totalRevenueKAUS)),
              userSharePercent: toFinancialPrecision((holder.kaus_balance / totalCirculatingKAUS) * 100),
              distributionId,
            },
            created_at: now.toISOString(),
          });

        results.usersProcessed++;
        results.totalDividendDistributed += dividend;

      } catch (err) {
        results.errors.push(`User ${holder.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 4: Record Distribution Summary
    // ═══════════════════════════════════════════════════════════════════════════

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('dividend_distributions')
      .insert({
        id: distributionId,
        distribution_date: now.toISOString().split('T')[0],
        yeongdong_revenue_krw: yeongdongDailyKRW,
        yeongdong_revenue_kaus: yeongdongRevenueKAUS,
        tesla_v2g_revenue_krw: v2gEarnings.dailyEarnings,
        tesla_v2g_revenue_kaus: teslaRevenueKAUS,
        total_revenue_kaus: totalRevenueKAUS,
        total_distributed_kaus: toFinancialPrecision(results.totalDividendDistributed),
        users_count: results.usersProcessed,
        circulating_supply: totalCirculatingKAUS,
        smp_price: yeongdongData.smpPrice,
        weather_condition: yeongdongData.weatherCondition,
        tesla_v2g_status: teslaData.v2gStatus,
        created_at: now.toISOString(),
      });

    // ═══════════════════════════════════════════════════════════════════════════
    // LOG COMPLETION
    // ═══════════════════════════════════════════════════════════════════════════

    const duration = Date.now() - startTime;

    await auditLogger.log({
      eventType: 'YIELD_CLAIM',
      userId: 'SYSTEM',
      amount: results.totalDividendDistributed,
      currency: 'KAUS',
      status: 'SUCCESS',
      details: {
        type: 'RWA_DIVIDEND_DISTRIBUTION',
        distributionId,
        usersProcessed: results.usersProcessed,
        yeongdongRevenue: results.yeongdongRevenue,
        teslaV2GRevenue: results.teslaV2GRevenue,
        totalRevenueKAUS: results.totalRevenueKAUS,
        totalDistributed: toFinancialPrecision(results.totalDividendDistributed),
        circulatingSupply: totalCirculatingKAUS,
        duration: `${duration}ms`,
        errors: results.errors.length,
      },
    });

    return NextResponse.json({
      success: true,
      cronType: 'RWA_DAILY_DIVIDEND',
      distributionId,
      results: {
        usersProcessed: results.usersProcessed,
        totalDividendDistributed: toFinancialPrecision(results.totalDividendDistributed),
        totalDividendKRW: toFinancialPrecision(results.totalDividendDistributed * KAUS_PRICE_KRW),
        revenueBreakdown: {
          yeongdongSolar: toFinancialPrecision(results.yeongdongRevenue),
          teslaV2G: toFinancialPrecision(results.teslaV2GRevenue),
          total: toFinancialPrecision(results.totalRevenueKAUS),
        },
        circulatingSupply: toFinancialPrecision(totalCirculatingKAUS),
        marketData: {
          smpPrice: yeongdongData.smpPrice,
          weatherCondition: yeongdongData.weatherCondition,
          v2gStatus: teslaData.v2gStatus,
        },
      },
      errors: results.errors.length > 0 ? results.errors : undefined,
      duration: `${duration}ms`,
      timestamp: now.toISOString(),
    });

  } catch (error) {
    console.error('[Dividend Cron] Error:', error);

    await auditLogger.log({
      eventType: 'YIELD_CLAIM',
      userId: 'SYSTEM',
      status: 'FAILED',
      details: {
        type: 'RWA_DIVIDEND_DISTRIBUTION',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Dividend distribution failed',
    }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET: Dividend Status & History
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET() {
  const supabase = getSupabaseAdmin();

  let stats = {
    lastDistribution: null as string | null,
    totalDistributed: 0,
    totalUsers: 0,
    averageDividend: 0,
    recentDistributions: [] as unknown[],
  };

  if (supabase) {
    // Get recent distributions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: distributions } = await (supabase as any)
      .from('dividend_distributions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(7);

    if (distributions && distributions.length > 0) {
      stats.lastDistribution = distributions[0].distribution_date;
      stats.totalDistributed = distributions.reduce(
        (sum: number, d: { total_distributed_kaus: number }) => sum + d.total_distributed_kaus,
        0
      );
      stats.totalUsers = distributions[0].users_count;
      stats.averageDividend = stats.totalDistributed / (stats.totalUsers || 1);
      stats.recentDistributions = distributions.map((d: {
        distribution_date: string;
        total_distributed_kaus: number;
        users_count: number;
        yeongdong_revenue_kaus: number;
        tesla_v2g_revenue_kaus: number;
      }) => ({
        date: d.distribution_date,
        amount: d.total_distributed_kaus,
        users: d.users_count,
        yeongdong: d.yeongdong_revenue_kaus,
        tesla: d.tesla_v2g_revenue_kaus,
      }));
    }
  }

  return NextResponse.json({
    success: true,
    name: 'RWA Daily Dividend Cron',
    version: '1.0.0',
    schedule: 'Daily at 12:00 KST (03:00 UTC)',
    endpoint: 'POST /api/kaus/dividend/cron',
    authentication: 'Bearer token or x-cron-secret header',
    stats: {
      lastDistribution: stats.lastDistribution,
      totalDistributed7Days: toFinancialPrecision(stats.totalDistributed),
      totalDistributedKRW: toFinancialPrecision(stats.totalDistributed * KAUS_PRICE_KRW),
      activeUsers: stats.totalUsers,
      averageDividend: toFinancialPrecision(stats.averageDividend),
    },
    recentDistributions: stats.recentDistributions,
    revenueSources: [
      { name: '영동 50MW 태양광 발전소', share: '40%', type: 'Solar Generation' },
      { name: '테슬라 사이버트럭 V2G', share: '35%', type: 'Vehicle-to-Grid' },
      { name: '운영 예비금', share: '25%', type: 'Reserve' },
    ],
    rwaAssets: {
      totalValueUSD: RWA_CONFIG.totalAssetValueUSD,
      description: 'Real World Assets backing KAUS token',
    },
  });
}
