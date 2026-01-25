/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 48: KAUS WITHDRAWAL API
 * ═══════════════════════════════════════════════════════════════════════════════
 * AI 트레이더 수익 출금 → 실제 지갑
 */

import { NextRequest, NextResponse } from 'next/server';
import { logWithdrawal } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

const WITHDRAWAL_FEES = {
  bank: { percentage: 0.5, minFee: 1000, currency: 'KRW' },
  paypal: { percentage: 2.9, minFee: 0.50, currency: 'USD' },
  crypto: { percentage: 0.1, minFee: 0, currency: 'USD' },
};

const MIN_WITHDRAWAL = { KRW: 10000, USD: 10 };
const MAX_WITHDRAWAL = { KRW: 100000000, USD: 100000 };

function calculateFee(amount: number, method: 'bank' | 'paypal' | 'crypto', currency: 'KRW' | 'USD'): number {
  const config = WITHDRAWAL_FEES[method];
  const percentageFee = amount * (config.percentage / 100);
  let minFee = config.minFee;
  if (config.currency !== currency) {
    minFee = currency === 'KRW' ? minFee * 1320 : minFee / 1320;
  }
  return Math.max(percentageFee, minFee);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency, method, destination } = body as {
      amount: number;
      currency: 'KRW' | 'USD';
      method: 'bank' | 'paypal' | 'crypto';
      destination: {
        bankName?: string;
        accountNumber?: string;
        accountHolder?: string;
        paypalEmail?: string;
        cryptoAddress?: string;
      };
    };

    // Validate amount
    if (amount < MIN_WITHDRAWAL[currency]) {
      return NextResponse.json({
        success: false,
        error: `Minimum withdrawal: ${MIN_WITHDRAWAL[currency]} ${currency}`,
      }, { status: 400 });
    }

    if (amount > MAX_WITHDRAWAL[currency]) {
      return NextResponse.json({
        success: false,
        error: `Maximum withdrawal: ${MAX_WITHDRAWAL[currency].toLocaleString()} ${currency}`,
      }, { status: 400 });
    }

    // Validate destination
    if (method === 'bank' && (!destination.bankName || !destination.accountNumber || !destination.accountHolder)) {
      return NextResponse.json({
        success: false,
        error: 'Bank details required',
      }, { status: 400 });
    }

    if (method === 'paypal' && !destination.paypalEmail) {
      return NextResponse.json({
        success: false,
        error: 'PayPal email required',
      }, { status: 400 });
    }

    if (method === 'crypto' && !destination.cryptoAddress) {
      return NextResponse.json({
        success: false,
        error: 'Crypto address required',
      }, { status: 400 });
    }

    const fee = calculateFee(amount, method, currency);
    const netAmount = amount - fee;
    const withdrawalId = `WD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Estimated arrival
    const arrivalDays = method === 'bank' ? 1 : 0;
    const estimatedArrival = new Date(Date.now() + arrivalDays * 24 * 60 * 60 * 1000).toISOString();

    // Log withdrawal
    await logWithdrawal(
      'demo-user',
      amount,
      currency,
      method,
      withdrawalId,
      'PENDING',
      { destination, fee, netAmount }
    );

    return NextResponse.json({
      success: true,
      withdrawalId,
      amount,
      fee,
      netAmount,
      currency,
      method,
      estimatedArrival,
      status: 'PENDING',
      message: `Withdrawal request submitted. ${currency === 'KRW' ? '₩' : '$'}${netAmount.toLocaleString()} will be sent to your ${method} account.`,
    });

  } catch (error) {
    console.error('[Withdrawal] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    methods: ['bank', 'paypal', 'crypto'],
    fees: WITHDRAWAL_FEES,
    limits: {
      min: MIN_WITHDRAWAL,
      max: MAX_WITHDRAWAL,
    },
    processingTime: {
      bank: '1 business day',
      paypal: 'Instant',
      crypto: 'Instant',
    },
  });
}
