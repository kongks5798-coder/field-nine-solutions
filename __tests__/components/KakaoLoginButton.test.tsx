/**
 * KakaoLoginButton 컴포넌트 테스트
 */

import { render, screen, waitFor } from '@testing-library/react';
import KakaoLoginButton from '@/src/components/auth/KakaoLoginButton';

// Mock Supabase client
jest.mock('@/src/utils/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signInWithOAuth: jest.fn().mockResolvedValue({ error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  })),
}));

describe('KakaoLoginButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', async () => {
    render(<KakaoLoginButton />);
    
    // 초기 로딩 상태 확인
    const button = screen.getByRole('button', { hidden: true });
    expect(button).toBeInTheDocument();
  });

  it('should render login button when not authenticated', async () => {
    const { createClient } = require('@/src/utils/supabase/client');
    createClient.mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        }),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } },
        })),
      },
    });

    render(<KakaoLoginButton />);
    
    await waitFor(() => {
      const button = screen.getByLabelText(/카카오 계정으로 로그인/i);
      expect(button).toBeInTheDocument();
    });
  });

  it('should render user profile when authenticated', async () => {
    const { createClient } = require('@/src/utils/supabase/client');
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    };

    createClient.mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: {
            session: {
              user: mockUser,
            },
          },
          error: null,
        }),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } },
        })),
        signOut: jest.fn().mockResolvedValue({ error: null }),
      },
    });

    render(<KakaoLoginButton />);
    
    await waitFor(() => {
      expect(screen.getByText(/반갑습니다/i)).toBeInTheDocument();
    });
  });
});
