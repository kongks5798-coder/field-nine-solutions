// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock next/link to render plain <a> tags
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import WorkspaceError from '@/app/workspace/error';

describe('WorkspaceError', () => {
  it('renders the error title', () => {
    const reset = vi.fn();
    const error = new Error('Test error') as Error & { digest?: string };

    render(<WorkspaceError error={error} reset={reset} />);

    expect(screen.getByText('워크스페이스에서 오류가 발생했습니다')).toBeInTheDocument();
  });

  it('calls reset when retry button is clicked', () => {
    const reset = vi.fn();
    const error = new Error('Test error') as Error & { digest?: string };

    render(<WorkspaceError error={error} reset={reset} />);

    fireEvent.click(screen.getByText('다시 시도'));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('shows error.digest when present', () => {
    const reset = vi.fn();
    const error = new Error('Test error') as Error & { digest?: string };
    error.digest = 'ERR_123_ABC';

    render(<WorkspaceError error={error} reset={reset} />);

    expect(screen.getByText(/ERR_123_ABC/)).toBeInTheDocument();
    expect(screen.getByText(/오류 코드:/)).toBeInTheDocument();
  });

  it('does not show digest section when digest is absent', () => {
    const reset = vi.fn();
    const error = new Error('No digest') as Error & { digest?: string };

    render(<WorkspaceError error={error} reset={reset} />);

    expect(screen.queryByText(/오류 코드:/)).not.toBeInTheDocument();
  });

  it('renders "대시보드로" link pointing to /dashboard', () => {
    const reset = vi.fn();
    const error = new Error('Test error') as Error & { digest?: string };

    render(<WorkspaceError error={error} reset={reset} />);

    const dashboardLink = screen.getByText('대시보드로').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });

  it('renders D logo text', () => {
    const reset = vi.fn();
    const error = new Error('Test error') as Error & { digest?: string };

    render(<WorkspaceError error={error} reset={reset} />);

    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('renders error description text', () => {
    const reset = vi.fn();
    const error = new Error('Test error') as Error & { digest?: string };

    render(<WorkspaceError error={error} reset={reset} />);

    expect(screen.getByText('워크스페이스를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.')).toBeInTheDocument();
  });
});
