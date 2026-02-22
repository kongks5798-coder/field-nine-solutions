import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── vi.hoisted ──
const mockGetSession = vi.hoisted(() => vi.fn());

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
  })),
}));

vi.mock('@/lib/logger', () => ({
  log: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { POST } from '@/app/api/canvas/generate/route';

// ── 헬퍼 ──
const NO_SESSION = { data: { session: null } };
function sessionOf(uid: string) {
  return { data: { session: { user: { id: uid } } } };
}

function makeReq(body: unknown = {}) {
  return new NextRequest('http://localhost/api/canvas/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const OPENAI_SUCCESS = {
  data: [
    { url: 'https://example.com/image1.png', revised_prompt: 'A beautiful sunset' },
  ],
};

// ── 테스트 ──
describe('POST /api/canvas/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = 'sk-test-key';
  });

  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await POST(makeReq({ prompt: 'a cat' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('OPENAI_API_KEY 미설정 → 503 반환', async () => {
    delete process.env.OPENAI_API_KEY;
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const res = await POST(makeReq({ prompt: 'a cat' }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain('API 키');
  });

  it('prompt 없음 → 400 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it('prompt 빈 문자열 → 400 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const res = await POST(makeReq({ prompt: '' }));
    expect(res.status).toBe(400);
  });

  it('정상 요청 → 이미지 URL 배열 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(OPENAI_SUCCESS),
    } as unknown as Response);
    const res = await POST(makeReq({ prompt: 'a beautiful sunset' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.images).toHaveLength(1);
    expect(body.images[0].url).toBe('https://example.com/image1.png');
    expect(body.images[0].revisedPrompt).toBe('A beautiful sunset');
  });

  it('OpenAI API 오류 → 502 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: { message: 'Rate limit exceeded' } }),
    } as unknown as Response);
    const res = await POST(makeReq({ prompt: 'test' }));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toContain('실패');
  });

  it('잘못된 model 값 → 400 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    const res = await POST(makeReq({ prompt: 'test', model: 'gpt-4' }));
    expect(res.status).toBe(400);
  });

  it('dall-e-2 모델로 정상 생성', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(OPENAI_SUCCESS),
    } as unknown as Response);
    const res = await POST(makeReq({ prompt: 'test', model: 'dall-e-2', size: '512x512' }));
    expect(res.status).toBe(200);
    // fetch 호출 시 body에 quality/style이 포함되지 않아야 함 (dall-e-2)
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const fetchBody = JSON.parse(fetchCall[1].body);
    expect(fetchBody.quality).toBeUndefined();
    expect(fetchBody.style).toBeUndefined();
  });

  it('fetch 예외 → 500 반환', async () => {
    mockGetSession.mockResolvedValue(sessionOf('u1'));
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const res = await POST(makeReq({ prompt: 'test' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('오류');
  });
});
