// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { TopUpModal } from '@/app/workspace/TopUpModal';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// TossPayments SDK는 브라우저 전용이므로 mock 처리
vi.mock('@tosspayments/tosspayments-sdk', () => ({
  loadTossPayments: vi.fn().mockResolvedValue({
    payment: vi.fn().mockReturnValue({
      requestPayment: vi.fn().mockResolvedValue({}),
    }),
  }),
}));

// fetch mock
global.fetch = vi.fn();

describe('TopUpModal', () => {
  const defaultProps = {
    currentSpent: 30000,
    hardLimit: 50000,
    periodReset: '2026-03-01',
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with usage info', () => {
    render(<TopUpModal {...defaultProps} />);
    expect(screen.getByText('⚡ AI 크레딧 충전')).toBeInTheDocument();
    expect(screen.getByText(/₩30,000 \/ ₩50,000/)).toBeInTheDocument();
  });

  it('shows three top-up options', () => {
    render(<TopUpModal {...defaultProps} />);
    expect(screen.getByText('₩10,000')).toBeInTheDocument();
    expect(screen.getByText('₩20,000')).toBeInTheDocument();
    expect(screen.getByText('₩50,000')).toBeInTheDocument();
  });

  it('calls onClose when X button is clicked', () => {
    render(<TopUpModal {...defaultProps} />);
    fireEvent.click(screen.getByText('✕'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const { container } = render(<TopUpModal {...defaultProps} />);
    const backdrop = container.firstChild as HTMLElement;
    fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows recommended badge on ₩20,000 option', () => {
    render(<TopUpModal {...defaultProps} />);
    expect(screen.getByText('추천')).toBeInTheDocument();
  });

  it('shows lowest price badge on ₩50,000 option', () => {
    render(<TopUpModal {...defaultProps} />);
    expect(screen.getByText('최저 단가')).toBeInTheDocument();
  });

  it('selects an option when clicked and updates charge button', () => {
    render(<TopUpModal {...defaultProps} />);
    // ₩20,000이 기본 선택이므로, 충전 버튼에 기본값 표시됨
    expect(screen.getByText('₩20,000 충전하기')).toBeInTheDocument();
    // ₩10,000 버튼 클릭
    fireEvent.click(screen.getByText('₩10,000').closest('button')!);
    expect(screen.getByText('₩10,000 충전하기')).toBeInTheDocument();
  });

  it('shows period reset info', () => {
    render(<TopUpModal {...defaultProps} />);
    expect(screen.getByText(/2026-03-01/)).toBeInTheDocument();
  });
});
