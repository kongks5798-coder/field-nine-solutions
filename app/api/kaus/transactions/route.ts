/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 55: TRANSACTION HISTORY API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 사용자 거래 내역 조회 API
 *
 * Features:
 * - 구매, 출금, 보너스, 추천 보상 등 모든 거래 타입
 * - 필터링 (타입, 기간, 상태)
 * - 페이지네이션
 * - 통계 요약
 *
 * @route GET /api/kaus/transactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { toFinancialPrecision, KAUS_PRICE_KRW, KAUS_PRICE_USD } from '@/lib/payment/kaus-purchase';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type TransactionType =
  | 'PURCHASE'
  | 'WITHDRAWAL'
  | 'REFERRAL_BONUS'
  | 'PURCHASE_BONUS'
  | 'ENERGY_REWARD'
  | 'STAKING_REWARD'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ADMIN_CREDIT'
  | 'ADMIN_DEBIT';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference_id: string;
  verified: boolean;
  created_at: string;
  description?: string;
}

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

function getTransactionDescription(type: TransactionType, referenceId: string): string {
  const descriptions: Record<TransactionType, string> = {
    'PURCHASE': 'KAUS 구매',
    'WITHDRAWAL': '출금',
    'REFERRAL_BONUS': '추천인 보너스',
    'PURCHASE_BONUS': '구매 보너스',
    'ENERGY_REWARD': '에너지 리워드',
    'STAKING_REWARD': '스테이킹 보상',
    'TRANSFER_IN': '수신',
    'TRANSFER_OUT': '송금',
    'ADMIN_CREDIT': '관리자 지급',
    'ADMIN_DEBIT': '관리자 차감',
  };

  return descriptions[type] || type;
}

function getTransactionIcon(type: TransactionType): string {
  const icons: Record<TransactionType, string> = {
    'PURCHASE': '💳',
    'WITHDRAWAL': '💸',
    'REFERRAL_BONUS': '🎁',
    'PURCHASE_BONUS': '🎉',
    'ENERGY_REWARD': '⚡',
    'STAKING_REWARD': '📈',
    'TRANSFER_IN': '📥',
    'TRANSFER_OUT': '📤',
    'ADMIN_CREDIT': '✅',
    'ADMIN_DEBIT': '❌',
  };

  return icons[type] || '📋';
}

