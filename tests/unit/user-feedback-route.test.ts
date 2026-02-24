// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// -- Hoisted mocks --
const fsMocks = vi.hoisted(() => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  appendFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(''),
}));

vi.mock('fs', () => ({
  promises: {
    mkdir: fsMocks.mkdir,
    appendFile: fsMocks.appendFile,
    readFile: fsMocks.readFile,
  },
}));

import { POST, GET } from '@/app/api/user-feedback/route';

// -- Helpers --
function makePostReq(body: unknown) {
  return new NextRequest('http://localhost/api/user-feedback', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// -- Tests --
describe('POST /api/user-feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when neither feedback nor score is provided', async () => {
    const res = await POST(makePostReq({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('No feedback');
  });

  it('returns 200 when feedback is provided', async () => {
    const res = await POST(makePostReq({ feedback: 'Great service!' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('returns 200 when only score is provided', async () => {
    const res = await POST(makePostReq({ score: 5 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('writes correct JSON line to feedback file', async () => {
    await POST(makePostReq({ feedback: 'Nice!', score: 4, timestamp: '2026-01-15T12:00:00Z' }));
    expect(fsMocks.mkdir).toHaveBeenCalledOnce();
    expect(fsMocks.appendFile).toHaveBeenCalledOnce();
    const written = fsMocks.appendFile.mock.calls[0][1] as string;
    const parsed = JSON.parse(written.trim());
    expect(parsed.feedback).toBe('Nice!');
    expect(parsed.score).toBe(4);
    expect(parsed.timestamp).toBe('2026-01-15T12:00:00Z');
  });

  it('generates a timestamp when none provided', async () => {
    await POST(makePostReq({ feedback: 'Auto timestamp' }));
    const written = fsMocks.appendFile.mock.calls[0][1] as string;
    const parsed = JSON.parse(written.trim());
    expect(parsed.timestamp).toBeDefined();
    expect(new Date(parsed.timestamp).toISOString()).toBe(parsed.timestamp);
  });
});

describe('GET /api/user-feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when file does not exist', async () => {
    fsMocks.readFile.mockRejectedValueOnce(new Error('ENOENT'));
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.logs).toEqual([]);
  });

  it('returns empty array when file is empty', async () => {
    fsMocks.readFile.mockResolvedValueOnce('');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.logs).toEqual([]);
  });

  it('parses valid JSONL lines and returns array', async () => {
    const line1 = JSON.stringify({ feedback: 'Good', score: 5 });
    const line2 = JSON.stringify({ feedback: 'OK', score: 3 });
    fsMocks.readFile.mockResolvedValueOnce(`${line1}\n${line2}\n`);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.logs).toHaveLength(2);
    expect(body.logs[0].feedback).toBe('Good');
    expect(body.logs[1].score).toBe(3);
  });

  it('skips malformed JSON lines gracefully', async () => {
    const valid = JSON.stringify({ feedback: 'Valid' });
    fsMocks.readFile.mockResolvedValueOnce(`${valid}\nnot-json\n`);
    const res = await GET();
    const body = await res.json();
    expect(body.logs).toHaveLength(1);
    expect(body.logs[0].feedback).toBe('Valid');
  });
});
