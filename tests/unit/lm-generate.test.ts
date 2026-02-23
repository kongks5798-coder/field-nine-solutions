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

import { POST } from '@/app/api/lm/generate/route';

// ── 헬퍼 ────────────────────────────────────────────────────────────────────
const NO_SESSION = { data: { session: null } };
const SESSION = {
  data: { session: { user: { id: 'test-uid', email: 'test@test.com' } } },
};

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/lm/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** SSE 스트림에서 data: 이벤트를 파싱하여 텍스트 배열로 반환 */
async function collectSSE(res: Response): Promise<string[]> {
  const reader = res.body?.getReader();
  if (!reader) return [];
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    for (const line of text.split('\n')) {
      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.text !== undefined) chunks.push(parsed.text);
        } catch {
          // JSON 파싱 실패 무시
        }
      }
    }
  }
  return chunks;
}

/** ReadableStream 바디를 시뮬레이션하는 모킹 응답 생성 */
function mockStreamResponse(lines: string[]) {
  const encoder = new TextEncoder();
  const combined = lines.join('\n') + '\n';
  let sent = false;
  return {
    ok: true,
    body: {
      getReader: () => ({
        read: async () => {
          if (!sent) {
            sent = true;
            return { done: false, value: encoder.encode(combined) };
          }
          return { done: true, value: undefined };
        },
      }),
    },
  } as unknown as Response;
}

let originalFetch: typeof globalThis.fetch;

