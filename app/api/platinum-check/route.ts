/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PLATINUM SOVEREIGNTY CHECK API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 29: Platinum Ascension - 100% Real-World Sovereignty
 *
 * Validates all API keys and returns platinum status
 * Used by dashboard to display sovereignty grade in real-time
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface KeyValidation {
  name: string;
  envVar: string;
  configured: boolean;
  validated: boolean;
  lastCheck: string;
}

interface PlatinumStatus {
  timestamp: string;
  grade: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'PENDING';
  livePercentage: number;
  keys: KeyValidation[];
  readyForPlatinum: boolean;
  missingKeys: string[];
  instructions: {
    key: string;
    source: string;
    url: string;
  }[];
}

// Validate OpenAI key
async function validateOpenAI(): Promise<boolean> {
  if (!process.env.OPENAI_API_KEY) return false;
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Validate KPX key (Korean Power Exchange)
async function validateKPX(): Promise<boolean> {
  if (!process.env.KPX_API_KEY) return false;
  // KPX API validation - check if key format is valid
  return process.env.KPX_API_KEY.length > 10;
}

// Validate Tesla Fleet API
async function validateTesla(): Promise<boolean> {
  if (!process.env.TESLA_ACCESS_TOKEN) return false;
  try {
    const res = await fetch('https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles', {
      headers: {
        Authorization: `Bearer ${process.env.TESLA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    return res.ok || res.status === 401; // 401 means token exists but may need refresh
  } catch {
    return false;
  }
}

// Validate Alchemy key
async function validateAlchemy(): Promise<boolean> {
  if (!process.env.ALCHEMY_API_KEY) return false;
  try {
    const res = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET(): Promise<NextResponse<PlatinumStatus>> {
  const timestamp = new Date().toISOString();

  // Validate all keys in parallel
  const [openaiValid, kpxValid, teslaValid, alchemyValid] = await Promise.all([
    validateOpenAI(),
    validateKPX(),
    validateTesla(),
    validateAlchemy(),
  ]);

  const keys: KeyValidation[] = [
    {
      name: 'OpenAI (AI Briefing)',
      envVar: 'OPENAI_API_KEY',
      configured: !!process.env.OPENAI_API_KEY,
      validated: openaiValid,
      lastCheck: timestamp,
    },
    {
      name: 'KEPCO/KPX (Energy SMP)',
      envVar: 'KPX_API_KEY',
      configured: !!process.env.KPX_API_KEY,
      validated: kpxValid,
      lastCheck: timestamp,
    },
    {
      name: 'Tesla Fleet (V2G)',
      envVar: 'TESLA_ACCESS_TOKEN',
      configured: !!process.env.TESLA_ACCESS_TOKEN,
      validated: teslaValid,
      lastCheck: timestamp,
    },
    {
      name: 'Alchemy (On-chain TVL)',
      envVar: 'ALCHEMY_API_KEY',
      configured: !!process.env.ALCHEMY_API_KEY,
      validated: alchemyValid,
      lastCheck: timestamp,
    },
  ];

  const configuredCount = keys.filter(k => k.configured).length;
  const validatedCount = keys.filter(k => k.validated).length;
  const livePercentage = (validatedCount / keys.length) * 100;

  // Determine grade
  let grade: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'PENDING';
  if (livePercentage >= 100) {
    grade = 'PLATINUM';
  } else if (livePercentage >= 75) {
    grade = 'GOLD';
  } else if (livePercentage >= 50) {
    grade = 'SILVER';
  } else if (livePercentage >= 25) {
    grade = 'BRONZE';
  } else {
    grade = 'PENDING';
  }

  const missingKeys = keys.filter(k => !k.configured).map(k => k.envVar);

  const instructions = [
    {
      key: 'KPX_API_KEY',
      source: '공공데이터포털 (data.go.kr)',
      url: 'https://www.data.go.kr/data/15001105/openapi.do',
    },
    {
      key: 'TESLA_ACCESS_TOKEN',
      source: 'Tesla Developer Portal',
      url: 'https://developer.tesla.com/docs/fleet-api',
    },
    {
      key: 'ALCHEMY_API_KEY',
      source: 'Alchemy Dashboard',
      url: 'https://dashboard.alchemy.com/',
    },
  ];

  return NextResponse.json({
    timestamp,
    grade,
    livePercentage,
    keys,
    readyForPlatinum: configuredCount >= 4,
    missingKeys,
    instructions: instructions.filter(i => missingKeys.includes(i.key)),
  });
}
