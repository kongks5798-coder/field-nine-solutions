/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 41: SOVEREIGN MEMBERSHIP PURCHASE API
 * ═══════════════════════════════════════════════════════════════════════════════
 * K-Nomad Membership Pass: $99 or 1,200 KAUS
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const MEMBERSHIP_CONFIG = {
  price: {
    usd: 99,
    kaus: 1200,
    krw: 144000, // 1200 KAUS × 120 KRW
  },
  benefits: [
    '에너지 구매 20% 할인',
    '영동 발전소 지분 데이터 독점 열람',
    'Prophet AI 프리미엄 분석',
    'Early Bird 프로모션 우선 참여',
  ],
  tier: 'PLATINUM',
};

// Lazy Supabase client
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, paymentMethod } = body; // paymentMethod: 'kaus' | 'usd'

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID required',
      }, { status: 400 });
    }

    const supabase = getSupabase();

    // Check wallet balance if paying with KAUS
    if (paymentMethod === 'kaus') {
      const requiredKaus = MEMBERSHIP_CONFIG.price.kaus;

      // Simulate balance check (실제로는 DB에서 조회)
      const currentBalance = 5000; // Mock balance

      if (currentBalance < requiredKaus) {
        return NextResponse.json({
          success: false,
          error: `잔액 부족. 필요: ${requiredKaus} KAUS, 보유: ${currentBalance} KAUS`,
          required: requiredKaus,
          current: currentBalance,
        }, { status: 400 });
      }

      // Deduct KAUS and upgrade membership
      if (supabase) {
        const { error } = await supabase
          .from('profiles')
          .update({
            membership_tier: MEMBERSHIP_CONFIG.tier,
            membership_activated_at: new Date().toISOString(),
            kaus_balance: currentBalance - requiredKaus,
          })
          .eq('id', userId);

        if (error) {
          console.error('Supabase update error:', error);
        }
      }

      return NextResponse.json({
        success: true,
        membership: {
          tier: MEMBERSHIP_CONFIG.tier,
          activatedAt: new Date().toISOString(),
          benefits: MEMBERSHIP_CONFIG.benefits,
        },
        payment: {
          method: 'kaus',
          amount: requiredKaus,
          currency: 'KAUS',
        },
        message: `🎉 PLATINUM 멤버십 활성화 완료! ${requiredKaus} KAUS 차감됨.`,
      });
    }

    // USD Payment (외부 결제 게이트웨이 연동 필요)
    if (paymentMethod === 'usd') {
      return NextResponse.json({
        success: true,
        redirectUrl: '/checkout?product=membership&amount=99',
        message: '결제 페이지로 이동합니다.',
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid payment method. Use: kaus or usd',
    }, { status: 400 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    name: 'Sovereign Membership',
    tier: MEMBERSHIP_CONFIG.tier,
    pricing: MEMBERSHIP_CONFIG.price,
    benefits: MEMBERSHIP_CONFIG.benefits,
    message: 'K-Nomad 멤버십으로 에너지 제국의 PLATINUM 시민이 되세요!',
  });
}
