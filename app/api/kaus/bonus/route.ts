/**
 * KAUS COIN BONUS API - 10% Extra on Energy Purchase
 * Phase 39: Revenue Engine
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const KAUS_BONUS_CONFIG = {
  baseRate: 10, // 10 KAUS per kWh
  bonusRate: 0.10, // 10% bonus
  minPurchase: 10,
  maxPurchase: 10000,
  kpxRate: 120, // KRW per KAUS
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { kwhAmount } = body;

    if (!kwhAmount || kwhAmount < KAUS_BONUS_CONFIG.minPurchase) {
      return NextResponse.json({
        success: false,
        error: `Minimum purchase is ${KAUS_BONUS_CONFIG.minPurchase} kWh`,
      }, { status: 400 });
    }

    if (kwhAmount > KAUS_BONUS_CONFIG.maxPurchase) {
      return NextResponse.json({
        success: false,
        error: `Maximum purchase is ${KAUS_BONUS_CONFIG.maxPurchase} kWh`,
      }, { status: 400 });
    }

    const baseKaus = kwhAmount * KAUS_BONUS_CONFIG.baseRate;
    const bonusKaus = baseKaus * KAUS_BONUS_CONFIG.bonusRate;
    const totalKaus = baseKaus + bonusKaus;
    const krwValue = totalKaus * KAUS_BONUS_CONFIG.kpxRate;

    return NextResponse.json({
      success: true,
      kwhAmount,
      baseKaus,
      bonusKaus,
      bonusPercent: KAUS_BONUS_CONFIG.bonusRate * 100,
      totalKaus,
      krwValue,
      kpxRate: KAUS_BONUS_CONFIG.kpxRate,
      message: `You will receive ${totalKaus.toLocaleString()} KAUS (includes ${bonusKaus.toLocaleString()} bonus)`,
      timestamp: new Date().toISOString(),
    });
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
    config: {
      baseRate: KAUS_BONUS_CONFIG.baseRate,
      bonusRate: KAUS_BONUS_CONFIG.bonusRate * 100,
      minPurchase: KAUS_BONUS_CONFIG.minPurchase,
      maxPurchase: KAUS_BONUS_CONFIG.maxPurchase,
      kpxRate: KAUS_BONUS_CONFIG.kpxRate,
    },
    message: 'Get 10% bonus KAUS when purchasing energy with Kaus Coin!',
  });
}
