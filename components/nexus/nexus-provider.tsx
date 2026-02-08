/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 74: NEXUS PROVIDER
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Nexus 앱 전역 Provider - 프리페치, 상태 관리, 최적화
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRoutePrefetch, useRouteMetrics, useInstantNavigation } from '@/hooks/use-route-prefetch';

interface NexusContextValue {
  isOnline: boolean;
  kausPrice: number;
  kausBalance: number;
  membershipTier: 'basic' | 'platinum' | 'sovereign';
  isLoading: boolean;
}

const NexusContext = createContext<NexusContextValue>({
  isOnline: true,
  kausPrice: 120,
  kausBalance: 0,
  membershipTier: 'basic',
  isLoading: true,
});

export function useNexus() {
  return useContext(NexusContext);
}

interface NexusProviderProps {
  children: ReactNode;
}

export function NexusProvider({ children }: NexusProviderProps) {
  const [state, setState] = useState<NexusContextValue>({
    isOnline: true,
    kausPrice: 120,
    kausBalance: 0,
    membershipTier: 'basic',
    isLoading: true,
  });

  // Initialize optimizations
  useRoutePrefetch();
  useRouteMetrics();
  useInstantNavigation();

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check cached data first
        const cachedBalance = sessionStorage.getItem('prefetch:/api/kaus/balance');
        const cachedPrice = sessionStorage.getItem('prefetch:/api/kaus/price');

        if (cachedBalance) {
          const { data } = JSON.parse(cachedBalance);
          setState((prev) => ({ ...prev, kausBalance: data.balance || 0 }));
        }

        if (cachedPrice) {
          const { data } = JSON.parse(cachedPrice);
          setState((prev) => ({ ...prev, kausPrice: data.price || 120 }));
        }

        // Fetch fresh data
        const [balanceRes, priceRes] = await Promise.all([
          fetch('/api/kaus/balance').catch(() => null),
          fetch('/api/kaus/price').catch(() => null),
        ]);

        if (balanceRes?.ok) {
          const data = await balanceRes.json();
          setState((prev) => ({ ...prev, kausBalance: data.balance || 0 }));
        }

        if (priceRes?.ok) {
          const data = await priceRes.json();
          setState((prev) => ({ ...prev, kausPrice: data.price || 120 }));
        }
      } catch {
        console.log('[Nexus] Using cached/default data');
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    fetchData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Network status
  useEffect(() => {
    const handleOnline = () => setState((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState((prev) => ({ ...prev, isOnline: false }));

    setState((prev) => ({ ...prev, isOnline: navigator.onLine }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <NexusContext.Provider value={state}>
      {children}
    </NexusContext.Provider>
  );
}

/**
 * Quick Access Bar - KAUS 잔액 및 상태 표시
 */
export function QuickAccessBar() {
  const { kausPrice, kausBalance, isOnline, membershipTier } = useNexus();

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-[#171717] text-white text-xs">
      {/* Online Status */}
      <div className="flex items-center gap-1">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isOnline ? 'bg-emerald-400' : 'bg-red-400'
          }`}
        />
        <span className="text-white/50">
          {isOnline ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {/* KAUS Price */}
      <div className="flex items-center gap-1">
        <span>🪙</span>
        <span className="font-bold">₩{kausPrice}</span>
      </div>

      {/* KAUS Balance */}
      <div className="flex items-center gap-1 ml-auto">
        <span className="text-white/50">Balance:</span>
        <span className="font-bold text-amber-400">
          {kausBalance.toLocaleString()} KAUS
        </span>
      </div>

      {/* Membership Badge */}
      {membershipTier !== 'basic' && (
        <div
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            membershipTier === 'sovereign'
              ? 'bg-purple-500/20 text-purple-400'
              : 'bg-amber-500/20 text-amber-400'
          }`}
        >
          {membershipTier.toUpperCase()}
        </div>
      )}
    </div>
  );
}
