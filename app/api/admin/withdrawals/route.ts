/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 58: ADMIN WITHDRAWALS API
 * ═══════════════════════════════════════════════════════════════════════════════
 * 출금 요청 조회 및 관리
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { toFinancialPrecision, KAUS_PRICE_KRW } from '@/lib/payment/kaus-purchase';

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
// GET: List Withdrawals
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status'); // PENDING, APPROVED, REJECTED, COMPLETED
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      // Return mock data for development
      return NextResponse.json({
        success: true,
        withdrawals: [],
        pagination: { limit, offset, total: 0 },
        message: 'Database not configured',
      });
    }

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('withdrawals')
      .select(`
        id,
        user_id,
        amount,
        fiat_amount,
        bank_name,
        account_number,
        status,
        created_at,
        users!inner(email, kaus_balance)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: withdrawals, count, error } = await query;

    if (error) {
      console.error('[Admin Withdrawals] Query error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch withdrawals',
      }, { status: 500 });
    }

    // Format withdrawals
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedWithdrawals = (withdrawals || []).map((w: any) => ({
      id: w.id,
      userId: w.user_id,
      userEmail: w.users?.email || 'Unknown',
      amount: toFinancialPrecision(w.amount),
      fiatAmount: toFinancialPrecision(w.fiat_amount || w.amount * KAUS_PRICE_KRW),
      bankName: w.bank_name || '',
      accountNumber: w.account_number || '',
      status: w.status,
      createdAt: w.created_at,
      userBalance: toFinancialPrecision(w.users?.kaus_balance || 0),
    }));

    return NextResponse.json({
      success: true,
      withdrawals: formattedWithdrawals,
      pagination: {
        limit,
        offset,
        total: count || 0,
        hasMore: (offset + limit) < (count || 0),
      },
      stats: {
        pending: status === 'PENDING' ? count : undefined,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Admin Withdrawals] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
