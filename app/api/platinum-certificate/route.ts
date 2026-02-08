/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PLATINUM SOVEREIGNTY CERTIFICATE API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 30: Total Sovereignty - Platinum Certificate Generation
 *
 * Issues official Field Nine Empire sovereignty certificates
 * - Validates all API integrations
 * - Generates unique certificate ID
 * - Returns certificate data for rendering
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

interface CertificateData {
  issued: boolean;
  grade: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'PENDING';
  certificateId: string | null;
  issueDate: string | null;
  expirationDate: string | null;
  empireName: string;
  holderTitle: string;

  // Verification data
  verification: {
    liveDataPercentage: number;
    apiKeysValidated: number;
    totalApiKeys: number;
    dataSources: {
      name: string;
      status: 'LIVE' | 'FALLBACK';
      verified: boolean;
    }[];
  };

  // Empire statistics at issuance
  empireStats: {
    totalAssets: number;
    dailyRevenue: number;
    monthlyRevenue: number;
    roi30Day: number;
    verifiedByAPI: boolean;
  };

  // Certificate metadata
  metadata: {
    version: string;
    blockchain: string;
    hash: string;
    timestamp: string;
  };

  // Visual elements
  visual: {
    borderColor: string;
    badgeIcon: string;
    sealText: string;
    gradeLabel: string;
  };
}

function generateCertificateHash(data: object): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0').toUpperCase();
}

function getGradeVisual(grade: string) {
  switch (grade) {
    case 'PLATINUM':
      return {
        borderColor: '#E5E4E2',
        badgeIcon: 'crown',
        sealText: 'PLATINUM SOVEREIGNTY',
        gradeLabel: '플래티넘',
      };
    case 'GOLD':
      return {
        borderColor: '#D4AF37',
        badgeIcon: 'star',
        sealText: 'GOLD SOVEREIGNTY',
        gradeLabel: '골드',
      };
    case 'SILVER':
      return {
        borderColor: '#C0C0C0',
        badgeIcon: 'shield',
        sealText: 'SILVER SOVEREIGNTY',
        gradeLabel: '실버',
      };
    case 'BRONZE':
      return {
        borderColor: '#CD7F32',
        badgeIcon: 'medal',
        sealText: 'BRONZE SOVEREIGNTY',
        gradeLabel: '브론즈',
      };
    default:
      return {
        borderColor: '#6B7280',
        badgeIcon: 'clock',
        sealText: 'PENDING VERIFICATION',
        gradeLabel: '검증 대기',
      };
  }
}

export async function GET(): Promise<NextResponse<CertificateData>> {
  const timestamp = new Date().toISOString();

  // Fetch all live data
  const [status, smp, tesla, exchange, tvl, empireStats] = await Promise.all([
    getLiveDataStatus(),
    getLiveSMP(),
    getLiveTeslaData(),
    getLiveExchangeData(),
    getLiveTVL(),
    getEmpireStats(),
  ]);

  const livePercentage = 100 - status.simulationPercentage;

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

  // Build data sources
  const dataSources = [
    { name: 'KEPCO/KPX (Energy SMP)', status: smp.isLive ? 'LIVE' : 'FALLBACK', verified: smp.isLive },
    { name: 'Tesla Fleet (V2G)', status: tesla.isLive ? 'LIVE' : 'FALLBACK', verified: tesla.isLive },
    { name: 'K-AUS Exchange', status: exchange.isLive ? 'LIVE' : 'FALLBACK', verified: exchange.isLive },
    { name: 'Alchemy (TVL)', status: tvl.isLive ? 'LIVE' : 'FALLBACK', verified: tvl.isLive },
  ] as const;

  const validatedSources = dataSources.filter(s => s.verified).length;

  // Check if certificate should be issued
  const issued = livePercentage >= 25;

  // Generate certificate ID
  const certificateId = issued
    ? `FN-${grade.substring(0, 3)}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    : null;

  // Calculate expiration (30 days from issuance)
  const expirationDate = issued
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  // Generate certificate hash for verification
  const certData = {
    grade,
    livePercentage,
    totalAssets: empireStats.totalAssets,
    timestamp,
  };
  const hash = generateCertificateHash(certData);

  const visual = getGradeVisual(grade);

  return NextResponse.json({
    issued,
    grade,
    certificateId,
    issueDate: issued ? timestamp : null,
    expirationDate,
    empireName: 'FIELD NINE EMPIRE',
    holderTitle: 'Sovereign Emperor',

    verification: {
      liveDataPercentage: livePercentage,
      apiKeysValidated: validatedSources,
      totalApiKeys: dataSources.length,
      dataSources: dataSources.map(s => ({
        name: s.name,
        status: s.status as 'LIVE' | 'FALLBACK',
        verified: s.verified,
      })),
    },

    empireStats: {
      totalAssets: empireStats.totalAssets,
      dailyRevenue: empireStats.dailyRevenue,
      monthlyRevenue: empireStats.monthlyRevenue,
      roi30Day: empireStats.roi30Day,
      verifiedByAPI: empireStats.verifiedByAPI,
    },

    metadata: {
      version: '30.0.0',
      blockchain: 'Ethereum Mainnet',
      hash: `0x${hash}`,
      timestamp,
    },

    visual,
  });
}
