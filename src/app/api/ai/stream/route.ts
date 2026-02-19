import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt, mode = 'openai', apiKey: clientApiKey } = await req.json();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (text: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
      };

      try {
        if (mode === 'openai') {
          const apiKey = process.env.OPENAI_API_KEY || clientApiKey;
          if (!apiKey) { send('[오류] OPENAI_API_KEY 미설정'); controller.close(); return; }

          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              stream: true,
              messages: [{ role: 'user', content: prompt }],
            }),
          });

          const reader = res.body?.getReader();
          if (!reader) { controller.close(); return; }
          const dec = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = dec.decode(value);
            for (const line of chunk.split('\n')) {
              if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                try {
                  const json = JSON.parse(line.slice(6));
                  const token = json.choices?.[0]?.delta?.content;
                  if (token) send(token);
                } catch {}
              }
            }
          }
        } else if (mode === 'anthropic') {
          const apiKey = process.env.ANTHROPIC_API_KEY || clientApiKey;
          if (!apiKey) { send('[오류] ANTHROPIC_API_KEY 미설정'); controller.close(); return; }

          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              max_tokens: 1024,
              stream: true,
              messages: [{ role: 'user', content: prompt }],
            }),
          });

          const reader = res.body?.getReader();
          if (!reader) { controller.close(); return; }
          const dec = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = dec.decode(value);
            for (const line of chunk.split('\n')) {
              if (line.startsWith('data: ')) {
                try {
                  const json = JSON.parse(line.slice(6));
                  if (json.type === 'content_block_delta') send(json.delta?.text || '');
                } catch {}
              }
            }
          }
        } else {
          // Gemini는 스트리밍 미지원 → 일반 호출
          const apiKey = process.env.GEMINI_API_KEY || clientApiKey;
          if (!apiKey) { send('[오류] GEMINI_API_KEY 미설정'); controller.close(); return; }
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          });
          const data = await res.json();
          send(data.candidates?.[0]?.content?.parts?.[0]?.text || 'Gemini 응답 없음');
        }
      } catch (e: any) {
        send(`[오류] ${e.message}`);
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
