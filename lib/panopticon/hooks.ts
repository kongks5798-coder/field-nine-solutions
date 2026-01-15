'use client';

/**
 * Panopticon React Hooks
 * CEO 대시보드 실시간 데이터 훅
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

interface DashboardData {
  financial: {
    monthlyRevenue: { value: string; raw: number; change: number; targetAchievement: number };
    operatingMargin: { value: string; raw: number };
  };
  musinsa: {
    ranking: {
      overall: number;
      category: number;
      categoryName: string;
      change: string;
      changeAmount: number;
    };
    sales: {
      total: string;
      today: string;
      settlement: string;
      pending: string;
    };
  };
  cs: {
    total: number;
    pending: number;
    urgent: number;
    today: number;
    status: 'normal' | 'warning' | 'critical';
  };
  server: {
    name: string;
    status: string;
    cpu: number;
    memory: number;
    gpu?: number;
    temperature?: number;
    uptime: number;
  };
  production: Array<{
    brand: string;
    item: string;
    status: string;
    progress: number;
    quantity: number;
    dDay: number;
    notes?: string;
  }>;
}

interface JarvisResponse {
  success: boolean;
  query: string;
  answer: string;
  data: unknown;
  timestamp: string;
}

// ============================================
// Dashboard Data Hook
// ============================================

export function useDashboardData(refreshInterval = 30000) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/panopticon/dashboard');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setIsLive(result.meta.isLive);
        setLastUpdated(new Date(result.meta.lastUpdated));
        setError(null);
      } else {
        setError(result.error || '데이터 로드 실패');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '네트워크 오류');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    isLive,
    refresh: fetchData,
  };
}

// ============================================
// Jarvis AI Hook
// ============================================

export function useJarvis() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ query: string; answer: string; timestamp: Date }>>([]);

  const askJarvis = useCallback(async (query: string): Promise<JarvisResponse | null> => {
    setLoading(true);

    try {
      const response = await fetch('/api/jarvis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const result: JarvisResponse = await response.json();

      if (result.success) {
        setHistory((prev) => [
          ...prev,
          { query, answer: result.answer, timestamp: new Date(result.timestamp) },
        ]);
      }

      return result;
    } catch (err) {
      console.error('[Jarvis] Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    askJarvis,
    loading,
    history,
    clearHistory,
  };
}

// ============================================
// Real-time Subscription Hook
// ============================================

type TableName =
  | 'panopticon_financial'
  | 'panopticon_musinsa_ranking'
  | 'panopticon_musinsa_sales'
  | 'panopticon_cs_reports'
  | 'panopticon_server_status'
  | 'panopticon_production';

export function useRealtimeSubscription<T>(
  table: TableName,
  onUpdate: (data: T) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.warn('[Panopticon] Supabase not configured for realtime');
      return;
    }

    const client = createClient(url, key);

    channelRef.current = client
      .channel(`panopticon-${table}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: table,
        },
        (payload) => {
          onUpdate(payload.new as T);
        }
      )
      .subscribe((status) => {
        console.log(`[Panopticon] ${table} subscription:`, status);
      });

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [table, onUpdate]);

  return channelRef.current;
}

// ============================================
// Server Status Hook (Polling + Realtime)
// ============================================

export function useServerStatus(pollInterval = 10000) {
  const [status, setStatus] = useState<{
    name: string;
    status: 'online' | 'offline' | 'warning';
    cpu: number;
    memory: number;
    gpu?: number;
    temperature?: number;
    uptime: number;
    connected: boolean;
    latency?: number;
  } | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/panopticon/dashboard');
        const result = await response.json();

        if (result.success) {
          setStatus({
            ...result.data.server,
            connected: result.meta.serverConnected,
            latency: result.meta.serverLatency,
          });
        }
      } catch (err) {
        console.error('[ServerStatus] Error:', err);
        setStatus((prev) => (prev ? { ...prev, connected: false } : null));
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval]);

  return status;
}

// ============================================
// Production Status Hook
// ============================================

export function useProductionStatus() {
  const [production, setProduction] = useState<
    Array<{
      id: string;
      brand: string;
      item: string;
      status: string;
      progress: number;
      quantity: number;
      dDay: number;
      notes?: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduction = async () => {
      try {
        const response = await fetch('/api/panopticon/dashboard');
        const result = await response.json();

        if (result.success) {
          setProduction(result.data.production);
        }
      } catch (err) {
        console.error('[Production] Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduction();
  }, []);

  // 실시간 업데이트 구독
  useRealtimeSubscription<{ id: string; brand: string; item: string; status: string; progress: number }>(
    'panopticon_production',
    (newData) => {
      setProduction((prev) => {
        const existing = prev.findIndex((p) => p.id === newData.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { ...updated[existing], ...newData };
          return updated;
        }
        return prev;
      });
    }
  );

  return { production, loading };
}

// ============================================
// Notification Hook
// ============================================

export function usePanopticonNotifications() {
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: 'info' | 'warning' | 'critical';
      title: string;
      message: string;
      timestamp: Date;
      read: boolean;
    }>
  >([]);

  // CS 긴급 건 알림
  useRealtimeSubscription<{ urgent_cases: number }>(
    'panopticon_cs_reports',
    (data) => {
      if (data.urgent_cases > 5) {
        setNotifications((prev) => [
          {
            id: `cs-${Date.now()}`,
            type: 'critical',
            title: '긴급 CS 알림',
            message: `긴급 처리 필요 건: ${data.urgent_cases}건`,
            timestamp: new Date(),
            read: false,
          },
          ...prev,
        ]);
      }
    }
  );

  // 서버 상태 알림
  useRealtimeSubscription<{ status: string; cpu_usage: number; temperature?: number }>(
    'panopticon_server_status',
    (data) => {
      if (data.status === 'warning' || data.status === 'offline') {
        setNotifications((prev) => [
          {
            id: `server-${Date.now()}`,
            type: data.status === 'offline' ? 'critical' : 'warning',
            title: '서버 상태 알림',
            message: `서버 상태: ${data.status}${data.temperature ? `, 온도: ${data.temperature}°C` : ''}`,
            timestamp: new Date(),
            read: false,
          },
          ...prev,
        ]);
      }
    }
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    markAsRead,
    clearAll,
  };
}
