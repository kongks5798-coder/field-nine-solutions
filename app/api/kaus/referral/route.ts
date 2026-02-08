/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 55: PRODUCTION REFERRAL BONUS SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Empire Link: DB 기반 추천인/피추천인 보너스 시스템
 *
 * Features:
 * - 추천인: 피추천인 첫 구매의 10% KAUS 보너스
 * - 피추천인: 첫 구매 5% 추가 보너스
 * - 신규 가입 보너스: 양측 각 100 KAUS
 * - SHA-256 감사 로깅
 * - 8자리 정밀도
 *
 * @route POST /api/kaus/referral
 * @route GET /api/kaus/referral
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auditLogger, logBalanceUpdate } from '@/lib/audit/logger';
import { toFinancialPrecision } from '@/lib/payment/kaus-purchase';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════════
// REFERRAL CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const REFERRAL_CONFIG = {
  // 신규 가입 보너스
  signupBonusReferrer: 100.00000000,  // 추천인 보너스
  signupBonusReferee: 100.00000000,   // 피추천인 보너스

  // 첫 구매 보너스 (%)
  purchaseBonusReferrer: 10,  // 추천인: 피추천인 첫 구매의 10%
  purchaseBonusReferee: 5,    // 피추천인: 첫 구매 5% 추가

  // 최대 추천 수
  maxReferrals: 1000,

  // KAUS 환율
  kpxRate: 120.00000000,  // KRW per KAUS
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
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function generateEmpireCode(userId: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  const userHash = userId.substring(0, 4);
  return `F9-${userHash}-${timestamp}-${random}`.toUpperCase();
}

