// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  verifyJWT: vi.fn(),
}));

vi.mock('@/core/jwt', () => ({
  verifyJWT: mocks.verifyJWT,
}));

import { requireAdmin } from '@/core/adminAuth';

function makeRequest(cookie?: string): Request {
  const headers: Record<string, string> = {};
  if (cookie) headers.cookie = cookie;
  return new Request('http://localhost/api/admin/test', { headers });
}

describe('requireAdmin', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.SESSION_SECRET = '';
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalEnv.JWT_SECRET;
    process.env.SESSION_SECRET = originalEnv.SESSION_SECRET;
  });

  it('JWT_SECRET이 없으면 500을 반환한다', async () => {
    process.env.JWT_SECRET = '';
    process.env.SESSION_SECRET = '';
    const result = await requireAdmin(makeRequest('auth=some-token'));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(500);
      const body = await result.response.json();
      expect(body.error).toBe('Server misconfigured');
    }
  });

  it('SESSION_SECRET 폴백이 동작한다', async () => {
    process.env.JWT_SECRET = '';
    process.env.SESSION_SECRET = 'fallback-secret';
    mocks.verifyJWT.mockResolvedValue({ sub: 'admin' });
    const result = await requireAdmin(makeRequest('auth=valid-token'));
    expect(result.ok).toBe(true);
    expect(mocks.verifyJWT).toHaveBeenCalledWith('valid-token', 'fallback-secret');
  });

  it('auth 쿠키가 없으면 401을 반환한다', async () => {
    const result = await requireAdmin(makeRequest());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      const body = await result.response.json();
      expect(body.error).toBe('Unauthorized');
    }
  });

  it('auth 쿠키가 빈 cookie 헤더이면 401을 반환한다', async () => {
    const result = await requireAdmin(makeRequest('other=value'));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it('JWT 검증 실패 시 401을 반환한다', async () => {
    mocks.verifyJWT.mockResolvedValue(null);
    const result = await requireAdmin(makeRequest('auth=invalid-token'));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      const body = await result.response.json();
      expect(body.error).toBe('Unauthorized');
    }
  });

  it('sub가 admin이 아니면 401을 반환한다', async () => {
    mocks.verifyJWT.mockResolvedValue({ sub: 'user' });
    const result = await requireAdmin(makeRequest('auth=user-token'));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it('유효한 admin JWT이면 ok:true를 반환한다', async () => {
    mocks.verifyJWT.mockResolvedValue({ sub: 'admin' });
    const result = await requireAdmin(makeRequest('auth=valid-admin-token'));
    expect(result.ok).toBe(true);
  });

  it('verifyJWT에 올바른 token과 secret을 전달한다', async () => {
    mocks.verifyJWT.mockResolvedValue({ sub: 'admin' });
    await requireAdmin(makeRequest('auth=my-token'));
    expect(mocks.verifyJWT).toHaveBeenCalledWith('my-token', 'test-jwt-secret');
  });

  it('여러 쿠키가 있을 때 auth 쿠키를 올바르게 추출한다', async () => {
    mocks.verifyJWT.mockResolvedValue({ sub: 'admin' });
    const result = await requireAdmin(makeRequest('session=abc; auth=real-token; theme=dark'));
    expect(result.ok).toBe(true);
    expect(mocks.verifyJWT).toHaveBeenCalledWith('real-token', 'test-jwt-secret');
  });

  it('auth 쿠키 값에 = 기호가 포함되어도 올바르게 추출한다', async () => {
    mocks.verifyJWT.mockResolvedValue({ sub: 'admin' });
    await requireAdmin(makeRequest('auth=eyJ0eXA=.payload=.sig='));
    expect(mocks.verifyJWT).toHaveBeenCalledWith('eyJ0eXA=.payload=.sig=', 'test-jwt-secret');
  });

  it('응답 Content-Type이 application/json이다', async () => {
    process.env.JWT_SECRET = '';
    process.env.SESSION_SECRET = '';
    const result = await requireAdmin(makeRequest('auth=token'));
    if (!result.ok) {
      expect(result.response.headers.get('Content-Type')).toBe('application/json');
    }
  });
});
