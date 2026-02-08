/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * USER KAUS BALANCE API - PRODUCTION GRADE (PHASE 78: BUG ZERO)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Returns authenticated user's KAUS balance from Supabase.
 * Creates wallet record if user doesn't have one.
 *
 * PRODUCTION: Real DB data only - no simulation
 * PHASE 78: Integrated audit logging & validation
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auditLogger, logKausTransaction } from '@/lib/logging/audit-logger';
import { UserWalletSchema } from '@/lib/validation/api-schemas';

export const dynamic = 'force-dynamic';

// KAUS pricing constants
const KAUS_PRICE_USD = 0.10;
const KAUS_PRICE_KRW = 120;

export async function GET() {
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      auditLogger.warn('auth', 'balance_fetch_unauthenticated', 'Unauthenticated balance request', {
        error: authError?.message,
      });

      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
        kausBalance: 0,
        kwhBalance: 0,
        krwValue: 0,
        usdValue: 0,
        isLive: false,
      }, { status: 401 });
    }

    // Fetch user's wallet from database
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If no wallet exists, create one with initial balance
    if (walletError && walletError.code === 'PGRST116') {
      auditLogger.info('kaus', 'wallet_creation_started', 'Creating new wallet for user', {
        userId: user.id,
      });

      // No row found - create new wallet
      const { data: newWallet, error: createError } = await supabase
        .from('user_wallets')
        .insert({
          user_id: user.id,
          kaus_balance: 100, // Welcome bonus: 100 KAUS
          kwh_balance: 10,   // Welcome bonus: 10 kWh
        })
        .select()
        .single();

      if (createError) {
        auditLogger.error('kaus', 'wallet_creation_failed', 'Failed to create user wallet', createError as Error, {
          userId: user.id,
          errorCode: createError.code,
        });

        return NextResponse.json({
          success: false,
          error: 'Failed to create wallet',
          kausBalance: 0,
          kwhBalance: 0,
          krwValue: 0,
          usdValue: 0,
          isLive: false,
        }, { status: 500 });
      }

      const kausBalance = newWallet?.kaus_balance || 0;
      const kwhBalance = newWallet?.kwh_balance || 0;

      // Log welcome bonus transaction
      logKausTransaction(
        user.id,
        `welcome-${user.id}-${Date.now()}`,
        'bonus',
        100,
        'completed',
        0,
        100,
        { source: 'welcome_bonus', kwh_bonus: 10 }
      );

      auditLogger.info('kaus', 'wallet_created', 'New wallet created with welcome bonus', {
        userId: user.id,
        kausBalance,
        kwhBalance,
        duration: Date.now() - startTime,
      });

      return NextResponse.json({
        success: true,
        userId: user.id,
        email: user.email,
        kausBalance,
        kwhBalance,
        krwValue: kausBalance * KAUS_PRICE_KRW,
        usdValue: kausBalance * KAUS_PRICE_USD,
        isLive: true,
        isNewUser: true,
        welcomeBonus: {
          kaus: 100,
          kwh: 10,
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (walletError) {
      auditLogger.error('kaus', 'wallet_fetch_failed', 'Failed to fetch user wallet', walletError as Error, {
        userId: user.id,
        errorCode: walletError.code,
      });

      return NextResponse.json({
        success: false,
        error: 'Database error',
        kausBalance: 0,
        kwhBalance: 0,
        krwValue: 0,
        usdValue: 0,
        isLive: false,
      }, { status: 500 });
    }

    const kausBalance = wallet?.kaus_balance || 0;
    const kwhBalance = wallet?.kwh_balance || 0;

    // Log successful balance fetch
    auditLogger.debug('kaus', 'balance_fetched', 'User balance retrieved successfully', {
      userId: user.id,
      kausBalance,
      kwhBalance,
      duration: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      kausBalance,
      kwhBalance,
      krwValue: kausBalance * KAUS_PRICE_KRW,
      usdValue: kausBalance * KAUS_PRICE_USD,
      isLive: true,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    auditLogger.critical('kaus', 'balance_api_crash', 'Critical error in balance API', error as Error, {
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
      kausBalance: 0,
      kwhBalance: 0,
      krwValue: 0,
      usdValue: 0,
      isLive: false,
    }, { status: 500 });
  }
}
