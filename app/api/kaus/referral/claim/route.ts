/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 79: REFERRAL PAYOUT API WITH AUDIT LOGGING
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 신규 가입자가 리퍼럴 코드 입력 시:
 * - 양측 지갑에 10 KAUS 즉시 지급
 * - DB 트랜잭션 기반 안전한 처리
 * - 운영 로거에 모든 내역 기록
 *
 * @route POST /api/kaus/referral/claim
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auditLogger, logKausTransaction } from '@/lib/logging/audit-logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

const ReferralClaimSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  referralCode: z.string().min(4, 'Invalid referral code').max(20),
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const REFERRAL_BONUS = {
  REFEREE: 10,   // New user gets 10 KAUS
  REFERRER: 10,  // Code owner gets 10 KAUS
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
// POST: Claim Referral Bonus
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const transactionId = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  try {
    const body = await request.json();

    // Validate input
    const validation = ReferralClaimSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`);

      auditLogger.warn('kaus', 'referral_validation_failed', 'Referral claim validation failed', {
        errors,
        transactionId,
      });

      return NextResponse.json({
        success: false,
        error: errors.join(', '),
        code: 'VALIDATION_ERROR',
      }, { status: 400 });
    }

    const { userId, referralCode } = validation.data;

    auditLogger.info('kaus', 'referral_claim_initiated', 'Referral claim process started', {
      transactionId,
      userId,
      referralCode: referralCode.toUpperCase(),
    });

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      auditLogger.error('system', 'db_unavailable', 'Database unavailable for referral claim', undefined, {
        transactionId,
      });

      return NextResponse.json({
        success: false,
        error: 'System unavailable',
        code: 'DB_UNAVAILABLE',
      }, { status: 503 });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: Validate Referral Code
    // ═══════════════════════════════════════════════════════════════════════════

    const { data: codeData, error: codeError } = await supabase
      .from('referral_codes')
      .select('user_id, code, is_active, total_referrals, total_earnings')
      .eq('code', referralCode.toUpperCase())
      .single();

    if (codeError || !codeData) {
      auditLogger.warn('kaus', 'referral_code_invalid', 'Invalid referral code attempted', {
        transactionId,
        userId,
        referralCode: referralCode.toUpperCase(),
      });

      return NextResponse.json({
        success: false,
        error: '유효하지 않은 추천 코드입니다.',
        code: 'INVALID_CODE',
      }, { status: 400 });
    }

    if (!codeData.is_active) {
      return NextResponse.json({
        success: false,
        error: '비활성화된 추천 코드입니다.',
        code: 'CODE_INACTIVE',
      }, { status: 400 });
    }

    // Prevent self-referral
    if (codeData.user_id === userId) {
      auditLogger.warn('security', 'self_referral_attempt', 'User attempted self-referral', {
        transactionId,
        userId,
      });

      return NextResponse.json({
        success: false,
        error: '본인 코드는 사용할 수 없습니다.',
        code: 'SELF_REFERRAL',
      }, { status: 400 });
    }

    const referrerId = codeData.user_id;

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: Check if Already Referred
    // ═══════════════════════════════════════════════════════════════════════════

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('referred_by')
      .eq('user_id', userId)
      .single();

    if (userProfile?.referred_by) {
      auditLogger.warn('kaus', 'already_referred', 'User already has a referrer', {
        transactionId,
        userId,
        existingReferrer: userProfile.referred_by,
      });

      return NextResponse.json({
        success: false,
        error: '이미 추천 코드를 사용했습니다.',
        code: 'ALREADY_REFERRED',
      }, { status: 400 });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: Execute Bonus Payout (Transactional)
    // ═══════════════════════════════════════════════════════════════════════════

    // Get current balances
    const [refereeWallet, referrerWallet] = await Promise.all([
      supabase.from('user_wallets').select('kaus_balance').eq('user_id', userId).single(),
      supabase.from('user_wallets').select('kaus_balance').eq('user_id', referrerId).single(),
    ]);

    const refereeBalanceBefore = refereeWallet.data?.kaus_balance || 0;
    const referrerBalanceBefore = referrerWallet.data?.kaus_balance || 0;

    // Credit REFEREE (new user)
    const { error: refereeError } = await supabase
      .from('user_wallets')
      .update({
        kaus_balance: refereeBalanceBefore + REFERRAL_BONUS.REFEREE,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (refereeError) {
      auditLogger.error('kaus', 'referee_credit_failed', 'Failed to credit referee', refereeError as Error, {
        transactionId,
        userId,
        amount: REFERRAL_BONUS.REFEREE,
      });

      return NextResponse.json({
        success: false,
        error: '보너스 지급 실패',
        code: 'CREDIT_FAILED',
      }, { status: 500 });
    }

    // Credit REFERRER (code owner)
    const { error: referrerError } = await supabase
      .from('user_wallets')
      .update({
        kaus_balance: referrerBalanceBefore + REFERRAL_BONUS.REFERRER,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', referrerId);

    if (referrerError) {
      // Rollback referee credit
      await supabase
        .from('user_wallets')
        .update({ kaus_balance: refereeBalanceBefore })
        .eq('user_id', userId);

      auditLogger.error('kaus', 'referrer_credit_failed', 'Failed to credit referrer, rolled back', referrerError as Error, {
        transactionId,
        referrerId,
        amount: REFERRAL_BONUS.REFERRER,
      });

      return NextResponse.json({
        success: false,
        error: '보너스 지급 실패',
        code: 'CREDIT_FAILED',
      }, { status: 500 });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 4: Update Referral Tracking
    // ═══════════════════════════════════════════════════════════════════════════

    // Update user's profile with referrer
    await supabase
      .from('profiles')
      .update({
        referred_by: referrerId,
        referral_code_used: referralCode.toUpperCase(),
        referred_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    // Update referrer's stats
    await supabase
      .from('referral_codes')
      .update({
        total_referrals: (codeData.total_referrals || 0) + 1,
        total_earnings: (codeData.total_earnings || 0) + REFERRAL_BONUS.REFERRER,
      })
      .eq('code', referralCode.toUpperCase());

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 5: Log Transactions
    // ═══════════════════════════════════════════════════════════════════════════

    // Log referee bonus
    logKausTransaction(
      userId,
      `${transactionId}-REFEREE`,
      'referral',
      REFERRAL_BONUS.REFEREE,
      'completed',
      refereeBalanceBefore,
      refereeBalanceBefore + REFERRAL_BONUS.REFEREE,
      {
        type: 'REFERRAL_SIGNUP_BONUS',
        referralCode: referralCode.toUpperCase(),
        referrerId,
      }
    );

    // Log referrer bonus
    logKausTransaction(
      referrerId,
      `${transactionId}-REFERRER`,
      'referral',
      REFERRAL_BONUS.REFERRER,
      'completed',
      referrerBalanceBefore,
      referrerBalanceBefore + REFERRAL_BONUS.REFERRER,
      {
        type: 'REFERRAL_REWARD',
        referralCode: referralCode.toUpperCase(),
        refereeId: userId,
      }
    );

    // Success log
    auditLogger.info('kaus', 'referral_claim_success', 'Referral bonus paid to both parties', {
      transactionId,
      userId,
      referrerId,
      refereeBonus: REFERRAL_BONUS.REFEREE,
      referrerBonus: REFERRAL_BONUS.REFERRER,
      referralCode: referralCode.toUpperCase(),
      duration: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      transactionId,
      refereeBonus: REFERRAL_BONUS.REFEREE,
      referrerBonus: REFERRAL_BONUS.REFERRER,
      newBalance: refereeBalanceBefore + REFERRAL_BONUS.REFEREE,
      message: `🎉 ${REFERRAL_BONUS.REFEREE} KAUS 보너스가 지급되었습니다!`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    auditLogger.critical('kaus', 'referral_claim_crash', 'Critical error in referral claim', error as Error, {
      transactionId,
      duration: Date.now() - startTime,
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Referral claim failed',
      code: 'INTERNAL_ERROR',
    }, { status: 500 });
  }
}
