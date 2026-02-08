/**
 * K-UNIVERSAL Wallet Transactions API
 * 거래 내역 조회 (필터링, 페이지네이션)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// ============================================
// Types
// ============================================

export type TransactionType = 'all' | 'topup' | 'payment' | 'transfer_in' | 'transfer_out' | 'refund';
export type TransactionStatus = 'all' | 'completed' | 'pending' | 'failed' | 'cancelled';

interface TransactionQuery {
  userId: string;
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ============================================
// GET: 거래 내역 조회 (필터링 + 페이지네이션)
// ============================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    const query: TransactionQuery = {
      userId: searchParams.get('userId') || '',
      type: (searchParams.get('type') as TransactionType) || 'all',
      status: (searchParams.get('status') as TransactionStatus) || 'all',
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    if (!query.userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // Build query
    let dbQuery = supabaseAdmin
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', query.userId)
      .order('created_at', { ascending: false });

    // Filter by type
    if (query.type && query.type !== 'all') {
      dbQuery = dbQuery.eq('type', query.type);
    }

    // Filter by status
    if (query.status && query.status !== 'all') {
      dbQuery = dbQuery.eq('status', query.status);
    }

    // Filter by date range
    if (query.startDate) {
      dbQuery = dbQuery.gte('created_at', query.startDate);
    }
    if (query.endDate) {
      dbQuery = dbQuery.lte('created_at', query.endDate);
    }

    // Pagination
    const offset = ((query.page || 1) - 1) * (query.limit || 20);
    dbQuery = dbQuery.range(offset, offset + (query.limit || 20) - 1);

    const { data: transactions, error, count } = await dbQuery;

    if (error) {
      console.error('Transaction query error:', error);
      return NextResponse.json(
        { success: false, error: '거래 내역 조회 실패' },
        { status: 500 }
      );
    }

    // Calculate summary
    const summary = await getTransactionSummary(query.userId);

    return NextResponse.json({
      success: true,
      transactions: transactions || [],
      pagination: {
        page: query.page || 1,
        limit: query.limit || 20,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / (query.limit || 20)),
      },
      summary,
    });

  } catch (error) {
    console.error('Transactions API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '서버 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}

// ============================================
// Helper: 거래 요약 정보
// ============================================

async function getTransactionSummary(userId: string) {
  try {
    // 이번 달 거래 통계
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyTransactions } = await supabaseAdmin
      .from('transactions')
      .select('amount, type')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', startOfMonth.toISOString());

    let totalTopup = 0;
    let totalSpent = 0;

    (monthlyTransactions || []).forEach((tx: { amount: number; type: string }) => {
      if (['topup', 'transfer_in', 'refund'].includes(tx.type)) {
        totalTopup += Number(tx.amount);
      } else if (['payment', 'transfer_out'].includes(tx.type)) {
        totalSpent += Number(tx.amount);
      }
    });

    return {
      monthlyTopup: totalTopup,
      monthlySpent: totalSpent,
      transactionCount: monthlyTransactions?.length || 0,
    };
  } catch {
    return {
      monthlyTopup: 0,
      monthlySpent: 0,
      transactionCount: 0,
    };
  }
}
