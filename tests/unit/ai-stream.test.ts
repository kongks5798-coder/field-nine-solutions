// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── 환경변수 (vi.mock 팩토리보다 먼저 실행) ──
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  process.env.OPENAI_API_KEY = 'sk-test-openai-key';
  process.env.ANTHROPIC_API_KEY = 'sk-test-anthropic-key';
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-gemini-key';
  process.env.XAI_API_KEY = 'test-xai-key';
});

// ── Supabase mock ──
const mockGetSession = vi.hoisted(() => vi.fn());
const mockAdminFrom = vi.hoisted(() => vi.fn());

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((_url: string, key: string) => {
    // service_role 키 → admin 클라이언트
    if (key === 'test-service-role-key') {
      return { from: mockAdminFrom };
    }
    // anon 키 → 일반 클라이언트
    return {
      auth: { getSession: mockGetSession },
      from: mockAdminFrom,
    };
  }),
}));

vi.mock('@/lib/env', () => ({ validateEnv: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  log: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// ── 전역 fetch mock ──
const mockFetch = vi.hoisted(() => vi.fn());
vi.stubGlobal('fetch', mockFetch);

import { POST } from '@/app/api/ai/stream/route';

// ── 헬퍼 ──
const SESSION = {
  data: { session: { user: { id: 'uid-1' } } },
  error: null,
};
const NO_SESSION = { data: { session: null }, error: null };

function makeReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/ai/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// 스트림 응답에서 SSE 텍스트를 모두 읽어 반환
async function readStream(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const dec = new TextDecoder();
  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += dec.decode(value);
  }
  return result;
}

// 프로필 조회 체인 mock 생성
function mockProfileSelect(plan: string | null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { plan }, error: null }),
      }),
    }),
  };
}

// usage_records 일일/월간 카운트 체인 mock 생성
function mockUsageCount(count: number) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({ count, error: null }),
        }),
      }),
    }),
  };
}

// usage_records insert mock
function mockInsert() {
  return { insert: vi.fn().mockResolvedValue({ error: null }) };
}

// monthly_usage select (Pro 플랜용)
function mockMonthlyUsage(amountKrw: number, aiCalls: number) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { amount_krw: amountKrw, ai_calls: aiCalls },
            error: null,
          }),
        }),
      }),
    }),
  };
}

// spending_caps select
function mockSpendingCap(hardLimit: number, warnThreshold: number) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { hard_limit: hardLimit, warn_threshold: warnThreshold },
          error: null,
        }),
      }),
    }),
  };
}

// monthly_usage upsert
function mockUpsert() {
  return { upsert: vi.fn().mockResolvedValue({ error: null }) };
}

// SSE 스트림 응답 생성 (OpenAI/Grok 형식)
function makeOpenAIStreamBody(tokens: string[]) {
  const lines = tokens.map(t =>
    `data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`
  ).join('') + 'data: [DONE]\n\n';
  return new ReadableStream({
    start(c) {
      c.enqueue(new TextEncoder().encode(lines));
      c.close();
    },
  });
}

// Gemini SSE 스트림 응답 생성
function makeGeminiStreamBody(tokens: string[]) {
  const lines = tokens.map(t =>
    `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: t }] } }] })}\n\n`
  ).join('') + 'data: [DONE]\n\n';
  return new ReadableStream({
    start(c) {
      c.enqueue(new TextEncoder().encode(lines));
      c.close();
    },
  });
}

