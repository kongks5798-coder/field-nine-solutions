// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// -- Hoisted mocks & env setup --
const mocks = vi.hoisted(() => {
  // Set env vars BEFORE the route module is loaded (module-level const capture)
  process.env.ADMIN_EMAIL = 'admin@test.com';
  process.env.SMTP_USER = 'smtp@test.com';
  process.env.SMTP_PASS = 'secret';
  process.env.SMTP_HOST = 'smtp.test.com';
  process.env.SMTP_PORT = '465';

  return {
    sendMail: vi.fn().mockResolvedValue({ messageId: 'msg-001' }),
    createTransport: vi.fn(),
  };
});

vi.mock('nodemailer', () => ({
  default: {
    createTransport: mocks.createTransport.mockReturnValue({
      sendMail: mocks.sendMail,
    }),
  },
}));

import { POST } from '@/app/api/send-admin-email/route';

// -- Helpers --
function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/send-admin-email', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// -- Tests (env is configured at import time) --
describe('POST /api/send-admin-email (configured)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sendMail.mockResolvedValue({ messageId: 'msg-001' });
    mocks.createTransport.mockReturnValue({ sendMail: mocks.sendMail });
  });

  it('returns 200 when email is sent successfully', async () => {
    const res = await POST(makeReq({ subject: 'Test Alert', text: 'Hello admin' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('calls createTransport with SMTP config', async () => {
    await POST(makeReq({ subject: 'Check', text: 'Body' }));
    expect(mocks.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.test.com',
        port: 465,
        secure: true,
        auth: { user: 'smtp@test.com', pass: 'secret' },
      }),
    );
  });

  it('calls sendMail with correct to/from/subject/text', async () => {
    await POST(makeReq({ subject: 'My Subject', text: 'My Body' }));
    expect(mocks.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'smtp@test.com',
        to: 'admin@test.com',
        subject: 'My Subject',
        text: 'My Body',
      }),
    );
  });

  it('uses default subject when none provided', async () => {
    await POST(makeReq({ text: 'No subject' }));
    expect(mocks.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'AI 품질 자동 알림',
      }),
    );
  });

  it('returns 500 when sendMail throws', async () => {
    mocks.sendMail.mockRejectedValueOnce(new Error('SMTP timeout'));
    const res = await POST(makeReq({ subject: 'Fail', text: 'Body' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Email send failed');
    expect(body.details).toContain('SMTP timeout');
  });
});

describe('POST /api/send-admin-email (missing config)', () => {
  it('returns 500 when SMTP env vars are absent', async () => {
    // Dynamically re-import with cleared env
    vi.resetModules();

    const saved = { ...process.env };
    delete process.env.ADMIN_EMAIL;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    const mod = await import('@/app/api/send-admin-email/route');
    const req = new NextRequest('http://localhost/api/send-admin-email', {
      method: 'POST',
      body: JSON.stringify({ subject: 'Test', text: 'Body' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await mod.POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('SMTP config missing');

    // Restore env
    Object.assign(process.env, saved);
  });
});
