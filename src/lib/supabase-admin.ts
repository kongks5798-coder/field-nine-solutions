import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Supabase service_role 클라이언트 싱글톤
// 요청마다 새 클라이언트를 생성하지 않아 커넥션 오버헤드 최소화
let _adminClient: SupabaseClient | null = null;

/**
 * Supabase `service_role` 권한을 가진 관리자 클라이언트를 반환한다.
 *
 * 싱글톤 패턴을 사용하여 프로세스 수명 동안 단일 인스턴스만 생성하므로,
 * 요청마다 새 클라이언트를 만드는 오버헤드를 방지한다.
 *
 * **필수 환경변수:**
 * - `NEXT_PUBLIC_SUPABASE_URL` — Supabase 프로젝트 URL
 * - `SUPABASE_SERVICE_ROLE_KEY` — Supabase service_role 시크릿 키
 *
 * @returns 이미 생성된 관리자 {@link SupabaseClient} 인스턴스 또는 새로 생성한 인스턴스
 * @throws {Error} 필수 환경변수가 설정되지 않은 경우 `"Supabase admin env vars not set"` 에러를 던진다
 *
 * @example
 * ```ts
 * const admin = getAdminClient();
 * const { data } = await admin.from("profiles").select("*");
 * ```
 */
export function getAdminClient(): SupabaseClient {
  if (_adminClient) return _adminClient;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase admin env vars not set');
  }
  _adminClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
  return _adminClient;
}
