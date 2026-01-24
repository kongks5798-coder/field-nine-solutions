/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TESLA AUTH MANAGER - FIELD NINE NEXUS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Manages Tesla OAuth tokens with automatic refresh
 * Stores tokens in Supabase for persistence across deployments
 */

import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Tesla OAuth endpoints
const TESLA_TOKEN_URL = 'https://auth.tesla.com/oauth2/v3/token';
const TESLA_CLIENT_ID = process.env.TESLA_CLIENT_ID || '';
const TESLA_CLIENT_SECRET = process.env.TESLA_CLIENT_SECRET || '';

interface TeslaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  updated_at: string;
}

interface TokenCache {
  tokens: TeslaTokens | null;
  lastFetch: number;
}

// In-memory cache with 5-minute TTL
const cache: TokenCache = {
  tokens: null,
  lastFetch: 0,
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get current Tesla access token
 * Automatically refreshes if expired
 */
export async function getTeslaAccessToken(): Promise<string | null> {
  try {
    // Check environment variable first (for backwards compatibility)
    const envToken = process.env.TESLA_ACCESS_TOKEN;
    if (envToken && envToken.length > 50) {
      return envToken;
    }

    // Check cache
    if (cache.tokens && Date.now() - cache.lastFetch < CACHE_TTL) {
      // Check if token is still valid
      const expiresAt = new Date(cache.tokens.expires_at).getTime();
      if (Date.now() < expiresAt - 60000) { // 1 minute buffer
        return cache.tokens.access_token;
      }
    }

    // Fetch from Supabase
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'tesla_tokens')
      .single();

    if (error || !data) {
      console.warn('[TESLA AUTH] No tokens found in database');
      return null;
    }

    const tokens = data.value as TeslaTokens;

    // Check expiration
    const expiresAt = new Date(tokens.expires_at).getTime();
    const now = Date.now();

    if (now >= expiresAt - 300000) { // 5 minutes before expiration
      console.log('[TESLA AUTH] Token expiring soon, refreshing...');
      const refreshedTokens = await refreshTeslaToken(tokens.refresh_token);
      if (refreshedTokens) {
        cache.tokens = refreshedTokens;
        cache.lastFetch = Date.now();
        return refreshedTokens.access_token;
      }
      return null;
    }

    // Update cache
    cache.tokens = tokens;
    cache.lastFetch = Date.now();

    return tokens.access_token;
  } catch (error) {
    console.error('[TESLA AUTH] Error getting access token:', error);
    return null;
  }
}

/**
 * Refresh Tesla access token using refresh token
 */
async function refreshTeslaToken(refreshToken: string): Promise<TeslaTokens | null> {
  try {
    console.log('[TESLA AUTH] Refreshing token...');

    const response = await fetch(TESLA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: TESLA_CLIENT_ID,
        client_secret: TESLA_CLIENT_SECRET,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[TESLA AUTH] Refresh failed:', errorData);
      return null;
    }

    const data = await response.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

    const tokens: TeslaTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken, // Use new or keep old
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    };

    // Store in Supabase
    await supabase
      .from('system_config')
      .upsert({
        key: 'tesla_tokens',
        value: tokens,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key',
      });

    console.log('[TESLA AUTH] ✅ Token refreshed successfully');
    return tokens;
  } catch (error) {
    console.error('[TESLA AUTH] Refresh error:', error);
    return null;
  }
}

/**
 * Check if Tesla is authenticated
 */
export async function isTeslaAuthenticated(): Promise<boolean> {
  const token = await getTeslaAccessToken();
  return !!token;
}

/**
 * Get Tesla auth status for dashboard
 */
export async function getTeslaAuthStatus(): Promise<{
  connected: boolean;
  expiresAt: string | null;
  lastUpdate: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'tesla_tokens')
      .single();

    if (error || !data) {
      return {
        connected: false,
        expiresAt: null,
        lastUpdate: null,
      };
    }

    const tokens = data.value as TeslaTokens;
    const isExpired = new Date(tokens.expires_at).getTime() < Date.now();

    return {
      connected: !isExpired,
      expiresAt: tokens.expires_at,
      lastUpdate: tokens.updated_at,
    };
  } catch (error) {
    console.error('[TESLA AUTH] Status check error:', error);
    return {
      connected: false,
      expiresAt: null,
      lastUpdate: null,
    };
  }
}

/**
 * Revoke Tesla tokens (disconnect)
 */
export async function revokeTeslaAuth(): Promise<boolean> {
  try {
    await supabase
      .from('system_config')
      .delete()
      .eq('key', 'tesla_tokens');

    cache.tokens = null;
    cache.lastFetch = 0;

    console.log('[TESLA AUTH] ✅ Tesla disconnected');
    return true;
  } catch (error) {
    console.error('[TESLA AUTH] Revoke error:', error);
    return false;
  }
}
