/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 55: WITHDRAWAL PROCESSING (ADMIN)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 관리자 전용 출금 처리 API
 * - 출금 승인/거부
 * - 잔액 차감
 * - 상태 업데이트
 *
 * @route POST /api/kaus/withdraw/process - 출금 처리
 * @route GET /api/kaus/withdraw/process - 대기 중인 출금 목록
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auditLogger, logBalanceUpdate } from '@/lib/audit/logger';
import { toFinancialPrecision } from '@/lib/payment/kaus-purchase';

export const dynamic = 'force-dynamic';

// Admin API Key (should be set in environment)
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'admin-secret-key';

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
// AUTH CHECK
// ═══════════════════════════════════════════════════════════════════════════════

function isAdmin(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-admin-key');
  return apiKey === ADMIN_API_KEY;
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST: Process Withdrawal (Approve/Reject)
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  // Check admin auth
  if (!isAdmin(request)) {
    return NextResponse.json({
      success: false,
      error: 'Unauthorized',
    }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { withdrawalId, action, rejectionReason, transactionRef } = body as {
      withdrawalId: string;
      action: 'APPROVE' | 'REJECT' | 'COMPLETE';
      rejectionReason?: string;
      transactionRef?: string; // Bank transfer reference
    };

    if (!withdrawalId || !action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
      }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Database unavailable',
      }, { status: 503 });
    }

    // Get withdrawal details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: withdrawal, error: fetchError } = await (supabase as any)
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (fetchError || !withdrawal) {
      return NextResponse.json({
        success: false,
        error: 'Withdrawal not found',
      }, { status: 404 });
    }

    // Check current status
    if (withdrawal.status === 'COMPLETED' || withdrawal.status === 'REJECTED') {
      return NextResponse.json({
        success: false,
        error: `Withdrawal already ${withdrawal.status.toLowerCase()}`,
      }, { status: 400 });
    }

    const userId = withdrawal.user_id;
    const kausAmount = toFinancialPrecision(withdrawal.kaus_amount);

    // ═══════════════════════════════════════════════════════════════════════════
    // PROCESS ACTION
    // ═══════════════════════════════════════════════════════════════════════════

    if (action === 'REJECT') {
      // Reject: Release pending amount back to available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: user } = await (supabase as any)
        .from('users')
        .select('pending_withdrawals')
        .eq('id', userId)
        .single();

      const currentPending = toFinancialPrecision(user?.pending_withdrawals || 0);
      const newPending = toFinancialPrecision(Math.max(0, currentPending - kausAmount));

      // Update user pending
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('users')
        .update({
          pending_withdrawals: newPending,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      // Update withdrawal status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('withdrawals')
        .update({
          status: 'REJECTED',
          rejection_reason: rejectionReason || 'Admin rejected',
          processed_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId);

      await auditLogger.log({
        eventType: 'WITHDRAWAL_COMPLETE',
        userId,
        amount: kausAmount,
        currency: 'KAUS',
        status: 'FAILED',
        details: {
          withdrawalId,
          action: 'REJECTED',
          reason: rejectionReason,
        },
      });

      return NextResponse.json({
        success: true,
        withdrawalId,
        status: 'REJECTED',
        message: '출금이 거부되었습니다. 잔액이 복원됩니다.',
      });
    }

    if (action === 'APPROVE') {
      // Approve: Move to PROCESSING status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('withdrawals')
        .update({
          status: 'PROCESSING',
          approved_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId);

      await auditLogger.log({
        eventType: 'WITHDRAWAL_REQUEST',
        userId,
        amount: kausAmount,
        currency: 'KAUS',
        status: 'PENDING',
        details: {
          withdrawalId,
          action: 'APPROVED',
          awaitingTransfer: true,
        },
      });

      return NextResponse.json({
        success: true,
        withdrawalId,
        status: 'PROCESSING',
        message: '출금이 승인되었습니다. 송금을 진행하세요.',
      });
    }

    if (action === 'COMPLETE') {
      // Complete: Deduct from balance, clear pending
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: user } = await (supabase as any)
        .from('users')
        .select('kaus_balance, pending_withdrawals')
        .eq('id', userId)
        .single();

      if (!user) {
        return NextResponse.json({
          success: false,
          error: 'User not found',
        }, { status: 404 });
      }

      const currentBalance = toFinancialPrecision(user.kaus_balance || 0);
      const currentPending = toFinancialPrecision(user.pending_withdrawals || 0);
      const newBalance = toFinancialPrecision(currentBalance - kausAmount);
      const newPending = toFinancialPrecision(Math.max(0, currentPending - kausAmount));

      if (newBalance < 0) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient balance',
        }, { status: 400 });
      }

      // Update user balance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('users')
        .update({
          kaus_balance: newBalance,
          pending_withdrawals: newPending,
          total_withdrawals: toFinancialPrecision((user.total_withdrawals || 0) + kausAmount),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      // Update withdrawal status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('withdrawals')
        .update({
          status: 'COMPLETED',
          transaction_ref: transactionRef,
          processed_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId);

      // Log balance update
      await logBalanceUpdate(
        userId,
        currentBalance,
        newBalance,
        'WITHDRAWAL',
        withdrawalId
      );

      await auditLogger.log({
        eventType: 'WITHDRAWAL_COMPLETE',
        userId,
        amount: kausAmount,
        currency: 'KAUS',
        status: 'SUCCESS',
        details: {
          withdrawalId,
          transactionRef,
          previousBalance: currentBalance,
          newBalance,
          fiatAmount: withdrawal.fiat_amount,
          netAmount: withdrawal.net_amount,
          method: withdrawal.method,
        },
      });

      return NextResponse.json({
        success: true,
        withdrawalId,
        status: 'COMPLETED',
        previousBalance: currentBalance,
        newBalance,
        message: '출금이 완료되었습니다.',
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action',
    }, { status: 400 });

  } catch (error) {
    console.error('[Withdrawal Process] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Processing failed',
    }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET: List Pending Withdrawals (Admin)
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({
      success: false,
      error: 'Unauthorized',
    }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'PENDING';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Database unavailable',
      }, { status: 503 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('withdrawals')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Query failed',
      }, { status: 500 });
    }

    // Calculate totals
    const totalKaus = data?.reduce((sum: number, w: { kaus_amount: number }) => sum + w.kaus_amount, 0) || 0;
    const totalFiat = data?.reduce((sum: number, w: { fiat_amount: number }) => sum + w.fiat_amount, 0) || 0;

    return NextResponse.json({
      success: true,
      status,
      withdrawals: data || [],
      count: data?.length || 0,
      totals: {
        kaus: toFinancialPrecision(totalKaus),
        fiat: toFinancialPrecision(totalFiat),
      },
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Query failed',
    }, { status: 500 });
  }
}
