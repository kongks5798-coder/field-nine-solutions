/**
 * Legacy Exchange Rates API Redirect
 * Redirects to /api/v1/exchange/rates
 *
 * @deprecated Use /api/v1/exchange/rates instead
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const newUrl = new URL('/api/v1/exchange/rates', url.origin);
  newUrl.search = url.search;

  // Proxy the request to v1 API
  const response = await fetch(newUrl.toString(), {
    headers: request.headers,
  });

  const data = await response.json();

  return NextResponse.json(data, {
    headers: {
      'X-Deprecated': 'Use /api/v1/exchange/rates instead',
    },
  });
}
