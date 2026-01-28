'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

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
 * Fetches actual tier from subscription API for authenticated users
 */
export function useUserTier(): UserTierData {
  const { data: session, status } = useSession();
  const [tier, setTier] = useState<UserTier>('guest');
  const [planId, setPlanId] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserTier() {
      if (status === 'loading') return;

      if (!session?.user) {
        setTier('guest');
        setPlanId('free');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/subscription');
        if (response.ok) {
          const data = await response.json();
          const userPlanId = data.subscription?.plan_id || 'free';
          setPlanId(userPlanId);

          // Map plan_id to tier (Energy Platform tiers)
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
  }, [session, status]);

  return {
    tier,
    planId,
    isLoading,
    isAuthenticated: !!session?.user,
  };
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
