import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getKausConversionRate,
  exchangeKwhToKaus,
  getKausWalletBalance,
  calculateUptime,
  type KausConversionRate,
  type KausExchangeResult,
  type KausWalletBalance,
} from '@/lib/partnerships/live-data-service';
import { auditLogger, logKausTransaction } from '@/lib/logging/audit-logger';
import { validateRequest, KausExchangeRequestSchema } from '@/lib/validation/api-schemas';

/**
 * KAUS ENERGY EXCHANGE API (PHASE 78: BUG ZERO)
 * Phase 33: Energy-to-Coin Conversion Endpoints
 *
 * Conversion Formula:
 * - Base: 1 kWh = 10 KAUS
 * - Price: 1 KAUS = $0.10 USD
 * - Dynamic multipliers apply based on grid demand and V2G bonus
 *
 * Uptime Formula:
 * Uptime% = (TotalTime - DownTime) / TotalTime × 100
 *
 * PHASE 78: Integrated audit logging & Zod validation
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Request Validation Schemas
const ExchangePostSchema = z.object({
  action: z.enum(['exchange', 'uptime']),
  kwhAmount: z.number().min(0.1, 'Minimum exchange is 0.1 kWh').max(10000, 'Maximum exchange is 10,000 kWh').optional(),
  totalTime: z.number().positive('totalTime must be greater than 0').optional(),
  downTime: z.number().min(0).optional(),
}).refine(
  (data) => data.action !== 'exchange' || (data.kwhAmount !== undefined && data.kwhAmount >= 0.1),
  { message: 'kwhAmount is required for exchange action' }
);

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// GET: Fetch current rate, wallet balance, or perform calculations
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'rate';

  try {
    switch (action) {
      case 'rate': {
        const rate = await getKausConversionRate();

        auditLogger.debug('kaus', 'rate_fetched', 'KAUS conversion rate fetched', {
          rate: rate.currentRate,
          multiplier: rate.multiplier,
          duration: Date.now() - startTime,
        });

        return NextResponse.json<APIResponse<KausConversionRate>>({
          success: true,
          data: rate,
          timestamp: new Date().toISOString(),
        });
      }

      case 'wallet': {
        const wallet = await getKausWalletBalance();

        auditLogger.debug('kaus', 'wallet_balance_fetched', 'KAUS wallet balance fetched', {
          kausBalance: wallet.kausBalance,
          duration: Date.now() - startTime,
        });

        return NextResponse.json<APIResponse<KausWalletBalance>>({
          success: true,
          data: wallet,
          timestamp: new Date().toISOString(),
        });
      }

      case 'uptime': {
        const totalTime = parseInt(searchParams.get('totalTime') || '0');
        const downTime = parseInt(searchParams.get('downTime') || '0');

        if (totalTime <= 0) {
          auditLogger.warn('kaus', 'uptime_invalid_params', 'Invalid uptime calculation params', {
            totalTime,
            downTime,
          });

          return NextResponse.json<APIResponse<null>>({
            success: false,
            error: 'totalTime must be greater than 0',
            timestamp: new Date().toISOString(),
          }, { status: 400 });
        }

        const uptimePercent = calculateUptime(totalTime, downTime);

        auditLogger.debug('performance', 'uptime_calculated', 'Uptime percentage calculated', {
          totalTime,
          downTime,
          uptimePercent,
          duration: Date.now() - startTime,
        });

        return NextResponse.json<APIResponse<{ uptime: number; formula: string }>>({
          success: true,
          data: {
            uptime: parseFloat(uptimePercent.toFixed(4)),
            formula: `(${totalTime} - ${downTime}) / ${totalTime} × 100 = ${uptimePercent.toFixed(4)}%`,
          },
          timestamp: new Date().toISOString(),
        });
      }

      default:
        auditLogger.warn('api', 'unknown_action', `Unknown action requested: ${action}`, {
          action,
        });

        return NextResponse.json<APIResponse<null>>({
          success: false,
          error: `Unknown action: ${action}`,
          timestamp: new Date().toISOString(),
        }, { status: 400 });
    }
  } catch (error) {
    auditLogger.error('kaus', 'exchange_get_error', 'Error in exchange GET endpoint', error as Error, {
      action,
      duration: Date.now() - startTime,
    });

    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// POST: Execute exchange
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    const body = await request.json();

    // Zod Validation
    const validation = ExchangePostSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`);

      auditLogger.warn('kaus', 'exchange_validation_failed', 'Exchange request validation failed', {
        errors,
        body,
      });

      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: errors.join(', '),
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    const validatedBody = validation.data;

    if (validatedBody.action === 'exchange') {
      const kwhAmount = validatedBody.kwhAmount!;

      auditLogger.info('kaus', 'exchange_initiated', 'KAUS exchange transaction initiated', {
        transactionId,
        kwhAmount,
      });

      const result = await exchangeKwhToKaus(kwhAmount);

      // Log successful transaction
      logKausTransaction(
        'system', // Replace with actual userId when auth is available
        transactionId,
        'exchange',
        result.netKaus,
        'completed',
        undefined,
        undefined,
        {
          inputKwh: result.inputKwh,
          outputKaus: result.outputKaus,
          fee: result.fee,
          usdValue: result.usdValue,
          rate: result.rate.currentRate,
          multiplier: result.rate.multiplier,
        }
      );

      auditLogger.info('kaus', 'exchange_completed', `Exchange completed: ${kwhAmount} kWh → ${result.netKaus.toFixed(2)} KAUS`, {
        transactionId,
        kwhAmount,
        netKaus: result.netKaus,
        duration: Date.now() - startTime,
      });

      return NextResponse.json<APIResponse<KausExchangeResult>>({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    }

    if (validatedBody.action === 'uptime') {
      const { totalTime, downTime } = validatedBody;

      if (!totalTime || totalTime <= 0) {
        auditLogger.warn('kaus', 'uptime_invalid_params', 'Invalid uptime calculation params', {
          totalTime,
          downTime,
        });

        return NextResponse.json<APIResponse<null>>({
          success: false,
          error: 'totalTime must be greater than 0',
          timestamp: new Date().toISOString(),
        }, { status: 400 });
      }

      const uptimePercent = calculateUptime(totalTime, downTime || 0);

      auditLogger.debug('performance', 'uptime_calculated_post', 'Uptime percentage calculated via POST', {
        totalTime,
        downTime: downTime || 0,
        uptimePercent,
        duration: Date.now() - startTime,
      });

      return NextResponse.json<APIResponse<{
        totalTime: number;
        downTime: number;
        uptimePercent: number;
        formula: string;
      }>>({
        success: true,
        data: {
          totalTime,
          downTime: downTime || 0,
          uptimePercent: parseFloat(uptimePercent.toFixed(4)),
          formula: `Uptime% = (${totalTime} - ${downTime || 0}) / ${totalTime} × 100`,
        },
        timestamp: new Date().toISOString(),
      });
    }

    auditLogger.warn('api', 'invalid_post_action', 'Invalid POST action requested', {
      action: validatedBody.action,
    });

    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Invalid action. Use "exchange" or "uptime"',
      timestamp: new Date().toISOString(),
    }, { status: 400 });

  } catch (error) {
    auditLogger.error('kaus', 'exchange_post_error', 'Critical error in exchange POST endpoint', error as Error, {
      transactionId,
      duration: Date.now() - startTime,
    });

    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
