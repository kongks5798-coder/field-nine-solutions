/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 52: PRODUCTION KAUS COIN PURCHASE SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * ZERO SIMULATION - 실제 결제 검증 기반 코인 지급
 * 금융 표준 준수: 소수점 8자리 정밀도
 *
 * "검증 없는 거래는 없다"
 */

import { createClient } from '@supabase/supabase-js';
import { auditLogger, logBalanceUpdate } from '@/lib/audit/logger';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS - Financial Standards
// ═══════════════════════════════════════════════════════════════════════════════

export const KAUS_PRICE_KRW = 120.00000000; // 1 KAUS = 120 KRW (8 decimals)
export const KAUS_PRICE_USD = 0.09000000;   // 1 KAUS = $0.09 (8 decimals)
export const DECIMAL_PRECISION = 8;

export const PURCHASE_PACKAGES = [
  {
    id: 'starter',
    kausAmount: 1000.00000000,
    priceKRW: 100000.00000000,
    priceUSD: 75.00000000,
    bonus: 0,
    label: 'Starter',
    popular: false,
  },
  {
    id: 'growth',
    kausAmount: 5000.00000000,
    priceKRW: 475000.00000000,
    priceUSD: 350.00000000,
    bonus: 5,
    label: 'Growth',
    popular: true,
  },
  {
    id: 'premium',
    kausAmount: 10000.00000000,
    priceKRW: 900000.00000000,
    priceUSD: 670.00000000,
    bonus: 10,
    label: 'Premium',
    popular: false,
  },
  {
    id: 'sovereign',
    kausAmount: 50000.00000000,
    priceKRW: 4000000.00000000,
    priceUSD: 3000.00000000,
    bonus: 20,
    label: 'Sovereign',
    popular: false,
  },
] as const;

export type PackageId = typeof PURCHASE_PACKAGES[number]['id'];

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface KausPurchaseRequest {
  packageId: PackageId;
  currency: 'KRW' | 'USD';
  paymentMethod: 'paypal' | 'toss' | 'card';
  userId: string;
  paymentVerificationId?: string;
}

export interface KausPurchaseResult {
  success: boolean;
  orderId?: string;
  kausAmount?: number;
  bonusAmount?: number;
  totalKaus?: number;
  transactionId?: string;
  error?: string;
  newBalance?: number;
}

export interface WithdrawalRequest {
  userId: string;
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
}

export interface WithdrawalResult {
  success: boolean;
  withdrawalId?: string;
  amount?: number;
  fee?: number;
  netAmount?: number;
  estimatedArrival?: string;
  error?: string;
}