describe('POST /api/ai/stream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(NO_SESSION);
    mockFetch.mockReset();
  });

  // ── 인증 ──
  it('비인증 사용자 → 401 반환', async () => {
    const res = await POST(makeReq({ mode: 'openai', prompt: '안녕' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ── 요청 검증 ──
  it('프롬프트와 메시지 모두 없음 → 400 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    // 프로필 조회 + usage 체인 설정 (Pro 플랜, 한도 이내)
    let callIdx = 0;
    mockAdminFrom.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return mockProfileSelect('pro');
      if (callIdx === 2) return mockMonthlyUsage(0, 0);
      if (callIdx === 3) return mockSpendingCap(50000, 40000);
      if (callIdx === 4) return mockInsert();
      if (callIdx === 5) return mockUpsert();
      return mockInsert();
    });

    const res = await POST(makeReq({ mode: 'openai', prompt: '', messages: [] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('프롬프트');
  });

  it('잘못된 요청 형식 → 400 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    let callIdx = 0;
    mockAdminFrom.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return mockProfileSelect('pro');
      if (callIdx === 2) return mockMonthlyUsage(0, 0);
      if (callIdx === 3) return mockSpendingCap(50000, 40000);
      if (callIdx === 4) return mockInsert();
      if (callIdx === 5) return mockUpsert();
      return mockInsert();
    });

    // mode가 유효하지 않은 값
    const res = await POST(makeReq({ mode: 'invalid-mode', prompt: '안녕' }));
    expect(res.status).toBe(400);
  });

  // ── 스타터 플랜 일일 제한 ──
  it('스타터 플랜 일일 한도 초과 → 429 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    let callIdx = 0;
    mockAdminFrom.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return mockProfileSelect('starter');
      // 일일 카운트 = 10 (한도 도달)
      if (callIdx === 2) return mockUsageCount(10);
      return mockInsert();
    });

    const res = await POST(makeReq({ mode: 'openai', prompt: '테스트' }));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain('하루');
    expect(body.error).toContain('10');
  });

  // ── 스타터 플랜 월간 제한 ──
  it('스타터 플랜 월간 한도 초과 → 429 반환 (canTopUp: false)', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    let callIdx = 0;
    mockAdminFrom.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return mockProfileSelect('starter');
      // 일일 카운트 = 5 (한도 이내)
      if (callIdx === 2) return mockUsageCount(5);
      // 월간 카운트 = 30 (한도 도달)
      if (callIdx === 3) return mockUsageCount(30);
      return mockInsert();
    });

    const res = await POST(makeReq({ mode: 'openai', prompt: '테스트' }));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain('월 30회');
    expect(body.canTopUp).toBe(false);
  });

  // ── Pro 플랜 지출 한도 초과 ──
  it('Pro 플랜 spending_cap 초과 → 402 반환 (canTopUp: true)', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    let callIdx = 0;
    mockAdminFrom.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return mockProfileSelect('pro');
      // 현재 누적 50,000원 (한도 50,000원 이상)
      if (callIdx === 2) return mockMonthlyUsage(50000, 100);
      if (callIdx === 3) return mockSpendingCap(50000, 40000);
      return mockInsert();
    });

    const res = await POST(makeReq({ mode: 'openai', prompt: '테스트' }));
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.error).toContain('한도');
    expect(body.canTopUp).toBe(true);
    expect(body.currentSpent).toBe(50000);
    expect(body.hardLimit).toBe(50000);
  });

  // ── OpenAI 스트리밍 성공 ──
  it('OpenAI 모드 → SSE 스트림 응답', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    let callIdx = 0;
    mockAdminFrom.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return mockProfileSelect('pro');
      if (callIdx === 2) return mockMonthlyUsage(1000, 5);
      if (callIdx === 3) return mockSpendingCap(50000, 40000);
      if (callIdx === 4) return mockInsert();
      if (callIdx === 5) return mockUpsert();
      return mockInsert();
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: makeOpenAIStreamBody(['안녕', '하세요']),
    });

    const res = await POST(makeReq({ mode: 'openai', prompt: '인사해줘' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');

    const text = await readStream(res);
    expect(text).toContain('안녕');
    expect(text).toContain('하세요');
    expect(text).toContain('[DONE]');

    // fetch가 OpenAI URL로 호출되었는지 검증
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  // ── Grok 스트리밍 성공 ──
  it('Grok 모드 → x.ai API로 스트림 요청', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    let callIdx = 0;
    mockAdminFrom.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return mockProfileSelect('pro');
      if (callIdx === 2) return mockMonthlyUsage(1000, 5);
      if (callIdx === 3) return mockSpendingCap(50000, 40000);
      if (callIdx === 4) return mockInsert();
      if (callIdx === 5) return mockUpsert();
      return mockInsert();
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: makeOpenAIStreamBody(['Grok', '응답']),
    });

    const res = await POST(makeReq({ mode: 'grok', prompt: '테스트' }));
    expect(res.status).toBe(200);

    const text = await readStream(res);
    expect(text).toContain('Grok');

    // x.ai URL로 호출되었는지 검증
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.x.ai/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );

    // 요청 body에 grok-3 모델명 포함 확인
    const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(fetchBody.model).toBe('grok-3');
  });

  // ── Gemini 전체 대화 이력 전송 확인 ──
  it('Gemini 모드 → contents[]에 전체 대화 이력 포함', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    let callIdx = 0;
    mockAdminFrom.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return mockProfileSelect('pro');
      if (callIdx === 2) return mockMonthlyUsage(1000, 5);
      if (callIdx === 3) return mockSpendingCap(50000, 40000);
      if (callIdx === 4) return mockInsert();
      if (callIdx === 5) return mockUpsert();
      return mockInsert();
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: makeGeminiStreamBody(['Gemini', '응답']),
    });

    const messages = [
      { role: 'user', content: '첫 번째 질문' },
      { role: 'assistant', content: '첫 번째 답변' },
      { role: 'user', content: '두 번째 질문' },
    ];

    const res = await POST(makeReq({ mode: 'gemini', messages }));
    expect(res.status).toBe(200);

    // Gemini API URL 확인
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('generativelanguage.googleapis.com'),
      expect.any(Object),
    );

    // 요청 body의 contents 배열에 모든 메시지가 포함되었는지 확인
    const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(fetchBody.contents).toHaveLength(3);
    // assistant → model로 변환 확인
    expect(fetchBody.contents[1].role).toBe('model');
    expect(fetchBody.contents[0].role).toBe('user');
    expect(fetchBody.contents[2].role).toBe('user');
    // 텍스트 내용 확인
    expect(fetchBody.contents[0].parts[0].text).toBe('첫 번째 질문');
    expect(fetchBody.contents[1].parts[0].text).toBe('첫 번째 답변');
    expect(fetchBody.contents[2].parts[0].text).toBe('두 번째 질문');
  });

  // ── 빌링 경고 헤더 ──
  it('Pro 플랜에서 경고 임계값 초과 → x-billing-warn 헤더 포함', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    let callIdx = 0;
    mockAdminFrom.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return mockProfileSelect('pro');
      // 현재 누적 39,950원 + 50원(openai) = 40,000원 → warnThreshold(40,000) 이상
      if (callIdx === 2) return mockMonthlyUsage(39950, 50);
      if (callIdx === 3) return mockSpendingCap(50000, 40000);
      if (callIdx === 4) return mockInsert();
      if (callIdx === 5) return mockUpsert();
      return mockInsert();
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: makeOpenAIStreamBody(['OK']),
    });

    const res = await POST(makeReq({ mode: 'openai', prompt: '테스트' }));
    expect(res.status).toBe(200);

    // x-billing-warn 헤더 존재 확인 (URI-encoded Korean)
    const warnHeader = res.headers.get('x-billing-warn');
    expect(warnHeader).toBeTruthy();
    const decoded = decodeURIComponent(warnHeader!);
    expect(decoded).toContain('천원');
  });

  // ── 이미지(Vision) 주입 ──
  it('이미지 전송 시 마지막 사용자 메시지에 image_url 주입', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    let callIdx = 0;
    mockAdminFrom.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return mockProfileSelect('pro');
      if (callIdx === 2) return mockMonthlyUsage(1000, 5);
      if (callIdx === 3) return mockSpendingCap(50000, 40000);
      if (callIdx === 4) return mockInsert();
      if (callIdx === 5) return mockUpsert();
      return mockInsert();
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: makeOpenAIStreamBody(['이미지 분석 결과']),
    });

    const fakeImage = 'iVBORw0KGgoAAAANSUhEUg==';
    const res = await POST(makeReq({
      mode: 'openai',
      prompt: '이 이미지를 설명해줘',
      image: fakeImage,
      imageMime: 'image/png',
    }));
    expect(res.status).toBe(200);

    // fetch 호출 시 messages에 image_url이 포함되었는지 확인
    const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const lastMsg = fetchBody.messages[fetchBody.messages.length - 1];
    expect(Array.isArray(lastMsg.content)).toBe(true);
    expect(lastMsg.content).toHaveLength(2);
    expect(lastMsg.content[0].type).toBe('text');
    expect(lastMsg.content[1].type).toBe('image_url');
    expect(lastMsg.content[1].image_url.url).toContain('data:image/png;base64,');
    expect(lastMsg.content[1].image_url.detail).toBe('high');
  });

  // ── 스타터 플랜 정상 호출 (한도 이내) ──
  it('스타터 플랜 한도 이내 → 정상 스트리밍 + 사용량 기록', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    const mockInsertFn = vi.fn().mockResolvedValue({ error: null });
    let callIdx = 0;
    mockAdminFrom.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return mockProfileSelect('starter');
      // 일일 카운트 = 3 (한도 이내)
      if (callIdx === 2) return mockUsageCount(3);
      // 월간 카운트 = 10 (한도 이내)
      if (callIdx === 3) return mockUsageCount(10);
      // insert (사용량 기록)
      if (callIdx === 4) return { insert: mockInsertFn };
      return mockInsert();
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: makeOpenAIStreamBody(['응답']),
    });

    const res = await POST(makeReq({ mode: 'openai', prompt: '테스트' }));
    expect(res.status).toBe(200);

    // 사용량 기록 insert 호출 확인
    expect(mockInsertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'uid-1',
        type: 'ai_call',
        amount: 0, // 스타터는 무료
      }),
    );
  });

  // ── 사용량 체크 DB 오류 → 503 ──
  it('사용량 체크 중 DB 오류 → 503 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    mockAdminFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue(new Error('DB connection failed')),
        }),
      }),
    }));

    const res = await POST(makeReq({ mode: 'openai', prompt: '테스트' }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain('일시 오류');
  });

  // ── Supabase 미설정 시 인증 우회 ──
  it('Supabase 미설정(placeholder URL) → 인증 우회하고 스트리밍 진행', async () => {
    const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: makeOpenAIStreamBody(['무인증', '응답']),
    });

    const res = await POST(makeReq({ mode: 'openai', prompt: '테스트' }));
    expect(res.status).toBe(200);

    const text = await readStream(res);
    expect(text).toContain('무인증');

    // Supabase auth.getSession이 호출되지 않았어야 함
    expect(mockGetSession).not.toHaveBeenCalled();

    process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
  });
});
