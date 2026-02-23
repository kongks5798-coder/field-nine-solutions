import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── vi.hoisted ──────────────────────────────────────────────────────────────
const mockGetSession = vi.hoisted(() => vi.fn());

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
  })),
}));

vi.mock('@/lib/logger', () => ({
  log: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { GET } from '@/app/api/lm/models/route';

// ── 헬퍼 ────────────────────────────────────────────────────────────────────
const NO_SESSION = { data: { session: null } };
const SESSION = {
  data: { session: { user: { id: 'test-uid', email: 'test@test.com' } } },
};

function makeReq() {
  return new NextRequest('http://localhost/api/lm/models', { method: 'GET' });
}

let originalFetch: typeof globalThis.fetch;

// ── 테스트 ──────────────────────────────────────────────────────────────────
describe('GET /api/lm/models', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    originalFetch = globalThis.fetch;
    // 기본 환경변수 초기화
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.XAI_API_KEY;
    delete process.env.OLLAMA_BASE_URL;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // ── 1. 미인증 → 401 ──────────────────────────────────────────────────────
  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ── 2. 모델 목록 구조 확인 ────────────────────────────────────────────────
  it('정상 인증 → 모델 목록 올바른 구조 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    // Ollama 오프라인 시뮬레이션
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.models).toBeDefined();
    expect(Array.isArray(body.models)).toBe(true);
    expect(body.ollamaOnline).toBe(false);
    expect(body.ollamaUrl).toBeDefined();

    // 각 모델에 필수 필드 확인
    for (const m of body.models) {
      expect(m).toHaveProperty('id');
      expect(m).toHaveProperty('name');
      expect(m).toHaveProperty('provider');
      expect(m).toHaveProperty('available');
      expect(m).toHaveProperty('contextLen');
      expect(m).toHaveProperty('speed');
      expect(m).toHaveProperty('cost');
    }
  });

  // ── 3. Ollama 온라인 감지 ─────────────────────────────────────────────────
  it('Ollama 연결 시 → ollamaOnline=true, 로컬 모델 포함', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        models: [
          { name: 'llama3:latest', size: 4700000000 },
          { name: 'mistral:latest', size: 3800000000 },
        ],
      }),
    } as unknown as Response);

    const res = await GET(makeReq());
    const body = await res.json();

    expect(body.ollamaOnline).toBe(true);
    // Ollama 모델이 목록에 포함
    const ollamaModels = body.models.filter((m: { provider: string }) => m.provider === 'ollama');
    expect(ollamaModels).toHaveLength(2);
    expect(ollamaModels[0].id).toBe('llama3:latest');
    expect(ollamaModels[0].cost).toBe('free');
    expect(ollamaModels[0].speed).toBe('local');
    // 크기 표시 확인 (GB 단위)
    expect(ollamaModels[0].size).toBe('4.7GB');
  });

  // ── 4. Ollama 오프라인 감지 ───────────────────────────────────────────────
  it('Ollama 미연결 → ollamaOnline=false, 로컬 모델 없음', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    const res = await GET(makeReq());
    const body = await res.json();

    expect(body.ollamaOnline).toBe(false);
    const ollamaModels = body.models.filter((m: { provider: string }) => m.provider === 'ollama');
    expect(ollamaModels).toHaveLength(0);
  });

  // ── 5. 클라우드 모델 — API 키에 따른 available 설정 ────────────────────────
  it('API 키 설정된 provider만 available=true', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.ANTHROPIC_API_KEY = 'ant-test';
    // GEMINI_API_KEY, XAI_API_KEY 미설정

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline'));

    const res = await GET(makeReq());
    const body = await res.json();

    const openaiModels = body.models.filter((m: { provider: string }) => m.provider === 'openai');
    const anthropicModels = body.models.filter((m: { provider: string }) => m.provider === 'anthropic');
    const geminiModels = body.models.filter((m: { provider: string }) => m.provider === 'gemini');
    const grokModels = body.models.filter((m: { provider: string }) => m.provider === 'grok');

    // OpenAI, Anthropic → available
    for (const m of openaiModels) expect(m.available).toBe(true);
    for (const m of anthropicModels) expect(m.available).toBe(true);
    // Gemini, Grok → unavailable
    for (const m of geminiModels) expect(m.available).toBe(false);
    for (const m of grokModels) expect(m.available).toBe(false);
  });

  // ── 6. Grok — XAI_API_KEY 설정 시 available=true ──────────────────────────
  it('XAI_API_KEY 설정 시 Grok 모델 available=true', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    process.env.XAI_API_KEY = 'xai-test-key';

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline'));

    const res = await GET(makeReq());
    const body = await res.json();

    const grokModels = body.models.filter((m: { provider: string }) => m.provider === 'grok');
    expect(grokModels.length).toBeGreaterThanOrEqual(1);
    for (const m of grokModels) expect(m.available).toBe(true);
    // Grok 모델 정보 확인
    const grok3 = grokModels.find((m: { id: string }) => m.id === 'grok-3');
    expect(grok3).toBeDefined();
    expect(grok3.name).toBe('Grok 3');
    expect(grok3.contextLen).toBe(131072);
  });

  // ── 7. Gemini — GOOGLE_GENERATIVE_AI_API_KEY 대체 ─────────────────────────
  it('GOOGLE_GENERATIVE_AI_API_KEY 설정 시 Gemini available=true', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'google-ai-key';

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline'));

    const res = await GET(makeReq());
    const body = await res.json();

    const geminiModels = body.models.filter((m: { provider: string }) => m.provider === 'gemini');
    expect(geminiModels.length).toBeGreaterThanOrEqual(1);
    for (const m of geminiModels) expect(m.available).toBe(true);
  });

  // ── 8. 모든 API 키 미설정 → 모든 클라우드 모델 unavailable ────────────────
  it('API 키 없으면 모든 클라우드 모델 available=false', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline'));

    const res = await GET(makeReq());
    const body = await res.json();

    const cloudModels = body.models.filter((m: { provider: string }) => m.provider !== 'ollama');
    for (const m of cloudModels) expect(m.available).toBe(false);
  });

  // ── 9. Ollama 커스텀 URL 반영 ─────────────────────────────────────────────
  it('OLLAMA_BASE_URL 환경변수가 ollamaUrl에 반영', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    process.env.OLLAMA_BASE_URL = 'http://remote-ollama:11434';
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline'));

    const res = await GET(makeReq());
    const body = await res.json();

    expect(body.ollamaUrl).toBe('http://remote-ollama:11434');
  });
});
