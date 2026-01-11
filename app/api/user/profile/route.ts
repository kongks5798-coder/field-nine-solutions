import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/src/utils/supabase/server';
import { formatErrorResponse, logError } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 사용자 프로필 API
 * GET: 프로필 조회
 * POST: 프로필 생성/업데이트
 */

interface UserProfile {
  budget_min?: number;
  budget_max?: number;
  preferred_brands?: string[];
  preferred_categories?: string[];
  style_preferences?: Record<string, any>;
  color_preferences?: string[];
  size_preferences?: Record<string, any>;
  price_drop_threshold?: number;
  notify_on_sale?: boolean;
  notify_on_new_items?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      logError(error, { action: 'get_user_profile', userId: user.id });
      return NextResponse.json(
        { success: false, error: '프로필 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: profile || null,
    });
  } catch (error: unknown) {
    logError(error, { action: 'get_user_profile' });
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.message,
        code: errorResponse.code,
      },
      { status: errorResponse.statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body: UserProfile = await request.json();
    const supabase = await createClient();

    // 기존 프로필 확인
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingProfile) {
      // 업데이트
      const { data: updatedProfile, error } = await supabase
        .from('user_profiles')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        logError(error, { action: 'update_user_profile', userId: user.id });
        return NextResponse.json(
          { success: false, error: '프로필 업데이트에 실패했습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        profile: updatedProfile,
        message: '프로필이 업데이트되었습니다.',
      });
    } else {
      // 생성
      const { data: newProfile, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          ...body,
        })
        .select()
        .single();

      if (error) {
        logError(error, { action: 'create_user_profile', userId: user.id });
        return NextResponse.json(
          { success: false, error: '프로필 생성에 실패했습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        profile: newProfile,
        message: '프로필이 생성되었습니다.',
      });
    }
  } catch (error: unknown) {
    logError(error, { action: 'save_user_profile' });
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.message,
        code: errorResponse.code,
      },
      { status: errorResponse.statusCode }
    );
  }
}
