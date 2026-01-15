/**
 * Panopticon Supabase Real-time Sync
 * CEO 대시보드 실시간 데이터 동기화
 */

import { createClient, RealtimeChannel } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export interface FinancialRecord {
  id: string;
  monthly_revenue: number;
  monthly_expense: number;
  operating_margin: number;
  previous_month_revenue: number;
  target_revenue: number;
  labor_expense: number;
  rent_expense: number;
  logistics_expense: number;
  other_expense: number;
  recorded_at: string;
}

export interface MusinsaRankingRecord {
  id: string;
  overall_rank: number;
  category_rank: number;
  category: string;
  previous_rank: number | null;
  change_direction: 'up' | 'down' | 'same';
  change_amount: number;
  recorded_at: string;
}

export interface MusinsaSalesRecord {
  id: string;
  total_sales: number;
  today_sales: number;
  week_sales: number;
  month_sales: number;
  settlement_amount: number;
  pending_settlement: number;
  recorded_at: string;
}

export interface CSReportRecord {
  id: string;
  total_cases: number;
  pending_cases: number;
  urgent_cases: number;
  today_cases: number;
  delivery_cases: number;
  quality_cases: number;
  exchange_cases: number;
  refund_cases: number;
  other_cases: number;
  recorded_at: string;
}

export interface ServerStatusRecord {
  id: string;
  server_name: string;
  status: 'online' | 'offline' | 'warning';
  cpu_usage: number;
  memory_usage: number;
  gpu_usage: number | null;
  temperature: number | null;
  uptime_seconds: number;
  recorded_at: string;
}

export interface ProductionRecord {
  id: string;
  brand: string;
  item: string;
  status: 'sampling' | 'production' | 'shipping' | 'completed';
  progress: number;
  quantity: number;
  due_date: string;
  notes: string | null;
  is_active: boolean;
}

// ============================================
// Supabase Client (Server-side)
// ============================================

let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('[Panopticon] Supabase credentials not configured');
    return null;
  }

  supabaseClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseClient;
}

// ============================================
// Data Fetching Functions
// ============================================

/**
 * 최신 재무 데이터 가져오기
 */
export async function getLatestFinancial(): Promise<FinancialRecord | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('panopticon_financial')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('[Panopticon] Financial fetch error:', error);
    return null;
  }

  return data;
}

/**
 * 최신 무신사 랭킹 가져오기
 */
export async function getLatestMusinsaRanking(): Promise<MusinsaRankingRecord | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('panopticon_musinsa_ranking')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('[Panopticon] Musinsa ranking fetch error:', error);
    return null;
  }

  return data;
}

/**
 * 최신 무신사 매출 가져오기
 */
export async function getLatestMusinsaSales(): Promise<MusinsaSalesRecord | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('panopticon_musinsa_sales')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('[Panopticon] Musinsa sales fetch error:', error);
    return null;
  }

  return data;
}

/**
 * 최신 CS 리포트 가져오기
 */
export async function getLatestCSReport(): Promise<CSReportRecord | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('panopticon_cs_reports')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('[Panopticon] CS report fetch error:', error);
    return null;
  }

  return data;
}

/**
 * 최신 서버 상태 가져오기
 */
export async function getLatestServerStatus(): Promise<ServerStatusRecord | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('panopticon_server_status')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('[Panopticon] Server status fetch error:', error);
    return null;
  }

  return data;
}

/**
 * 활성 생산 현황 가져오기
 */
export async function getActiveProduction(): Promise<ProductionRecord[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('panopticon_production')
    .select('*')
    .eq('is_active', true)
    .order('due_date', { ascending: true });

  if (error) {
    console.error('[Panopticon] Production fetch error:', error);
    return [];
  }

  return data || [];
}

// ============================================
// Data Writing Functions
// ============================================

/**
 * 재무 데이터 기록
 */
export async function recordFinancial(data: Omit<FinancialRecord, 'id' | 'recorded_at'>) {
  const client = getSupabaseClient();
  if (!client) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error } = await (client as any)
    .from('panopticon_financial')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('[Panopticon] Financial record error:', error);
    return null;
  }

  return result as FinancialRecord | null;
}

/**
 * 무신사 랭킹 기록
 */
export async function recordMusinsaRanking(data: Omit<MusinsaRankingRecord, 'id' | 'recorded_at'>) {
  const client = getSupabaseClient();
  if (!client) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error } = await (client as any)
    .from('panopticon_musinsa_ranking')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('[Panopticon] Musinsa ranking record error:', error);
    return null;
  }

  return result as MusinsaRankingRecord | null;
}

