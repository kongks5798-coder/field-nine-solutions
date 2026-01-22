/**
 * Legacy AI Concierge API Redirect
 * Redirects to /api/v1/ai/concierge
 *
 * @deprecated Use /api/v1/ai/concierge instead
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const newUrl = new URL('/api/v1/ai/concierge', url.origin);
  newUrl.search = url.search;

  const response = await fetch(newUrl.toString(), {
    headers: request.headers,
  });

  const data = await response.json();

  return NextResponse.json(data, {
    headers: { 'X-Deprecated': 'Use /api/v1/ai/concierge instead' },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const newUrl = new URL('/api/v1/ai/concierge', url.origin);

  const body = await request.json();

  const response = await fetch(newUrl.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...Object.fromEntries(request.headers.entries()),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  return NextResponse.json(data, {
    status: response.status,
    headers: { 'X-Deprecated': 'Use /api/v1/ai/concierge instead' },
  });
}
