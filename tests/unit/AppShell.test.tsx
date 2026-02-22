// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// next/navigation mock
vi.mock('next/navigation', () => ({
  usePathname: vi.fn().mockReturnValue('/dashboard'),
  useRouter: vi.fn().mockReturnValue({ push: vi.fn() }),
}));

// next/link mock
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Supabase auth mock
vi.mock('@/utils/supabase/auth', () => ({
  getAuthUser: vi.fn().mockResolvedValue(null),
  authSignOut: vi.fn().mockResolvedValue(undefined),
}));

// fetch mock — /api/auth/me 호출용
global.fetch = vi.fn().mockResolvedValue({
  ok: false,
  json: vi.fn().mockResolvedValue(null),
});

import AppShell from '@/components/AppShell';

describe('AppShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue(null),
    });
  });

  it('renders children content', () => {
    render(
      <AppShell>
        <div>테스트 컨텐츠</div>
      </AppShell>
    );
    expect(screen.getByText('테스트 컨텐츠')).toBeInTheDocument();
  });

  it('renders logo link pointing to home', () => {
    render(
      <AppShell>
        <div>내용</div>
      </AppShell>
    );
    const logoLink = screen.getByText('Dalkak').closest('a');
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('renders navigation links', () => {
    render(
      <AppShell>
        <div>내용</div>
      </AppShell>
    );
    expect(screen.getByText('대시보드')).toBeInTheDocument();
    expect(screen.getByText('Studio')).toBeInTheDocument();
    expect(screen.getByText('팀')).toBeInTheDocument();
    expect(screen.getByText('클라우드')).toBeInTheDocument();
  });

  it('renders settings and billing links', () => {
    render(
      <AppShell>
        <div>내용</div>
      </AppShell>
    );
    const settingsLink = screen.getByText('⚙️ API 설정').closest('a');
    expect(settingsLink).toHaveAttribute('href', '/settings');
    const billingLink = screen.getByText('💳 청구').closest('a');
    expect(billingLink).toHaveAttribute('href', '/billing');
  });

  it('shows login and signup links when user is not logged in', () => {
    render(
      <AppShell>
        <div>내용</div>
      </AppShell>
    );
    expect(screen.getByText('로그인')).toBeInTheDocument();
    expect(screen.getByText('시작하기 →')).toBeInTheDocument();
  });

  it('renders all 9 navigation items', () => {
    render(
      <AppShell>
        <div>내용</div>
      </AppShell>
    );
    const navItems = ['대시보드', 'Studio', 'LM 허브', 'Flow', 'Canvas', 'Collab', '팀', '클라우드', 'CoWork'];
    navItems.forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
});
