import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'offline' | 'unknown';
  lastCheck: string | null;
  responseTime?: number | null;
  processes?: Array<{
    name: string;
    status: string;
    uptime: number;
    restarts: number;
    memory: number;
    cpu: number;
  }>;
  lastCommit?: {
    hash: string;
    message: string;
    date: string;
  } | null;
}

interface HealthReport {
  status: 'operational' | 'degraded' | 'outage';
  timestamp: string;
  services: Record<string, ServiceStatus>;
  uptime: number;
  version: string;
}

async function checkSupabase(): Promise<ServiceStatus> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    return { name: 'Supabase DB', status: 'unknown', lastCheck: null };
  }

  try {
    const start = Date.now();
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      },
      cache: 'no-store',
    });
    const responseTime = Date.now() - start;

    return {
      name: 'Supabase DB',
      status: res.status === 200 || res.status === 401 ? 'healthy' : 'degraded',
      lastCheck: new Date().toISOString(),
      responseTime,
    };
  } catch {
    return {
      name: 'Supabase DB',
      status: 'offline',
      lastCheck: new Date().toISOString(),
      responseTime: null,
    };
  }
}

async function checkVercel(): Promise<ServiceStatus> {
  try {
    const start = Date.now();
    // Self-check
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/health`, {
      cache: 'no-store',
    });
    const responseTime = Date.now() - start;

    return {
      name: 'Frontend (Vercel)',
      status: res.ok ? 'healthy' : 'degraded',
      lastCheck: new Date().toISOString(),
      responseTime,
    };
  } catch {
    return {
      name: 'Frontend (Vercel)',
      status: 'healthy', // If we're responding, we're healthy
      lastCheck: new Date().toISOString(),
      responseTime: 0,
    };
  }
}

async function checkGitHub(): Promise<ServiceStatus> {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || 'kongks5798-coder';
  const repo = process.env.GITHUB_REPO || 'field-nine-solutions';

  if (!token) {
    return {
      name: 'GitHub Sync',
      status: 'unknown',
      lastCheck: null,
      lastCommit: null,
    };
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      return {
        name: 'GitHub Sync',
        status: 'degraded',
        lastCheck: new Date().toISOString(),
        lastCommit: null,
      };
    }

    const commits = await res.json();
    const latest = commits[0];

    return {
      name: 'GitHub Sync',
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      lastCommit: latest ? {
        hash: latest.sha?.substring(0, 7),
        message: latest.commit?.message?.substring(0, 50),
        date: latest.commit?.author?.date,
      } : null,
    };
  } catch {
    return {
      name: 'GitHub Sync',
      status: 'offline',
      lastCheck: new Date().toISOString(),
      lastCommit: null,
    };
  }
}

function readLocalHealthFile(): HealthReport | null {
  try {
    const filePath = path.join(process.cwd(), 'public', 'health-status.json');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch {
    // File doesn't exist or is invalid
  }
  return null;
}

export async function GET() {
  const timestamp = new Date().toISOString();

  // Try to read local health file first (from PM2 health monitor)
  const localHealth = readLocalHealthFile();

  // Run real-time checks
  const [supabase, vercel, github] = await Promise.all([
    checkSupabase(),
    checkVercel(),
    checkGitHub(),
  ]);

  // Merge with local PM2 data if available
  const pm2Status: ServiceStatus = localHealth?.services?.pm2 || {
    name: 'PM2 Backend',
    status: 'unknown',
    lastCheck: null,
    processes: [],
  };

  const services = {
    vercel,
    supabase,
    pm2: pm2Status,
    github,
  };

  // Calculate overall status
  const statuses = Object.values(services).map(s => s.status);
  const overallStatus: 'operational' | 'degraded' | 'outage' =
    statuses.every(s => s === 'healthy' || s === 'unknown')
      ? 'operational'
      : statuses.some(s => s === 'offline')
        ? 'outage'
        : 'degraded';

  const healthReport: HealthReport = {
    status: overallStatus,
    timestamp,
    services,
    uptime: localHealth?.uptime || 0,
    version: process.env.npm_package_version || '1.0.0',
  };

  return NextResponse.json(healthReport, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
