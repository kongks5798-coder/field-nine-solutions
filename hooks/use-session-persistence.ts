/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 76: SESSION PERSISTENCE & STATE RESTORATION
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 앱 상태 복원 및 세션 유지
 * - 마지막 방문 페이지 기억
 * - 폼 데이터 자동 저장
 * - 스크롤 위치 복원
 * - 탭 상태 유지
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const STORAGE_PREFIX = 'nexus:';
const SESSION_EXPIRY = 30 * 60 * 1000; // 30 minutes

interface SessionData {
  timestamp: number;
  pathname: string;
  scrollY: number;
  state: Record<string, unknown>;
}

/**
 * Hook to persist and restore last visited route
 */
export function useLastVisitedRoute() {
  const pathname = usePathname();

  useEffect(() => {
    // Only track nexus routes
    if (pathname && pathname.includes('/nexus/')) {
      localStorage.setItem(`${STORAGE_PREFIX}lastRoute`, pathname);
      localStorage.setItem(`${STORAGE_PREFIX}lastVisit`, Date.now().toString());
    }
  }, [pathname]);

  const getLastRoute = useCallback((): string | null => {
    const lastRoute = localStorage.getItem(`${STORAGE_PREFIX}lastRoute`);
    const lastVisit = localStorage.getItem(`${STORAGE_PREFIX}lastVisit`);

    if (!lastRoute || !lastVisit) return null;

    const elapsed = Date.now() - parseInt(lastVisit);
    if (elapsed > SESSION_EXPIRY) {
      localStorage.removeItem(`${STORAGE_PREFIX}lastRoute`);
      localStorage.removeItem(`${STORAGE_PREFIX}lastVisit`);
      return null;
    }

    return lastRoute;
  }, []);

  return { getLastRoute };
}

/**
 * Hook to persist scroll position
 */
export function useScrollRestore(key?: string) {
  const pathname = usePathname();
  const scrollKey = key || pathname;
  const isRestoringRef = useRef(false);

  // Save scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (isRestoringRef.current) return;
      sessionStorage.setItem(`${STORAGE_PREFIX}scroll:${scrollKey}`, window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollKey]);

  // Restore scroll position
  useEffect(() => {
    const savedScroll = sessionStorage.getItem(`${STORAGE_PREFIX}scroll:${scrollKey}`);
    if (savedScroll) {
      isRestoringRef.current = true;
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScroll));
        isRestoringRef.current = false;
      }, 100);
    }
  }, [scrollKey]);
}

/**
 * Hook to persist form data
 */
export function useFormPersistence<T extends Record<string, unknown>>(
  formKey: string,
  initialValues: T
) {
  const [values, setValues] = useState<T>(initialValues);
  const storageKey = `${STORAGE_PREFIX}form:${formKey}`;

  // Load saved values on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check if not expired (5 minutes)
        if (parsed.timestamp && Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          setValues(parsed.data);
        } else {
          sessionStorage.removeItem(storageKey);
        }
      }
    } catch {
      sessionStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  // Save values on change
  const updateValues = useCallback((newValues: Partial<T>) => {
    setValues((prev) => {
      const updated = { ...prev, ...newValues };
      sessionStorage.setItem(storageKey, JSON.stringify({
        timestamp: Date.now(),
        data: updated,
      }));
      return updated;
    });
  }, [storageKey]);

  // Clear saved values
  const clearForm = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    setValues(initialValues);
  }, [storageKey, initialValues]);

  return { values, updateValues, clearForm };
}

/**
 * Hook to persist tab selection
 */
export function useTabPersistence(
  tabKey: string,
  defaultTab: string
): [string, (tab: string) => void] {
  const storageKey = `${STORAGE_PREFIX}tab:${tabKey}`;
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Load saved tab on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      setActiveTab(saved);
    }
  }, [storageKey]);

  // Save tab on change
  const setTab = useCallback((tab: string) => {
    sessionStorage.setItem(storageKey, tab);
    setActiveTab(tab);
  }, [storageKey]);

  return [activeTab, setTab];
}

/**
 * Hook to persist generic state
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T,
  options: { storage?: 'local' | 'session'; expiry?: number } = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const { storage = 'session', expiry = SESSION_EXPIRY } = options;
  const storageKey = `${STORAGE_PREFIX}state:${key}`;
  const storageApi = storage === 'local' ? localStorage : sessionStorage;

  const [state, setStateInternal] = useState<T>(() => {
    try {
      const saved = storageApi.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.timestamp && Date.now() - parsed.timestamp < expiry) {
          return parsed.value;
        }
        storageApi.removeItem(storageKey);
      }
    } catch {
      storageApi.removeItem(storageKey);
    }
    return initialValue;
  });

  const setState = useCallback((value: T | ((prev: T) => T)) => {
    setStateInternal((prev) => {
      const newValue = typeof value === 'function'
        ? (value as (prev: T) => T)(prev)
        : value;
      storageApi.setItem(storageKey, JSON.stringify({
        timestamp: Date.now(),
        value: newValue,
      }));
      return newValue;
    });
  }, [storageKey, storageApi]);

  const clearState = useCallback(() => {
    storageApi.removeItem(storageKey);
    setStateInternal(initialValue);
  }, [storageKey, storageApi, initialValue]);

  return [state, setState, clearState];
}

/**
 * Hook to restore full session state
 */
export function useSessionRestore() {
  const pathname = usePathname();

  useEffect(() => {
    // Save session data periodically
    const saveSession = () => {
      const sessionData: SessionData = {
        timestamp: Date.now(),
          pathname: pathname || '',
        scrollY: window.scrollY,
        state: {},
      };
      localStorage.setItem(`${STORAGE_PREFIX}session`, JSON.stringify(sessionData));
    };

    // Save on visibility change (app going to background)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveSession();
      }
    };

    // Save on beforeunload
    const handleBeforeUnload = () => {
      saveSession();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname]);

  const getSession = useCallback((): SessionData | null => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}session`);
      if (!saved) return null;

      const session: SessionData = JSON.parse(saved);
      if (Date.now() - session.timestamp > SESSION_EXPIRY) {
        localStorage.removeItem(`${STORAGE_PREFIX}session`);
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }, []);

  return { getSession };
}

/**
 * Hook to track and restore search/filter state
 */
export function useSearchState(
  key: string,
  defaultValues: { query: string; filters: Record<string, unknown> }
) {
  const storageKey = `${STORAGE_PREFIX}search:${key}`;

  const [searchState, setSearchState] = useState(defaultValues);

  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSearchState(parsed);
      } catch {
        sessionStorage.removeItem(storageKey);
      }
    }
  }, [storageKey]);

  const updateSearch = useCallback((updates: Partial<typeof defaultValues>) => {
    setSearchState((prev) => {
      const updated = { ...prev, ...updates };
      sessionStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  }, [storageKey]);

  const clearSearch = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    setSearchState(defaultValues);
  }, [storageKey, defaultValues]);

  return { searchState, updateSearch, clearSearch };
}

/**
 * Hook to cache KAUS balance in localStorage
 */
export function useBalanceCache() {
  const CACHE_KEY = 'kaus-balance';

  const cacheBalance = useCallback((balance: number) => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      value: balance,
      timestamp: Date.now(),
    }));
  }, []);

  const getCachedBalance = useCallback((): number | null => {
    try {
      const saved = localStorage.getItem(CACHE_KEY);
      if (!saved) return null;

      const { value, timestamp } = JSON.parse(saved);
      // Cache valid for 5 minutes
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return value;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  return { cacheBalance, getCachedBalance };
}
