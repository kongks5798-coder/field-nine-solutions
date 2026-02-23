// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSend = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 'msg_123' }));

vi.mock('resend', () => {
  function MockResend() {
    return { emails: { send: mockSend } };
  }
  return { Resend: MockResend };
});

// Set env before importing module
process.env.RESEND_API_KEY = 'test-resend-key';

import {
  sendWelcomeEmail,
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendContactEmail,
  sendTrialExpiringEmail,
  sendLimitWarningEmail,
  sendPlanChangedEmail,
} from '@/lib/email';

describe('sendWelcomeEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('올바른 수신자와 제목으로 이메일을 전송한다', async () => {
    await sendWelcomeEmail('user@example.com', 'John');
    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toBe('user@example.com');
    expect(call.subject).toContain('환영');
    expect(call.from).toContain('noreply@fieldnine.io');
  });

  it('HTML 본문에 사용자 이름이 포함된다', async () => {
    await sendWelcomeEmail('user@example.com', 'Alice');
    const call = mockSend.mock.calls[0][0];
    expect(call.html).toContain('Alice');
  });

  it('HTML 본문에 워크스페이스 링크가 포함된다', async () => {
    await sendWelcomeEmail('user@example.com', 'Bob');
    const call = mockSend.mock.calls[0][0];
    expect(call.html).toContain('fieldnine.io/workspace');
  });
});

describe('sendPaymentSuccessEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('올바른 수신자와 금액으로 이메일을 전송한다', async () => {
    await sendPaymentSuccessEmail('user@example.com', 'pro', 39000, '2025년 3월');
    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toBe('user@example.com');
    expect(call.subject).toContain('39,000');
    expect(call.subject).toContain('2025년 3월');
  });

  it('HTML에 플랜 이름이 포함된다', async () => {
    await sendPaymentSuccessEmail('user@example.com', 'team', 99000, '2025년 4월');
    const call = mockSend.mock.calls[0][0];
    expect(call.html).toContain('TEAM');
  });
});

describe('sendPaymentFailedEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('실패 안내 이메일을 전송한다', async () => {
    await sendPaymentFailedEmail('user@example.com', 39000, '2025년 3월');
    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toContain('결제 실패');
  });

  it('HTML에 금액과 기간이 포함된다', async () => {
    await sendPaymentFailedEmail('user@example.com', 49000, '2025년 5월');
    const call = mockSend.mock.calls[0][0];
    expect(call.html).toContain('49,000');
    expect(call.html).toContain('2025년 5월');
  });
});

describe('sendContactEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('문의 이메일을 sales 주소로 전송한다', async () => {
    await sendContactEmail({
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Acme Corp',
      message: 'Hello',
    });
    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toBe('sales@fieldnine.io');
    expect(call.replyTo).toBe('john@example.com');
    expect(call.subject).toContain('John Doe');
    expect(call.subject).toContain('Acme Corp');
  });

  it('회사가 없으면 "개인"으로 표시된다', async () => {
    await sendContactEmail({ name: 'Jane', email: 'jane@example.com' });
    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toContain('개인');
  });
});

describe('sendTrialExpiringEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('체험 만료 예정 이메일을 전송한다', async () => {
    await sendTrialExpiringEmail('user@example.com', 3, 'pro');
    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toContain('3일');
    expect(call.html).toContain('PRO');
  });
});

describe('sendLimitWarningEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('한도 경고 이메일을 전송한다', async () => {
    await sendLimitWarningEmail('user@example.com', 80000, 100000);
    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toContain('80%');
    expect(call.html).toContain('80,000');
    expect(call.html).toContain('100,000');
  });
});

describe('sendPlanChangedEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('플랜 업그레이드 시 적절한 제목을 사용한다', async () => {
    await sendPlanChangedEmail('user@example.com', 'pro');
    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toContain('PRO');
    expect(call.html).toContain('업그레이드');
    expect(call.html).toContain('fieldnine.io/workspace');
  });

  it('플랜 해제 시 적절한 제목을 사용한다', async () => {
    await sendPlanChangedEmail('user@example.com', null);
    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toContain('해제');
    expect(call.html).toContain('무료 플랜');
    expect(call.html).toContain('fieldnine.io/pricing');
  });
});
