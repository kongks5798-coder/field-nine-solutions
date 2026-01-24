/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TESLA OAUTH LOGIN - FIELD NINE NEXUS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Initiates Tesla OAuth 2.0 authorization flow
 * Redirects user to Tesla login page
 */

import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// Tesla OAuth Configuration
const TESLA_AUTH_URL = 'https://auth.tesla.com/oauth2/v3/authorize';
const TESLA_CLIENT_ID = process.env.TESLA_CLIENT_ID || '';
// Production callback URL (must match Tesla Developer Portal)
const REDIRECT_URI = 'https://m.fieldnine.io/api/auth/callback/tesla';

// Required scopes for V2G energy trading
const SCOPES = [
  'openid',
  'offline_access',
  'user_data',
  'vehicle_device_data',
  'vehicle_cmds',
  'vehicle_charging_cmds',
].join(' ');

export async function GET() {
  try {
    if (!TESLA_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Tesla Client ID not configured' },
        { status: 500 }
      );
    }

    // Generate secure state for CSRF protection
    const state = randomBytes(16).toString('hex');

    // Build authorization URL
    const authUrl = new URL(TESLA_AUTH_URL);
    authUrl.searchParams.set('client_id', TESLA_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', SCOPES);
    authUrl.searchParams.set('state', state);

    console.log('[TESLA AUTH] Initiating OAuth flow');
    console.log('[TESLA AUTH] Redirect URI:', REDIRECT_URI);

    // Create response with redirect
    const response = NextResponse.redirect(authUrl.toString());

    // Store state in cookie for verification
    response.cookies.set('tesla_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[TESLA AUTH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Tesla OAuth' },
      { status: 500 }
    );
  }
}
// Force redeploy: 1769251592
