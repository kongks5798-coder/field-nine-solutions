/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 57: BLOCKCHAIN TRANSACTIONS API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * GET /api/blockchain/transactions - Get user's blockchain transactions
 * POST /api/blockchain/transactions - Record a new transaction
 * PATCH /api/blockchain/transactions - Update transaction status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getTransactionStatus, type Network } from '@/lib/blockchain/alchemy-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE ADMIN CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase credentials not configured');
  return createClient(url, key);
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface RecordTransactionRequest {
  txHash: string;
  chainId: number;
  txType: 'SETTLEMENT' | 'STAKE' | 'UNSTAKE' | 'BRIDGE' | 'TRANSFER';
  fromAddress: string;
  toAddress: string;
  amount: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  settlementId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHAIN ID TO NETWORK
// ═══════════════════════════════════════════════════════════════════════════════

const chainIdToNetwork: Record<number, Network> = {
  1: 'ethereum',
  42161: 'arbitrum',
  137: 'polygon',
  10: 'optimism',
};

// ═══════════════════════════════════════════════════════════════════════════════
// GET - Get User's Transactions
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const txType = searchParams.get('type');
    const chainId = searchParams.get('chainId');

    const supabaseAdmin = getSupabaseAdmin();

    // Build query
    let query = supabaseAdmin
      .from('blockchain_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (txType) query = query.eq('tx_type', txType);
    if (chainId) query = query.eq('chain_id', parseInt(chainId));

    const { data: transactions, error, count } = await query;

    if (error) {
      console.error('[TX API] Fetch error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch transactions', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactions: transactions.map(tx => ({
        id: tx.id,
        txHash: tx.tx_hash,
        chainId: tx.chain_id,
        type: tx.tx_type,
        from: tx.from_address,
        to: tx.to_address,
        amount: tx.amount,
        amountUsd: tx.amount_usd,
        tokenSymbol: tx.token_symbol,
        status: tx.status,
        confirmations: tx.confirmations,
        gasUsed: tx.gas_used,
        gasCostUsd: tx.gas_cost_usd,
        submittedAt: tx.submitted_at,
        confirmedAt: tx.confirmed_at,
        settlementId: tx.settlement_id,
      })),
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
    });

  } catch (error) {
    console.error('[TX API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST - Record New Transaction
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body: RecordTransactionRequest = await request.json();

    // Validate tx hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(body.txHash)) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction hash', code: 'INVALID_TX_HASH' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Check if transaction already exists
    const { data: existingTx } = await supabaseAdmin
      .from('blockchain_transactions')
      .select('id')
      .eq('tx_hash', body.txHash)
      .single();

    if (existingTx) {
      return NextResponse.json(
        { success: false, error: 'Transaction already recorded', code: 'TX_EXISTS' },
        { status: 409 }
      );
    }

    // Get initial transaction status from blockchain
    const network = chainIdToNetwork[body.chainId] || 'ethereum';
    const txStatus = await getTransactionStatus(body.txHash, network);

    // Insert transaction record
    const { data: transaction, error: insertError } = await supabaseAdmin
      .from('blockchain_transactions')
      .insert({
        user_id: user.id,
        tx_hash: body.txHash,
        chain_id: body.chainId,
        tx_type: body.txType,
        from_address: body.fromAddress.toLowerCase(),
        to_address: body.toAddress.toLowerCase(),
        amount: body.amount,
        token_address: body.tokenAddress?.toLowerCase(),
        token_symbol: body.tokenSymbol || 'KAUS',
        status: txStatus?.status.toUpperCase() || 'PENDING',
        confirmations: txStatus?.confirmations || 0,
        block_number: txStatus?.blockNumber,
        gas_used: txStatus?.gasUsed,
        settlement_id: body.settlementId,
        submitted_at: new Date().toISOString(),
        confirmed_at: txStatus?.status === 'confirmed' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[TX API] Insert error:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to record transaction', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // Log to audit
    await supabaseAdmin.from('audit_logs').insert({
      event_type: 'BLOCKCHAIN_TX_RECORDED',
      user_id: user.id,
      status: 'SUCCESS',
      details: {
        txHash: body.txHash,
        txType: body.txType,
        amount: body.amount,
        chainId: body.chainId,
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        txHash: transaction.tx_hash,
        status: transaction.status,
        confirmations: transaction.confirmations,
      },
    });

  } catch (error) {
    console.error('[TX API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH - Update Transaction Status
// ═══════════════════════════════════════════════════════════════════════════════

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const txHash = searchParams.get('txHash');

    if (!txHash) {
      return NextResponse.json(
        { success: false, error: 'Transaction hash required', code: 'MISSING_PARAM' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get existing transaction
    const { data: existingTx, error: fetchError } = await supabaseAdmin
      .from('blockchain_transactions')
      .select('*')
      .eq('tx_hash', txHash)
      .single();

    if (fetchError || !existingTx) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found', code: 'TX_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Skip if already confirmed or failed
    if (existingTx.status === 'CONFIRMED' || existingTx.status === 'FAILED') {
      return NextResponse.json({
        success: true,
        transaction: {
          txHash: existingTx.tx_hash,
          status: existingTx.status,
          confirmations: existingTx.confirmations,
        },
        message: 'Transaction already finalized',
      });
    }

    // Get updated status from blockchain
    const network = chainIdToNetwork[existingTx.chain_id] || 'ethereum';
    const txStatus = await getTransactionStatus(txHash, network);

    if (!txStatus) {
      return NextResponse.json(
        { success: false, error: 'Could not fetch transaction status', code: 'FETCH_FAILED' },
        { status: 502 }
      );
    }

    // Update transaction
    const { error: updateError } = await supabaseAdmin
      .from('blockchain_transactions')
      .update({
        status: txStatus.status.toUpperCase(),
        confirmations: txStatus.confirmations,
        block_number: txStatus.blockNumber,
        gas_used: txStatus.gasUsed,
        confirmed_at: txStatus.status === 'confirmed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('tx_hash', txHash);

    if (updateError) {
      console.error('[TX API] Update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update transaction', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // If confirmed and linked to settlement, update settlement status
    if (txStatus.status === 'confirmed' && existingTx.settlement_id) {
      await supabaseAdmin
        .from('kaus_settlements')
        .update({
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingTx.settlement_id);

      // Deduct from wallet balance
      const { data: settlement } = await supabaseAdmin
        .from('kaus_settlements')
        .select('wallet_id, kaus_amount')
        .eq('id', existingTx.settlement_id)
        .single();

      if (settlement) {
        await supabaseAdmin.rpc('deduct_wallet_balance', {
          p_wallet_id: settlement.wallet_id,
          p_amount: settlement.kaus_amount,
        });
      }
    }

    return NextResponse.json({
      success: true,
      transaction: {
        txHash,
        status: txStatus.status.toUpperCase(),
        confirmations: txStatus.confirmations,
        blockNumber: txStatus.blockNumber,
      },
    });

  } catch (error) {
    console.error('[TX API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
