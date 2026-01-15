/**
 * K-UNIVERSAL Wallet Balance API
 * 지갑 잔액 조회 및 거래 내역
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// ============================================
// GET: 지갑 잔액 및 거래 내역 조회
// ============================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 1. 지갑 잔액 조회
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    // 지갑이 없으면 기본값 반환
    if (walletError) {
      return NextResponse.json({
        success: true,
        wallet: {
          balance: 0,
          currency: 'KRW',
        },
        transactions: [],
      });
    }

    // 2. 최근 거래 내역 조회 (최근 20건)
    const { data: transactions } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      success: true,
      wallet: {
        balance: wallet?.balance || 0,
        currency: wallet?.currency || 'KRW',
        updatedAt: wallet?.updated_at,
      },
      transactions: transactions || [],
    });

  } catch (error) {
    console.error('Balance API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '서버 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}
