/**
 * K-UNIVERSAL Wallet Balance API
 * 지갑 잔액 조회 및 거래 내역
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import {
  checkRateLimit,
  getClientIdentifier,
  RateLimiters,
  rateLimitHeaders,
} from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

// ============================================
// GET: 지갑 잔액 및 거래 내역 조회
// ============================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Rate limiting - 100 requests per minute for read operations
  const clientIp = getClientIdentifier(request);
  const rateLimit = checkRateLimit(clientIp, RateLimiters.standard);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.' },
      { status: 429, headers: rateLimitHeaders(rateLimit) }
    );
  }

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
      .from('wallets')
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
          hasVirtualCard: false,
        },
        transactions: [],
      });
    }

    // 2. 최근 거래 내역 조회 (최근 20건)
    const { data: transactions } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      success: true,
      wallet: {
        id: wallet?.id,
        balance: Number(wallet?.balance) || 0,
        currency: wallet?.currency || 'KRW',
        hasVirtualCard: wallet?.has_virtual_card || false,
        cardLastFour: wallet?.card_last_four,
        updatedAt: wallet?.updated_at,
      },
      transactions: (transactions || []).map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        currency: t.currency,
        status: t.status,
        description: t.description,
        merchantName: t.merchant_name,
        merchantCategory: t.merchant_category,
        createdAt: t.created_at,
      })),
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
