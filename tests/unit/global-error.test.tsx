// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GlobalError from '@/app/global-error';

describe('global-error page', () => {
  it('renders fatal error heading', () => {
    const reset = vi.fn();
    const error = new Error('Test error') as Error & { digest?: string };

    render(<GlobalError error={error} reset={reset} />);

    expect(screen.getByText('치명적 오류가 발생했습니다')).toBeInTheDocument();
  });

  it('shows error digest code when present', () => {
    const reset = vi.fn();
    const error = new Error('Test error') as Error & { digest?: string };
    error.digest = 'abc123';

    render(<GlobalError error={error} reset={reset} />);

    expect(screen.getByText(/abc123/)).toBeInTheDocument();
  });

  it('does not show digest section when digest is absent', () => {
    const reset = vi.fn();
    const error = new Error('No digest error') as Error & { digest?: string };

    render(<GlobalError error={error} reset={reset} />);

    expect(screen.queryByText(/오류 코드:/)).not.toBeInTheDocument();
  });

  it('calls reset when retry button is clicked', () => {
    const reset = vi.fn();
    const error = new Error('Test error') as Error & { digest?: string };

    render(<GlobalError error={error} reset={reset} />);

    fireEvent.click(screen.getByText('다시 시도'));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('renders home link', () => {
    const reset = vi.fn();
    const error = new Error('Test error') as Error & { digest?: string };

    render(<GlobalError error={error} reset={reset} />);

    const homeLink = screen.getByText('홈으로').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders D logo text', () => {
    const reset = vi.fn();
    const error = new Error('Test error') as Error & { digest?: string };

    render(<GlobalError error={error} reset={reset} />);

    expect(screen.getByText('D')).toBeInTheDocument();
  });
});
