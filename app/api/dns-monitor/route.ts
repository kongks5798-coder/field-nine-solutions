/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DNS REAL-TIME MONITORING API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 30: Total Sovereignty - DNS Health Check
 *
 * Monitors DNS propagation status for Field Nine domains
 * - www.fieldnine.io (primary)
 * - m.fieldnine.io (mobile)
 * - nexus.fieldnine.io (API hub)
 *
 * Returns real-time connectivity status
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DomainStatus {
  domain: string;
  status: 'ACTIVE' | 'PENDING' | 'ERROR';
  responseTime: number | null;
  statusCode: number | null;
  lastChecked: string;
  sslValid: boolean;
}

interface DNSMonitorResponse {
  timestamp: string;
  overallHealth: 'FULL' | 'PARTIAL' | 'OFFLINE';
  domains: DomainStatus[];
  readyForPWA: boolean;
  mobileReady: boolean;
  checkInterval: number;
  nextCheck: string;
}

async function checkDomain(domain: string): Promise<DomainStatus> {
  const startTime = Date.now();
  const lastChecked = new Date().toISOString();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    return {
      domain,
      status: response.ok ? 'ACTIVE' : 'ERROR',
      responseTime,
      statusCode: response.status,
      lastChecked,
      sslValid: true, // If we got here via HTTPS, SSL is valid
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check if it's a DNS resolution failure
    const isDNSError = errorMessage.includes('ENOTFOUND') ||
                       errorMessage.includes('getaddrinfo') ||
                       errorMessage.includes('fetch failed');

    return {
      domain,
      status: isDNSError ? 'PENDING' : 'ERROR',
      responseTime: null,
      statusCode: null,
      lastChecked,
      sslValid: false,
    };
  }
}

export async function GET(): Promise<NextResponse<DNSMonitorResponse>> {
  const timestamp = new Date().toISOString();
  const checkInterval = 10; // seconds

  // Check all domains in parallel
  const domains = await Promise.all([
    checkDomain('www.fieldnine.io'),
    checkDomain('m.fieldnine.io'),
    checkDomain('nexus.fieldnine.io'),
  ]);

  // Calculate overall health
  const activeCount = domains.filter(d => d.status === 'ACTIVE').length;
  let overallHealth: 'FULL' | 'PARTIAL' | 'OFFLINE';

  if (activeCount === domains.length) {
    overallHealth = 'FULL';
  } else if (activeCount > 0) {
    overallHealth = 'PARTIAL';
  } else {
    overallHealth = 'OFFLINE';
  }

  // Check if mobile domain is ready
  const mobileReady = domains.find(d => d.domain === 'm.fieldnine.io')?.status === 'ACTIVE';

  // PWA is ready when at least www is active
  const wwwActive = domains.find(d => d.domain === 'www.fieldnine.io')?.status === 'ACTIVE';
  const readyForPWA = wwwActive || false;

  // Calculate next check time
  const nextCheck = new Date(Date.now() + checkInterval * 1000).toISOString();

  return NextResponse.json({
    timestamp,
    overallHealth,
    domains,
    readyForPWA,
    mobileReady,
    checkInterval,
    nextCheck,
  });
}
