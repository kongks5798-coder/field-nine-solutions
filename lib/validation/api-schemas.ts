/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 78: API VALIDATION SCHEMAS - ZERO BUG ARCHITECTURE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Zod-based strict validation for all API endpoints.
 * NO DATA PASSES WITHOUT VALIDATION.
 *
 * Categories:
 * - KAUS Balance & Transactions
 * - User Authentication
 * - Payment Processing
 * - Energy Trading
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════════
// COMMON SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

export const UUIDSchema = z.string().uuid('Invalid UUID format');

export const EmailSchema = z.string().email('Invalid email format');

export const PositiveNumberSchema = z.number().positive('Must be a positive number');

export const NonNegativeNumberSchema = z.number().min(0, 'Cannot be negative');

export const TimestampSchema = z.string().datetime('Invalid timestamp format');

// ═══════════════════════════════════════════════════════════════════════════════
// KAUS SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

export const KausBalanceSchema = z.object({
  userId: UUIDSchema,
  kausBalance: NonNegativeNumberSchema,
  kwhBalance: NonNegativeNumberSchema,
  krwValue: NonNegativeNumberSchema,
  usdValue: NonNegativeNumberSchema,
  isLive: z.boolean(),
  timestamp: TimestampSchema.optional(),
});

export const KausTransactionSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  type: z.enum(['deposit', 'withdrawal', 'exchange', 'staking', 'dividend', 'referral', 'bonus']),
  amount: z.number(), // Can be negative for withdrawals
  balanceBefore: NonNegativeNumberSchema,
  balanceAfter: NonNegativeNumberSchema,
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']),
  txHash: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: TimestampSchema,
});

export const KausExchangeRequestSchema = z.object({
  action: z.enum(['exchange', 'rate']),
  kwhAmount: PositiveNumberSchema.optional(),
}).refine(
  (data) => data.action !== 'exchange' || data.kwhAmount !== undefined,
  { message: 'kwhAmount is required for exchange action' }
);

export const KausExchangeResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    kwhToKaus: PositiveNumberSchema,
    kausToUsd: PositiveNumberSchema,
    kausToKrw: PositiveNumberSchema,
    gridDemandMultiplier: PositiveNumberSchema,
    v2gBonus: NonNegativeNumberSchema,
    netKaus: NonNegativeNumberSchema.optional(),
    fee: NonNegativeNumberSchema.optional(),
    transactionId: z.string().optional(),
  }).optional(),
  error: z.string().optional(),
});

export const KausPurchaseRequestSchema = z.object({
  packageId: z.enum(['starter', 'growth', 'premium', 'enterprise']),
  currency: z.enum(['KRW', 'USD']),
  paymentMethod: z.enum(['stripe', 'paypal', 'toss', 'kaus']),
});

export const KausWithdrawRequestSchema = z.object({
  amount: PositiveNumberSchema.min(100, 'Minimum withdrawal is 100 KAUS'),
  method: z.enum(['bank', 'crypto', 'paypal']),
  bankAccount: z.string().optional(),
  cryptoAddress: z.string().optional(),
}).refine(
  (data) => {
    if (data.method === 'bank') return !!data.bankAccount;
    if (data.method === 'crypto') return !!data.cryptoAddress;
    return true;
  },
  { message: 'Bank account or crypto address required for respective methods' }
);

// ═══════════════════════════════════════════════════════════════════════════════
// DIVIDEND SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

export const DividendDistributionSchema = z.object({
  userId: UUIDSchema,
  amount: PositiveNumberSchema,
  source: z.enum(['yeongdong_solar', 'tesla_v2g', 'grid_arbitrage']),
  period: z.string(), // e.g., "2026-01-28"
  kausBalance: NonNegativeNumberSchema,
  sharePercentage: z.number().min(0).max(100),
});