function isPositiveTransaction(type: TransactionType): boolean {
  const positiveTypes: TransactionType[] = [
    'PURCHASE',
    'REFERRAL_BONUS',
    'PURCHASE_BONUS',
    'ENERGY_REWARD',
    'STAKING_REWARD',
    'TRANSFER_IN',
    'ADMIN_CREDIT',
  ];
  return positiveTypes.includes(type);
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET: Transaction History
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  // Return API info if no userId
  if (!userId) {
    return NextResponse.json({
      success: true,
      name: 'KAUS Transaction History API',
      version: '1.0.0',
      phase: 55,
      endpoints: {
        list: 'GET /api/kaus/transactions?userId=xxx',
        filters: {
          type: '?type=PURCHASE,WITHDRAWAL',
          status: '?status=verified|pending',
          from: '?from=2024-01-01',
          to: '?to=2024-12-31',
          limit: '?limit=50',
          offset: '?offset=0',
        },
      },
      transactionTypes: [
        'PURCHASE',
        'WITHDRAWAL',
        'REFERRAL_BONUS',
        'PURCHASE_BONUS',
        'ENERGY_REWARD',
        'STAKING_REWARD',
        'TRANSFER_IN',
        'TRANSFER_OUT',
        'ADMIN_CREDIT',
        'ADMIN_DEBIT',
      ],
    });
  }

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Database unavailable',
      }, { status: 503 });
    }

    // Parse query parameters
    const type = searchParams.get('type'); // comma-separated types
    const status = searchParams.get('status'); // verified | pending
    const from = searchParams.get('from'); // ISO date
    const to = searchParams.get('to'); // ISO date
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const summary = searchParams.get('summary') === 'true';

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (type) {
      const types = type.split(',').map(t => t.trim().toUpperCase());
      query = query.in('type', types);
    }

    if (status === 'verified') {
      query = query.eq('verified', true);
    } else if (status === 'pending') {
      query = query.eq('verified', false);
    }

    if (from) {
      query = query.gte('created_at', from);
    }

    if (to) {
      query = query.lte('created_at', to);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: transactions, count, error } = await query;

    if (error) {
      console.error('[Transactions] Query error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch transactions',
      }, { status: 500 });
    }

    // Format transactions
    const formattedTransactions = (transactions || []).map((tx: Transaction) => ({
      id: tx.id,
      type: tx.type,
      description: getTransactionDescription(tx.type, tx.reference_id),
      icon: getTransactionIcon(tx.type),
      amount: toFinancialPrecision(tx.amount),
      isPositive: isPositiveTransaction(tx.type),
      balanceBefore: toFinancialPrecision(tx.balance_before),
      balanceAfter: toFinancialPrecision(tx.balance_after),
      referenceId: tx.reference_id,
      verified: tx.verified,
      createdAt: tx.created_at,
      fiatValue: {
        KRW: toFinancialPrecision(tx.amount * KAUS_PRICE_KRW),
        USD: toFinancialPrecision(tx.amount * KAUS_PRICE_USD),
      },
    }));

    // Calculate summary if requested
    let summaryData = null;
    if (summary) {
      // Get all transactions for summary (without pagination)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let summaryQuery = (supabase as any)
        .from('transactions')
        .select('type, amount, verified')
        .eq('user_id', userId);

      if (from) summaryQuery = summaryQuery.gte('created_at', from);
      if (to) summaryQuery = summaryQuery.lte('created_at', to);

      const { data: allTxs } = await summaryQuery;

      const txList = allTxs || [];

      let totalCredits = 0;
      let totalDebits = 0;
      const byType: Record<string, { count: number; amount: number }> = {};

      for (const tx of txList) {
        if (isPositiveTransaction(tx.type)) {
          totalCredits += tx.amount;
        } else {
          totalDebits += tx.amount;
        }

        if (!byType[tx.type]) {
          byType[tx.type] = { count: 0, amount: 0 };
        }
        byType[tx.type].count++;
        byType[tx.type].amount += tx.amount;
      }

      summaryData = {
        totalCredits: toFinancialPrecision(totalCredits),
        totalDebits: toFinancialPrecision(totalDebits),
        netChange: toFinancialPrecision(totalCredits - totalDebits),
        transactionCount: txList.length,
        byType: Object.fromEntries(
          Object.entries(byType).map(([k, v]) => [
            k,
            {
              count: v.count,
              amount: toFinancialPrecision(v.amount),
              description: getTransactionDescription(k as TransactionType, ''),
            },
          ])
        ),
        fiatSummary: {
          KRW: {
            credits: toFinancialPrecision(totalCredits * KAUS_PRICE_KRW),
            debits: toFinancialPrecision(totalDebits * KAUS_PRICE_KRW),
            net: toFinancialPrecision((totalCredits - totalDebits) * KAUS_PRICE_KRW),
          },
          USD: {
            credits: toFinancialPrecision(totalCredits * KAUS_PRICE_USD),
            debits: toFinancialPrecision(totalDebits * KAUS_PRICE_USD),
            net: toFinancialPrecision((totalCredits - totalDebits) * KAUS_PRICE_USD),
          },
        },
      };
    }

    // Get current balance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user } = await (supabase as any)
      .from('users')
      .select('kaus_balance, pending_withdrawals, total_earnings')
      .eq('id', userId)
      .single();

    const currentBalance = toFinancialPrecision(user?.kaus_balance || 0);
    const pendingWithdrawals = toFinancialPrecision(user?.pending_withdrawals || 0);
    const availableBalance = toFinancialPrecision(currentBalance - pendingWithdrawals);

    return NextResponse.json({
      success: true,
      userId,
      balance: {
        current: currentBalance,
        pending: pendingWithdrawals,
        available: availableBalance,
        fiat: {
          KRW: toFinancialPrecision(currentBalance * KAUS_PRICE_KRW),
          USD: toFinancialPrecision(currentBalance * KAUS_PRICE_USD),
        },
      },
      transactions: formattedTransactions,
      pagination: {
        limit,
        offset,
        total: count || 0,
        hasMore: (offset + limit) < (count || 0),
      },
      ...(summaryData && { summary: summaryData }),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Transactions] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
