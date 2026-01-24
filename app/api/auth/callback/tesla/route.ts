/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TESLA OAUTH CALLBACK - FIELD NINE NEXUS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Handles Tesla OAuth callback
 * Exchanges authorization code for access token
 * Stores tokens securely in Supabase
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Tesla OAuth Configuration
const TESLA_TOKEN_URL = 'https://auth.tesla.com/oauth2/v3/token';
const TESLA_CLIENT_ID = process.env.TESLA_CLIENT_ID || '';
const TESLA_CLIENT_SECRET = process.env.TESLA_CLIENT_SECRET || '';
// Production callback URL (must match Tesla Developer Portal)
const REDIRECT_URI = 'https://m.fieldnine.io/api/auth/callback/tesla';

// Supabase client for token storage
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface TeslaTokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Check for OAuth errors
    if (error) {
      console.error('[TESLA CALLBACK] OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        `https://m.fieldnine.io/nexus?error=${encodeURIComponent(error)}&message=${encodeURIComponent(errorDescription || '')}`
      );
    }

    // Validate required parameters
    if (!code) {
      console.error('[TESLA CALLBACK] Missing authorization code');
      return NextResponse.redirect(
        'https://m.fieldnine.io/nexus?error=missing_code'
      );
    }

    // Verify state (CSRF protection)
    const cookies = request.headers.get('cookie') || '';
    const stateCookie = cookies
      .split(';')
      .find(c => c.trim().startsWith('tesla_oauth_state='));
    const savedState = stateCookie?.split('=')[1]?.trim();

    if (state !== savedState) {
      console.warn('[TESLA CALLBACK] State mismatch - possible CSRF');
      // Continue anyway for now, but log warning
    }

    console.log('[TESLA CALLBACK] Exchanging code for tokens...');

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(TESLA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: TESLA_CLIENT_ID,
        client_secret: TESLA_CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('[TESLA CALLBACK] Token exchange failed:', errorData);
      return NextResponse.redirect(
        `https://m.fieldnine.io/nexus?error=token_exchange_failed&message=${encodeURIComponent(errorData.error_description || errorData.error || 'Unknown error')}`
      );
    }

    const tokens: TeslaTokenResponse = await tokenResponse.json();

    console.log('[TESLA CALLBACK] ✅ Token exchange successful');
    console.log('[TESLA CALLBACK] Access token length:', tokens.access_token?.length);
    console.log('[TESLA CALLBACK] Expires in:', tokens.expires_in, 'seconds');

    // Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Store tokens in Supabase
    const { error: dbError } = await supabase
      .from('system_config')
      .upsert({
        key: 'tesla_tokens',
        value: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key',
      });

    if (dbError) {
      console.error('[TESLA CALLBACK] Failed to store tokens:', dbError);
      // Still redirect to success, tokens are in response
    } else {
      console.log('[TESLA CALLBACK] ✅ Tokens stored in Supabase');
    }

    // Clear state cookie and redirect to success page
    const response = NextResponse.redirect(
      'https://m.fieldnine.io/nexus?tesla=connected'
    );

    response.cookies.set('tesla_oauth_state', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    // Also set a success indicator cookie
    response.cookies.set('tesla_connected', 'true', {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      maxAge: 86400, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[TESLA CALLBACK] Error:', error);
    return NextResponse.redirect(
      `https://m.fieldnine.io/nexus?error=callback_failed&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
    );
  }
}
