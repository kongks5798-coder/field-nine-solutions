/**
 * Supabase Server Client
 * API Routes에서 사용 - service_role 키로 RLS 우회
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase server credentials not found');
}

// Service Role 클라이언트 - RLS 우회, API Routes에서만 사용
// 타입 없이 생성 (동적 테이블 접근용)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
