import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/ai/chat/route';

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/ai/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  it('prompt 없음 → 400 반환', async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('prompt');
  });

  it('prompt 비어있음 → 400 반환', async () => {
    const res = await POST(makeReq({ prompt: '' }));
    expect(res.status).toBe(400);
  });

  it('prompt 10001자 초과 → 400 반환', async () => {
    const res = await POST(makeReq({ prompt: 'x'.repeat(10_001) }));
    expect(res.status).toBe(400);
  });

  it('mode=openai, OPENAI_API_KEY 없을 때 → 500 반환', async () => {
    const res = await POST(makeReq({ prompt: '안녕', mode: 'openai' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('OPENAI_API_KEY');
  });

  it('mode=gemini, GEMINI_API_KEY 없을 때 → 500 반환', async () => {
    const res = await POST(makeReq({ prompt: '안녕', mode: 'gemini' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('GOOGLE_GENERATIVE_AI_API_KEY');
  });

  it('mode=anthropic, ANTHROPIC_API_KEY 없을 때 → 500 반환', async () => {
    const res = await POST(makeReq({ prompt: '안녕', mode: 'anthropic' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('ANTHROPIC_API_KEY');
  });

  it('mode=openai, API 호출 성공 → text 반환', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        choices: [{ message: { content: 'AI 응답입니다.' } }],
      }),
    } as unknown as Response);
    const res = await POST(makeReq({ prompt: '안녕', mode: 'openai' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.text).toBe('AI 응답입니다.');
  });

  it('mode=gemini, API 호출 성공 → text 반환', async () => {
    process.env.GEMINI_API_KEY = 'gemini-key';
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: 'Gemini 응답' }] } }],
      }),
    } as unknown as Response);
    const res = await POST(makeReq({ prompt: '안녕', mode: 'gemini' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.text).toBe('Gemini 응답');
  });

  it('mode=anthropic, API 호출 성공 → text 반환', async () => {
    process.env.ANTHROPIC_API_KEY = 'ant-key';
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        content: [{ text: 'Claude 응답' }],
      }),
    } as unknown as Response);
    const res = await POST(makeReq({ prompt: '안녕', mode: 'anthropic' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.text).toBe('Claude 응답');
  });

  it('기본 mode는 openai', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ choices: [{ message: { content: '응답' } }] }),
    } as unknown as Response);
    const res = await POST(makeReq({ prompt: '테스트' }));
    expect(res.status).toBe(200);
  });

  it('잘못된 JSON body → 400 반환', async () => {
    const req = new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      body: 'invalid-json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
