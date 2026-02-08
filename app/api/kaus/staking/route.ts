/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 56: KAUS STAKING & YIELD SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 스테이킹 & 이자 수익 시스템
 *
 * Features:
 * - 락업 기간별 APY (Flexible ~ 365일)
 * - 일별 이자 자동 적립
 * - 언스테이킹 쿨다운
 * - 조기 출금 페널티
 * - SHA-256 감사 로깅
 *
 * @route POST /api/kaus/staking - 스테이킹/언스테이킹
 * @route GET /api/kaus/staking - 스테이킹 정보/상태 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auditLogger, logBalanceUpdate } from '@/lib/audit/logger';
import { toFinancialPrecision, KAUS_PRICE_KRW } from '@/lib/payment/kaus-purchase';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════════
// STAKING PLANS
// ═══════════════════════════════════════════════════════════════════════════════

const STAKING_PLANS = [
  {
    id: 'flexible',
    name: 'Flexible',
    nameKo: '자유 스테이킹',
    lockDays: 0,
    apyPercent: 3.00000000,
    minAmount: 100.00000000,
    maxAmount: 1000000.00000000,
    earlyWithdrawPenalty: 0,
    cooldownHours: 0,
    description: '언제든 출금 가능, 낮은 이자율',
  },
  {
    id: '30days',
    name: '30 Days',
    nameKo: '30일 락업',
    lockDays: 30,
    apyPercent: 8.00000000,
    minAmount: 500.00000000,
    maxAmount: 5000000.00000000,
    earlyWithdrawPenalty: 5, // 5% penalty
    cooldownHours: 24,
    description: '30일 락업, 중간 수익률',
  },
  {
    id: '90days',
    name: '90 Days',
    nameKo: '90일 락업',
    lockDays: 90,
    apyPercent: 12.00000000,
    minAmount: 1000.00000000,
    maxAmount: 10000000.00000000,
    earlyWithdrawPenalty: 10,
    cooldownHours: 48,
    description: '90일 락업, 높은 수익률',
  },
  {
    id: '180days',
    name: '180 Days',
    nameKo: '180일 락업',
    lockDays: 180,
    apyPercent: 18.00000000,
    minAmount: 5000.00000000,
    maxAmount: 50000000.00000000,
    earlyWithdrawPenalty: 15,
    cooldownHours: 72,
    description: '180일 락업, 프리미엄 수익률',
  },
  {
    id: '365days',
    name: '365 Days',
    nameKo: '1년 락업',
    lockDays: 365,
    apyPercent: 25.00000000,
    minAmount: 10000.00000000,
    maxAmount: 100000000.00000000,
    earlyWithdrawPenalty: 20,
    cooldownHours: 168, // 7 days
    description: '1년 락업, 최고 수익률 (Sovereign 전용)',
  },
] as const;

type PlanId = typeof STAKING_PLANS[number]['id'];

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

function getPlan(planId: string) {
  return STAKING_PLANS.find(p => p.id === planId);
}

function calculateDailyInterest(principal: number, apyPercent: number): number {
  // Daily interest = Principal * (APY / 365)
  const dailyRate = apyPercent / 100 / 365;
  return toFinancialPrecision(principal * dailyRate);
}

function calculateAccruedInterest(
  principal: number,
  apyPercent: number,
  stakedAt: Date,
  now: Date = new Date()
): number {
  const daysDiff = Math.floor((now.getTime() - stakedAt.getTime()) / (1000 * 60 * 60 * 24));
  const dailyRate = apyPercent / 100 / 365;
  return toFinancialPrecision(principal * dailyRate * daysDiff);
}

function isLockupComplete(stakedAt: Date, lockDays: number): boolean {
  if (lockDays === 0) return true;
  const unlockDate = new Date(stakedAt.getTime() + lockDays * 24 * 60 * 60 * 1000);
  return new Date() >= unlockDate;
}

