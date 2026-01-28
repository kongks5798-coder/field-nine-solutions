/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 81: SOVEREIGN VAULT - AUTH VERIFICATION API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Verifies Emperor access for vault entry
 * - 1st Lock: Check if user is authorized (kongks5798@gmail.com)
 * - Returns authorization status and user info
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Authorized Emperor emails
const EMPEROR_EMAILS = ['kongks5798@gmail.com'];

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      // Development mode - allow access with mock data
      return NextResponse.json({
        success: true,
        authorized: true,
        user: {
          email: 'kongks5798@gmail.com',
          role: 'EMPEROR',
        },
        message: 'Development mode - Emperor access granted',
      });
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('[Vault Auth] Session error:', sessionError);
      return NextResponse.json({
        success: false,
        authorized: false,
        error: 'Failed to verify session',
      }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({
        success: false,
        authorized: false,
        error: 'No active session',
        requiresLogin: true,
      }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Check if user is authorized Emperor
    const isEmperor = EMPEROR_EMAILS.includes(userEmail || '');

    if (!isEmperor) {
      console.warn(`[Vault Auth] Unauthorized access attempt: ${userEmail}`);
      return NextResponse.json({
        success: false,
        authorized: false,
        error: 'Access denied. Emperor clearance required.',
        user: {
          email: userEmail,
          role: 'CITIZEN',
        },
      }, { status: 403 });
    }

    // Log successful authorization
    console.log(`[Vault Auth] Emperor access granted: ${userEmail}`);

    return NextResponse.json({
      success: true,
      authorized: true,
      user: {
        id: session.user.id,
        email: userEmail,
        role: 'EMPEROR',
        lastSignIn: session.user.last_sign_in_at,
      },
      message: 'Emperor access verified',
    });
  } catch (error) {
    console.error('[Vault Auth] Error:', error);
    return NextResponse.json({
      success: false,
      authorized: false,
      error: 'Authentication verification failed',
    }, { status: 500 });
  }
}
