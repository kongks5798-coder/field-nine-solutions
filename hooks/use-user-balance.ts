'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 56: REAL USER BALANCE HOOK
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Zero mock data. All balances from Supabase.
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface UserBalance {
  kausBalance: number;
  kausLockedBalance: number;
  fiatBalance: number;
  fiatCurrency: string;
  totalEarnings: number;
  pendingWithdrawals: number;
  stakedAmount: number;
  referralEarnings: number;
}

export interface UserProfile {
  userId: string;
  email: string;
  fullName: string;
  sovereignNumber: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  avatarUrl?: string;
  createdAt: string;
}

export interface UseUserBalanceReturn {
  balance: UserBalance | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
}

const DEFAULT_BALANCE: UserBalance = {
  kausBalance: 0,
  kausLockedBalance: 0,
  fiatBalance: 0,
  fiatCurrency: 'KRW',
  totalEarnings: 0,
  pendingWithdrawals: 0,
  stakedAmount: 0,
  referralEarnings: 0,
};

/**
 * Hook to fetch real user balance and profile from Supabase
 * NO MOCK DATA - Returns zeros if not authenticated
 */
export function useUserBalance(): UseUserBalanceReturn {
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchUserData = useCallback(async () => {
    const supabase = createClient();

    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setIsAuthenticated(false);
        setBalance(DEFAULT_BALANCE);
        setProfile(null);
        return;
      }

      setIsAuthenticated(true);

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile({
          userId: user.id,
          email: user.email || '',
          fullName: profileData.full_name || 'Sovereign',
          sovereignNumber: profileData.sovereign_number || 0,
          tier: calculateTier(profileData.total_kaus_earned || 0),
          avatarUrl: profileData.avatar_url,
          createdAt: profileData.created_at,
        });
      }

      // Fetch wallet balance
      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance, locked_balance, currency')
        .eq('user_id', user.id)
        .single();

      // Fetch staking positions
      const { data: stakingData } = await supabase
        .from('staking_positions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'active');

      const stakedAmount = stakingData?.reduce((sum: number, pos: { amount: number | null }) => sum + Number(pos.amount || 0), 0) || 0;

      // Fetch referral earnings
      const { data: referralData } = await supabase
        .from('referral_rewards')
        .select('amount')
        .eq('referrer_id', user.id)
        .eq('status', 'paid');

      const referralEarnings = referralData?.reduce((sum: number, r: { amount: number | null }) => sum + Number(r.amount || 0), 0) || 0;

      // Fetch pending withdrawals
      const { data: withdrawalData } = await supabase
        .from('withdrawal_requests')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      const pendingWithdrawals = withdrawalData?.reduce((sum: number, w: { amount: number | null }) => sum + Number(w.amount || 0), 0) || 0;

      // Calculate total earnings (all-time KAUS earned)
      const { data: transactionData } = await supabase
        .from('kaus_transactions')
        .select('amount')
        .eq('user_id', user.id)
        .in('type', ['STAKING_REWARD', 'REFERRAL_REWARD', 'SIGNUP_BONUS', 'PURCHASE_BONUS']);

      const totalEarnings = transactionData?.reduce((sum: number, t: { amount: number | null }) => sum + Number(t.amount || 0), 0) || 0;

      setBalance({
        kausBalance: Number(walletData?.balance || 0),
        kausLockedBalance: Number(walletData?.locked_balance || 0),
        fiatBalance: 0, // Fiat balance from separate table if exists
        fiatCurrency: 'KRW',
        totalEarnings,
        pendingWithdrawals,
        stakedAmount,
        referralEarnings,
      });

    } catch (err) {
      console.error('[useUserBalance] Error:', err);
      setError('Failed to fetch user data');
      setBalance(DEFAULT_BALANCE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();

    // Subscribe to auth changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  return {
    balance,
    profile,
    loading,
    error,
    isAuthenticated,
    refresh: fetchUserData,
  };
}

/**
 * Calculate tier based on total KAUS earned
 */
function calculateTier(totalKausEarned: number): 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' {
  if (totalKausEarned >= 1000000) return 'DIAMOND';
  if (totalKausEarned >= 500000) return 'PLATINUM';
  if (totalKausEarned >= 100000) return 'GOLD';
  if (totalKausEarned >= 10000) return 'SILVER';
  return 'BRONZE';
}

/**
 * Format KAUS balance with proper formatting
 */
export function formatKausBalance(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toLocaleString();
}

/**
 * Hook for quick balance check (lightweight)
 */
export function useKausBalance(): { balance: number; loading: boolean } {
  const { balance, loading } = useUserBalance();
  return {
    balance: balance?.kausBalance || 0,
    loading,
  };
}

export default useUserBalance;
