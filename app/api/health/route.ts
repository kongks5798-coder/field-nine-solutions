/**
 * K-UNIVERSAL Health Check Endpoint
 * For Docker healthcheck and monitoring
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '3.0.0',
  };

  return NextResponse.json(health, { status: 200 });
}
