import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { log } from '@/lib/logger';

const CLOUD_MODELS = [
  { id: 'gpt-4o',            name: 'GPT-4o',            provider: 'openai',    available: false, contextLen: 128000,  speed: 'fast',   cost: '$$'  },
  { id: 'gpt-4o-mini',       name: 'GPT-4o Mini',       provider: 'openai',    available: false, contextLen: 128000,  speed: 'fast',   cost: '$'   },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'anthropic', available: false, contextLen: 200000,  speed: 'medium', cost: '$$'  },
  { id: 'claude-opus-4-6',   name: 'Claude Opus 4.6',   provider: 'anthropic', available: false, contextLen: 200000,  speed: 'slow',   cost: '$$$' },
  { id: 'gemini-2.0-flash',  name: 'Gemini 2.0 Flash',  provider: 'gemini',    available: false, contextLen: 1000000, speed: 'fast',   cost: '$'   },
  { id: 'grok-3',            name: 'Grok 3',            provider: 'grok',      available: false, contextLen: 131072,  speed: 'fast',   cost: '$$'  },
];

export async function GET(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 클라우드 모델 — API 키 보유 여부로 available 설정
  const cloudModels = CLOUD_MODELS.map(m => ({
    ...m,
    available:
      m.provider === 'openai'    ? !!process.env.OPENAI_API_KEY :
      m.provider === 'anthropic' ? !!process.env.ANTHROPIC_API_KEY :
      m.provider === 'gemini'    ? !!(process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY) :
      m.provider === 'grok'      ? !!process.env.XAI_API_KEY :
      false,
  }));

  // Ollama 로컬 모델
  const ollamaUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
  type OllamaModel = {
    id: string; name: string; provider: string; available: boolean;
    contextLen: number; speed: string; cost: string; size?: string;
  };
  let ollamaModels: OllamaModel[] = [];
  let ollamaOnline = false;

  try {
    const r = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (r.ok) {
      const data = await r.json();
      ollamaOnline = true;
      ollamaModels = (data.models ?? []).map((m: { name: string; size?: number }) => ({
        id:         m.name,
        name:       m.name,
        provider:   'ollama',
        available:  true,
        contextLen: 128000,
        speed:      'local',
        cost:       'free',
        size:       m.size ? `${(m.size / 1e9).toFixed(1)}GB` : undefined,
      }));
    }
  } catch {
    // Ollama 미연결 시 무시
  }

  log.info('[lm/models] 모델 목록 조회', {
    userId: session.user.id,
    cloudCount: cloudModels.length,
    ollamaCount: ollamaModels.length,
    ollamaOnline,
  });

  const res = NextResponse.json({
    models:      [...ollamaModels, ...cloudModels],
    ollamaOnline,
    ollamaUrl,
  });
  res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  return res;
}
