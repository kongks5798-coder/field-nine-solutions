/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 57: BLOCKCHAIN WALLET API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * POST /api/blockchain/wallet - Connect wallet to user account
 * GET /api/blockchain/wallet - Get user's connected wallets
 * DELETE /api/blockchain/wallet - Disconnect wallet
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

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

interface ConnectWalletRequest {
  walletAddress: string;
  chainId: number;
  connectorType: string;
  signature?: string; // For verification
  message?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function isValidEthAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST - Connect Wallet
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

    // Parse request
    const body: ConnectWalletRequest = await request.json();

    // Validate wallet address
    if (!isValidEthAddress(body.walletAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address', code: 'INVALID_ADDRESS' },
        { status: 400 }
      );
    }

    // Validate chain ID
    const supportedChains = [1, 42161, 137, 8453, 10, 11155111];
    if (!supportedChains.includes(body.chainId)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported chain', code: 'UNSUPPORTED_CHAIN' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Check if wallet is already connected to another user
    const { data: existingWallet } = await supabaseAdmin
      .from('connected_wallets')
      .select('user_id')
      .eq('wallet_address', body.walletAddress.toLowerCase())
      .eq('chain_id', body.chainId)
      .single();

    if (existingWallet && existingWallet.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Wallet already connected to another account', code: 'WALLET_IN_USE' },
        { status: 409 }
      );
    }

    // Check user's wallet count (limit to 5)
    const { count } = await supabaseAdmin
      .from('connected_wallets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (count && count >= 5) {
      return NextResponse.json(
        { success: false, error: 'Maximum wallet limit reached (5)', code: 'MAX_WALLETS' },
        { status: 400 }
      );
    }

    // Check if this is the first wallet (make it primary)
    const isPrimary = count === 0;

    // Upsert wallet
    const { data: wallet, error: upsertError } = await supabaseAdmin
      .from('connected_wallets')
      .upsert({
        user_id: user.id,
        wallet_address: body.walletAddress.toLowerCase(),
        chain_id: body.chainId,
        connector_type: body.connectorType,
        is_verified: !!body.signature, // If signature provided, mark as verified
        verified_at: body.signature ? new Date().toISOString() : null,
        signature_hash: body.signature || null,
        is_primary: isPrimary,
        is_active: true,
        last_connected_at: new Date().toISOString(),
        metadata: {
          userAgent: request.headers.get('user-agent'),
          connectedAt: new Date().toISOString(),
        },
      }, {
        onConflict: 'user_id,wallet_address,chain_id',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('[Wallet API] Upsert error:', upsertError);
      return NextResponse.json(
        { success: false, error: 'Failed to connect wallet', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // Log to audit
    await supabaseAdmin.from('audit_logs').insert({
      event_type: 'WALLET_CONNECTED',
      user_id: user.id,
      status: 'SUCCESS',
      details: {
        walletAddress: body.walletAddress,
        chainId: body.chainId,
        connectorType: body.connectorType,
        isPrimary,
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      wallet: {
        id: wallet.id,
        address: wallet.wallet_address,
        chainId: wallet.chain_id,
        connectorType: wallet.connector_type,
        isVerified: wallet.is_verified,
        isPrimary: wallet.is_primary,
        connectedAt: wallet.created_at,
      },
    });

  } catch (error) {
    console.error('[Wallet API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET - Get Connected Wallets
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

    const supabaseAdmin = getSupabaseAdmin();

    // Fetch user's wallets
    const { data: wallets, error } = await supabaseAdmin
      .from('connected_wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Wallet API] Fetch error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch wallets', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      wallets: wallets.map(w => ({
        id: w.id,
        address: w.wallet_address,
        chainId: w.chain_id,
        connectorType: w.connector_type,
        isVerified: w.is_verified,
        isPrimary: w.is_primary,
        lastConnectedAt: w.last_connected_at,
        connectedAt: w.created_at,
      })),
      count: wallets.length,
    });

  } catch (error) {
    console.error('[Wallet API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE - Disconnect Wallet
// ═══════════════════════════════════════════════════════════════════════════════

export async function DELETE(request: NextRequest) {
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
    const walletId = searchParams.get('id');
    const walletAddress = searchParams.get('address');

    if (!walletId && !walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet ID or address required', code: 'MISSING_PARAM' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Build query
    let query = supabaseAdmin
      .from('connected_wallets')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (walletId) {
      query = query.eq('id', walletId);
    } else if (walletAddress) {
      query = query.eq('wallet_address', walletAddress.toLowerCase());
    }

    const { error: updateError } = await query;

    if (updateError) {
      console.error('[Wallet API] Disconnect error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to disconnect wallet', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // Log to audit
    await supabaseAdmin.from('audit_logs').insert({
      event_type: 'WALLET_DISCONNECTED',
      user_id: user.id,
      status: 'SUCCESS',
      details: {
        walletId,
        walletAddress,
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Wallet disconnected successfully',
    });

  } catch (error) {
    console.error('[Wallet API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
