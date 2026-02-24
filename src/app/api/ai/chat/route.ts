import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import { OPENAI_API_BASE, ANTHROPIC_API_BASE, GEMINI_API_BASE, XAI_API_BASE } from '@/lib/constants';

const AiChatSchema = z.object({
  prompt: z.string().min(1).max(10_000),
  mode:   z.enum(['openai', 'gemini', 'anthropic', 'grok']).default('openai'),
});

export async function POST(req: NextRequest) {
  // ── 인증 확인 ────────────────────────────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const raw = await req.json().catch(() => ({}));
  const parsed = AiChatSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'prompt 필요 (최대 10,000자)' }, { status: 400 });
  const { prompt, mode } = parsed.data;

  try {
    if (mode === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY 미설정' }, { status: 500 });
      const res = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      return NextResponse.json({ text: data.choices?.[0]?.message?.content || 'AI 응답 없음' });
    }

    if (mode === 'gemini') {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) return NextResponse.json({ error: 'GOOGLE_GENERATIVE_AI_API_KEY 미설정' }, { status: 500 });
      const res = await fetch(`${GEMINI_API_BASE}/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const data = await res.json();
      return NextResponse.json({ text: data.candidates?.[0]?.content?.parts?.[0]?.text || 'Gemini 응답 없음' });
    }

    if (mode === 'anthropic') {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY 미설정' }, { status: 500 });
      const res = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-3-5-haiku-20241022', max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      return NextResponse.json({ text: data.content?.[0]?.text || 'Anthropic 응답 없음' });
    }

    if (mode === 'grok') {
      const apiKey = process.env.XAI_API_KEY;
      if (!apiKey) return NextResponse.json({ error: 'XAI_API_KEY 미설정' }, { status: 500 });
      const res = await fetch(`${XAI_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'grok-3', max_tokens: 4096, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      return NextResponse.json({ text: data.choices?.[0]?.message?.content || 'Grok 응답 없음' });
    }

    return NextResponse.json({ error: '지원하지 않는 모드' }, { status: 400 });
  } catch (e: unknown) {
    console.error('[ai/chat] 처리 실패', (e as Error).message);
    return NextResponse.json({ error: 'AI 요청 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