function isValidEmpireCode(code: string): boolean {
  return /^F9-[A-Z0-9]{4}-[A-Z0-9]+-[A-Z0-9]+$/i.test(code);
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST: Referral Actions
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, referralCode, purchaseAmount } = body as {
      action: 'generate' | 'claim' | 'stats' | 'purchase-bonus';
      userId: string;
      referralCode?: string;
      purchaseAmount?: number;
    };

    const supabase = getSupabaseAdmin();

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTION: Generate new Empire Link
    // ═══════════════════════════════════════════════════════════════════════════

    if (action === 'generate') {
      if (!userId) {
        return NextResponse.json({
          success: false,
          error: 'User ID required',
        }, { status: 400 });
      }

      // Check if user already has a code
      let empireCode: string;

      if (supabase) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing } = await (supabase as any)
          .from('referral_codes')
          .select('code')
          .eq('user_id', userId)
          .single();

        if (existing?.code) {
          empireCode = existing.code;
        } else {
          empireCode = generateEmpireCode(userId);

          // Save to database
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('referral_codes')
            .insert({
              user_id: userId,
              code: empireCode,
              created_at: new Date().toISOString(),
            });
        }
      } else {
        empireCode = generateEmpireCode(userId);
      }

      const empireLink = `https://m.fieldnine.io/join?ref=${empireCode}`;

      return NextResponse.json({
        success: true,
        empireCode,
        empireLink,
        rewards: {
          signupBonus: {
            referrer: REFERRAL_CONFIG.signupBonusReferrer,
            referee: REFERRAL_CONFIG.signupBonusReferee,
          },
          purchaseBonus: {
            referrerPercent: REFERRAL_CONFIG.purchaseBonusReferrer,
            refereePercent: REFERRAL_CONFIG.purchaseBonusReferee,
          },
          message: '추천 시 각 100 KAUS + 첫 구매 보너스!',
        },
        shareText: {
          ko: `🏰 Field Nine 제국에 합류하세요! 가입 즉시 100 KAUS 지급! ${empireLink}`,
          en: `🏰 Join the Field Nine Empire! Get 100 KAUS instantly! ${empireLink}`,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTION: Claim signup referral bonus
    // ═══════════════════════════════════════════════════════════════════════════

    if (action === 'claim') {
      if (!referralCode || !userId) {
        return NextResponse.json({
          success: false,
          error: 'Referral code and user ID required',
        }, { status: 400 });
      }

      if (!isValidEmpireCode(referralCode)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid Empire Link code',
        }, { status: 400 });
      }

      if (!supabase) {
        return NextResponse.json({
          success: false,
          error: 'Database unavailable',
        }, { status: 503 });
      }

      // Find referrer by code
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: referralData } = await (supabase as any)
        .from('referral_codes')
        .select('user_id')
        .eq('code', referralCode.toUpperCase())
        .single();

      if (!referralData) {
        return NextResponse.json({
          success: false,
          error: 'Referral code not found',
        }, { status: 404 });
      }

      const referrerId = referralData.user_id;

      // Check if user was already referred
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingReferral } = await (supabase as any)
        .from('referrals')
        .select('id')
        .eq('referee_id', userId)
        .single();

      if (existingReferral) {
        return NextResponse.json({
          success: false,
          error: '이미 추천 보너스를 받았습니다.',
          code: 'ALREADY_CLAIMED',
        }, { status: 400 });
      }

      // Prevent self-referral
      if (referrerId === userId) {
        return NextResponse.json({
          success: false,
          error: '자기 자신을 추천할 수 없습니다.',
          code: 'SELF_REFERRAL',
        }, { status: 400 });
      }

      // Grant bonuses
      const referrerBonus = toFinancialPrecision(REFERRAL_CONFIG.signupBonusReferrer);
      const refereeBonus = toFinancialPrecision(REFERRAL_CONFIG.signupBonusReferee);

      // Get current balances
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: referrerUser } = await (supabase as any)
        .from('users')
        .select('kaus_balance')
        .eq('id', referrerId)
        .single();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: refereeUser } = await (supabase as any)
        .from('users')
        .select('kaus_balance')
        .eq('id', userId)
        .single();

      const referrerPrevBalance = toFinancialPrecision(referrerUser?.kaus_balance || 0);
      const refereePrevBalance = toFinancialPrecision(refereeUser?.kaus_balance || 0);

      const referrerNewBalance = toFinancialPrecision(referrerPrevBalance + referrerBonus);
      const refereeNewBalance = toFinancialPrecision(refereePrevBalance + refereeBonus);

      // Update referrer balance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('users')
        .update({
          kaus_balance: referrerNewBalance,
          total_referral_earnings: toFinancialPrecision((referrerUser?.total_referral_earnings || 0) + referrerBonus),
          updated_at: new Date().toISOString(),
        })
        .eq('id', referrerId);

      // Update referee balance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('users')
        .update({
          kaus_balance: refereeNewBalance,
          referred_by: referrerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      // Record referral relationship
      const referralId = `REF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('referrals')
        .insert({
          id: referralId,
          referrer_id: referrerId,
          referee_id: userId,
          referral_code: referralCode.toUpperCase(),
          signup_bonus_referrer: referrerBonus,
          signup_bonus_referee: refereeBonus,
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
        });

      // Record transactions
      const txReferrerId = `TX-REF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const txRefereeId = `TX-REF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('transactions')
        .insert([
          {
            id: txReferrerId,
            user_id: referrerId,
            type: 'REFERRAL_BONUS',
            amount: referrerBonus,
            balance_before: referrerPrevBalance,
            balance_after: referrerNewBalance,
            reference_id: referralId,
            verified: true,
            created_at: new Date().toISOString(),
          },
          {
            id: txRefereeId,
            user_id: userId,
            type: 'REFERRAL_BONUS',
            amount: refereeBonus,
            balance_before: refereePrevBalance,
            balance_after: refereeNewBalance,
            reference_id: referralId,
            verified: true,
            created_at: new Date().toISOString(),
          },
        ]);

      // Audit logs
      await Promise.all([
        logBalanceUpdate(referrerId, referrerPrevBalance, referrerNewBalance, 'REFERRAL_BONUS', txReferrerId),
        logBalanceUpdate(userId, refereePrevBalance, refereeNewBalance, 'REFERRAL_BONUS', txRefereeId),
        auditLogger.log({
          eventType: 'REFERRAL_BONUS',
          userId: referrerId,
          amount: referrerBonus + refereeBonus,
          currency: 'KAUS',
          status: 'SUCCESS',
          details: {
            type: 'SIGNUP_BONUS',
            referralId,
            refereeId: userId,
            referralCode,
            referrerBonus,
            refereeBonus,
            referrerNewBalance,
            refereeNewBalance,
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        referralId,
        claimed: true,
        rewards: {
          referrer: {
            userId: referrerId,
            kaus: referrerBonus,
            newBalance: referrerNewBalance,
          },
          referee: {
            userId,
            kaus: refereeBonus,
            newBalance: refereeNewBalance,
          },
          totalKaus: toFinancialPrecision(referrerBonus + refereeBonus),
        },
        message: `🎉 추천 보너스 지급 완료! 양측 각 ${REFERRAL_CONFIG.signupBonusReferrer} KAUS`,
        timestamp: new Date().toISOString(),
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTION: Grant purchase bonus
    // ═══════════════════════════════════════════════════════════════════════════

    if (action === 'purchase-bonus') {
      if (!userId || !purchaseAmount) {
        return NextResponse.json({
          success: false,
          error: 'User ID and purchase amount required',
        }, { status: 400 });
      }

      if (!supabase) {
        return NextResponse.json({
          success: false,
          error: 'Database unavailable',
        }, { status: 503 });
      }

      // Check if user was referred
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: referral } = await (supabase as any)
        .from('referrals')
        .select('id, referrer_id, first_purchase_bonus_granted')
        .eq('referee_id', userId)
        .single();

      if (!referral) {
        return NextResponse.json({
          success: true,
          bonusGranted: false,
          message: 'No referral relationship found',
        });
      }

      if (referral.first_purchase_bonus_granted) {
        return NextResponse.json({
          success: true,
          bonusGranted: false,
          message: 'First purchase bonus already granted',
        });
      }

      const kausPurchased = toFinancialPrecision(purchaseAmount);
      const referrerBonus = toFinancialPrecision(kausPurchased * (REFERRAL_CONFIG.purchaseBonusReferrer / 100));
      const refereeBonus = toFinancialPrecision(kausPurchased * (REFERRAL_CONFIG.purchaseBonusReferee / 100));

      // Get current balances
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: referrerUser } = await (supabase as any)
        .from('users')
        .select('kaus_balance')
        .eq('id', referral.referrer_id)
        .single();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: refereeUser } = await (supabase as any)
        .from('users')
        .select('kaus_balance')
        .eq('id', userId)
        .single();

      const referrerPrevBalance = toFinancialPrecision(referrerUser?.kaus_balance || 0);
      const refereePrevBalance = toFinancialPrecision(refereeUser?.kaus_balance || 0);

      const referrerNewBalance = toFinancialPrecision(referrerPrevBalance + referrerBonus);
      const refereeNewBalance = toFinancialPrecision(refereePrevBalance + refereeBonus);

      // Update balances
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('users')
        .update({
          kaus_balance: referrerNewBalance,
          total_referral_earnings: toFinancialPrecision((referrerUser?.total_referral_earnings || 0) + referrerBonus),
          updated_at: new Date().toISOString(),
        })
        .eq('id', referral.referrer_id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('users')
        .update({
          kaus_balance: refereeNewBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      // Mark bonus as granted
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('referrals')
        .update({
          first_purchase_bonus_granted: true,
          purchase_bonus_referrer: referrerBonus,
          purchase_bonus_referee: refereeBonus,
          first_purchase_amount: kausPurchased,
          updated_at: new Date().toISOString(),
        })
        .eq('id', referral.id);

      // Audit log
      await auditLogger.log({
        eventType: 'REFERRAL_BONUS',
        userId: referral.referrer_id,
        amount: referrerBonus + refereeBonus,
        currency: 'KAUS',
        status: 'SUCCESS',
        details: {
          type: 'PURCHASE_BONUS',
          referralId: referral.id,
          refereeId: userId,
          purchaseAmount: kausPurchased,
          referrerBonus,
          refereeBonus,
        },
      });

      return NextResponse.json({
        success: true,
        bonusGranted: true,
        rewards: {
          referrer: {
            userId: referral.referrer_id,
            kaus: referrerBonus,
            percent: REFERRAL_CONFIG.purchaseBonusReferrer,
          },
          referee: {
            userId,
            kaus: refereeBonus,
            percent: REFERRAL_CONFIG.purchaseBonusReferee,
          },
        },
        message: '첫 구매 보너스가 지급되었습니다!',
        timestamp: new Date().toISOString(),
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTION: Get referral stats
    // ═══════════════════════════════════════════════════════════════════════════

    if (action === 'stats') {
      if (!userId) {
        return NextResponse.json({
          success: false,
          error: 'User ID required',
        }, { status: 400 });
      }

      if (!supabase) {
        // Return placeholder stats if DB unavailable
        return NextResponse.json({
          success: true,
          stats: {
            totalReferrals: 0,
            activeReferrals: 0,
            earnedKaus: 0,
            pendingKaus: 0,
          },
          config: REFERRAL_CONFIG,
          timestamp: new Date().toISOString(),
        });
      }

      // Get user's referral code
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: codeData } = await (supabase as any)
        .from('referral_codes')
        .select('code')
        .eq('user_id', userId)
        .single();

      // Get referral stats
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: referrals } = await (supabase as any)
        .from('referrals')
        .select('id, status, signup_bonus_referrer, purchase_bonus_referrer, first_purchase_bonus_granted, created_at')
        .eq('referrer_id', userId);

      const allReferrals = referrals || [];
      const activeReferrals = allReferrals.filter((r: { status: string }) => r.status === 'ACTIVE');
      const withPurchase = allReferrals.filter((r: { first_purchase_bonus_granted: boolean }) => r.first_purchase_bonus_granted);

      let totalEarned = 0;
      for (const r of allReferrals) {
        totalEarned += r.signup_bonus_referrer || 0;
        totalEarned += r.purchase_bonus_referrer || 0;
      }

      const stats = {
        empireCode: codeData?.code || null,
        empireLink: codeData?.code ? `https://m.fieldnine.io/join?ref=${codeData.code}` : null,
        totalReferrals: allReferrals.length,
        activeReferrals: activeReferrals.length,
        referralsWithPurchase: withPurchase.length,
        conversionRate: allReferrals.length > 0
          ? toFinancialPrecision((withPurchase.length / allReferrals.length) * 100)
          : 0,
        earnedKaus: toFinancialPrecision(totalEarned),
        earnedKrw: toFinancialPrecision(totalEarned * REFERRAL_CONFIG.kpxRate),
      };

      return NextResponse.json({
        success: true,
        stats,
        config: {
          signupBonusReferrer: REFERRAL_CONFIG.signupBonusReferrer,
          signupBonusReferee: REFERRAL_CONFIG.signupBonusReferee,
          purchaseBonusReferrer: REFERRAL_CONFIG.purchaseBonusReferrer,
          purchaseBonusReferee: REFERRAL_CONFIG.purchaseBonusReferee,
          maxReferrals: REFERRAL_CONFIG.maxReferrals,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: generate, claim, purchase-bonus, or stats',
    }, { status: 400 });

  } catch (error) {
    console.error('[Referral] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET: Referral System Info
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  // Validate specific code
  if (code) {
    if (!isValidEmpireCode(code)) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: 'Invalid Empire Link format',
      }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (supabase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('referral_codes')
        .select('user_id, created_at')
        .eq('code', code.toUpperCase())
        .single();

      return NextResponse.json({
        success: true,
        valid: !!data,
        code: code.toUpperCase(),
        rewards: data ? {
          signup: {
            referrer: REFERRAL_CONFIG.signupBonusReferrer,
            referee: REFERRAL_CONFIG.signupBonusReferee,
          },
          purchase: {
            referrerPercent: REFERRAL_CONFIG.purchaseBonusReferrer,
            refereePercent: REFERRAL_CONFIG.purchaseBonusReferee,
          },
        } : null,
      });
    }

    return NextResponse.json({
      success: true,
      valid: true, // Assume valid if DB not available
      code: code.toUpperCase(),
    });
  }

  // Return general info
  return NextResponse.json({
    success: true,
    name: 'Empire Referral System',
    version: '2.0.0',
    phase: 55,
    config: {
      signupBonus: {
        referrer: REFERRAL_CONFIG.signupBonusReferrer,
        referee: REFERRAL_CONFIG.signupBonusReferee,
        total: REFERRAL_CONFIG.signupBonusReferrer + REFERRAL_CONFIG.signupBonusReferee,
      },
      purchaseBonus: {
        referrerPercent: REFERRAL_CONFIG.purchaseBonusReferrer,
        refereePercent: REFERRAL_CONFIG.purchaseBonusReferee,
        description: '추천인: 피추천인 첫 구매의 10%, 피추천인: 첫 구매 5% 추가',
      },
      maxReferrals: REFERRAL_CONFIG.maxReferrals,
      kpxRate: REFERRAL_CONFIG.kpxRate,
    },
    actions: ['generate', 'claim', 'purchase-bonus', 'stats'],
    features: [
      '신규 가입 시 양측 각 100 KAUS 즉시 지급',
      '피추천인 첫 구매 시 추천인 10% 보너스',
      '피추천인 첫 구매 시 5% 추가 보너스',
      'SHA-256 감사 로깅',
      '8자리 금융 정밀도',
    ],
    message: '🏰 추천하고 보너스 받으세요! 신규가입 100 KAUS + 첫 구매 보너스!',
  });
}
