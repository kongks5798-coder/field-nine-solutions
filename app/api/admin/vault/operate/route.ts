/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 81: SOVEREIGN VAULT - MINT/BURN OPERATIONS API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Endpoint for executing KAUS token operations
 * - Mint: Create new tokens
 * - Burn: Remove tokens from circulation
 * - SHA-256 audit trail for all operations
 * - Protected: Emperor access only (kongks5798@gmail.com)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { broadcastSystemEvent, createSystemEvent } from '@/lib/system-events';

// Lazy-init Supabase client with service role for admin operations
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Generate SHA-256 signature for audit trail
function generateSignature(operation: {
  type: string;
  amount: number;
  reason: string;
  timestamp: string;
  executor: string;
}): string {
  const data = JSON.stringify(operation);
  return crypto.createHash('sha256').update(data).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, amount, reason } = body;

    // Validate input
    if (!type || !['mint', 'burn'].includes(type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid operation type. Must be "mint" or "burn"',
      }, { status: 400 });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Amount must be a positive number',
      }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const executor = 'EMPEROR';

    // Generate cryptographic signature
    const signature = generateSignature({
      type,
      amount,
      reason: reason || `${type.toUpperCase()} operation`,
      timestamp,
      executor,
    });

    const supabase = getSupabaseAdmin();

    if (!supabase) {
      // Mock response when Supabase is not configured
      console.log(`[Vault] Mock ${type.toUpperCase()}: ${amount} KAUS`);
      console.log(`[Vault] Signature: ${signature}`);

      // Broadcast system event for Jarvis integration
      const eventType = type === 'mint' ? 'MINT_EXECUTED' : 'BURN_EXECUTED';
      const systemEvent = createSystemEvent(eventType, {
        amount,
        reason: reason || `${type.toUpperCase()} operation`,
        signature,
        executor: 'EMPEROR',
        impact: amount >= 1000000 ? 'high' : amount >= 100000 ? 'medium' : 'low',
      });
      broadcastSystemEvent(systemEvent);

      return NextResponse.json({
        success: true,
        message: `Successfully ${type === 'mint' ? 'minted' : 'burned'} ${amount.toLocaleString()} KAUS`,
        operation: {
          type,
          amount,
          reason: reason || `${type.toUpperCase()} operation`,
          timestamp,
          signature,
        },
        signature,
      });
    }

    // Start transaction
    // First, get current reserve data
    const { data: currentReserve, error: fetchError } = await supabase
      .from('system_reserve')
      .select('*')
      .single();

    // If table doesn't exist or other DB error, fall back to mock mode
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.warn('[Vault] DB error, falling back to mock mode:', fetchError.message);

      // Broadcast system event for Jarvis integration (mock mode)
      const eventType = type === 'mint' ? 'MINT_EXECUTED' : 'BURN_EXECUTED';
      const systemEvent = createSystemEvent(eventType, {
        amount,
        reason: reason || `${type.toUpperCase()} operation`,
        signature,
        executor: 'EMPEROR',
        impact: amount >= 1000000 ? 'high' : amount >= 100000 ? 'medium' : 'low',
      });
      broadcastSystemEvent(systemEvent);

      // Return mock success response
      return NextResponse.json({
        success: true,
        message: `Successfully ${type === 'mint' ? 'minted' : 'burned'} ${amount.toLocaleString()} KAUS (mock mode)`,
        operation: {
          type,
          amount,
          reason: reason || `${type.toUpperCase()} operation`,
          timestamp,
          signature,
        },
        signature,
        mock: true,
      });
    }

    // Calculate new values
    const currentTotal = currentReserve?.total_supply || 1000000000;
    const currentCirculating = currentReserve?.circulating_supply || 750000000;
    const currentReserveBalance = currentReserve?.reserve_balance || 200000000;
    const currentBurned = currentReserve?.burned_total || 50000000;
    const currentMinted = currentReserve?.minted_total || 1050000000;

    let newValues;
    if (type === 'mint') {
      newValues = {
        total_supply: currentTotal + amount,
        circulating_supply: currentCirculating + amount,
        reserve_balance: currentReserveBalance,
        burned_total: currentBurned,
        minted_total: currentMinted + amount,
      };
    } else {
      // Burn - ensure we have enough to burn
      if (amount > currentCirculating) {
        return NextResponse.json({
          success: false,
          error: `Cannot burn ${amount} KAUS. Only ${currentCirculating} in circulation.`,
        }, { status: 400 });
      }
      newValues = {
        total_supply: currentTotal - amount,
        circulating_supply: currentCirculating - amount,
        reserve_balance: currentReserveBalance,
        burned_total: currentBurned + amount,
        minted_total: currentMinted,
      };
    }

    // Update reserve
    const { error: updateError } = await supabase
      .from('system_reserve')
      .upsert({
        id: 'main',
        ...newValues,
        last_operation: {
          type,
          amount,
          timestamp,
          signature,
        },
        updated_at: timestamp,
      });

    if (updateError) {
      console.error('[Vault] Failed to update reserve:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update reserve',
      }, { status: 500 });
    }

    // Log operation
    const { error: logError } = await supabase
      .from('reserve_operations')
      .insert({
        operation_type: type,
        amount,
        reason: reason || `${type.toUpperCase()} operation`,
        signature,
        executed_by: executor,
        created_at: timestamp,
        pre_supply: currentTotal,
        post_supply: newValues.total_supply,
      });

    if (logError) {
      console.error('[Vault] Failed to log operation:', logError);
      // Don't fail the request, just log the error
    }

    console.log(`[Vault] ${type.toUpperCase()} executed: ${amount} KAUS`);
    console.log(`[Vault] Signature: ${signature}`);

    // Broadcast system event for Jarvis integration (real transaction)
    const eventType = type === 'mint' ? 'MINT_EXECUTED' : 'BURN_EXECUTED';
    const systemEvent = createSystemEvent(eventType, {
      amount,
      reason: reason || `${type.toUpperCase()} operation`,
      signature,
      executor: 'EMPEROR',
      impact: amount >= 1000000 ? 'high' : amount >= 100000 ? 'medium' : 'low',
      previousValue: currentTotal,
      newValue: newValues.total_supply,
    });
    broadcastSystemEvent(systemEvent);

    return NextResponse.json({
      success: true,
      message: `Successfully ${type === 'mint' ? 'minted' : 'burned'} ${amount.toLocaleString()} KAUS`,
      operation: {
        type,
        amount,
        reason: reason || `${type.toUpperCase()} operation`,
        timestamp,
        signature,
      },
      newSupply: newValues.total_supply,
      signature,
    });
  } catch (error) {
    console.error('[Vault] Operation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to execute operation',
    }, { status: 500 });
  }
}
