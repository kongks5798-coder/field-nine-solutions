import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && url !== 'https://placeholder.supabase.co';
}

// Vision message content type
type MsgContent = string | Array<{
  type: 'text' | 'image_url' | 'image';
  text?: string;
  image_url?: { url: string; detail?: string };
  source?: { type: 'base64'; media_type: string; data: string };
}>;

interface ApiMessage { role: string; content: MsgContent; }

const STARTER_DAILY_LIMIT = 10;

// 모델별 AI 호출 단가 (원화 KRW)
const CALL_COST: Record<string, number> = {
  openai:    50,   // GPT-4o
  anthropic: 120,  // Claude Opus (고품질 코드 생성)
  gemini:    20,   // Gemini
  grok:      50,   // Grok
};

export async function POST(req: NextRequest) {
  // req.json()은 한 번만 호출 가능하므로 clone 후 미리 읽기
  const reqClone = req.clone();
  const bodyForMode = await reqClone.json().catch(() => ({}));
  const callMode: string = (bodyForMode as Record<string, string>).mode ?? 'openai';

  if (isSupabaseConfigured()) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
    );
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminSb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );
    const uid = session.user.id;
    const period = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    const today  = new Date().toISOString().slice(0, 10);

    try {
      const { data: profile } = await adminSb
        .from('profiles').select('plan').eq('id', uid).single();
      const plan = profile?.plan ?? null;

      if (!plan || plan === 'starter') {
        // 스타터: 하루 N회 제한
        const { count } = await adminSb
          .from('usage_records')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', uid)
          .eq('type', 'ai_call')
          .gte('created_at', `${today}T00:00:00Z`);

        if ((count ?? 0) >= STARTER_DAILY_LIMIT) {
          return NextResponse.json(
            { error: `스타터 플랜은 하루 ${STARTER_DAILY_LIMIT}회까지 AI를 사용할 수 있습니다. 업그레이드해주세요.` },
            { status: 429 }
          );
        }
        // 스타터 사용량 기록 (무료)
        await adminSb.from('usage_records').insert({
          user_id: uid, type: 'ai_call', quantity: 1,
          unit_price: 0, amount: 0, billed: true,
          billing_period: period, model: callMode,
        });

      } else {
        // Pro/Team: 월 한도(spending_cap) 체크
        const callCost = CALL_COST[callMode] ?? 50;

        // 현재 월 누적 금액 조회
        const { data: monthUsage } = await adminSb
          .from('monthly_usage')
          .select('amount_krw')
          .eq('user_id', uid)
          .eq('billing_period', period)
          .single();

        const currentAmount = monthUsage?.amount_krw ?? 0;

        // 한도 조회 (없으면 기본 50,000원)
        const { data: cap } = await adminSb
          .from('spending_caps')
          .select('hard_limit, warn_threshold')
          .eq('user_id', uid)
          .single();

        const hardLimit    = cap?.hard_limit    ?? 50000;
        const warnThreshold = cap?.warn_threshold ?? 40000;

        if (currentAmount >= hardLimit) {
          return NextResponse.json(
            { error: `이번 달 사용 한도(${(hardLimit/1000).toFixed(0)}천원)에 도달했습니다. 다음 달 1일에 초기화됩니다.` },
            { status: 402 }
          );
        }

        // 사용량 기록 (usage_records)
        await adminSb.from('usage_records').insert({
          user_id: uid, type: 'ai_call', quantity: 1,
          unit_price: callCost, amount: callCost, billed: false,
          billing_period: period, model: callMode,
        });

        // monthly_usage upsert
        const newAmount = currentAmount + callCost;
        await adminSb.from('monthly_usage').upsert({
          user_id: uid,
          billing_period: period,
          ai_calls: (monthUsage ? 1 : 1),
          amount_krw: newAmount,
          status: 'open',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,billing_period' });

        // monthly_usage ai_calls 증분 업데이트
        if (monthUsage) {
          await adminSb.from('monthly_usage')
            .update({ ai_calls: (monthUsage as unknown as { ai_calls?: number })?.ai_calls ? ((monthUsage as unknown as { ai_calls: number }).ai_calls + 1) : 1, amount_krw: newAmount, updated_at: new Date().toISOString() })
            .eq('user_id', uid).eq('billing_period', period);
        }

        // 경고 임박 시 응답 헤더에 포함 (UI에서 읽어서 표시)
        if (newAmount >= warnThreshold) {
          // 헤더로 경고 전달 (stream 응답에서는 초기 헤더에 포함됨)
          req.headers.set('x-billing-warn', `이번 달 ${(newAmount/1000).toFixed(1)}천원 사용 중 (한도 ${(hardLimit/1000).toFixed(0)}천원)`);
        }
      }
    } catch (err) {
      console.error('[AI stream] 사용량 체크 실패:', (err as Error).message);
      return NextResponse.json({ error: '서비스 일시 오류. 잠시 후 다시 시도해주세요.' }, { status: 503 });
    }
  }

  const body = await req.json();
  const { mode = 'openai', apiKey: clientApiKey } = body;
  const prompt: string = body.prompt ?? '';
  const systemPrompt: string = body.system ?? '';
  const messages: ApiMessage[] = body.messages ?? [];
  // Optional base64 image for vision (attached to last user message)
  const imageBase64: string = body.image ?? '';
  const imageMime: string = body.imageMime ?? 'image/png';

  if (!prompt && messages.length === 0) {
    return NextResponse.json({ error: '프롬프트가 필요합니다.' }, { status: 400 });
  }
  const VALID_MODES = ['openai', 'anthropic', 'gemini', 'grok'];
  if (!VALID_MODES.includes(mode)) {
    return NextResponse.json({ error: '유효하지 않은 AI 모드입니다.' }, { status: 400 });
  }

  // Build base messages
  let finalMessages: ApiMessage[] = messages.length > 0
    ? [...messages]
    : [{ role: 'user', content: prompt }];

  // Inject image into last user message if provided
  if (imageBase64) {
    const lastIdx = finalMessages.length - 1;
    const last = finalMessages[lastIdx];
    if (last.role === 'user') {
      const textContent = typeof last.content === 'string' ? last.content : '';
      finalMessages[lastIdx] = {
        role: 'user',
        content: [
          { type: 'text', text: textContent },
          { type: 'image_url', image_url: { url: `data:${imageMime};base64,${imageBase64}`, detail: 'high' } },
        ],
      };
    }
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (text: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
      };

      try {
        // ── OpenAI (GPT-4o Vision) ────────────────────────────────────────────
        if (mode === 'openai') {
          const apiKey = process.env.OPENAI_API_KEY || clientApiKey;
          if (!apiKey) { send('[오류] OPENAI_API_KEY 미설정'); controller.close(); return; }

          const openaiMsgs = [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            ...finalMessages,
          ];
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ model: 'gpt-4o-mini', stream: true, max_tokens: 16000, messages: openaiMsgs }),
          });
          if (!res.ok) { send(`[오류] OpenAI ${res.status}: ${await res.text()}`); controller.close(); return; }

          const reader = res.body?.getReader();
          if (!reader) { controller.close(); return; }
          const dec = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            for (const line of dec.decode(value).split('\n')) {
              if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                try { const token = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content; if (token) send(token); } catch {}
              }
            }
          }

        // ── Anthropic Claude (Vision) ─────────────────────────────────────────
        } else if (mode === 'anthropic') {
          const apiKey = process.env.ANTHROPIC_API_KEY || clientApiKey;
          if (!apiKey) { send('[오류] ANTHROPIC_API_KEY 미설정'); controller.close(); return; }

          // Convert image_url format → Anthropic format
          const anthropicMsgs = finalMessages.map(m => {
            if (typeof m.content === 'string') return m;
            const parts = (m.content as Array<{type: string; text?: string; image_url?: {url: string}}>).map(p => {
              if (p.type === 'image_url' && p.image_url?.url?.startsWith('data:')) {
                const [meta, data] = p.image_url.url.split(',');
                const mimeMatch = meta.match(/data:([^;]+)/);
                return { type: 'image', source: { type: 'base64', media_type: mimeMatch?.[1] ?? 'image/png', data } };
              }
              return p.type === 'text' ? { type: 'text', text: p.text } : p;
            });
            return { role: m.role, content: parts };
          });

          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({
              model: 'claude-sonnet-4-6', max_tokens: 16000, stream: true,
              ...(systemPrompt ? { system: systemPrompt } : {}),
              messages: anthropicMsgs,
            }),
          });
          if (!res.ok) { send(`[오류] Anthropic ${res.status}: ${await res.text()}`); controller.close(); return; }

          const reader = res.body?.getReader();
          if (!reader) { controller.close(); return; }
          const dec = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            for (const line of dec.decode(value).split('\n')) {
              if (line.startsWith('data: ')) {
                try { const j = JSON.parse(line.slice(6)); if (j.type === 'content_block_delta') send(j.delta?.text || ''); } catch {}
              }
            }
          }

        // ── Grok 3 ───────────────────────────────────────────────────────────
        } else if (mode === 'grok') {
          const apiKey = process.env.XAI_API_KEY || clientApiKey;
          if (!apiKey) { send('[오류] XAI_API_KEY 미설정'); controller.close(); return; }

          const res = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: 'grok-3', stream: true, max_tokens: 8192,
              messages: [
                ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                ...finalMessages,
              ],
            }),
          });
          if (!res.ok) { send(`[오류] Grok ${res.status}`); controller.close(); return; }

          const reader = res.body?.getReader();
          if (!reader) { controller.close(); return; }
          const dec = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            for (const line of dec.decode(value).split('\n')) {
              if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                try { const token = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content; if (token) send(token); } catch {}
              }
            }
          }

        // ── Gemini (with vision) ──────────────────────────────────────────────
        } else {
          const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || clientApiKey;
          if (!apiKey) { send('[오류] GOOGLE_GENERATIVE_AI_API_KEY 미설정'); controller.close(); return; }

          // Build Gemini parts
          const lastMsg = finalMessages[finalMessages.length - 1];
          const parts: Array<{text?: string; inlineData?: {mimeType: string; data: string}}> = [];
          if (typeof lastMsg.content === 'string') {
            parts.push({ text: lastMsg.content });
          } else {
            for (const p of lastMsg.content as Array<{type: string; text?: string; image_url?: {url: string}}>) {
              if (p.type === 'text') parts.push({ text: p.text });
              if (p.type === 'image_url' && p.image_url?.url?.startsWith('data:')) {
                const [meta, data] = p.image_url.url.split(',');
                const mimeMatch = meta.match(/data:([^;]+)/);
                parts.push({ inlineData: { mimeType: mimeMatch?.[1] ?? 'image/png', data } });
              }
            }
          }

          const model = imageBase64 ? 'gemini-2.0-flash' : 'gemini-2.0-flash';
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts }] }) }
          );
          const data = await res.json();
          send(data.candidates?.[0]?.content?.parts?.[0]?.text || '[오류] Gemini 응답 없음');
        }
      } catch (e: unknown) {
        send(`[오류] ${(e as Error).message}`);
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  });
}
