/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DNS VERIFICATION & AUTO-REFRESH API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 31: Final Ascension - Global DNS Handshake
 *
 * Verifies DNS propagation and provides setup instructions
 * Auto-refreshes every 10 seconds to detect when DNS is ready
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DNSRecord {
  type: 'CNAME' | 'A' | 'AAAA';
  name: string;
  target: string;
  status: 'CONFIGURED' | 'PENDING' | 'ERROR';
}

interface DNSVerificationResponse {
  timestamp: string;
  allConfigured: boolean;
  pwaReady: boolean;
  mobileReady: boolean;

  domains: {
    domain: string;
    status: 'ACTIVE' | 'PENDING' | 'ERROR';
    responseTime: number | null;
    https: boolean;
  }[];

  requiredRecords: DNSRecord[];

  cloudflareInstructions: {
    step: number;
    action: string;
    details: string;
  }[];

  nextCheckIn: number; // seconds
  checkCount: number;
}

async function checkDomainStatus(domain: string): Promise<{
  status: 'ACTIVE' | 'PENDING' | 'ERROR';
  responseTime: number | null;
  https: boolean;
}> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    return {
      status: response.ok ? 'ACTIVE' : 'ERROR',
      responseTime: Date.now() - startTime,
      https: true,
    };
  } catch {
    return {
      status: 'PENDING',
      responseTime: null,
      https: false,
    };
  }
}

// Track check count across requests (in-memory, resets on deploy)
let globalCheckCount = 0;

export async function GET(): Promise<NextResponse<DNSVerificationResponse>> {
  const timestamp = new Date().toISOString();
  globalCheckCount++;

  // Check all domains in parallel
  const [wwwStatus, mStatus, nexusStatus] = await Promise.all([
    checkDomainStatus('www.fieldnine.io'),
    checkDomainStatus('m.fieldnine.io'),
    checkDomainStatus('nexus.fieldnine.io'),
  ]);

  const domains = [
    { domain: 'www.fieldnine.io', ...wwwStatus },
    { domain: 'm.fieldnine.io', ...mStatus },
    { domain: 'nexus.fieldnine.io', ...nexusStatus },
  ];

  // Required DNS records
  const requiredRecords: DNSRecord[] = [
    {
      type: 'CNAME',
      name: 'www',
      target: 'cname.vercel-dns.com',
      status: wwwStatus.status === 'ACTIVE' ? 'CONFIGURED' : 'PENDING',
    },
    {
      type: 'CNAME',
      name: 'm',
      target: 'cname.vercel-dns.com',
      status: mStatus.status === 'ACTIVE' ? 'CONFIGURED' : 'PENDING',
    },
    {
      type: 'CNAME',
      name: 'nexus',
      target: 'cname.vercel-dns.com',
      status: nexusStatus.status === 'ACTIVE' ? 'CONFIGURED' : 'PENDING',
    },
  ];

  const allConfigured = domains.every(d => d.status === 'ACTIVE');
  const mobileReady = mStatus.status === 'ACTIVE';
  const pwaReady = wwwStatus.status === 'ACTIVE';

  // Cloudflare setup instructions
  const cloudflareInstructions = [
    {
      step: 1,
      action: 'Cloudflare 대시보드 접속',
      details: 'https://dash.cloudflare.com → fieldnine.io 선택',
    },
    {
      step: 2,
      action: 'DNS 메뉴 클릭',
      details: '좌측 사이드바에서 DNS → Records 선택',
    },
    {
      step: 3,
      action: 'CNAME 레코드 추가 (m)',
      details: 'Type: CNAME | Name: m | Target: cname.vercel-dns.com | Proxy: DNS only (회색 구름)',
    },
    {
      step: 4,
      action: 'CNAME 레코드 추가 (nexus)',
      details: 'Type: CNAME | Name: nexus | Target: cname.vercel-dns.com | Proxy: DNS only (회색 구름)',
    },
    {
      step: 5,
      action: '저장 후 대기',
      details: 'DNS 전파에 최대 5분 소요. 이 페이지가 자동으로 상태를 확인합니다.',
    },
  ];

  return NextResponse.json({
    timestamp,
    allConfigured,
    pwaReady,
    mobileReady,
    domains,
    requiredRecords,
    cloudflareInstructions: mobileReady ? [] : cloudflareInstructions,
    nextCheckIn: 10,
    checkCount: globalCheckCount,
  });
}
