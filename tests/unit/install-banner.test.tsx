// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to create mock fn that can be referenced in vi.mock factory
const { mockPromptInstall } = vi.hoisted(() => ({
  mockPromptInstall: vi.fn().mockResolvedValue(true),
}));

// Mock the useInstallPrompt hook
vi.mock('@/hooks/useInstallPrompt', () => ({
  useInstallPrompt: vi.fn().mockReturnValue({
    canInstall: false,
    isInstalled: false,
    promptInstall: mockPromptInstall,
  }),
}));

import InstallBanner from '@/components/InstallBanner';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

const mockedUseInstallPrompt = vi.mocked(useInstallPrompt);

describe('InstallBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseInstallPrompt.mockReturnValue({
      canInstall: false,
      isInstalled: false,
      promptInstall: mockPromptInstall,
    });
  });

  it('returns null when canInstall is false', () => {
    const { container } = render(<InstallBanner />);
    expect(container.innerHTML).toBe('');
  });

  it('renders install button when canInstall is true', () => {
    mockedUseInstallPrompt.mockReturnValue({
      canInstall: true,
      isInstalled: false,
      promptInstall: mockPromptInstall,
    });

    render(<InstallBanner />);
    expect(screen.getByText('설치')).toBeInTheDocument();
    expect(screen.getByText('Dalkak 설치')).toBeInTheDocument();
  });

  it('renders description text when canInstall is true', () => {
    mockedUseInstallPrompt.mockReturnValue({
      canInstall: true,
      isInstalled: false,
      promptInstall: mockPromptInstall,
    });

    render(<InstallBanner />);
    expect(screen.getByText('홈 화면에 추가하여 빠르게 접근')).toBeInTheDocument();
  });

  it('renders close button with aria-label', () => {
    mockedUseInstallPrompt.mockReturnValue({
      canInstall: true,
      isInstalled: false,
      promptInstall: mockPromptInstall,
    });

    render(<InstallBanner />);
    expect(screen.getByLabelText('닫기')).toBeInTheDocument();
  });

  it('hides banner when close button is clicked', () => {
    mockedUseInstallPrompt.mockReturnValue({
      canInstall: true,
      isInstalled: false,
      promptInstall: mockPromptInstall,
    });

    render(<InstallBanner />);
    expect(screen.getByText('설치')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('닫기'));

    expect(screen.queryByText('설치')).not.toBeInTheDocument();
  });

  it('calls promptInstall when install button is clicked', () => {
    mockedUseInstallPrompt.mockReturnValue({
      canInstall: true,
      isInstalled: false,
      promptInstall: mockPromptInstall,
    });

    render(<InstallBanner />);
    fireEvent.click(screen.getByText('설치'));

    expect(mockPromptInstall).toHaveBeenCalledTimes(1);
  });
});
