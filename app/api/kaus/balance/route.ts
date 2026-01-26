/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * KAUS COIN BALANCE API - FIELD NINE NEXUS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 38: THE FINAL ASCENSION
 * Returns Boss wallet Kaus Coin balance via Alchemy SDK
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Configuration
const CONFIG = {
  ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY || '',
  ALCHEMY_BASE_URL: 'https://polygon-mainnet.g.alchemy.com/v2',
  BOSS_WALLET: process.env.BOSS_WALLET_ADDRESS || '0x0a5769...',
  KAUS_CONTRACT: process.env.KAUS_CONTRACT_ADDRESS || '',
  KAUS_DECIMALS: 18,
  BASE_KAUS_PRICE_USD: 0.10,
  KPX_RATE: 120, // KRW per KAUS
};

async function getTokenBalance(walletAddress: string, tokenContract: string): Promise<number> {
  if (!CONFIG.ALCHEMY_API_KEY || !tokenContract) {
    return 0;
  }

  try {
    const baseUrl = `${CONFIG.ALCHEMY_BASE_URL}/${CONFIG.ALCHEMY_API_KEY}`;
    const data = `0x70a08231000000000000000000000000${walletAddress.slice(2).toLowerCase()}`;

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'eth_call',
        params: [{ to: tokenContract, data }, 'latest'],
      }),
    });

    if (!response.ok) return 0;

    const result = await response.json();
    if (result.error) return 0;

    const balance = parseInt(result.result, 16);
    return balance / Math.pow(10, CONFIG.KAUS_DECIMALS);
  } catch (error) {
    console.error('[KAUS BALANCE] Error:', error);
    return 0;
  }
}

function formatBalance(balance: number): string {
  if (balance >= 1000000) {
    return `${(balance / 1000000).toFixed(2)}M`;
  }
  if (balance >= 1000) {
    return `${(balance / 1000).toFixed(2)}K`;
  }
  return balance.toFixed(2);
}

export async function GET() {
  try {
    let kausBalance = 0;
    let isLive = false;

    // Try to get real balance from Alchemy
    if (CONFIG.ALCHEMY_API_KEY && CONFIG.KAUS_CONTRACT) {
      kausBalance = await getTokenBalance(CONFIG.BOSS_WALLET, CONFIG.KAUS_CONTRACT);
      isLive = kausBalance > 0;
    }

    // PRODUCTION: No fake data - return 0 if blockchain unavailable
    if (!isLive) {
      console.warn('[KAUS BALANCE] Blockchain connection unavailable - returning zero balance');
      return NextResponse.json({
        success: true,
        kausBalance: 0,
        kausBalanceFormatted: '0',
        krwValue: 0,
        usdValue: 0,
        kpxRate: CONFIG.KPX_RATE,
        isLive: false,
        warning: 'ALCHEMY_API_KEY or KAUS_CONTRACT not configured',
        timestamp: new Date().toISOString(),
      });
    }

    const krwValue = kausBalance * CONFIG.KPX_RATE;
    const usdValue = kausBalance * CONFIG.BASE_KAUS_PRICE_USD;

    return NextResponse.json({
      success: true,
      kausBalance,
      kausBalanceFormatted: formatBalance(kausBalance),
      krwValue,
      usdValue,
      kpxRate: CONFIG.KPX_RATE,
      isLive,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[KAUS BALANCE] Error:', error);
    // PRODUCTION: Return error, NOT fake data
    return NextResponse.json({
      success: false,
      kausBalance: 0,
      kausBalanceFormatted: '0',
      krwValue: 0,
      usdValue: 0,
      kpxRate: 120,
      isLive: false,
      error: error instanceof Error ? error.message : 'Blockchain connection failed',
    }, { status: 503 });
  }
}
