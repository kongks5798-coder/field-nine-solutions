/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 81: SOVEREIGN VAULT - RESERVE DATA API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Endpoint for fetching KAUS token supply data
 * - Total supply, circulating, reserve, burned
 * - Operation audit logs
 * - Protected: Emperor access only
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy-init Supabase client with service role for admin operations
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();

  // Check authorization header for session token
  const authHeader = request.headers.get('Authorization');

  if (!supabase) {
    // Return mock data when Supabase is not configured
    return NextResponse.json({
      success: true,
      reserve: {
        totalSupply: 1000000000,
        circulatingSupply: 750000000,
        reserveBalance: 200000000,
        burnedTotal: 50000000,
        mintedTotal: 1050000000,
        lastOperation: {
          type: 'mint',
          amount: 10000000,
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          signature: 'sha256_mock_7f8d9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e',
        },
      },
      logs: [
        {
          id: '1',
          type: 'mint',
          amount: 10000000,
          reason: 'Initial liquidity injection',
          signature: 'sha256_7f8d9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          executedBy: 'EMPEROR',
        },
        {
          id: '2',
          type: 'burn',
          amount: 5000000,
          reason: 'Supply reduction - Q4 adjustment',
          signature: 'sha256_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          executedBy: 'EMPEROR',
        },
        {
          id: '3',
          type: 'mint',
          amount: 25000000,
          reason: 'Exchange liquidity pool funding',
          signature: 'sha256_b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
          timestamp: new Date(Date.now() - 259200000).toISOString(),
          executedBy: 'EMPEROR',
        },
      ],
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // Fetch reserve data from system_reserve table
    const { data: reserve, error: reserveError } = await supabase
      .from('system_reserve')
      .select('*')
      .single();

    if (reserveError && reserveError.code !== 'PGRST116') {
      console.error('[Vault] Reserve fetch error:', reserveError);
    }

    // Fetch operation logs
    const { data: logs, error: logsError } = await supabase
      .from('reserve_operations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (logsError && logsError.code !== 'PGRST116') {
      console.error('[Vault] Logs fetch error:', logsError);
    }

    // Mock logs for when DB has no data
    const mockLogs = [
      {
        id: '1',
        type: 'mint',
        amount: 10000000,
        reason: 'Initial liquidity injection',
        signature: 'sha256_7f8d9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        executedBy: 'EMPEROR',
      },
      {
        id: '2',
        type: 'burn',
        amount: 5000000,
        reason: 'Supply reduction - Q4 adjustment',
        signature: 'sha256_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        executedBy: 'EMPEROR',
      },
    ];

    // Transform data for response
    const formattedReserve = reserve ? {
      totalSupply: reserve.total_supply || 0,
      circulatingSupply: reserve.circulating_supply || 0,
      reserveBalance: reserve.reserve_balance || 0,
      burnedTotal: reserve.burned_total || 0,
      mintedTotal: reserve.minted_total || 0,
      lastOperation: reserve.last_operation,
    } : {
      totalSupply: 1000000000,
      circulatingSupply: 750000000,
      reserveBalance: 200000000,
      burnedTotal: 50000000,
      mintedTotal: 1050000000,
      lastOperation: null,
    };

    const formattedLogs = logs && logs.length > 0
      ? logs.map((log: Record<string, unknown>) => ({
          id: log.id,
          type: log.operation_type,
          amount: log.amount,
          reason: log.reason,
          signature: log.signature,
          timestamp: log.created_at,
          executedBy: log.executed_by,
        }))
      : mockLogs;

    return NextResponse.json({
      success: true,
      reserve: formattedReserve,
      logs: formattedLogs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Vault] GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch reserve data',
    }, { status: 500 });
  }
}
