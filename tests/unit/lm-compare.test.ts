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

import { POST } from '@/app/api/lm/compare/route';

// ── 헬퍼 ────────────────────────────────────────────────────────────────────
const NO_SESSION = { data: { session: null } };
const SESSION = {
  data: { session: { user: { id: 'test-uid', email: 'test@test.com' } } },
};

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/lm/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** fetch JSON 응답 헬퍼 */
function mockJsonResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
  } as unknown as Response;
}

let originalFetch: typeof globalThis.fetch;

// ── 테스트 ──────────────────────────────────────────────────────────────────
describe('POST /api/lm/compare', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    originalFetch = globalThis.fetch;
    // 기본 환경변수 설정
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.ANTHROPIC_API_KEY = 'ant-test';
    process.env.GEMINI_API_KEY = 'gemini-test';
    process.env.XAI_API_KEY = 'xai-test';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // ── 1. 인증 검증 ──────────────────────────────────────────────────────────
  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await POST(makeReq({
      prompt: '안녕',
      models: [
        { id: 'gpt-4o', provider: 'openai' },
        { id: 'claude-sonnet-4-6', provider: 'anthropic' },
      ],
    }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ── 2. models 배열 누락 → 400 ────────────────────────────────────────────
  it('models 배열 누락 → 400 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq({ prompt: '안녕' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Bad Request');
  });

  // ── 3. models 배열이 비어있음 → 400 ──────────────────────────────────────
  it('models 배열 빈 배열 → 400 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq({ prompt: '안녕', models: [] }));
    expect(res.status).toBe(400);
  });

  // ── 4. 모델 1개만 (최소 2개 필요) → 400 ──────────────────────────────────
  it('모델 1개 (최소 2개 미만) → 400 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq({
      prompt: '안녕',
      models: [{ id: 'gpt-4o', provider: 'openai' }],
    }));
    expect(res.status).toBe(400);
  });

  // ── 5. 모델 5개 (최대 4개 초과) → 400 ────────────────────────────────────
  it('모델 5개 (최대 4개 초과) → 400 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq({
      prompt: '안녕',
      models: [
        { id: 'gpt-4o', provider: 'openai' },
        { id: 'claude-sonnet-4-6', provider: 'anthropic' },
        { id: 'gemini-2.0-flash', provider: 'gemini' },
        { id: 'grok-3', provider: 'grok' },
        { id: 'gpt-4o-mini', provider: 'openai' },
      ],
    }));
    expect(res.status).toBe(400);
  });

  // ── 6. 2개 모델 정상 비교 → 200 + results 배열 ────────────────────────────
  it('2개 모델 정상 비교 → 200 + responses 배열', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(mockJsonResponse({
        choices: [{ message: { content: 'OpenAI 응답' } }],
      }))
      .mockResolvedValueOnce(mockJsonResponse({
        content: [{ text: 'Anthropic 응답' }],
      }));

    const res = await POST(makeReq({
      prompt: '안녕하세요',
      models: [
        { id: 'gpt-4o', provider: 'openai' },
        { id: 'claude-sonnet-4-6', provider: 'anthropic' },
      ],
    }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.prompt).toBe('안녕하세요');
    expect(body.responses).toHaveLength(2);
    expect(body.timestamp).toBeDefined();

    // 각 응답에 model, provider, text, latencyMs 필드 확인
    const openaiResult = body.responses.find((r: Record<string, unknown>) => r.provider === 'openai');
    const anthropicResult = body.responses.find((r: Record<string, unknown>) => r.provider === 'anthropic');
    expect(openaiResult.text).toBe('OpenAI 응답');
    expect(openaiResult.latencyMs).toBeGreaterThanOrEqual(0);
    expect(anthropicResult.text).toBe('Anthropic 응답');
  });

  // ── 7. 한 모델 실패, 다른 모델 성공 → 200 + partial results ──────────────
  it('한 모델 실패 시 → 200 + error 필드 포함된 부분 결과', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    // OpenAI 성공, Anthropic 실패 (API 키 미설정)
    delete process.env.ANTHROPIC_API_KEY;

    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(mockJsonResponse({
        choices: [{ message: { content: '정상 응답' } }],
      }));

    const res = await POST(makeReq({
      prompt: '테스트',
      models: [
        { id: 'gpt-4o', provider: 'openai' },
        { id: 'claude-sonnet-4-6', provider: 'anthropic' },
      ],
    }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.responses).toHaveLength(2);

    // 성공한 OpenAI 결과
    const openaiResult = body.responses.find((r: Record<string, unknown>) => r.provider === 'openai');
    expect(openaiResult.text).toBe('정상 응답');
    expect(openaiResult.error).toBeUndefined();

    // 실패한 Anthropic 결과 (error 필드 존재)
    const anthropicResult = body.responses.find((r: Record<string, unknown>) => r.provider === 'anthropic');
    expect(anthropicResult.error).toBeDefined();
    expect(anthropicResult.text).toBe('');
  });

  // ── 8. 잘못된 provider → 400 ─────────────────────────────────────────────
  it('잘못된 provider → 400 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq({
      prompt: '안녕',
      models: [
        { id: 'gpt-4o', provider: 'openai' },
        { id: 'some-model', provider: 'invalid_provider' },
      ],
    }));
    expect(res.status).toBe(400);
  });
});
