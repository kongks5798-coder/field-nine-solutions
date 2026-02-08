/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * EMPIRE SOVEREIGNTY STATUS API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 29: Platinum Ascension - 100% Real-World Sovereignty
 *
 * Returns the complete sovereignty status of the Field Nine Empire
 * - Real-time data integration percentage
 * - API key configuration status
 * - Revenue verification
 * - Sovereignty certificate generation
 * - PLATINUM grade detection with 100% live data
 */

import { NextResponse } from 'next/server';
import {
  getLiveDataStatus,
  getLiveSMP,
  getLiveTeslaData,
  getLiveExchangeData,
  getLiveTVL,
} from '@/lib/partnerships/live-data-service';
import { getEmpireStats } from '@/lib/partnerships/empire-roi-forecast';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SovereigntyStatus {
  timestamp: string;
  empireName: string;
  version: string;

  // Data Integration Status
  dataIntegration: {
    livePercentage: number;
    simulationPercentage: number;
    status: 'FULL_SOVEREIGNTY' | 'PARTIAL_SOVEREIGNTY' | 'SIMULATION_MODE';
    sources: {
      kepco: { status: 'LIVE' | 'FALLBACK'; source: string };
      tesla: { status: 'LIVE' | 'FALLBACK'; source: string };
      exchange: { status: 'LIVE' | 'FALLBACK'; source: string };
      tvl: { status: 'LIVE' | 'FALLBACK'; source: string };
    };
  };

  // API Key Status
  apiKeys: {
    configured: number;
    total: number;
    keys: {
      name: string;
      status: 'CONFIGURED' | 'MISSING';
      envVar: string;
    }[];
  };

  // Revenue Status
  revenue: {
    dailyRevenue: number;
    monthlyRevenue: number;
    yearlyProjection: number;
    verified: boolean;
    currency: string;
  };

  // Sovereignty Certificate
  certificate: {
    issued: boolean;
    issueDate: string | null;
    certificateId: string | null;
    grade: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'PENDING';
  };

  // Infrastructure Health
  infrastructure: {
    dns: {
      'www.fieldnine.io': 'ACTIVE' | 'PENDING';
      'm.fieldnine.io': 'ACTIVE' | 'PENDING';
      'nexus.fieldnine.io': 'ACTIVE' | 'PENDING';
    };
    ssl: 'VALID' | 'PENDING';
    pwa: 'READY' | 'NOT_READY';
  };
}

export async function GET(): Promise<NextResponse<SovereigntyStatus>> {
  const timestamp = new Date().toISOString();

  // Fetch all data
  const [status, smp, tesla, exchange, tvl, empireStats] = await Promise.all([
    getLiveDataStatus(),
    getLiveSMP(),
    getLiveTeslaData(),
    getLiveExchangeData(),
    getLiveTVL(),
    getEmpireStats(),
  ]);

  const livePercentage = 100 - status.simulationPercentage;

  // Determine sovereignty status
  let sovereigntyStatus: 'FULL_SOVEREIGNTY' | 'PARTIAL_SOVEREIGNTY' | 'SIMULATION_MODE';
  if (livePercentage >= 100) {
    sovereigntyStatus = 'FULL_SOVEREIGNTY';
  } else if (livePercentage >= 25) {
    sovereigntyStatus = 'PARTIAL_SOVEREIGNTY';
  } else {
    sovereigntyStatus = 'SIMULATION_MODE';
  }

  // Determine certificate grade
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

  // API Keys status
  const apiKeysList = [
    { name: 'OpenAI (AI Briefing)', envVar: 'OPENAI_API_KEY', status: process.env.OPENAI_API_KEY ? 'CONFIGURED' : 'MISSING' },
    { name: 'KEPCO/KPX (Energy)', envVar: 'KPX_API_KEY', status: process.env.KPX_API_KEY ? 'CONFIGURED' : 'MISSING' },
    { name: 'Tesla Fleet (V2G)', envVar: 'TESLA_ACCESS_TOKEN', status: process.env.TESLA_ACCESS_TOKEN ? 'CONFIGURED' : 'MISSING' },
    { name: 'Alchemy (TVL)', envVar: 'ALCHEMY_API_KEY', status: process.env.ALCHEMY_API_KEY ? 'CONFIGURED' : 'MISSING' },
    { name: 'Supabase', envVar: 'SUPABASE_SERVICE_ROLE_KEY', status: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'CONFIGURED' : 'MISSING' },
    { name: 'Amadeus (Flights)', envVar: 'AMADEUS_CLIENT_ID', status: process.env.AMADEUS_CLIENT_ID ? 'CONFIGURED' : 'MISSING' },
  ] as const;

  const configuredKeys = apiKeysList.filter(k => k.status === 'CONFIGURED').length;

  return NextResponse.json({
    timestamp,
    empireName: 'FIELD NINE EMPIRE',
    version: '28.0.0',

    dataIntegration: {
      livePercentage,
      simulationPercentage: status.simulationPercentage,
      status: sovereigntyStatus,
      sources: {
        kepco: { status: smp.isLive ? 'LIVE' : 'FALLBACK', source: smp.source },
        tesla: { status: tesla.isLive ? 'LIVE' : 'FALLBACK', source: tesla.source },
        exchange: { status: exchange.isLive ? 'LIVE' : 'FALLBACK', source: exchange.source },
        tvl: { status: tvl.isLive ? 'LIVE' : 'FALLBACK', source: tvl.source },
      },
    },

    apiKeys: {
      configured: configuredKeys,
      total: apiKeysList.length,
      keys: apiKeysList.map(k => ({ name: k.name, status: k.status, envVar: k.envVar })),
    },

    revenue: {
      dailyRevenue: empireStats.dailyRevenue,
      monthlyRevenue: empireStats.monthlyRevenue,
      yearlyProjection: empireStats.yearlyProjection,
      verified: empireStats.verifiedByAPI,
      currency: 'USD',
    },

    certificate: {
      issued: livePercentage >= 25,
      issueDate: livePercentage >= 25 ? timestamp : null,
      certificateId: livePercentage >= 25 ? `FN-SOV-${Date.now().toString(36).toUpperCase()}` : null,
      grade,
    },

    infrastructure: {
      dns: {
        'www.fieldnine.io': 'ACTIVE',
        'm.fieldnine.io': 'PENDING',
        'nexus.fieldnine.io': 'PENDING',
      },
      ssl: 'VALID',
      pwa: 'READY',
    },
  });
}
