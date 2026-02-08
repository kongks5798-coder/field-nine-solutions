/**
 * Debug endpoint to verify deployed REDIRECT_URI
 */

import { NextResponse } from 'next/server';

// This should match the login route
const REDIRECT_URI = 'https://m.fieldnine.io/api/auth/callback/tesla';

export async function GET() {
  return NextResponse.json({
    redirect_uri: REDIRECT_URI,
    timestamp: new Date().toISOString(),
    deployed: true,
    env_app_url: process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET',
  });
}
