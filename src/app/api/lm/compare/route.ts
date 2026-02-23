import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import { log } from '@/lib/logger';

export const maxDuration = 60;

// ── 요청 스키마 ─────────────────────────────────────────────────────────────
const CompareSchema = z.object({
  prompt: z.string().min(1).max(10000),
  models: z.array(z.object({
    id: z.string(),
    provider: z.enum(['openai', 'anthropic', 'gemini', 'grok']),
  })).min(2).max(4),
  system: z.string().max(5000).optional(),
});

export async function POST(req: NextRequest) {
  // ── 인증 확인 ─────────────────────────────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } },
  );
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // ── 요청 파싱 ─────────────────────────────────────────────────────────────
  const body = await req.json().catch(() => ({}));
  const parsed = CompareSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

  const { prompt, models, system } = parsed.data;
  const messages = [{ role: 'user', content: prompt }];
  const withSystem = system ? [{ role: 'system', content: system }, ...messages] : messages;

  // ── 모든 모델 병렬 호출 (비스트리밍, 비교용) ───────────────────────────────
  const results = await Promise.allSettled(
    models.map(async (m) => {
      const start = Date.now();
      try {
        let text = '';

        // ── OpenAI ────────────────────────────────────────────────────────
        if (m.provider === 'openai') {
          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) throw new Error('OPENAI_API_KEY 미설정');
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ model: m.id, max_tokens: 4096, messages: withSystem }),
          });
          if (!res.ok) throw new Error(`OpenAI ${res.status}`);
          const data = await res.json();
          text = data.choices?.[0]?.message?.content || '';

        // ── Anthropic ─────────────────────────────────────────────────────
        } else if (m.provider === 'anthropic') {
          const apiKey = process.env.ANTHROPIC_API_KEY;
          if (!apiKey) throw new Error('ANTHROPIC_API_KEY 미설정');
          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: m.id,
              max_tokens: 4096,
              ...(system ? { system } : {}),
              messages,
            }),
          });
          if (!res.ok) throw new Error(`Anthropic ${res.status}`);
          const data = await res.json();
          text = data.content?.[0]?.text || '';

        // ── Gemini ────────────────────────────────────────────────────────
        } else if (m.provider === 'gemini') {
          const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
          if (!apiKey) throw new Error('GEMINI_API_KEY 미설정');
          const geminiBody: Record<string, unknown> = {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          };
          if (system) {
            geminiBody.systemInstruction = { parts: [{ text: system }] };
          }
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${m.id}:generateContent?key=${apiKey}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiBody) },
          );
          if (!res.ok) throw new Error(`Gemini ${res.status}`);
          const data = await res.json();
          text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // ── Grok (x.ai) ──────────────────────────────────────────────────
        } else if (m.provider === 'grok') {
          const apiKey = process.env.XAI_API_KEY;
          if (!apiKey) throw new Error('XAI_API_KEY 미설정');
          const res = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ model: m.id, max_tokens: 4096, messages: withSystem }),
          });
          if (!res.ok) throw new Error(`Grok ${res.status}`);
          const data = await res.json();
          text = data.choices?.[0]?.message?.content || '';
        }

        return {
          model: m.id,
          provider: m.provider,
          text,
          latencyMs: Date.now() - start,
          tokenEstimate: Math.ceil(text.length / 4),
        };
      } catch (e) {
        log.error('[lm/compare] 모델 호출 실패', { model: m.id, error: (e as Error).message });
        return {
          model: m.id,
          provider: m.provider,
          text: '',
          error: (e as Error).message,
          latencyMs: Date.now() - start,
          tokenEstimate: 0,
        };
      }
    }),
  );

  // ── 결과 조합 ─────────────────────────────────────────────────────────────
  const responses = results.map(r => r.status === 'fulfilled' ? r.value : { error: 'Failed' });

  return NextResponse.json({ prompt, responses, timestamp: new Date().toISOString() });
}
