/**
 * 프로필 유틸리티 함수 테스트
 */

import { ensureProfile } from '@/src/utils/profile';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const createMockSupabase = () => {
  const mockSupabase = {
    from: jest.fn(),
  } as unknown as SupabaseClient;

  return mockSupabase;
};

describe('ensureProfile', () => {
  it('should return true if profile already exists', async () => {
    const mockSupabase = createMockSupabase();
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-123' },
          error: null,
        }),
      }),
    });

    (mockSupabase.from as jest.Mock) = jest.fn().mockReturnValue({
      select: mockSelect,
    });

    const result = await ensureProfile(mockSupabase, {
      userId: 'user-123',
      email: 'test@example.com',
    });

    expect(result).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
  });

  it('should create profile if it does not exist', async () => {
    const mockSupabase = createMockSupabase();
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // Not found error
        }),
      }),
    });

    const mockInsert = jest.fn().mockResolvedValue({
      error: null,
    });

    (mockSupabase.from as jest.Mock) = jest.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
    });

    const result = await ensureProfile(mockSupabase, {
      userId: 'user-123',
      email: 'test@example.com',
      role: 'employee',
    });

    expect(result).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith({
      id: 'user-123',
      email: 'test@example.com',
      role: 'employee',
    });
  });

  it('should return false if profile creation fails', async () => {
    const mockSupabase = createMockSupabase();
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      }),
    });

    const mockInsert = jest.fn().mockResolvedValue({
      error: { message: 'Insert failed' },
    });

    (mockSupabase.from as jest.Mock) = jest.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
    });

    const result = await ensureProfile(mockSupabase, {
      userId: 'user-123',
      email: 'test@example.com',
    });

    expect(result).toBe(false);
  });
});
