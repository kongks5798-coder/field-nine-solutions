'use client';

import { useState, useEffect } from 'react';

// User tier type for energy platform
export type UserTier = 'guest' | 'explorer' | 'sovereign' | 'platinum' | 'enterprise';

interface UserTierData {
  tier: UserTier;
  planId: string;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Hook to get current user's subscription tier
 * Returns 'guest' for unauthenticated users
 * Fetches actual tier from /api/auth/me and /api/subscription
 */
export function useUserTier(): UserTierData {
  const [tier, setTier] = useState<UserTier>('guest');
  const [planId, setPlanId] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function fetchUserTier() {
      try {
        // Check auth via Supabase-based /api/auth/me
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          setTier('guest');
          setPlanId('free');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        setIsAuthenticated(true);

        const response = await fetch('/api/subscription');
        if (response.ok) {
          const data = await response.json();
          const userPlanId = data.subscription?.plan_id || 'free';
          setPlanId(userPlanId);

          const tierMap: Record<string, UserTier> = {
            free: 'guest',
            explorer: 'explorer',
            sovereign: 'sovereign',
            platinum: 'platinum',
            enterprise: 'enterprise',
          };

          setTier(tierMap[userPlanId] || 'guest');
        } else {
          setTier('guest');
          setPlanId('free');
        }
      } catch (error) {
        console.error('Failed to fetch user tier:', error);
        setTier('guest');
        setPlanId('free');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserTier();
  }, []);

  return { tier, planId, isLoading, isAuthenticated };
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: UserTier): string {
  const names: Record<UserTier, string> = {
    guest: 'Guest',
    explorer: 'Explorer',
    sovereign: 'Sovereign',
    platinum: 'Platinum',
    enterprise: 'Enterprise',
  };
  return names[tier];
}

/**
 * Get tier color class
 */
export function getTierColor(tier: UserTier): string {
  const colors: Record<UserTier, string> = {
    guest: 'text-white/50',
    explorer: 'text-[#00E5FF]',
    sovereign: 'text-amber-400',
    platinum: 'text-emerald-400',
    enterprise: 'text-purple-400',
  };
  return colors[tier];
}
