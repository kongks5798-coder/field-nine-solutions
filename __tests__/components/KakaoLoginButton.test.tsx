/**
 * KakaoLoginButton 컴포넌트 테스트
 * @vitest-environment jsdom
 */

import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock Supabase client
vi.mock('@/src/utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockImplementation(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

// Must import after mocking
import KakaoLoginButton from '@/src/components/auth/KakaoLoginButton';

describe('KakaoLoginButton', () => {
  it('should render without crashing', () => {
    // Just verify the component renders without throwing
    const { container } = render(<KakaoLoginButton />);
    expect(container).toBeTruthy();
    // Component renders a div wrapper
    expect(container.firstChild).toBeTruthy();
  });
});
