'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 82: VAULT SESSION MANAGEMENT - IMPERIAL SECURITY PROTOCOL
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Sovereign-grade session security for the Central Bank Vault
 * - 5-minute auto-lock timeout
 * - Activity-based session refresh
 * - Secure session storage
 * - Audit trail for all access
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const SESSION_WARNING_MS = 60 * 1000; // Warning 1 minute before timeout
const SESSION_KEY = 'f9_vault_session';
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'];

interface VaultSession {
  unlockedAt: number;
  lastActivity: number;
  signature: string;
}

interface UseVaultSessionOptions {
  onTimeout?: () => void;
  onWarning?: (remainingMs: number) => void;
  onActivity?: () => void;
}

interface UseVaultSessionReturn {
  isSessionValid: boolean;
  remainingTime: number;
  isWarning: boolean;
  startSession: () => void;
  endSession: () => void;
  refreshSession: () => void;
}

function generateSessionSignature(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 16);
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'ssr';
  // Simple hash for audit purposes
  const data = `${timestamp}-${random}-${userAgent}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `VSN_${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

export function useVaultSession(options: UseVaultSessionOptions = {}): UseVaultSessionReturn {
  const { onTimeout, onWarning, onActivity } = options;

  const [isSessionValid, setIsSessionValid] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isWarning, setIsWarning] = useState(false);

  const sessionRef = useRef<VaultSession | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activityThrottleRef = useRef<number>(0);

  // Load session from storage
  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;

    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const session: VaultSession = JSON.parse(stored);
        const elapsed = Date.now() - session.lastActivity;

        if (elapsed < SESSION_TIMEOUT_MS) {
          sessionRef.current = session;
          setIsSessionValid(true);
          setRemainingTime(SESSION_TIMEOUT_MS - elapsed);
        } else {
          // Session expired
          sessionStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      // Invalid session data
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, []);

  // Session countdown timer
  useEffect(() => {
    if (!isSessionValid) return;

    timerRef.current = setInterval(() => {
      setRemainingTime(prev => {
        const newRemaining = prev - 1000;

        if (newRemaining <= 0) {
          // Session timeout
          setIsSessionValid(false);
          setIsWarning(false);
          sessionStorage.removeItem(SESSION_KEY);
          sessionRef.current = null;
          onTimeout?.();
          return 0;
        }

        // Warning check
        if (newRemaining <= SESSION_WARNING_MS && !isWarning) {
          setIsWarning(true);
          onWarning?.(newRemaining);
        }

        return newRemaining;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isSessionValid, isWarning, onTimeout, onWarning]);

  // Activity listeners for session refresh
  useEffect(() => {
    if (!isSessionValid) return;

    const handleActivity = () => {
      const now = Date.now();
      // Throttle activity updates to once per 5 seconds
      if (now - activityThrottleRef.current < 5000) return;
      activityThrottleRef.current = now;

      if (sessionRef.current) {
        sessionRef.current.lastActivity = now;
        setRemainingTime(SESSION_TIMEOUT_MS);
        setIsWarning(false);

        // Persist to storage
        try {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionRef.current));
        } catch {
          // Storage full or unavailable
        }

        onActivity?.();
      }
    };

    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isSessionValid, onActivity]);

  // Start a new session
  const startSession = useCallback(() => {
    const now = Date.now();
    const session: VaultSession = {
      unlockedAt: now,
      lastActivity: now,
      signature: generateSessionSignature(),
    };

    sessionRef.current = session;
    setIsSessionValid(true);
    setRemainingTime(SESSION_TIMEOUT_MS);
    setIsWarning(false);

    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // Storage unavailable
    }

    console.log(`[VaultSession] Session started: ${session.signature}`);
  }, []);

  // End session (manual logout)
  const endSession = useCallback(() => {
    if (sessionRef.current) {
      console.log(`[VaultSession] Session ended: ${sessionRef.current.signature}`);
    }

    sessionRef.current = null;
    setIsSessionValid(false);
    setRemainingTime(0);
    setIsWarning(false);

    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Storage unavailable
    }
  }, []);

  // Manually refresh session (extend timeout)
  const refreshSession = useCallback(() => {
    if (!sessionRef.current) return;

    const now = Date.now();
    sessionRef.current.lastActivity = now;
    setRemainingTime(SESSION_TIMEOUT_MS);
    setIsWarning(false);

    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionRef.current));
    } catch {
      // Storage unavailable
    }
  }, []);

  return {
    isSessionValid,
    remainingTime,
    isWarning,
    startSession,
    endSession,
    refreshSession,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION WARNING COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function formatRemainingTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `0:${remainingSeconds.toString().padStart(2, '0')}`;
}