// ── 테스트 ──────────────────────────────────────────────────────────────────
describe('POST /api/lm/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    originalFetch = globalThis.fetch;
    // 기본 환경변수 정리
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

  // ── 1. 인증 검증 ──────────────────────────────────────────────────────────
  it('미인증 → 401 반환', async () => {
    mockGetSession.mockResolvedValue(NO_SESSION);
    const res = await POST(makeReq({ model: 'gpt-4o', prompt: '안녕', provider: 'openai' }));
    expect(res.status).toBe(401);
  });

  // ── 2. 스키마 검증 — 잘못된 provider ──────────────────────────────────────
  it('잘못된 provider → 400 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq({ model: 'test', prompt: '안녕', provider: 'invalid' }));
    expect(res.status).toBe(400);
  });

  // ── 3. 스키마 검증 — model 없음 ───────────────────────────────────────────
  it('model 없음 → 400 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq({ prompt: '안녕', provider: 'openai' }));
    expect(res.status).toBe(400);
  });

  // ── 4. prompt + messages 모두 없음 → 400 ──────────────────────────────────
  it('prompt와 messages 모두 없음 → 400 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(makeReq({ model: 'gpt-4o', provider: 'openai' }));
    expect(res.status).toBe(400);
  });

  // ── 5. 잘못된 JSON body → 400 ─────────────────────────────────────────────
  it('잘못된 JSON body → 400 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const req = new NextRequest('http://localhost/api/lm/generate', {
      method: 'POST',
      body: 'not-json!!!',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  // ── 6. OpenAI 스트리밍 정상 ────────────────────────────────────────────────
  it('OpenAI provider → SSE 스트림 정상 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    process.env.OPENAI_API_KEY = 'sk-test-key';

    const sseLines = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}',
      'data: {"choices":[{"delta":{"content":" World"}}]}',
      'data: [DONE]',
    ];
    globalThis.fetch = vi.fn().mockResolvedValue(mockStreamResponse(sseLines));

    const res = await POST(makeReq({ model: 'gpt-4o', prompt: '안녕', provider: 'openai' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');

    const chunks = await collectSSE(res);
    expect(chunks).toContain('Hello');
    expect(chunks).toContain(' World');
  });

  // ── 7. OpenAI API 키 미설정 → 오류 메시지 SSE ─────────────────────────────
  it('OpenAI API 키 미설정 → SSE로 오류 메시지 전송', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    // OPENAI_API_KEY 미설정

    const res = await POST(makeReq({ model: 'gpt-4o', prompt: '안녕', provider: 'openai' }));
    expect(res.status).toBe(200); // SSE 스트림은 항상 200
    const chunks = await collectSSE(res);
    const joined = chunks.join('');
    expect(joined).toContain('OPENAI_API_KEY');
  });

  // ── 8. Anthropic 스트리밍 정상 ─────────────────────────────────────────────
  it('Anthropic provider → SSE 스트림 정상 반환', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    process.env.ANTHROPIC_API_KEY = 'ant-test-key';

    const sseLines = [
      'data: {"type":"content_block_delta","delta":{"text":"Claude"}}',
      'data: {"type":"content_block_delta","delta":{"text":" 응답"}}',
    ];
    globalThis.fetch = vi.fn().mockResolvedValue(mockStreamResponse(sseLines));

    const res = await POST(makeReq({ model: 'claude-sonnet-4-6', prompt: '안녕', provider: 'anthropic' }));
    expect(res.status).toBe(200);

    const chunks = await collectSSE(res);
    expect(chunks).toContain('Claude');
    expect(chunks).toContain(' 응답');

    // Anthropic은 system을 별도 파라미터로 전달, baseMessages만 messages로 보냄
    const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const fetchBody = JSON.parse(fetchCall[1].body);
    expect(fetchBody.stream).toBe(true);
    expect(fetchBody.messages).toBeDefined();
  });

  // ── 9. Anthropic API 키 미설정 → 오류 메시지 SSE ──────────────────────────
  it('Anthropic API 키 미설정 → SSE로 오류 메시지 전송', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    const res = await POST(makeReq({ model: 'claude-sonnet-4-6', prompt: '안녕', provider: 'anthropic' }));
    const chunks = await collectSSE(res);
    const joined = chunks.join('');
    expect(joined).toContain('ANTHROPIC_API_KEY');
  });

  // ── 10. Gemini 전체 대화 이력 전송 검증 ────────────────────────────────────
  it('Gemini provider → 전체 대화 이력(messages)을 contents로 전송', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    process.env.GEMINI_API_KEY = 'gemini-test-key';

    const sseLines = [
      'data: {"candidates":[{"content":{"parts":[{"text":"Gemini"}]}}]}',
      'data: {"candidates":[{"content":{"parts":[{"text":" 응답"}]}}]}',
    ];
    globalThis.fetch = vi.fn().mockResolvedValue(mockStreamResponse(sseLines));

    const multiMessages = [
      { role: 'user', content: '첫 번째 메시지' },
      { role: 'assistant', content: 'AI 응답' },
      { role: 'user', content: '두 번째 메시지' },
    ];

    const res = await POST(makeReq({
      model: 'gemini-2.0-flash',
      provider: 'gemini',
      messages: multiMessages,
    }));
    expect(res.status).toBe(200);

    // Gemini API 호출 시 전체 대화 이력이 contents에 포함되는지 검증
    const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const fetchBody = JSON.parse(fetchCall[1].body);
    expect(fetchBody.contents).toHaveLength(3);
    // assistant → model로 변환 확인
    expect(fetchBody.contents[0].role).toBe('user');
    expect(fetchBody.contents[1].role).toBe('model');
    expect(fetchBody.contents[2].role).toBe('user');
    // 각 메시지의 텍스트 확인
    expect(fetchBody.contents[0].parts[0].text).toBe('첫 번째 메시지');
    expect(fetchBody.contents[1].parts[0].text).toBe('AI 응답');
    expect(fetchBody.contents[2].parts[0].text).toBe('두 번째 메시지');
  });

  // ── 11. Gemini API 키 미설정 → 오류 메시지 SSE ─────────────────────────────
  it('Gemini API 키 미설정 → SSE로 오류 메시지 전송', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    const res = await POST(makeReq({ model: 'gemini-2.0-flash', prompt: '안녕', provider: 'gemini' }));
    const chunks = await collectSSE(res);
    const joined = chunks.join('');
    expect(joined).toContain('GEMINI_API_KEY');
  });

  // ── 12. Grok 스트리밍 정상 ─────────────────────────────────────────────────
  it('Grok provider → SSE 스트림 정상 반환 (x.ai API)', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    process.env.XAI_API_KEY = 'xai-test-key';

    const sseLines = [
      'data: {"choices":[{"delta":{"content":"Grok"}}]}',
      'data: {"choices":[{"delta":{"content":" 응답입니다"}}]}',
      'data: [DONE]',
    ];
    globalThis.fetch = vi.fn().mockResolvedValue(mockStreamResponse(sseLines));

    const res = await POST(makeReq({ model: 'grok-3', prompt: '안녕', provider: 'grok' }));
    expect(res.status).toBe(200);

    const chunks = await collectSSE(res);
    expect(chunks).toContain('Grok');
    expect(chunks).toContain(' 응답입니다');

    // x.ai API URL 확인
    const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(fetchCall[0]).toBe('https://api.x.ai/v1/chat/completions');
    // Authorization 헤더 확인
    expect(fetchCall[1].headers.Authorization).toBe('Bearer xai-test-key');
  });

  // ── 13. Grok API 키 미설정 → 오류 메시지 SSE ──────────────────────────────
  it('Grok API 키 미설정 → SSE로 오류 메시지 전송', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    const res = await POST(makeReq({ model: 'grok-3', prompt: '안녕', provider: 'grok' }));
    const chunks = await collectSSE(res);
    const joined = chunks.join('');
    expect(joined).toContain('XAI_API_KEY');
  });

  // ── 14. Ollama 로컬 provider 정상 ──────────────────────────────────────────
  it('Ollama provider → 로컬 서버로 스트리밍', async () => {
    mockGetSession.mockResolvedValue(SESSION);

    // Ollama 응답은 각 줄이 JSON 객체
    const ollamaLines = [
      '{"message":{"content":"안녕"}}',
      '{"message":{"content":"하세요"}}',
    ];
    globalThis.fetch = vi.fn().mockResolvedValue(mockStreamResponse(ollamaLines));

    const res = await POST(makeReq({ model: 'llama3', prompt: '안녕', provider: 'ollama' }));
    expect(res.status).toBe(200);

    const chunks = await collectSSE(res);
    expect(chunks).toContain('안녕');
    expect(chunks).toContain('하세요');

    // localhost:11434 기본 URL 확인
    const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(fetchCall[0]).toBe('http://localhost:11434/api/chat');
  });

  // ── 15. Ollama 커스텀 BASE_URL 사용 ────────────────────────────────────────
  it('Ollama → OLLAMA_BASE_URL 환경변수 사용', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    process.env.OLLAMA_BASE_URL = 'http://custom-ollama:11434';

    globalThis.fetch = vi.fn().mockResolvedValue(
      mockStreamResponse(['{"message":{"content":"ok"}}']),
    );

    await POST(makeReq({ model: 'llama3', prompt: '테스트', provider: 'ollama' }));

    const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(fetchCall[0]).toBe('http://custom-ollama:11434/api/chat');
  });

  // ── 16. system 프롬프트 전달 검증 ──────────────────────────────────────────
  it('system 프롬프트 → OpenAI messages 배열에 포함', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    process.env.OPENAI_API_KEY = 'sk-test';

    const sseLines = ['data: {"choices":[{"delta":{"content":"OK"}}]}', 'data: [DONE]'];
    globalThis.fetch = vi.fn().mockResolvedValue(mockStreamResponse(sseLines));

    await POST(makeReq({
      model: 'gpt-4o',
      prompt: '안녕',
      provider: 'openai',
      system: '너는 도우미야',
    }));

    const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const fetchBody = JSON.parse(fetchCall[1].body);
    // system 메시지가 맨 앞에 위치
    expect(fetchBody.messages[0].role).toBe('system');
    expect(fetchBody.messages[0].content).toBe('너는 도우미야');
    expect(fetchBody.messages[1].role).toBe('user');
  });

  // ── 17. 응답 헤더 확인 ─────────────────────────────────────────────────────
  it('SSE 응답 헤더 확인 (Content-Type, Cache-Control, Connection)', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    process.env.OPENAI_API_KEY = 'sk-test';

    globalThis.fetch = vi.fn().mockResolvedValue(
      mockStreamResponse(['data: {"choices":[{"delta":{"content":"hi"}}]}', 'data: [DONE]']),
    );

    const res = await POST(makeReq({ model: 'gpt-4o', prompt: '안녕', provider: 'openai' }));
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
    expect(res.headers.get('Cache-Control')).toBe('no-cache');
    expect(res.headers.get('Connection')).toBe('keep-alive');
  });

  // ── 18. [DONE] 이벤트가 스트림 끝에 전송됨 ────────────────────────────────
  it('스트림 끝에 [DONE] 이벤트 전송', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    process.env.OPENAI_API_KEY = 'sk-test';

    globalThis.fetch = vi.fn().mockResolvedValue(
      mockStreamResponse(['data: {"choices":[{"delta":{"content":"hi"}}]}', 'data: [DONE]']),
    );

    const res = await POST(makeReq({ model: 'gpt-4o', prompt: 'test', provider: 'openai' }));
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value);
    }
    expect(fullText).toContain('data: [DONE]');
  });

  // ── 19. Gemini system instruction 전달 검증 ────────────────────────────────
  it('Gemini → system 프롬프트가 systemInstruction으로 전달', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    process.env.GEMINI_API_KEY = 'gemini-key';

    globalThis.fetch = vi.fn().mockResolvedValue(
      mockStreamResponse(['data: {"candidates":[{"content":{"parts":[{"text":"ok"}]}}]}']),
    );

    await POST(makeReq({
      model: 'gemini-2.0-flash',
      prompt: '테스트',
      provider: 'gemini',
      system: '시스템 지시문',
    }));

    const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const fetchBody = JSON.parse(fetchCall[1].body);
    expect(fetchBody.systemInstruction).toBeDefined();
    expect(fetchBody.systemInstruction.parts[0].text).toBe('시스템 지시문');
  });

  // ── 20. API 호출 중 네트워크 오류 → 오류 SSE 전송 ──────────────────────────
  it('fetch 예외 발생 → SSE로 오류 메시지 전송', async () => {
    mockGetSession.mockResolvedValue(SESSION);
    process.env.OPENAI_API_KEY = 'sk-test';

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

    const res = await POST(makeReq({ model: 'gpt-4o', prompt: '안녕', provider: 'openai' }));
    const chunks = await collectSSE(res);
    const joined = chunks.join('');
    expect(joined).toContain('오류');
  });
});
