/**
 * Workspace Memory API
 *
 * GET  /api/memory        — fetch user's last 10 memories
 * POST /api/memory        — save a new memory snapshot
 * DELETE /api/memory?id=  — delete a memory by id
 *
 * Supabase RLS — each user can only access their own rows.
 *
 * Table DDL:
 * -- CREATE TABLE workspace_memory (
 * --   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 * --   user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
 * --   prompt text NOT NULL,
 * --   tags text[] DEFAULT '{}',
 * --   html_preview text,
 * --   style_tokens jsonb DEFAULT '{}',
 * --   created_at timestamptz DEFAULT now()
 * -- );
 * -- CREATE INDEX ON workspace_memory(user_id, created_at DESC);
 * -- ALTER TABLE workspace_memory ENABLE ROW LEVEL SECURITY;
 * -- CREATE POLICY "users own memories" ON workspace_memory FOR ALL USING (auth.uid() = user_id);
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { checkLimit, ipFromHeaders, headersFor } from '@/core/rateLimit';
import { z } from 'zod';

export const runtime = 'edge';

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && url !== 'https://placeholder.supabase.co';
}

function getUserSupabase(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    }
  );
}

const StyleTokensSchema = z.object({
  primaryColor: z.string().max(50).optional(),
  fontFamily: z.string().max(100).optional(),
  theme: z.enum(['dark', 'light']).optional(),
  layout: z.enum(['grid', 'flex', 'sidebar']).optional(),
});

const PostBodySchema = z.object({
  prompt: z.string().min(1).max(200),
  tags: z.array(z.string().max(50)).max(20).default([]),
  html_preview: z.string().max(500).optional().default(''),
  style_tokens: StyleTokensSchema.default({}),
});

// ── GET /api/memory ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const ip = ipFromHeaders(req.headers);
  const rl = checkLimit(`memory:get:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'RATE_LIMIT', message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429, headers: headersFor(rl) }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ memories: [] });
  }

  const supabase = getUserSupabase(req);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('workspace_memory')
    .select('id, prompt, tags, html_preview, style_tokens, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: 'DB 조회 실패' }, { status: 500 });
  }

  return NextResponse.json({ memories: data ?? [] });
}

// ── POST /api/memory ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = ipFromHeaders(req.headers);
  const rl = checkLimit(`memory:post:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'RATE_LIMIT', message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429, headers: headersFor(rl) }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, id: null });
  }

  const supabase = getUserSupabase(req);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = PostBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '요청 형식이 올바르지 않습니다.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { prompt, tags, html_preview, style_tokens } = parsed.data;

  const { data, error } = await supabase
    .from('workspace_memory')
    .insert({
      user_id: session.user.id,
      prompt,
      tags,
      html_preview,
      style_tokens,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: '저장 실패' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data?.id ?? null }, { status: 201 });
}

// ── DELETE /api/memory?id=xxx ────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const ip = ipFromHeaders(req.headers);
  const rl = checkLimit(`memory:delete:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'RATE_LIMIT', message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429, headers: headersFor(rl) }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
  }

  const supabase = getUserSupabase(req);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // RLS ensures user can only delete their own rows
  const { error } = await supabase
    .from('workspace_memory')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id);

  if (error) {
    return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
