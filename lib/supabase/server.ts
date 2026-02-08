/**
 * Supabase Server Client
 * SSR 환경에서 쿠키 기반 세션 관리
 * @version 2.0.0 - Production Grade
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server Component용 Supabase 클라이언트
 * - 읽기 전용 쿠키 접근
 * - getUser() 호출에 최적화
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component에서는 쿠키 설정 불가
            // Middleware나 Server Action에서 처리됨
          }
        },
      },
    }
  );
}

/**
 * Server Action/Route Handler용 Supabase 클라이언트
 * - 읽기/쓰기 쿠키 접근
 * - 세션 갱신 가능
 */
export async function createActionClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

/**
 * Admin Client (Service Role)
 * - 서버 사이드 전용
 * - 관리자 권한 필요 작업용 (RLS 우회)
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // Admin 클라이언트는 쿠키 불필요
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * 현재 인증된 사용자 가져오기
 * - 에러 발생 시 null 반환
 */
export async function getUser() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('[Auth] getUser error:', error.message);
      return null;
    }

    return user;
  } catch (error) {
    console.error('[Auth] getUser exception:', error);
    return null;
  }
}

/**
 * 현재 세션 가져오기
 * - 에러 발생 시 null 반환
 */
export async function getSession() {
  try {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[Auth] getSession error:', error.message);
      return null;
    }

    return session;
  } catch (error) {
    console.error('[Auth] getSession exception:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAZY INITIALIZATION - Prevents build-time errors when env vars are missing
// ═══════════════════════════════════════════════════════════════════════════════

let _supabaseAdmin: ReturnType<typeof createServerClient> | null = null;

/**
 * Get or create supabaseAdmin instance (lazy initialization)
 * Returns null if SUPABASE_SERVICE_ROLE_KEY is not configured
 */
export function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin;

  try {
    _supabaseAdmin = createAdminClient();
    return _supabaseAdmin;
  } catch (error) {
    console.warn('[Supabase] Admin client not available:', error);
    return null;
  }
}

// Legacy export for backward compatibility - now uses lazy initialization
export const supabaseAdmin = (() => {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('[Supabase] SUPABASE_SERVICE_ROLE_KEY not configured - admin client unavailable');
      return null;
    }
    return createAdminClient();
  } catch {
    return null;
  }
})() as ReturnType<typeof createServerClient> | null;