function getUnlockDate(stakedAt: Date, lockDays: number): Date {
  return new Date(stakedAt.getTime() + lockDays * 24 * 60 * 60 * 1000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST: Staking Actions
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, planId, amount, stakeId } = body as {
      action: 'stake' | 'unstake' | 'claim' | 'cancel-unstake';
      userId: string;
      planId?: PlanId;
      amount?: number;
      stakeId?: string;
    };

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '로그인이 필요합니다.',
        code: 'AUTH_REQUIRED',
      }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Database unavailable',
      }, { status: 503 });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTION: STAKE
    // ═══════════════════════════════════════════════════════════════════════════

    if (action === 'stake') {
      if (!planId || !amount) {
        return NextResponse.json({
          success: false,
          error: '플랜과 금액을 선택하세요.',
        }, { status: 400 });
      }

      const plan = getPlan(planId);
      if (!plan) {
        return NextResponse.json({
          success: false,
          error: '유효하지 않은 스테이킹 플랜입니다.',
        }, { status: 400 });
      }

      const stakeAmount = toFinancialPrecision(amount);

      if (stakeAmount < plan.minAmount) {
        return NextResponse.json({
          success: false,
          error: `최소 스테이킹 금액: ${plan.minAmount.toLocaleString()} KAUS`,
          minimum: plan.minAmount,
        }, { status: 400 });
      }

      if (stakeAmount > plan.maxAmount) {
        return NextResponse.json({
          success: false,
          error: `최대 스테이킹 금액: ${plan.maxAmount.toLocaleString()} KAUS`,
          maximum: plan.maxAmount,
        }, { status: 400 });
      }

      // Get user balance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: user } = await (supabase as any)
        .from('users')
        .select('kaus_balance, pending_withdrawals')
        .eq('id', userId)
        .single();

      const currentBalance = toFinancialPrecision(user?.kaus_balance || 0);
      const pendingWithdrawals = toFinancialPrecision(user?.pending_withdrawals || 0);
      const availableBalance = toFinancialPrecision(currentBalance - pendingWithdrawals);

      if (stakeAmount > availableBalance) {
        return NextResponse.json({
          success: false,
          error: `잔액 부족. 사용 가능: ${availableBalance.toLocaleString()} KAUS`,
          available: availableBalance,
        }, { status: 400 });
      }

      // Create stake record
      const newStakeId = `STK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const now = new Date();
      const unlockDate = getUnlockDate(now, plan.lockDays);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('stakes')
        .insert({
          id: newStakeId,
          user_id: userId,
          plan_id: planId,
          principal: stakeAmount,
          apy_percent: plan.apyPercent,
          lock_days: plan.lockDays,
          accrued_interest: 0,
          last_interest_calc: now.toISOString(),
          staked_at: now.toISOString(),
          unlock_at: unlockDate.toISOString(),
          status: 'ACTIVE',
          created_at: now.toISOString(),
        });

      // Deduct from user balance
      const newBalance = toFinancialPrecision(currentBalance - stakeAmount);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('users')
        .update({
          kaus_balance: newBalance,
          total_staked: toFinancialPrecision((user?.total_staked || 0) + stakeAmount),
          updated_at: now.toISOString(),
        })
        .eq('id', userId);

      // Record transaction
      const txId = `TX-STK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('transactions')
        .insert({
          id: txId,
          user_id: userId,
          type: 'STAKING_DEPOSIT',
          amount: -stakeAmount, // Negative because deducted
          balance_before: currentBalance,
          balance_after: newBalance,
          reference_id: newStakeId,
          verified: true,
          created_at: now.toISOString(),
        });

      // Audit log
      await auditLogger.log({
        eventType: 'STAKING_DEPOSIT',
        userId,
        amount: stakeAmount,
        currency: 'KAUS',
        status: 'SUCCESS',
        details: {
          stakeId: newStakeId,
          planId,
          planName: plan.name,
          apyPercent: plan.apyPercent,
          lockDays: plan.lockDays,
          unlockAt: unlockDate.toISOString(),
          previousBalance: currentBalance,
          newBalance,
        },
      });

      // Calculate expected earnings
      const dailyInterest = calculateDailyInterest(stakeAmount, plan.apyPercent);
      const monthlyInterest = toFinancialPrecision(dailyInterest * 30);
      const yearlyInterest = toFinancialPrecision(stakeAmount * (plan.apyPercent / 100));

      return NextResponse.json({
        success: true,
        stakeId: newStakeId,
        planId,
        planName: plan.name,
        principal: stakeAmount,
        apyPercent: plan.apyPercent,
        lockDays: plan.lockDays,
        unlockAt: unlockDate.toISOString(),
        newBalance,
        expectedEarnings: {
          daily: dailyInterest,
          monthly: monthlyInterest,
          yearly: yearlyInterest,
          dailyKRW: toFinancialPrecision(dailyInterest * KAUS_PRICE_KRW),
          monthlyKRW: toFinancialPrecision(monthlyInterest * KAUS_PRICE_KRW),
          yearlyKRW: toFinancialPrecision(yearlyInterest * KAUS_PRICE_KRW),
        },
        message: `${stakeAmount.toLocaleString()} KAUS 스테이킹 완료! 예상 일일 수익: ${dailyInterest.toFixed(4)} KAUS`,
        timestamp: now.toISOString(),
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTION: UNSTAKE
    // ═══════════════════════════════════════════════════════════════════════════

    if (action === 'unstake') {
      if (!stakeId) {
        return NextResponse.json({
          success: false,
          error: 'Stake ID required',
        }, { status: 400 });
      }

      // Get stake record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: stake } = await (supabase as any)
        .from('stakes')
        .select('*')
        .eq('id', stakeId)
        .eq('user_id', userId)
        .single();

      if (!stake) {
        return NextResponse.json({
          success: false,
          error: '스테이킹 정보를 찾을 수 없습니다.',
        }, { status: 404 });
      }

      if (stake.status !== 'ACTIVE') {
        return NextResponse.json({
          success: false,
          error: `이미 ${stake.status === 'UNSTAKING' ? '언스테이킹 중' : '완료'}입니다.`,
        }, { status: 400 });
      }

      const plan = getPlan(stake.plan_id);
      if (!plan) {
        return NextResponse.json({
          success: false,
          error: 'Invalid plan',
        }, { status: 400 });
      }

      const stakedAt = new Date(stake.staked_at);
      const now = new Date();
      const lockupComplete = isLockupComplete(stakedAt, plan.lockDays);

      // Calculate accrued interest
      const accruedInterest = calculateAccruedInterest(
        stake.principal,
        plan.apyPercent,
        stakedAt,
        now
      );

      // Calculate penalty if early withdrawal
      let penalty = 0;
      if (!lockupComplete && plan.earlyWithdrawPenalty > 0) {
        penalty = toFinancialPrecision(stake.principal * (plan.earlyWithdrawPenalty / 100));
      }

      // Calculate cooldown end time
      const cooldownEnd = plan.cooldownHours > 0
        ? new Date(now.getTime() + plan.cooldownHours * 60 * 60 * 1000)
        : now;

      // Update stake status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('stakes')
        .update({
          status: plan.cooldownHours > 0 ? 'UNSTAKING' : 'COMPLETED',
          accrued_interest: accruedInterest,
          penalty_amount: penalty,
          unstake_requested_at: now.toISOString(),
          cooldown_ends_at: cooldownEnd.toISOString(),
          completed_at: plan.cooldownHours > 0 ? null : now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', stakeId);

      // If no cooldown, process immediately
      if (plan.cooldownHours === 0) {
        const returnAmount = toFinancialPrecision(stake.principal + accruedInterest - penalty);

        // Get current balance
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: user } = await (supabase as any)
          .from('users')
          .select('kaus_balance, total_staked')
          .eq('id', userId)
          .single();

        const currentBalance = toFinancialPrecision(user?.kaus_balance || 0);
        const newBalance = toFinancialPrecision(currentBalance + returnAmount);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('users')
          .update({
            kaus_balance: newBalance,
            total_staked: toFinancialPrecision(Math.max(0, (user?.total_staked || 0) - stake.principal)),
            total_stake_earnings: toFinancialPrecision((user?.total_stake_earnings || 0) + accruedInterest),
            updated_at: now.toISOString(),
          })
          .eq('id', userId);

        await logBalanceUpdate(userId, currentBalance, newBalance, 'STAKING_WITHDRAW', stakeId);

        return NextResponse.json({
          success: true,
          stakeId,
          status: 'COMPLETED',
          principal: stake.principal,
          accruedInterest,
          penalty,
          returnAmount,
          newBalance,
          message: `언스테이킹 완료! ${returnAmount.toLocaleString()} KAUS 지급`,
          timestamp: now.toISOString(),
        });
      }

      // Cooldown required
      await auditLogger.log({
        eventType: 'STAKING_WITHDRAW',
        userId,
        amount: stake.principal,
        currency: 'KAUS',
        status: 'PENDING',
        details: {
          stakeId,
          accruedInterest,
          penalty,
          cooldownHours: plan.cooldownHours,
          cooldownEndsAt: cooldownEnd.toISOString(),
          earlyWithdrawal: !lockupComplete,
        },
      });

      return NextResponse.json({
        success: true,
        stakeId,
        status: 'UNSTAKING',
        principal: stake.principal,
        accruedInterest,
        penalty,
        expectedReturn: toFinancialPrecision(stake.principal + accruedInterest - penalty),
        cooldownHours: plan.cooldownHours,
        cooldownEndsAt: cooldownEnd.toISOString(),
        earlyWithdrawal: !lockupComplete,
        message: `언스테이킹 요청 완료. ${plan.cooldownHours}시간 후 지급됩니다.`,
        timestamp: now.toISOString(),
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTION: CLAIM (Complete unstaking after cooldown)
    // ═══════════════════════════════════════════════════════════════════════════

    if (action === 'claim') {
      if (!stakeId) {
        return NextResponse.json({
          success: false,
          error: 'Stake ID required',
        }, { status: 400 });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: stake } = await (supabase as any)
        .from('stakes')
        .select('*')
        .eq('id', stakeId)
        .eq('user_id', userId)
        .single();

      if (!stake) {
        return NextResponse.json({
          success: false,
          error: '스테이킹 정보를 찾을 수 없습니다.',
        }, { status: 404 });
      }

      if (stake.status !== 'UNSTAKING') {
        return NextResponse.json({
          success: false,
          error: '언스테이킹 중인 상태가 아닙니다.',
        }, { status: 400 });
      }

      const now = new Date();
      const cooldownEnds = new Date(stake.cooldown_ends_at);

      if (now < cooldownEnds) {
        const remainingMs = cooldownEnds.getTime() - now.getTime();
        const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));

        return NextResponse.json({
          success: false,
          error: `쿨다운 ${remainingHours}시간 남았습니다.`,
          cooldownEndsAt: cooldownEnds.toISOString(),
          remainingHours,
        }, { status: 400 });
      }

      // Process claim
      const returnAmount = toFinancialPrecision(
        stake.principal + stake.accrued_interest - (stake.penalty_amount || 0)
      );

      // Get current balance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: user } = await (supabase as any)
        .from('users')
        .select('kaus_balance, total_staked, total_stake_earnings')
        .eq('id', userId)
        .single();

      const currentBalance = toFinancialPrecision(user?.kaus_balance || 0);
      const newBalance = toFinancialPrecision(currentBalance + returnAmount);

      // Update user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('users')
        .update({
          kaus_balance: newBalance,
          total_staked: toFinancialPrecision(Math.max(0, (user?.total_staked || 0) - stake.principal)),
          total_stake_earnings: toFinancialPrecision((user?.total_stake_earnings || 0) + stake.accrued_interest),
          updated_at: now.toISOString(),
        })
        .eq('id', userId);

      // Update stake
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('stakes')
        .update({
          status: 'COMPLETED',
          completed_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', stakeId);

      // Record transaction
      const txId = `TX-UNSTK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('transactions')
        .insert({
          id: txId,
          user_id: userId,
          type: 'STAKING_REWARD',
          amount: returnAmount,
          balance_before: currentBalance,
          balance_after: newBalance,
          reference_id: stakeId,
          verified: true,
          created_at: now.toISOString(),
        });

      await logBalanceUpdate(userId, currentBalance, newBalance, 'STAKING_WITHDRAW', stakeId);

      await auditLogger.log({
        eventType: 'STAKING_WITHDRAW',
        userId,
        amount: returnAmount,
        currency: 'KAUS',
        status: 'SUCCESS',
        details: {
          stakeId,
          principal: stake.principal,
          accruedInterest: stake.accrued_interest,
          penalty: stake.penalty_amount,
          returnAmount,
          newBalance,
        },
      });

      return NextResponse.json({
        success: true,
        stakeId,
        status: 'COMPLETED',
        principal: stake.principal,
        accruedInterest: stake.accrued_interest,
        penalty: stake.penalty_amount || 0,
        returnAmount,
        newBalance,
        message: `${returnAmount.toLocaleString()} KAUS 지급 완료!`,
        timestamp: now.toISOString(),
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: stake, unstake, claim',
    }, { status: 400 });

  } catch (error) {
    console.error('[Staking] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET: Staking Info / User Stakes
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  // Return plans info if no userId
  if (!userId) {
    return NextResponse.json({
      success: true,
      name: 'KAUS Staking System',
      version: '1.0.0',
      phase: 56,
      plans: STAKING_PLANS.map(plan => ({
        id: plan.id,
        name: plan.name,
        nameKo: plan.nameKo,
        lockDays: plan.lockDays,
        apyPercent: plan.apyPercent,
        minAmount: plan.minAmount,
        maxAmount: plan.maxAmount,
        earlyWithdrawPenalty: plan.earlyWithdrawPenalty,
        cooldownHours: plan.cooldownHours,
        description: plan.description,
        // Example earnings for 10,000 KAUS
        exampleEarnings: {
          principal: 10000,
          daily: calculateDailyInterest(10000, plan.apyPercent),
          monthly: toFinancialPrecision(calculateDailyInterest(10000, plan.apyPercent) * 30),
          yearly: toFinancialPrecision(10000 * (plan.apyPercent / 100)),
        },
      })),
      actions: ['stake', 'unstake', 'claim'],
      message: '스테이킹하고 최대 25% APY 수익을 받으세요!',
    });
  }

  // Get user's stakes
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Database unavailable',
      }, { status: 503 });
    }

    // Get all user stakes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: stakes } = await (supabase as any)
      .from('stakes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get user stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user } = await (supabase as any)
      .from('users')
      .select('total_staked, total_stake_earnings')
      .eq('id', userId)
      .single();

    const now = new Date();
    const formattedStakes = (stakes || []).map((stake: {
      id: string;
      plan_id: string;
      principal: number;
      apy_percent: number;
      lock_days: number;
      accrued_interest: number;
      staked_at: string;
      unlock_at: string;
      status: string;
      cooldown_ends_at?: string;
      penalty_amount?: number;
    }) => {
      const plan = getPlan(stake.plan_id);
      const stakedAt = new Date(stake.staked_at);
      const currentInterest = stake.status === 'ACTIVE'
        ? calculateAccruedInterest(stake.principal, stake.apy_percent, stakedAt, now)
        : stake.accrued_interest;

      return {
        id: stake.id,
        planId: stake.plan_id,
        planName: plan?.name || stake.plan_id,
        principal: stake.principal,
        apyPercent: stake.apy_percent,
        lockDays: stake.lock_days,
        accruedInterest: currentInterest,
        accruedInterestKRW: toFinancialPrecision(currentInterest * KAUS_PRICE_KRW),
        stakedAt: stake.staked_at,
        unlockAt: stake.unlock_at,
        status: stake.status,
        isUnlocked: isLockupComplete(stakedAt, stake.lock_days),
        cooldownEndsAt: stake.cooldown_ends_at,
        penalty: stake.penalty_amount,
        dailyInterest: calculateDailyInterest(stake.principal, stake.apy_percent),
      };
    });

    // Calculate totals
    const activeStakes = formattedStakes.filter((s: { status: string }) => s.status === 'ACTIVE');
    const totalPrincipal = activeStakes.reduce((sum: number, s: { principal: number }) => sum + s.principal, 0);
    const totalAccruedInterest = activeStakes.reduce((sum: number, s: { accruedInterest: number }) => sum + s.accruedInterest, 0);
    const totalDailyInterest = activeStakes.reduce((sum: number, s: { dailyInterest: number }) => sum + s.dailyInterest, 0);

    return NextResponse.json({
      success: true,
      userId,
      summary: {
        totalStaked: toFinancialPrecision(user?.total_staked || 0),
        totalEarnings: toFinancialPrecision(user?.total_stake_earnings || 0),
        activePrincipal: toFinancialPrecision(totalPrincipal),
        accruedInterest: toFinancialPrecision(totalAccruedInterest),
        dailyInterest: toFinancialPrecision(totalDailyInterest),
        monthlyInterest: toFinancialPrecision(totalDailyInterest * 30),
        fiat: {
          totalStakedKRW: toFinancialPrecision((user?.total_staked || 0) * KAUS_PRICE_KRW),
          accruedInterestKRW: toFinancialPrecision(totalAccruedInterest * KAUS_PRICE_KRW),
          dailyInterestKRW: toFinancialPrecision(totalDailyInterest * KAUS_PRICE_KRW),
        },
      },
      stakes: formattedStakes,
      activeCount: activeStakes.length,
      totalCount: formattedStakes.length,
      timestamp: now.toISOString(),
    });

  } catch (error) {
    console.error('[Staking GET] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
