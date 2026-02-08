/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 56: STAKING INTEREST CRON JOB
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 일별 이자 계산 및 적립 크론잡
 * Vercel Cron 또는 수동 호출로 실행
 *
 * Tasks:
 * 1. 모든 활성 스테이킹의 이자 계산
 * 2. accrued_interest 업데이트
 * 3. 쿨다운 완료된 언스테이킹 자동 처리
 * 4. 감사 로그 기록
 *
 * @route POST /api/kaus/staking/cron
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auditLogger } from '@/lib/audit/logger';
import { toFinancialPrecision, KAUS_PRICE_KRW } from '@/lib/payment/kaus-purchase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max for Vercel

// Cron secret for security
const CRON_SECRET = process.env.CRON_SECRET || 'cron-secret-key';

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
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function calculateDailyInterest(principal: number, apyPercent: number): number {
  const dailyRate = apyPercent / 100 / 365;
  return toFinancialPrecision(principal * dailyRate);
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST: Run Interest Calculation Cron
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

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Database unavailable',
      }, { status: 503 });
    }

    const results = {
      interestUpdated: 0,
      totalInterestAccrued: 0,
      cooldownProcessed: 0,
      totalReturned: 0,
      errors: [] as string[],
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // TASK 1: Update accrued interest for all active stakes
    // ═══════════════════════════════════════════════════════════════════════════

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: activeStakes, error: stakesError } = await (supabase as any)
      .from('stakes')
      .select('id, user_id, principal, apy_percent, accrued_interest, last_interest_calc')
      .eq('status', 'ACTIVE');

    if (stakesError) {
      results.errors.push(`Failed to fetch active stakes: ${stakesError.message}`);
    } else if (activeStakes) {
      for (const stake of activeStakes) {
        try {
          const lastCalc = new Date(stake.last_interest_calc);
          const hoursSinceLastCalc = (now.getTime() - lastCalc.getTime()) / (1000 * 60 * 60);

          // Only update if at least 12 hours since last calculation
          if (hoursSinceLastCalc >= 12) {
            const dailyInterest = calculateDailyInterest(stake.principal, stake.apy_percent);
            const daysToAdd = Math.floor(hoursSinceLastCalc / 24);
            const interestToAdd = toFinancialPrecision(dailyInterest * Math.max(1, daysToAdd));
            const newAccruedInterest = toFinancialPrecision(stake.accrued_interest + interestToAdd);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
              .from('stakes')
              .update({
                accrued_interest: newAccruedInterest,
                last_interest_calc: now.toISOString(),
                updated_at: now.toISOString(),
              })
              .eq('id', stake.id);

            results.interestUpdated++;
            results.totalInterestAccrued += interestToAdd;
          }
        } catch (err) {
          results.errors.push(`Stake ${stake.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TASK 2: Process completed cooldowns (auto-claim)
    // ═══════════════════════════════════════════════════════════════════════════

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: unstakingStakes, error: unstakingError } = await (supabase as any)
      .from('stakes')
      .select('*')
      .eq('status', 'UNSTAKING')
      .lte('cooldown_ends_at', now.toISOString());

    if (unstakingError) {
      results.errors.push(`Failed to fetch unstaking stakes: ${unstakingError.message}`);
    } else if (unstakingStakes) {
      for (const stake of unstakingStakes) {
        try {
          const returnAmount = toFinancialPrecision(
            stake.principal + stake.accrued_interest - (stake.penalty_amount || 0)
          );

          // Get user balance
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: user } = await (supabase as any)
            .from('users')
            .select('kaus_balance, total_staked, total_stake_earnings')
            .eq('id', stake.user_id)
            .single();

          if (user) {
            const currentBalance = toFinancialPrecision(user.kaus_balance || 0);
            const newBalance = toFinancialPrecision(currentBalance + returnAmount);

            // Update user balance
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
              .from('users')
              .update({
                kaus_balance: newBalance,
                total_staked: toFinancialPrecision(Math.max(0, (user.total_staked || 0) - stake.principal)),
                total_stake_earnings: toFinancialPrecision((user.total_stake_earnings || 0) + stake.accrued_interest),
                updated_at: now.toISOString(),
              })
              .eq('id', stake.user_id);

            // Update stake status
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
              .from('stakes')
              .update({
                status: 'COMPLETED',
                completed_at: now.toISOString(),
                updated_at: now.toISOString(),
              })
              .eq('id', stake.id);

            // Record transaction
            const txId = `TX-CRON-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
              .from('transactions')
              .insert({
                id: txId,
                user_id: stake.user_id,
                type: 'STAKING_REWARD',
                amount: returnAmount,
                balance_before: currentBalance,
                balance_after: newBalance,
                reference_id: stake.id,
                verified: true,
                created_at: now.toISOString(),
              });

            results.cooldownProcessed++;
            results.totalReturned += returnAmount;

            // Log completion
            await auditLogger.log({
              eventType: 'STAKING_WITHDRAW',
              userId: stake.user_id,
              amount: returnAmount,
              currency: 'KAUS',
              status: 'SUCCESS',
              details: {
                stakeId: stake.id,
                principal: stake.principal,
                accruedInterest: stake.accrued_interest,
                penalty: stake.penalty_amount,
                returnAmount,
                processedByCron: true,
              },
            });
          }
        } catch (err) {
          results.errors.push(`Unstake ${stake.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LOG CRON COMPLETION
    // ═══════════════════════════════════════════════════════════════════════════

    const duration = Date.now() - startTime;

    await auditLogger.log({
      eventType: 'YIELD_CLAIM',
      userId: 'SYSTEM',
      amount: results.totalInterestAccrued,
      currency: 'KAUS',
      status: 'SUCCESS',
      details: {
        type: 'STAKING_CRON',
        interestUpdated: results.interestUpdated,
        totalInterestAccrued: results.totalInterestAccrued,
        totalInterestKRW: toFinancialPrecision(results.totalInterestAccrued * KAUS_PRICE_KRW),
        cooldownProcessed: results.cooldownProcessed,
        totalReturned: results.totalReturned,
        duration: `${duration}ms`,
        errors: results.errors.length,
      },
    });

    return NextResponse.json({
      success: true,
      cronType: 'STAKING_INTEREST',
      results: {
        interestUpdated: results.interestUpdated,
        totalInterestAccrued: toFinancialPrecision(results.totalInterestAccrued),
        totalInterestKRW: toFinancialPrecision(results.totalInterestAccrued * KAUS_PRICE_KRW),
        cooldownProcessed: results.cooldownProcessed,
        totalReturned: toFinancialPrecision(results.totalReturned),
      },
      errors: results.errors.length > 0 ? results.errors : undefined,
      duration: `${duration}ms`,
      timestamp: now.toISOString(),
    });

  } catch (error) {
    console.error('[Staking Cron] Error:', error);

    await auditLogger.log({
      eventType: 'YIELD_CLAIM',
      userId: 'SYSTEM',
      status: 'FAILED',
      details: {
        type: 'STAKING_CRON',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Cron job failed',
    }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET: Cron Status
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET() {
  const supabase = getSupabaseAdmin();

  let stats = {
    activeStakes: 0,
    unstakingStakes: 0,
    totalPrincipal: 0,
    totalAccruedInterest: 0,
  };

  if (supabase) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: active } = await (supabase as any)
      .from('stakes')
      .select('principal, accrued_interest')
      .eq('status', 'ACTIVE');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: unstaking } = await (supabase as any)
      .from('stakes')
      .select('id')
      .eq('status', 'UNSTAKING');

    if (active) {
      stats.activeStakes = active.length;
      stats.totalPrincipal = active.reduce((sum: number, s: { principal: number }) => sum + s.principal, 0);
      stats.totalAccruedInterest = active.reduce((sum: number, s: { accrued_interest: number }) => sum + s.accrued_interest, 0);
    }

    if (unstaking) {
      stats.unstakingStakes = unstaking.length;
    }
  }

  return NextResponse.json({
    success: true,
    name: 'Staking Interest Cron',
    version: '1.0.0',
    schedule: 'Daily at 00:00 UTC',
    endpoint: 'POST /api/kaus/staking/cron',
    authentication: 'Bearer token or x-cron-secret header',
    stats: {
      activeStakes: stats.activeStakes,
      unstakingStakes: stats.unstakingStakes,
      totalPrincipal: toFinancialPrecision(stats.totalPrincipal),
      totalAccruedInterest: toFinancialPrecision(stats.totalAccruedInterest),
      totalValueKRW: toFinancialPrecision((stats.totalPrincipal + stats.totalAccruedInterest) * KAUS_PRICE_KRW),
    },
    tasks: [
      'Update accrued interest for active stakes',
      'Process completed cooldowns (auto-claim)',
      'Record transactions and audit logs',
    ],
  });
}
