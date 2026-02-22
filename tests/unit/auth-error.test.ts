import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/auth/error/route';

function makeReq(method: string) {
  return new NextRequest('http://localhost/api/auth/error', { method });
}

describe('GET /api/auth/error', () => {
  it('returns 404 with error message', async () => {
    const res = await GET();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: 'Not found' });
  });
});

describe('POST /api/auth/error', () => {
  it('returns 404 with error message', async () => {
    const res = await POST();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: 'Not found' });
  });
});