export interface UserBalance {
  kausBalance: number;
  pendingKaus: number;
  availableForWithdrawal: number;
  totalEarnings: number;
  totalDeposits: number;
  totalWithdrawals: number;
  lastUpdated: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRECISION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export function toFinancialPrecision(value: number): number {
  return Number(value.toFixed(DECIMAL_PRECISION));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PACKAGE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export function getPackage(packageId: PackageId) {
  return PURCHASE_PACKAGES.find(p => p.id === packageId);
}

export function calculateKausFromFiat(amount: number, currency: 'KRW' | 'USD'): number {
  const rate = currency === 'KRW' ? KAUS_PRICE_KRW : KAUS_PRICE_USD;
  return toFinancialPrecision(amount / rate);
}

export function calculateFiatFromKaus(kausAmount: number, currency: 'KRW' | 'USD'): number {
  const rate = currency === 'KRW' ? KAUS_PRICE_KRW : KAUS_PRICE_USD;
  return toFinancialPrecision(kausAmount * rate);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PURCHASE FUNCTIONS (Server-side only)
// ═══════════════════════════════════════════════════════════════════════════════

export async function initiatePurchase(
  request: KausPurchaseRequest
): Promise<KausPurchaseResult> {
  const pkg = getPackage(request.packageId);
  if (!pkg) {
    return { success: false, error: 'Invalid package' };
  }

  const orderId = `KAUS-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
  const bonusAmount = toFinancialPrecision(pkg.kausAmount * (pkg.bonus / 100));
  const totalKaus = toFinancialPrecision(pkg.kausAmount + bonusAmount);

  // Log pending purchase (no balance update yet)
  await auditLogger.log({
    eventType: 'KAUS_PURCHASE',
    userId: request.userId,
    amount: totalKaus,
    currency: request.currency,
    status: 'PENDING',
    details: {
      orderId,
      packageId: request.packageId,
      bonusAmount,
      paymentMethod: request.paymentMethod,
      awaitingPaymentVerification: true,
    },
  });

  return {
    success: true,
    orderId,
    kausAmount: pkg.kausAmount,
    bonusAmount,
    totalKaus,
  };
}

/**
 * Complete purchase ONLY after payment verification
 * This function should only be called from webhook handlers
 */
export async function completePurchase(
  userId: string,
  orderId: string,
  totalKaus: number,
  paymentVerificationId: string
): Promise<KausPurchaseResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, error: 'Database unavailable' };
  }

  try {
    // Verify payment hasn't been used before (prevent double-spend)
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id')
      .eq('payment_verification_id', paymentVerificationId)
      .single();

    if (existingTx) {
      return { success: false, error: 'Payment already processed' };
    }

    // Get current balance
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('kaus_balance')
      .eq('id', userId)
      .single();

    if (fetchError) {
      return { success: false, error: 'User not found' };
    }

    const previousBalance = toFinancialPrecision(user?.kaus_balance || 0);
    const newBalance = toFinancialPrecision(previousBalance + totalKaus);

    // Update balance
    const { error: updateError } = await supabase
      .from('users')
      .update({
        kaus_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      return { success: false, error: 'Balance update failed' };
    }

    // Record transaction
    const transactionId = `TX-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    await supabase.from('transactions').insert({
      id: transactionId,
      user_id: userId,
      type: 'PURCHASE',
      amount: totalKaus,
      balance_before: previousBalance,
      balance_after: newBalance,
      reference_id: orderId,
      payment_verification_id: paymentVerificationId,
      verified: true,
      created_at: new Date().toISOString(),
    });

    // Log successful balance update
    await logBalanceUpdate(userId, previousBalance, newBalance, 'KAUS_PURCHASE', transactionId);

    return {
      success: true,
      orderId,
      totalKaus,
      transactionId,
      newBalance,
    };
  } catch (error) {
    console.error('[CompletePurchase] Error:', error);
    return { success: false, error: 'Internal error' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WITHDRAWAL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const WITHDRAWAL_FEES = {
  bank: { percentage: 0.50000000, minFee: 1000.00000000, currency: 'KRW' as const },
  paypal: { percentage: 2.90000000, minFee: 0.50000000, currency: 'USD' as const },
  crypto: { percentage: 0.10000000, minFee: 0.00000000, currency: 'USD' as const },
};

export const MIN_WITHDRAWAL = {
  KRW: 10000.00000000,
  USD: 10.00000000,
};

export const MAX_WITHDRAWAL = {
  KRW: 100000000.00000000,
  USD: 100000.00000000,
};

export function calculateWithdrawalFee(
  amount: number,
  method: 'bank' | 'paypal' | 'crypto',
  currency: 'KRW' | 'USD'
): number {
  const feeConfig = WITHDRAWAL_FEES[method];
  const percentageFee = toFinancialPrecision(amount * (feeConfig.percentage / 100));

  let minFee = feeConfig.minFee;
  if (feeConfig.currency !== currency) {
    minFee = currency === 'KRW' ? toFinancialPrecision(minFee * 1320) : toFinancialPrecision(minFee / 1320);
  }

  return Math.max(percentageFee, minFee);
}

export async function initiateWithdrawal(
  request: WithdrawalRequest
): Promise<WithdrawalResult> {
  const { userId, amount, currency, method } = request;

  // Validate amount
  if (amount < MIN_WITHDRAWAL[currency]) {
    return { success: false, error: `Minimum withdrawal: ${MIN_WITHDRAWAL[currency]} ${currency}` };
  }

  if (amount > MAX_WITHDRAWAL[currency]) {
    return { success: false, error: `Maximum withdrawal: ${MAX_WITHDRAWAL[currency]} ${currency}` };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, error: 'Database unavailable' };
  }

  // Check user balance
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('kaus_balance')
    .eq('id', userId)
    .single();

  if (fetchError || !user) {
    return { success: false, error: 'User not found' };
  }

  const kausRequired = calculateKausFromFiat(amount, currency);
  if (user.kaus_balance < kausRequired) {
    return { success: false, error: 'Insufficient balance' };
  }

  const fee = calculateWithdrawalFee(amount, method, currency);
  const netAmount = toFinancialPrecision(amount - fee);

  const arrivalDays = method === 'bank' ? 1 : 0;
  const estimatedArrival = new Date(Date.now() + arrivalDays * 24 * 60 * 60 * 1000).toISOString();

  const withdrawalId = `WD-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

  // Log pending withdrawal
  await auditLogger.log({
    eventType: 'WITHDRAWAL_REQUEST',
    userId,
    amount,
    currency,
    status: 'PENDING',
    details: {
      withdrawalId,
      method,
      fee,
      netAmount,
      estimatedArrival,
      destination: request.destination,
    },
  });

  return {
    success: true,
    withdrawalId,
    amount,
    fee,
    netAmount,
    estimatedArrival,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER BALANCE (Production - Database Only)
// ═══════════════════════════════════════════════════════════════════════════════

export async function getUserBalance(userId: string): Promise<UserBalance | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error('[getUserBalance] Database unavailable');
    return null;
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('kaus_balance, pending_kaus, total_earnings, total_deposits, total_withdrawals, updated_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return null;
    }

    const kausBalance = toFinancialPrecision(user.kaus_balance || 0);
    const pendingKaus = toFinancialPrecision(user.pending_kaus || 0);

    return {
      kausBalance,
      pendingKaus,
      availableForWithdrawal: toFinancialPrecision(kausBalance - pendingKaus),
      totalEarnings: toFinancialPrecision(user.total_earnings || 0),
      totalDeposits: toFinancialPrecision(user.total_deposits || 0),
      totalWithdrawals: toFinancialPrecision(user.total_withdrawals || 0),
      lastUpdated: user.updated_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('[getUserBalance] Error:', error);
    return null;
  }
}

export function convertKausToFiat(kausAmount: number, currency: 'KRW' | 'USD'): number {
  return toFinancialPrecision(
    currency === 'KRW'
      ? kausAmount * KAUS_PRICE_KRW
      : kausAmount * KAUS_PRICE_USD
  );
}
