import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * SOVEREIGN AUTH API
 * Phase 33: CEO/Admin Exclusive Access Control
 *
 * POST: Authenticate with passphrase
 * DELETE: Logout (clear session)
 * GET: Check session status
 */

const SOVEREIGN_COOKIE_NAME = 'sovereign-session';
const SOVEREIGN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Rate limiting (in-memory, resets on deploy)
const attemptLog = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn?: number } {
  const now = Date.now();
  const record = attemptLog.get(ip);

  if (!record) {
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  // Reset if lockout period passed
  if (now - record.lastAttempt > LOCKOUT_DURATION) {
    attemptLog.delete(ip);
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const resetIn = Math.ceil((LOCKOUT_DURATION - (now - record.lastAttempt)) / 1000);
    return { allowed: false, remaining: 0, resetIn };
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - record.count - 1 };
}

function recordAttempt(ip: string, success: boolean): void {
  if (success) {
    attemptLog.delete(ip);
    return;
  }

  const record = attemptLog.get(ip);
  if (record) {
    record.count++;
    record.lastAttempt = Date.now();
  } else {
    attemptLog.set(ip, { count: 1, lastAttempt: Date.now() });
  }
}

// POST: Authenticate
export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  // Rate limit check
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    console.warn(`[Sovereign Auth] Rate limit exceeded for IP: ${ip}`);
    return NextResponse.json(
      {
        success: false,
        error: `Too many attempts. Try again in ${rateLimit.resetIn} seconds.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.resetIn),
        },
      }
    );
  }

  try {
    const { passphrase } = await request.json();

    if (!passphrase || typeof passphrase !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Passphrase required' },
        { status: 400 }
      );
    }

    // Get expected passphrase from environment
    const sovereignPassphrase = process.env.SOVEREIGN_PASSPHRASE;

    if (!sovereignPassphrase) {
      console.error('[Sovereign Auth] SOVEREIGN_PASSPHRASE not configured');
      return NextResponse.json(
        { success: false, error: 'System configuration error' },
        { status: 500 }
      );
    }

    // Validate passphrase
    const isValid = passphrase === sovereignPassphrase;

    // Record attempt for rate limiting
    recordAttempt(ip, isValid);

    if (!isValid) {
      console.warn(`[Sovereign Auth] Invalid passphrase attempt from IP: ${ip}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Access Denied',
          attemptsRemaining: rateLimit.remaining,
        },
        { status: 401 }
      );
    }

    // Create session token (base64 encoded passphrase)
    const sessionToken = Buffer.from(sovereignPassphrase).toString('base64');

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(SOVEREIGN_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SOVEREIGN_COOKIE_MAX_AGE,
      path: '/',
    });

    console.log(`[Sovereign Auth] Successful authentication from IP: ${ip}`);

    return NextResponse.json({
      success: true,
      message: 'Access granted',
      expiresAt: new Date(Date.now() + SOVEREIGN_COOKIE_MAX_AGE * 1000).toISOString(),
    });
  } catch (error) {
    console.error('[Sovereign Auth] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// DELETE: Logout
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SOVEREIGN_COOKIE_NAME);

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('[Sovereign Auth] Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}

// GET: Check session status
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(SOVEREIGN_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return NextResponse.json({
        authenticated: false,
        message: 'No active session',
      });
    }

    const sovereignPassphrase = process.env.SOVEREIGN_PASSPHRASE;

    if (!sovereignPassphrase) {
      return NextResponse.json({
        authenticated: false,
        message: 'System configuration error',
      });
    }

    const expectedHash = Buffer.from(sovereignPassphrase).toString('base64');
    const isValid = sessionCookie.value === expectedHash;

    return NextResponse.json({
      authenticated: isValid,
      message: isValid ? 'Session valid' : 'Session expired',
    });
  } catch (error) {
    console.error('[Sovereign Auth] Check error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Check failed' },
      { status: 500 }
    );
  }
}
