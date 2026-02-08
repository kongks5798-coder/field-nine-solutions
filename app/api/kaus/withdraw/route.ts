/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 55: KAUS WITHDRAWAL SYSTEM (PRODUCTION)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 출금 요청 및 처리 API
 * - 은행 송금 (KRW)
 * - PayPal 출금 (USD)
 *
 * Security:
 * - 잔액 검증 (DB 기반)
 * - 수수료 계산 (8자리 정밀도)
 * - 관리자 승인 필수
 * - SHA-256 감사 로깅
 *
 * @route POST /api/kaus/withdraw - 출금 요청
 * @route GET /api/kaus/withdraw - 출금 내역/정보 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auditLogger } from '@/lib/audit/logger';
import {
  toFinancialPrecision,
  KAUS_PRICE_KRW,
  KAUS_PRICE_USD,
  WITHDRAWAL_FEES,
  MIN_WITHDRAWAL,
  MAX_WITHDRAWAL,
  calculateWithdrawalFee,
} from '@/lib/payment/kaus-purchase';

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
// KOREAN BANK CODES
// ═══════════════════════════════════════════════════════════════════════════════

const KOREAN_BANKS = [
  { code: '004', name: 'KB국민은행' },
  { code: '088', name: '신한은행' },
  { code: '020', name: '우리은행' },
  { code: '081', name: '하나은행' },
  { code: '011', name: 'NH농협은행' },
  { code: '023', name: 'SC제일은행' },
  { code: '027', name: '씨티은행' },
  { code: '039', name: '경남은행' },
  { code: '034', name: '광주은행' },
  { code: '031', name: '대구은행' },
  { code: '032', name: '부산은행' },
  { code: '002', name: '산업은행' },
  { code: '045', name: '새마을금고' },
  { code: '007', name: '수협은행' },
  { code: '048', name: '신협' },
  { code: '037', name: '전북은행' },
  { code: '035', name: '제주은행' },
  { code: '090', name: '카카오뱅크' },
  { code: '089', name: '케이뱅크' },
  { code: '092', name: '토스뱅크' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// POST: Create Withdrawal Request
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, currency, method, destination } = body as {
      userId: string;
      amount: number;
      currency: 'KRW' | 'USD';
      method: 'bank' | 'paypal';
      destination: {
        bankCode?: string;
        bankName?: string;
        accountNumber?: string;
        accountHolder?: string;
        paypalEmail?: string;
      };
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // VALIDATION
    // ═══════════════════════════════════════════════════════════════════════════

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '로그인이 필요합니다.',
        code: 'AUTH_REQUIRED',
      }, { status: 401 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: '유효한 출금 금액을 입력하세요.',
        code: 'INVALID_AMOUNT',
      }, { status: 400 });
    }

    // Validate destination based on method
    if (method === 'bank') {
      if (!destination.bankCode || !destination.accountNumber || !destination.accountHolder) {
        return NextResponse.json({
          success: false,
          error: '은행 정보를 모두 입력하세요.',
          code: 'INVALID_BANK_INFO',
        }, { status: 400 });
      }
    } else if (method === 'paypal') {
      if (!destination.paypalEmail) {
        return NextResponse.json({
          success: false,
          error: 'PayPal 이메일을 입력하세요.',
          code: 'INVALID_PAYPAL_EMAIL',
        }, { status: 400 });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: '지원하지 않는 출금 방식입니다.',
        code: 'INVALID_METHOD',
      }, { status: 400 });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CALCULATE FIAT AMOUNT
    // ═══════════════════════════════════════════════════════════════════════════

    const kausAmount = toFinancialPrecision(amount);
    const rate = currency === 'KRW' ? KAUS_PRICE_KRW : KAUS_PRICE_USD;
    const fiatAmount = toFinancialPrecision(kausAmount * rate);

    // Check minimum/maximum
    if (fiatAmount < MIN_WITHDRAWAL[currency]) {
      return NextResponse.json({
        success: false,
        error: `최소 출금 금액: ${MIN_WITHDRAWAL[currency].toLocaleString()} ${currency}`,
        code: 'BELOW_MINIMUM',
        minimum: MIN_WITHDRAWAL[currency],
      }, { status: 400 });
    }

    if (fiatAmount > MAX_WITHDRAWAL[currency]) {
      return NextResponse.json({
        success: false,
        error: `최대 출금 금액: ${MAX_WITHDRAWAL[currency].toLocaleString()} ${currency}`,
        code: 'ABOVE_MAXIMUM',
        maximum: MAX_WITHDRAWAL[currency],
      }, { status: 400 });
    }

    // Calculate fee
    const fee = calculateWithdrawalFee(fiatAmount, method, currency);
    const netAmount = toFinancialPrecision(fiatAmount - fee);

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK USER BALANCE
    // ═══════════════════════════════════════════════════════════════════════════

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: '시스템 오류가 발생했습니다.',
        code: 'DB_UNAVAILABLE',
      }, { status: 503 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user, error: userError } = await (supabase as any)
      .from('users')
      .select('kaus_balance, pending_withdrawals')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: '사용자 정보를 찾을 수 없습니다.',
        code: 'USER_NOT_FOUND',
      }, { status: 404 });
    }

    const currentBalance = toFinancialPrecision(user.kaus_balance || 0);
    const pendingWithdrawals = toFinancialPrecision(user.pending_withdrawals || 0);
    const availableBalance = toFinancialPrecision(currentBalance - pendingWithdrawals);

    if (kausAmount > availableBalance) {
      return NextResponse.json({
        success: false,
        error: `잔액 부족. 출금 가능: ${availableBalance.toLocaleString()} KAUS`,
        code: 'INSUFFICIENT_BALANCE',
        available: availableBalance,
        requested: kausAmount,
      }, { status: 400 });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CREATE WITHDRAWAL REQUEST
    // ═══════════════════════════════════════════════════════════════════════════

    const withdrawalId = `WD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Mask sensitive data for display
    const maskedDestination = method === 'bank'
      ? {
          bankCode: destination.bankCode,
          bankName: destination.bankName || KOREAN_BANKS.find(b => b.code === destination.bankCode)?.name,
          accountNumber: maskAccountNumber(destination.accountNumber || ''),
          accountHolder: destination.accountHolder,
        }
      : {
          paypalEmail: maskEmail(destination.paypalEmail || ''),
        };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
      .from('withdrawals')
      .insert({
        id: withdrawalId,
        user_id: userId,
        kaus_amount: kausAmount,
        fiat_amount: fiatAmount,
        currency,
        fee,
        net_amount: netAmount,
        method,
        destination: destination,
        destination_display: maskedDestination,
        status: 'PENDING',
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('[Withdrawal] Insert error:', insertError);
      return NextResponse.json({
        success: false,
        error: '출금 요청 생성 실패',
        code: 'CREATE_FAILED',
      }, { status: 500 });
    }

    // Update pending withdrawals
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('users')
      .update({
        pending_withdrawals: toFinancialPrecision(pendingWithdrawals + kausAmount),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    // ═══════════════════════════════════════════════════════════════════════════
    // AUDIT LOG
    // ═══════════════════════════════════════════════════════════════════════════

    await auditLogger.log({
      eventType: 'WITHDRAWAL_REQUEST',
      userId,
      amount: kausAmount,
      currency: 'KAUS',
      status: 'PENDING',
      details: {
        withdrawalId,
        fiatAmount,
        fiatCurrency: currency,
        fee,
        netAmount,
        method,
        destination: maskedDestination,
      },
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // RESPONSE
    // ═══════════════════════════════════════════════════════════════════════════

    const estimatedDays = method === 'bank' ? '1-2 영업일' : '1-3 영업일';

    return NextResponse.json({
      success: true,
      withdrawalId,
      kausAmount,
      fiatAmount,
      currency,
      fee,
      netAmount,
      method,
      destination: maskedDestination,
      status: 'PENDING',
      estimatedArrival: estimatedDays,
      message: `출금 요청이 접수되었습니다. ${estimatedDays} 내 처리됩니다.`,
    });

  } catch (error) {
    console.error('[Withdrawal] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '출금 요청 실패',
    }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET: Withdrawal Info or History
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  // If no userId, return general info
  if (!userId) {
    return NextResponse.json({
      success: true,
      methods: ['bank', 'paypal'],
      fees: WITHDRAWAL_FEES,
      limits: {
        min: MIN_WITHDRAWAL,
        max: MAX_WITHDRAWAL,
      },
      banks: KOREAN_BANKS,
      rates: {
        KRW: KAUS_PRICE_KRW,
        USD: KAUS_PRICE_USD,
      },
      processingTime: {
        bank: '1-2 영업일',
        paypal: '1-3 영업일',
      },
    });
  }

  // Get user's withdrawal history
  try {
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: '시스템 오류',
      }, { status: 503 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('withdrawals')
      .select('id, kaus_amount, fiat_amount, currency, fee, net_amount, method, destination_display, status, created_at, processed_at, rejection_reason')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Withdrawal History] Error:', error);
      return NextResponse.json({
        success: false,
        error: '출금 내역 조회 실패',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      withdrawals: data || [],
      count: data?.length || 0,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '조회 실패',
    }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function maskAccountNumber(account: string): string {
  if (account.length <= 4) return '****';
  return account.slice(0, 2) + '*'.repeat(account.length - 4) + account.slice(-2);
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '****@****';
  const maskedLocal = local.length <= 2
    ? '*'.repeat(local.length)
    : local[0] + '*'.repeat(local.length - 2) + local.slice(-1);
  return `${maskedLocal}@${domain}`;
}
