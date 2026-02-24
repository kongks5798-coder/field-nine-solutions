// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// -- Hoisted mocks --
const fsMocks = vi.hoisted(() => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  appendFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('fs', () => ({
  promises: {
    mkdir: fsMocks.mkdir,
    appendFile: fsMocks.appendFile,
  },
}));

import { POST } from '@/app/api/log-chat/route';

// -- Helpers --
function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/log-chat', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// -- Tests --
describe('POST /api/log-chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when user is missing', async () => {
    const res = await POST(makeReq({ text: 'hello' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Missing user or text');
  });

  it('returns 400 when text is missing', async () => {
    const res = await POST(makeReq({ user: 'alice' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Missing user or text');
  });

  it('returns 400 when both user and text are missing', async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it('returns 200 with valid user and text', async () => {
    const res = await POST(makeReq({ user: 'alice', text: 'hello world' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('creates logs directory and appends to file on valid request', async () => {
    await POST(makeReq({ user: 'bob', text: 'test message', timestamp: '2026-01-01T00:00:00Z' }));
    expect(fsMocks.mkdir).toHaveBeenCalledOnce();
    expect(fsMocks.mkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    expect(fsMocks.appendFile).toHaveBeenCalledOnce();
    const written = fsMocks.appendFile.mock.calls[0][1] as string;
    const parsed = JSON.parse(written.trim());
    expect(parsed.user).toBe('bob');
    expect(parsed.text).toBe('test message');
    expect(parsed.timestamp).toBe('2026-01-01T00:00:00Z');
  });

  it('returns 500 when filesystem write fails', async () => {
    fsMocks.appendFile.mockRejectedValueOnce(new Error('disk full'));
    const res = await POST(makeReq({ user: 'alice', text: 'hello' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Log failed');
    expect(body.details).toContain('disk full');
  });

  it('generates a timestamp if none is provided', async () => {
    await POST(makeReq({ user: 'carol', text: 'auto-ts' }));
    const written = fsMocks.appendFile.mock.calls[0][1] as string;
    const parsed = JSON.parse(written.trim());
    expect(parsed.timestamp).toBeDefined();
    // Should be a valid ISO date string
    expect(new Date(parsed.timestamp).toISOString()).toBe(parsed.timestamp);
  });
});
