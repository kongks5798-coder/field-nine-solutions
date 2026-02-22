import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import { log } from '@/lib/logger';

const GenerateSchema = z.object({
  prompt:  z.string().min(1).max(1000),
  model:   z.enum(['dall-e-3', 'dall-e-2']).default('dall-e-3'),
  size:    z.enum(['1024x1024', '1792x1024', '1024x1792', '512x512', '256x256']).default('1024x1024'),
  quality: z.enum(['standard', 'hd']).default('standard'),
  style:   z.enum(['vivid', 'natural']).default('vivid'),
  n:       z.number().int().min(1).max(4).default(1),
});

export async function POST(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'OpenAI API 키가 설정되지 않았습니다.' }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? '잘못된 요청' }, { status: 400 });
  }
  const { prompt, model, size, quality, style, n } = parsed.data;

  const reqBody: Record<string, unknown> = { prompt, model, size, n, response_format: 'url' };
  if (model === 'dall-e-3') {
    reqBody.quality = quality;
    reqBody.style   = style;
  }

  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(reqBody),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      log.error('[canvas/generate] OpenAI 오류', { status: res.status, error: err });
      return NextResponse.json({ error: '이미지 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' }, { status: 502 });
    }

    const data = await res.json();
    const images = (data.data ?? []).map((img: { url: string; revised_prompt?: string }) => ({
      url:           img.url,
      revisedPrompt: img.revised_prompt,
    }));

    log.info('[canvas/generate] 이미지 생성 완료', { userId: session.user.id, n: images.length });
    return NextResponse.json({ images });
  } catch (err) {
    log.error('[canvas/generate] 처리 실패', { error: (err as Error).message });
    return NextResponse.json({ error: '이미지 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
