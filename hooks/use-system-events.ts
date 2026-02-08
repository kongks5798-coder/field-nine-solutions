'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 82: SYSTEM EVENTS HOOK - CLIENT-SIDE SSE CONSUMER
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Real-time connection to the Economic Brain
 * - Receives Central Bank operations instantly
 * - Triggers Jarvis proactive briefings
 * - Updates dashboard metrics in real-time
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SystemEvent, ReserveMetrics, JarvisBriefing } from '@/lib/system-events';

interface SystemEventMessage {
  type: 'connected' | 'system_event' | 'heartbeat';
  event?: SystemEvent;
  briefing?: JarvisBriefing;
  metrics: ReserveMetrics;
  recentEvents?: SystemEvent[];
  timestamp: string;
}

interface UseSystemEventsOptions {
  autoConnect?: boolean;
  onEvent?: (event: SystemEvent, briefing: JarvisBriefing) => void;
  onMetricsUpdate?: (metrics: ReserveMetrics) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export function useSystemEvents(options: UseSystemEventsOptions = {}) {
  const {
    autoConnect = true,
    onEvent,
    onMetricsUpdate,
    onConnectionChange,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [metrics, setMetrics] = useState<ReserveMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<SystemEvent[]>([]);
  const [latestBriefing, setLatestBriefing] = useState<JarvisBriefing | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    // Don't reconnect if we've exceeded max attempts
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      setError('Maximum reconnection attempts exceeded');
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource('/api/events/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[SystemEvents] SSE Connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onConnectionChange?.(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data: SystemEventMessage = JSON.parse(event.data);

          // Update metrics
          if (data.metrics) {
            setMetrics(data.metrics);
            onMetricsUpdate?.(data.metrics);
          }

          // Handle different message types
          switch (data.type) {
            case 'connected':
              if (data.recentEvents) {
                setRecentEvents(data.recentEvents);
              }
              break;

            case 'system_event':
              if (data.event && data.briefing) {
                setRecentEvents((prev) => [data.event!, ...prev].slice(0, 50));
                setLatestBriefing(data.briefing);
                onEvent?.(data.event, data.briefing);

                // Trigger haptic feedback for high-priority events
                if (data.briefing.priority === 'critical' || data.briefing.priority === 'high') {
                  triggerHapticFeedback(data.briefing.priority);
                }
              }
              break;

            case 'heartbeat':
              // Just a keepalive, metrics already updated
              break;
          }
        } catch (parseError) {
          console.error('[SystemEvents] Failed to parse message:', parseError);
        }
      };

      eventSource.onerror = () => {
        console.error('[SystemEvents] SSE Error - attempting reconnect');
        setIsConnected(false);
        onConnectionChange?.(false);
        eventSource.close();

        // Exponential backoff for reconnection
        reconnectAttemptsRef.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`[SystemEvents] Reconnecting... (attempt ${reconnectAttemptsRef.current})`);
          connect();
        }, delay);
      };
    } catch (err) {
      console.error('[SystemEvents] Failed to create EventSource:', err);
      setError('Failed to connect to event stream');
    }
  }, [onEvent, onMetricsUpdate, onConnectionChange]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    metrics,
    recentEvents,
    latestBriefing,
    error,
    connect,
    disconnect,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HAPTIC FEEDBACK PATTERNS (Protocol 2: Physical UX)
// ═══════════════════════════════════════════════════════════════════════════════

function triggerHapticFeedback(priority: 'critical' | 'high' | 'normal') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    switch (priority) {
      case 'critical':
        // Urgent triple pulse pattern
        navigator.vibrate([100, 50, 100, 50, 200]);
        break;
      case 'high':
        // Double pulse pattern
        navigator.vibrate([100, 50, 150]);
        break;
      default:
        // Single subtle pulse
        navigator.vibrate(50);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// JARVIS BRIEFING QUEUE HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useJarvisBriefings() {
  const [briefingQueue, setBriefingQueue] = useState<JarvisBriefing[]>([]);
  const [currentBriefing, setCurrentBriefing] = useState<JarvisBriefing | null>(null);

  const addBriefing = useCallback((briefing: JarvisBriefing) => {
    setBriefingQueue((prev) => [...prev, briefing]);
  }, []);

  const dismissBriefing = useCallback(() => {
    setCurrentBriefing(null);
  }, []);

  // Process queue - show next briefing when current is dismissed
  useEffect(() => {
    if (!currentBriefing && briefingQueue.length > 0) {
      const [next, ...rest] = briefingQueue;
      setCurrentBriefing(next);
      setBriefingQueue(rest);
    }
  }, [currentBriefing, briefingQueue]);

  // Auto-connect to system events and queue briefings
  const { isConnected, metrics, latestBriefing } = useSystemEvents({
    onEvent: (event, briefing) => {
      // High-priority events go directly to current display
      if (briefing.priority === 'critical') {
        setCurrentBriefing(briefing);
      } else {
        addBriefing(briefing);
      }
    },
  });

  // Queue the latest briefing when it arrives
  useEffect(() => {
    if (latestBriefing) {
      addBriefing(latestBriefing);
    }
  }, [latestBriefing, addBriefing]);

  return {
    isConnected,
    metrics,
    currentBriefing,
    briefingQueue,
    dismissBriefing,
    queueLength: briefingQueue.length,
  };
}
