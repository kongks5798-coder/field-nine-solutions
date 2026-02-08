/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 84: SOVEREIGN VAULT - SERVER-SIDE SESSION API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Secure server-side session management for vault access
 * - Survives browser refresh
 * - 5-minute inactivity timeout
 * - Cookie-based session with httpOnly flag
 * - SHA-256 session signature
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Session configuration
const SESSION_COOKIE_NAME = 'f9_vault_session';
const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const SESSION_SECRET = process.env.VAULT_SESSION_SECRET || 'imperial-vault-secret-key-2026';

interface VaultSession {
  signature: string;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
  ip?: string;
  userAgent?: string;
}

// Generate session signature
function generateSessionSignature(data: object): string {
  const payload = JSON.stringify(data) + SESSION_SECRET;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

// Validate session signature
function validateSession(session: VaultSession): boolean {
  const now = Date.now();

  // Check expiry
  if (now > session.expiresAt) {
    return false;
  }

  // Check inactivity (5 minutes since last activity)
  if (now - session.lastActivity > SESSION_TIMEOUT_MS) {
    return false;
  }

  return true;
}

// GET: Check session status
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return NextResponse.json({
        success: false,
        valid: false,
        reason: 'no_session',
      });
    }

    try {
      const session: VaultSession = JSON.parse(
        Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
      );

      if (!validateSession(session)) {
        return NextResponse.json({
          success: false,
          valid: false,
          reason: 'session_expired',
        });
      }

      // Session is valid
      return NextResponse.json({
        success: true,
        valid: true,
        remainingMs: session.expiresAt - Date.now(),
        lastActivity: session.lastActivity,
      });
    } catch {
      return NextResponse.json({
        success: false,
        valid: false,
        reason: 'invalid_session_data',
      });
    }
  } catch (error) {
    console.error('[Vault Session] Check error:', error);
    return NextResponse.json({
      success: false,
      valid: false,
      reason: 'server_error',
    }, { status: 500 });
  }
}

// POST: Create or refresh session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, passcode } = body;

    // Get client info
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               request.headers.get('cf-connecting-ip') ||
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const now = Date.now();

    if (action === 'create') {
      // Verify passcode for new session
      const VAULT_PASSCODE = process.env.VAULT_PASSCODE || '042500';

      if (passcode !== VAULT_PASSCODE) {
        return NextResponse.json({
          success: false,
          error: 'Invalid passcode',
        }, { status: 401 });
      }

      // Create new session
      const session: VaultSession = {
        signature: generateSessionSignature({ ip, userAgent, timestamp: now }),
        createdAt: now,
        lastActivity: now,
        expiresAt: now + SESSION_TIMEOUT_MS,
        ip,
        userAgent,
      };

      const sessionValue = Buffer.from(JSON.stringify(session)).toString('base64');

      const response = NextResponse.json({
        success: true,
        message: 'Session created',
        expiresAt: session.expiresAt,
        remainingMs: SESSION_TIMEOUT_MS,
      });

      response.cookies.set(SESSION_COOKIE_NAME, sessionValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_TIMEOUT_MS / 1000,
      });

      console.log(`[Vault Session] Created for IP: ${ip}`);

      return response;
    }

    if (action === 'refresh') {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

      if (!sessionCookie?.value) {
        return NextResponse.json({
          success: false,
          error: 'No active session',
        }, { status: 401 });
      }

      try {
        const session: VaultSession = JSON.parse(
          Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
        );

        if (!validateSession(session)) {
          return NextResponse.json({
            success: false,
            error: 'Session expired',
          }, { status: 401 });
        }

        // Refresh session
        session.lastActivity = now;
        session.expiresAt = now + SESSION_TIMEOUT_MS;

        const sessionValue = Buffer.from(JSON.stringify(session)).toString('base64');

        const response = NextResponse.json({
          success: true,
          message: 'Session refreshed',
          expiresAt: session.expiresAt,
          remainingMs: SESSION_TIMEOUT_MS,
        });

        response.cookies.set(SESSION_COOKIE_NAME, sessionValue, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: SESSION_TIMEOUT_MS / 1000,
        });

        return response;
      } catch {
        return NextResponse.json({
          success: false,
          error: 'Invalid session',
        }, { status: 401 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action',
    }, { status: 400 });
  } catch (error) {
    console.error('[Vault Session] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
    }, { status: 500 });
  }
}

// DELETE: End session
export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Session ended',
    });

    response.cookies.delete(SESSION_COOKIE_NAME);

    console.log('[Vault Session] Ended');

    return response;
  } catch (error) {
    console.error('[Vault Session] End error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to end session',
    }, { status: 500 });
  }
}
