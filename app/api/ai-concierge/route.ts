/**
 * Legacy AI Concierge API Redirect
 * Redirects to /api/v1/ai/concierge
 *
 * @deprecated Use /api/v1/ai/concierge instead
 */

import { NextRequest, NextResponse } from 'next/server';

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

  // Transform old request format to new format if needed
  const transformedBody = body.query
    ? { action: 'chat', messages: [{ role: 'user', content: body.query }] }
    : { action: 'chat', ...body };

  const response = await fetch(newUrl.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...Object.fromEntries(request.headers.entries()),
    },
    body: JSON.stringify(transformedBody),
  });

  const data = await response.json();

  // Transform response to old format for backwards compatibility
  const legacyResponse = data.message
    ? { ...data, answer: data.message, response: data.message }
    : data;

  return NextResponse.json(legacyResponse, {
    status: response.status,
    headers: { 'X-Deprecated': 'Use /api/v1/ai/concierge instead' },
  });
}