/**
 * 무신사 매출 기록
 */
export async function recordMusinsaSales(data: Omit<MusinsaSalesRecord, 'id' | 'recorded_at'>) {
  const client = getSupabaseClient();
  if (!client) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error } = await (client as any)
    .from('panopticon_musinsa_sales')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('[Panopticon] Musinsa sales record error:', error);
    return null;
  }

  return result as MusinsaSalesRecord | null;
}

/**
 * CS 리포트 기록
 */
export async function recordCSReport(data: Omit<CSReportRecord, 'id' | 'recorded_at'>) {
  const client = getSupabaseClient();
  if (!client) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error } = await (client as any)
    .from('panopticon_cs_reports')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('[Panopticon] CS report record error:', error);
    return null;
  }

  return result as CSReportRecord | null;
}

/**
 * 서버 상태 기록
 */
export async function recordServerStatus(data: Omit<ServerStatusRecord, 'id' | 'recorded_at'>) {
  const client = getSupabaseClient();
  if (!client) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error } = await (client as any)
    .from('panopticon_server_status')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('[Panopticon] Server status record error:', error);
    return null;
  }

  return result as ServerStatusRecord | null;
}

/**
 * Jarvis 대화 로그 기록
 */
export async function recordJarvisLog(query: string, answer: string, category?: string, responseTimeMs?: number) {
  const client = getSupabaseClient();
  if (!client) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error } = await (client as any)
    .from('panopticon_jarvis_logs')
    .insert({
      query,
      answer,
      query_category: category,
      response_time_ms: responseTimeMs,
    })
    .select()
    .single();

  if (error) {
    console.error('[Panopticon] Jarvis log record error:', error);
    return null;
  }

  return result;
}

// ============================================
// Real-time Subscription (Client-side)
// ============================================

export type PanopticonTable =
  | 'panopticon_financial'
  | 'panopticon_musinsa_ranking'
  | 'panopticon_musinsa_sales'
  | 'panopticon_cs_reports'
  | 'panopticon_server_status'
  | 'panopticon_production';

/**
 * 실시간 구독 생성 (브라우저용)
 */
export function subscribeToTable(
  table: PanopticonTable,
  callback: (payload: unknown) => void
): RealtimeChannel | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  const client = createClient(url, key);

  const channel = client
    .channel(`panopticon-${table}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: table,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return channel;
}

/**
 * 모든 Panopticon 테이블 실시간 구독
 */
export function subscribeToAllTables(callbacks: {
  onFinancial?: (data: FinancialRecord) => void;
  onMusinsaRanking?: (data: MusinsaRankingRecord) => void;
  onMusinsaSales?: (data: MusinsaSalesRecord) => void;
  onCSReport?: (data: CSReportRecord) => void;
  onServerStatus?: (data: ServerStatusRecord) => void;
  onProduction?: (data: ProductionRecord) => void;
}): RealtimeChannel[] {
  const channels: RealtimeChannel[] = [];

  if (callbacks.onFinancial) {
    const ch = subscribeToTable('panopticon_financial', callbacks.onFinancial as (d: unknown) => void);
    if (ch) channels.push(ch);
  }

  if (callbacks.onMusinsaRanking) {
    const ch = subscribeToTable('panopticon_musinsa_ranking', callbacks.onMusinsaRanking as (d: unknown) => void);
    if (ch) channels.push(ch);
  }

  if (callbacks.onMusinsaSales) {
    const ch = subscribeToTable('panopticon_musinsa_sales', callbacks.onMusinsaSales as (d: unknown) => void);
    if (ch) channels.push(ch);
  }

  if (callbacks.onCSReport) {
    const ch = subscribeToTable('panopticon_cs_reports', callbacks.onCSReport as (d: unknown) => void);
    if (ch) channels.push(ch);
  }

  if (callbacks.onServerStatus) {
    const ch = subscribeToTable('panopticon_server_status', callbacks.onServerStatus as (d: unknown) => void);
    if (ch) channels.push(ch);
  }

  if (callbacks.onProduction) {
    const ch = subscribeToTable('panopticon_production', callbacks.onProduction as (d: unknown) => void);
    if (ch) channels.push(ch);
  }

  return channels;
}

/**
 * 구독 해제
 */
export function unsubscribeAll(channels: RealtimeChannel[]) {
  channels.forEach((ch) => ch.unsubscribe());
}