export const DividendCronResultSchema = z.object({
  success: z.boolean(),
  totalDistributed: NonNegativeNumberSchema,
  recipientCount: z.number().int().min(0),
  distributions: z.array(DividendDistributionSchema),
  timestamp: TimestampSchema,
  errors: z.array(z.string()).optional(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// ENERGY TRADING SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

export const EnergySwapRequestSchema = z.object({
  fromSource: z.enum(['solar', 'wind', 'battery', 'grid']),
  toSource: z.enum(['solar', 'wind', 'battery', 'grid']),
  amount: PositiveNumberSchema,
  slippageTolerance: z.number().min(0).max(0.1).default(0.005),
});

export const TradingSignalSchema = z.object({
  action: z.enum(['buy', 'sell', 'hold']),
  confidence: z.number().min(0).max(1),
  price: PositiveNumberSchema,
  reason: z.string(),
  timestamp: TimestampSchema,
});

// ═══════════════════════════════════════════════════════════════════════════════
// USER WALLET SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

export const UserWalletSchema = z.object({
  id: UUIDSchema,
  user_id: UUIDSchema,
  kaus_balance: NonNegativeNumberSchema,
  kwh_balance: NonNegativeNumberSchema,
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
});

export const WalletUpdateSchema = z.object({
  kaus_balance: NonNegativeNumberSchema.optional(),
  kwh_balance: NonNegativeNumberSchema.optional(),
}).refine(
  (data) => data.kaus_balance !== undefined || data.kwh_balance !== undefined,
  { message: 'At least one balance field must be provided' }
);

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

export const PaymentWebhookSchema = z.object({
  event: z.string(),
  data: z.object({
    id: z.string(),
    amount: PositiveNumberSchema,
    currency: z.string(),
    status: z.enum(['succeeded', 'failed', 'pending', 'cancelled']),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
  timestamp: z.number(),
});

export const StripeWebhookSchema = z.object({
  id: z.string().startsWith('evt_'),
  type: z.string(),
  data: z.object({
    object: z.record(z.string(), z.unknown()),
  }),
  created: z.number(),
  livemode: z.boolean(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map((e) => {
    const path = e.path.join('.');
    return context
      ? `[${context}] ${path}: ${e.message}`
      : `${path}: ${e.message}`;
  });

  console.error('[VALIDATION ERROR]', errors);

  return { success: false, errors };
}

export function createValidatedHandler<TInput, TOutput>(
  inputSchema: z.ZodSchema<TInput>,
  handler: (input: TInput) => Promise<TOutput>
): (input: unknown) => Promise<TOutput | { success: false; errors: string[] }> {
  return async (input: unknown) => {
    const validation = validateRequest(inputSchema, input);

    if (!validation.success) {
      return { success: false, errors: validation.errors };
    }

    return handler(validation.data);
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// API RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

export const ApiSuccessResponseSchema = <T extends z.ZodSchema>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    timestamp: TimestampSchema.optional(),
  });

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.array(z.string()).optional(),
  timestamp: TimestampSchema.optional(),
});

export const ApiResponseSchema = <T extends z.ZodSchema>(dataSchema: T) =>
  z.union([ApiSuccessResponseSchema(dataSchema), ApiErrorResponseSchema]);

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type KausBalance = z.infer<typeof KausBalanceSchema>;
export type KausTransaction = z.infer<typeof KausTransactionSchema>;
export type KausExchangeRequest = z.infer<typeof KausExchangeRequestSchema>;
export type KausExchangeResponse = z.infer<typeof KausExchangeResponseSchema>;
export type KausPurchaseRequest = z.infer<typeof KausPurchaseRequestSchema>;
export type KausWithdrawRequest = z.infer<typeof KausWithdrawRequestSchema>;
export type DividendDistribution = z.infer<typeof DividendDistributionSchema>;
export type DividendCronResult = z.infer<typeof DividendCronResultSchema>;
export type EnergySwapRequest = z.infer<typeof EnergySwapRequestSchema>;
export type TradingSignal = z.infer<typeof TradingSignalSchema>;
export type UserWallet = z.infer<typeof UserWalletSchema>;
export type WalletUpdate = z.infer<typeof WalletUpdateSchema>;
export type PaymentWebhook = z.infer<typeof PaymentWebhookSchema>;
export type StripeWebhook = z.infer<typeof StripeWebhookSchema>;
