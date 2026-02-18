'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 83: MARKET ORACLE HOOK - REAL-TIME MARKET DATA
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * React hook for consuming real-time market oracle data
 * - Auto-updates every 30 seconds
 * - Provides dynamic APY calculations
 * - 8 decimal precision for yield values
 */

import { useState, useEffect, useCallback } from 'react';
import type { MarketOracleData, YieldProjection, YieldCalculationParams } from '@/lib/energy/market-oracle';

interface UseMarketOracleOptions {
  tier?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseMarketOracleReturn {
  data: MarketOracleData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  calculateYield: (params: Omit<YieldCalculationParams, 'tier'>) => Promise<YieldProjection | null>;
}

export function useMarketOracle(options: UseMarketOracleOptions = {}): UseMarketOracleReturn {
  const {
    tier = 'Bronze',
    autoRefresh = true,
    refreshInterval = 30000,
  } = options;

  const [data, setData] = useState<MarketOracleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Dynamic import to avoid SSR issues
      const { fetchMarketOracle } = await import('@/lib/energy/market-oracle');
      const oracleData = await fetchMarketOracle(tier);
      setData(oracleData);
      setError(null);
    } catch (err) {
      console.error('[useMarketOracle] Fetch error:', err);
      setError('Failed to fetch market data');
    } finally {
      setIsLoading(false);
    }
  }, [tier]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  // Calculate yield for a specific amount
  const calculateYield = useCallback(
    async (params: Omit<YieldCalculationParams, 'tier'>): Promise<YieldProjection | null> => {
      try {
        const { calculateYieldProjection } = await import('@/lib/energy/market-oracle');
        return await calculateYieldProjection({
          ...params,
          tier: tier as 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Sovereign' | 'Emperor',
        });
      } catch (err) {
        console.error('[useMarketOracle] Yield calculation error:', err);
        return null;
      }
    },
    [tier]
  );

  return {
    data,
    isLoading,
    error,
    refresh: fetchData,
    calculateYield,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIALIZED HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useDynamicAPY(tier: string = 'Bronze') {
  const { data, isLoading } = useMarketOracle({ tier });

  return {
    baseAPY: data?.yield.baseAPY ?? 0,
    energyBonus: data?.yield.energyBonus ?? 0,
    reserveBonus: data?.yield.reserveBonus ?? 0,
    volatilityAdjustment: data?.yield.volatilityAdjustment ?? 0,
    totalAPY: data?.yield.totalAPY ?? 0,
    isLoading,
  };
}

export function useSMPData() {
  const { data, isLoading } = useMarketOracle();

  return {
    current: data?.smp.current ?? 0,
    peak: data?.smp.peak ?? 0,
    offPeak: data?.smp.offPeak ?? 0,
    average24h: data?.smp.average24h ?? 0,
    trend: data?.smp.trend ?? 'stable',
    isLoading,
  };
}

export function useEnergyProduction() {
  const { data, isLoading } = useMarketOracle();

  return {
    currentOutputMW: data?.production.currentOutputMW ?? 0,
    dailyGenerationMWh: data?.production.dailyGenerationMWh ?? 0,
    efficiency: data?.production.efficiency ?? 0,
    utilizationRate: data?.production.utilizationRate ?? 0,
    isLoading,
  };
}
