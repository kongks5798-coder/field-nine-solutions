/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 80: ABSOLUTE TRUTH PROTOCOL - PRIMARY NODE STATUS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Zero mock data tolerance. When real data is unavailable:
 * - Display "Primary Node Reconnecting..." instead of fake numbers
 * - Show reconnection progress
 * - High-tech visual feedback
 *
 * This component replaces ALL mock/fallback data displays
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface PrimaryNodeStatusProps {
  /** Is the primary data source connected? */
  isConnected: boolean;
  /** Name of the data source */
  source?: string;
  /** Retry callback */
  onRetry?: () => void;
  /** Custom message */
  message?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show as inline or block */
  inline?: boolean;
}

export function PrimaryNodeStatus({
  isConnected,
  source = 'Primary Node',
  onRetry,
  message,
  size = 'md',
  inline = false,
}: PrimaryNodeStatusProps) {
  const [dots, setDots] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // Animated dots
  useEffect(() => {
    if (isConnected) return;
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Auto-retry counter
  useEffect(() => {
    if (isConnected) {
      setRetryCount(0);
      return;
    }
    const interval = setInterval(() => {
      setRetryCount(prev => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [isConnected]);

  const sizeClasses = {
    sm: 'text-xs p-2',
    md: 'text-sm p-3',
    lg: 'text-base p-4',
  };

  if (isConnected) return null;

  const content = (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        ${inline ? 'inline-flex' : 'flex'}
        items-center gap-3 rounded-xl
        bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10
        border border-amber-500/30
        ${sizeClasses[size]}
      `}
    >
      {/* Animated reconnection indicator */}
      <div className="relative">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-3 h-3 rounded-full bg-amber-500"
          style={{
            boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
          }}
        />
        {/* Ripple effect */}
        <motion.div
          animate={{
            scale: [1, 2.5],
            opacity: [0.5, 0],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 rounded-full border border-amber-500"
        />
      </div>

      {/* Status text */}
      <div className="flex-1">
        <div className="font-bold text-amber-400 flex items-center gap-1">
          <span>{source} Reconnecting</span>
          <span className="w-6 text-left">{dots}</span>
        </div>
        {message && (
          <div className="text-amber-300/70 text-xs mt-0.5">
            {message}
          </div>
        )}
        {retryCount > 0 && (
          <div className="text-amber-300/50 text-xs mt-0.5">
            Attempt #{retryCount + 1} in progress
          </div>
        )}
      </div>

      {/* Retry button */}
      {onRetry && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-400 text-xs font-bold hover:bg-amber-500/30 transition-colors"
        >
          Retry
        </motion.button>
      )}
    </motion.div>
  );

  return <AnimatePresence>{content}</AnimatePresence>;
}

/**
 * Display placeholder for loading/reconnecting state
 * Use this instead of showing mock data
 */
interface DataPlaceholderProps {
  /** Type of data being loaded */
  type?: 'number' | 'text' | 'chart';
  /** Width class */
  width?: string;
  /** Is currently loading? */
  isLoading?: boolean;
  /** Source name for reconnecting state */
  source?: string;
}

export function DataPlaceholder({
  type = 'number',
  width = 'w-20',
  isLoading = true,
  source = 'Node',
}: DataPlaceholderProps) {
  const [opacity, setOpacity] = useState(0.3);

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setOpacity(prev => (prev === 0.3 ? 0.6 : 0.3));
    }, 800);
    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <motion.div
      className={`${width} h-6 rounded bg-white/10 flex items-center justify-center overflow-hidden`}
      style={{ opacity }}
      transition={{ duration: 0.4 }}
    >
      {type === 'number' && (
        <span className="text-white/30 text-xs font-mono">---</span>
      )}
      {type === 'text' && (
        <span className="text-white/30 text-xs">Loading...</span>
      )}
    </motion.div>
  );
}

/**
 * Hook to manage connection status and auto-retry
 */
export function useNodeConnection(
  fetchFn: () => Promise<boolean>,
  retryInterval = 10000
) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const result = await fetchFn();
      setIsConnected(result);
      setError(null);
    } catch (e) {
      setIsConnected(false);
      setError(e instanceof Error ? e.message : 'Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, retryInterval);
    return () => clearInterval(interval);
  }, [retryInterval]);

  return {
    isConnected,
    isLoading,
    error,
    retry: checkConnection,
  };
}

/**
 * System-wide reconnecting banner
 * Shows when any critical data source is unavailable
 */
export function SystemReconnectingBanner({
  sources,
}: {
  sources: { name: string; connected: boolean }[];
}) {
  const disconnected = sources.filter(s => !s.connected);

  if (disconnected.length === 0) return null;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-50 p-2"
    >
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-r from-amber-900/90 via-orange-900/90 to-amber-900/90 backdrop-blur-md border border-amber-500/40 rounded-xl px-4 py-3 flex items-center gap-4">
          {/* Pulsing icon */}
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-2xl"
          >
            ⚡
          </motion.div>

          {/* Status info */}
          <div className="flex-1">
            <div className="font-bold text-amber-300 text-sm">
              Primary Node Reconnecting...
            </div>
            <div className="text-amber-200/70 text-xs">
              {disconnected.map(s => s.name).join(', ')} - Attempting to establish connection
            </div>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-amber-500"
            />
            <span className="text-amber-400 text-xs font-mono">
              {disconnected.length}/{sources.length} OFFLINE
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default PrimaryNodeStatus;
