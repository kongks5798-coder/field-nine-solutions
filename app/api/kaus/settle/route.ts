/**
 * 🌐 KAUS Settlement API
 * Global Payment Bridge for KAUS Cryptocurrency
 * Field Nine Nexus - Phase 52
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// TYPES
// ============================================================

interface SettlementRequest {
  amount: number; // KAUS amount
  currency: 'USD' | 'EUR' | 'KRW' | 'JPY' | 'GBP' | 'AED' | 'SGD';
  paymentMethod: 'STRIPE' | 'BANK_WIRE' | 'CRYPTO_BRIDGE';
  destinationAddress?: string;
  bankDetails?: {
    accountNumber: string;
    routingNumber: string;
    bankName: string;
    swift?: string;
  };
  metadata?: Record<string, string>;
}

interface SettlementResponse {
  success: boolean;
  transactionId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  kausAmount: number;
  fiatAmount: number;
  currency: string;
  exchangeRate: number;
  fees: {
    networkFee: number;
    processingFee: number;
    totalFee: number;
  };
  estimatedCompletion: string;
  settlementDetails: {
    method: string;
    destination: string;
  };
  timestamp: number;
}

// ============================================================
// EXCHANGE RATES (KAUS -> Fiat)
// ============================================================

const KAUS_EXCHANGE_RATES: Record<string, number> = {
  USD: 0.10, // 1 KAUS = $0.10 USD
  EUR: 0.092,
  KRW: 120, // 1 KAUS = 120 KRW
  JPY: 14.5,
  GBP: 0.079,
  AED: 0.37,
  SGD: 0.135,
};

// Fee structure
const FEES = {
  STRIPE: 0.029, // 2.9% + $0.30
  STRIPE_FIXED: 0.30,
  BANK_WIRE: 0.01, // 1%
  BANK_WIRE_FIXED: 25, // $25 flat
  CRYPTO_BRIDGE: 0.005, // 0.5%
  NETWORK_FEE: 0.001, // 0.1% KAUS network fee
};

// ============================================================
// HELPERS
// ============================================================

function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `KAUS_${timestamp}_${random}`.toUpperCase();
}

function calculateFees(
  amount: number,
  currency: string,
  method: string
): { networkFee: number; processingFee: number; totalFee: number } {
  const fiatAmount = amount * KAUS_EXCHANGE_RATES[currency];

  // Network fee in fiat
  const networkFee = fiatAmount * FEES.NETWORK_FEE;

  // Processing fee based on method
  let processingFee = 0;
  switch (method) {
    case 'STRIPE':
      processingFee = fiatAmount * FEES.STRIPE + FEES.STRIPE_FIXED;
      break;
    case 'BANK_WIRE':
      processingFee = Math.max(fiatAmount * FEES.BANK_WIRE, FEES.BANK_WIRE_FIXED);
      break;
    case 'CRYPTO_BRIDGE':
      processingFee = fiatAmount * FEES.CRYPTO_BRIDGE;
      break;
  }

  return {
    networkFee: Math.round(networkFee * 100) / 100,
    processingFee: Math.round(processingFee * 100) / 100,
    totalFee: Math.round((networkFee + processingFee) * 100) / 100,
  };
}

function getEstimatedCompletion(method: string): string {
  const now = new Date();

  switch (method) {
    case 'STRIPE':
      // Stripe: instant to 2 business days
      now.setHours(now.getHours() + 2);
      return now.toISOString();
    case 'BANK_WIRE':
      // Bank wire: 1-3 business days
      now.setDate(now.getDate() + 2);
      return now.toISOString();
    case 'CRYPTO_BRIDGE':
      // Crypto bridge: 10-30 minutes
      now.setMinutes(now.getMinutes() + 15);
      return now.toISOString();
    default:
      now.setDate(now.getDate() + 1);
      return now.toISOString();
  }
}

function validateRequest(body: SettlementRequest): string | null {
  if (!body.amount || body.amount <= 0) {
    return '유효한 KAUS 금액을 입력해주세요.';
  }

  if (body.amount < 10) {
    return '최소 출금 금액은 10 KAUS입니다.';
  }

  if (body.amount > 1000000) {
    return '1회 최대 출금 금액은 1,000,000 KAUS입니다.';
  }

  if (!KAUS_EXCHANGE_RATES[body.currency]) {
    return '지원하지 않는 통화입니다.';
  }

  if (!['STRIPE', 'BANK_WIRE', 'CRYPTO_BRIDGE'].includes(body.paymentMethod)) {
    return '지원하지 않는 결제 방식입니다.';
  }

  if (body.paymentMethod === 'BANK_WIRE' && !body.bankDetails) {
    return '은행 송금에는 계좌 정보가 필요합니다.';
  }

  if (body.paymentMethod === 'CRYPTO_BRIDGE' && !body.destinationAddress) {
    return '암호화폐 브릿지에는 목적지 주소가 필요합니다.';
  }

  return null;
}

// ============================================================
// API HANDLERS
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body: SettlementRequest = await request.json();

    // Validate request
    const validationError = validateRequest(body);
    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          error: validationError,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // Calculate exchange and fees
    const exchangeRate = KAUS_EXCHANGE_RATES[body.currency];
    const fiatAmount = body.amount * exchangeRate;
    const fees = calculateFees(body.amount, body.currency, body.paymentMethod);
    const netAmount = fiatAmount - fees.totalFee;

    // Generate transaction
    const transactionId = generateTransactionId();

    // Determine destination display
    let destination = '';
    switch (body.paymentMethod) {
      case 'STRIPE':
        destination = 'Stripe 연결 계정';
        break;
      case 'BANK_WIRE':
        destination = body.bankDetails?.bankName || '지정 은행';
        break;
      case 'CRYPTO_BRIDGE':
        destination = body.destinationAddress
          ? `${body.destinationAddress.slice(0, 8)}...${body.destinationAddress.slice(-6)}`
          : 'Unknown';
        break;
    }

    const response: SettlementResponse = {
      success: true,
      transactionId,
      status: 'PROCESSING',
      kausAmount: body.amount,
      fiatAmount: Math.round(netAmount * 100) / 100,
      currency: body.currency,
      exchangeRate,
      fees,
      estimatedCompletion: getEstimatedCompletion(body.paymentMethod),
      settlementDetails: {
        method: body.paymentMethod,
        destination,
      },
      timestamp: Date.now(),
    };

    // In production, this would:
    // 1. Verify user's KAUS balance
    // 2. Lock the KAUS amount
    // 3. Initiate payment via Stripe/Bank/Crypto
    // 4. Update transaction status
    // 5. Release or confirm KAUS burn

    return NextResponse.json(response);

  } catch (error) {
    console.error('Settlement error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '결제 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get('transactionId');

  if (transactionId) {
    // In production, fetch actual transaction status
    return NextResponse.json({
      transactionId,
      status: 'PROCESSING',
      message: '결제가 처리 중입니다.',
      progress: 65,
      estimatedRemaining: '약 2시간',
    });
  }

  // Return exchange rates and supported methods
  return NextResponse.json({
    exchangeRates: KAUS_EXCHANGE_RATES,
    supportedCurrencies: Object.keys(KAUS_EXCHANGE_RATES),
    paymentMethods: [
      {
        id: 'STRIPE',
        name: 'Stripe',
        description: '신용카드/직불카드 결제',
        processingTime: '즉시 ~ 2영업일',
        minAmount: 10,
        maxAmount: 50000,
        feePercent: 2.9,
        feeFixed: 0.30,
      },
      {
        id: 'BANK_WIRE',
        name: '은행 송금',
        description: '국내/해외 은행 계좌로 직접 송금',
        processingTime: '1-3 영업일',
        minAmount: 100,
        maxAmount: 1000000,
        feePercent: 1.0,
        feeFixed: 25,
      },
      {
        id: 'CRYPTO_BRIDGE',
        name: '암호화폐 브릿지',
        description: 'USDT, ETH, BTC 등으로 변환',
        processingTime: '10-30분',
        minAmount: 10,
        maxAmount: 100000,
        feePercent: 0.5,
        feeFixed: 0,
      },
    ],
    limits: {
      daily: 500000, // KAUS
      weekly: 2000000,
      monthly: 5000000,
    },
    lastUpdated: new Date().toISOString(),
  });
}
