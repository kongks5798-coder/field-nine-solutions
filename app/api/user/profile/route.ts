/**
 * K-UNIVERSAL User Profile API
 * 사용자 프로필 관리 엔드포인트
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';
import {
  checkRateLimit,
  getClientIdentifier,
  RateLimiters,
  rateLimitHeaders,
} from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

/**
 * GET /api/user/profile
 * Get current user's profile
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const clientIp = getClientIdentifier(request);

  // Rate limiting
  const rateLimit = checkRateLimit(clientIp, RateLimiters.standard);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: rateLimitHeaders(rateLimit) }
    );
  }

  try {
    // Authenticate user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get profile from database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[Profile API] Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // Return combined user data
    return NextResponse.json({
      id: user.id,
      email: user.email,
      phone: user.phone,
      emailVerified: user.email_confirmed_at !== null,
      profile: profile || {
        user_id: user.id,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        preferred_language: 'ko',
        notification_settings: {
          email: true,
          push: true,
          sms: false,
        },
      },
      createdAt: user.created_at,
    });

  } catch (error) {
    console.error('[Profile API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile
 * Update current user's profile
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const clientIp = getClientIdentifier(request);

  // Rate limiting
  const rateLimit = checkRateLimit(clientIp, RateLimiters.standard);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: rateLimitHeaders(rateLimit) }
    );
  }

  try {
    // Authenticate user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { full_name, avatar_url, preferred_language, notification_settings } = body;

    // Validate input
    const allowedLanguages = ['ko', 'en', 'ja', 'zh'];
    if (preferred_language && !allowedLanguages.includes(preferred_language)) {
      return NextResponse.json(
        { error: 'Invalid preferred_language. Allowed: ko, en, ja, zh' },
        { status: 400 }
      );
    }

    if (full_name && (full_name.length < 2 || full_name.length > 50)) {
      return NextResponse.json(
        { error: 'full_name must be between 2 and 50 characters' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    if (full_name !== undefined) updateData.full_name = full_name;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (preferred_language !== undefined) updateData.preferred_language = preferred_language;
    if (notification_settings !== undefined) updateData.notification_settings = notification_settings;

    // Upsert profile
    const { data: profile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .upsert(updateData, { onConflict: 'user_id' })
      .select()
      .single();

    if (updateError) {
      console.error('[Profile API] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile,
    });

  } catch (error) {
    console.error('[Profile API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/profile
 * Delete user account (soft delete)
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const clientIp = getClientIdentifier(request);

  // Rate limiting - strict for destructive operations
  const rateLimit = checkRateLimit(clientIp, RateLimiters.strict);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: rateLimitHeaders(rateLimit) }
    );
  }

  try {
    // Authenticate user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Soft delete - mark profile as deleted
    const { error: deleteError } = await supabaseAdmin
      .from('profiles')
      .update({
        deleted_at: new Date().toISOString(),
        full_name: '[Deleted User]',
        avatar_url: null,
      })
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[Profile API] Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete profile' },
        { status: 500 }
      );
    }

    // Sign out user
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: 'Account has been deleted',
    });

  } catch (error) {
    console.error('[Profile API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete profile' },
      { status: 500 }
    );
  }
}
