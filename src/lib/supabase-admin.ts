import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Supabase service_role 클라이언트 싱글톤
// 요청마다 새 클라이언트를 생성하지 않아 커넥션 오버헤드 최소화
let _adminClient: SupabaseClient | null = null;

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
