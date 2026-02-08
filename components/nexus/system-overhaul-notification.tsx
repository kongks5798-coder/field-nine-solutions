/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 80: SYSTEM OVERHAUL NOTIFICATION
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Real-time notification when admin changes system multipliers
 * - Cyan flash effect across entire screen
 * - Dramatic "SYSTEM OVERHAUL" announcement
 * - Auto-dismiss with multiplier details
 *
 * Broadcasts to ALL users when Emperor changes settings
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { triggerFeedback } from './neon-effects';

interface MultiplierChange {
  type: 'energy' | 'kaus' | 'smp';
  oldValue: number;
  newValue: number;
  modifiedBy: string;
  timestamp: string;
}

interface SystemOverhaulProps {
  /** Is notification active? */
  isActive: boolean;
  /** Multiplier change details */
  change?: MultiplierChange;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Auto-dismiss duration (ms) */
  autoDismiss?: number;
}

export function SystemOverhaulNotification({
  isActive,
  change,
  onDismiss,
  autoDismiss = 5000,
}: SystemOverhaulProps) {
  useEffect(() => {
    if (!isActive) return;

    // Trigger dramatic feedback
    triggerFeedback('transaction', { haptic: true, sound: true });

    // Auto dismiss
    if (autoDismiss && onDismiss) {
      const timer = setTimeout(onDismiss, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [isActive, autoDismiss, onDismiss]);

  const multiplierLabels = {
    energy: 'Energy Exchange Rate',
    kaus: 'KAUS Multiplier',
    smp: 'SMP Adjustment',
  };

  const formatValue = (type: string, value: number) => {
    if (type === 'smp') return `${value >= 0 ? '+' : ''}${value} KRW/kWh`;
    return `${value.toFixed(2)}x`;
  };

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Full-screen cyan flash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0.2, 0.4, 0] }}
            transition={{ duration: 1, times: [0, 0.1, 0.3, 0.5, 1] }}
            className="fixed inset-0 z-[100] pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(0,229,255,0.8) 0%, rgba(0,229,255,0.2) 50%, transparent 70%)',
            }}
          />

          {/* Scan line effect */}
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: '200%' }}
            transition={{ duration: 0.8, ease: 'linear' }}
            className="fixed inset-x-0 h-2 z-[100] pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, #00E5FF 50%, transparent 100%)',
              boxShadow: '0 0 50px #00E5FF, 0 0 100px #00E5FF',
            }}
          />

          {/* Main notification card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -50 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[101] w-full max-w-md px-4"
          >
            <div className="bg-[#0a0a0a]/95 backdrop-blur-xl border-2 border-[#00E5FF] rounded-2xl overflow-hidden">
              {/* Animated border glow */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(0,229,255,0.5), inset 0 0 20px rgba(0,229,255,0.1)',
                    '0 0 40px rgba(0,229,255,0.8), inset 0 0 40px rgba(0,229,255,0.2)',
                    '0 0 20px rgba(0,229,255,0.5), inset 0 0 20px rgba(0,229,255,0.1)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-2xl pointer-events-none"
              />

              {/* Header with animated gradient */}
              <div className="relative px-6 py-4 bg-gradient-to-r from-[#00E5FF]/20 via-[#00E5FF]/10 to-[#00E5FF]/20">
                <motion.div
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                />
                <div className="relative flex items-center gap-3">
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="text-3xl"
                  >
                    ⚡
                  </motion.span>
                  <div>
                    <h3 className="text-xl font-black text-[#00E5FF] tracking-wider">
                      SYSTEM OVERHAUL
                    </h3>
                    <p className="text-xs text-white/50 font-mono">
                      EMPEROR DIRECTIVE EXECUTED
                    </p>
                  </div>
                </div>
              </div>

              {/* Change details */}
              {change && (
                <div className="px-6 py-4 space-y-3">
                  <div className="text-sm text-white/70">
                    {multiplierLabels[change.type]} Updated
                  </div>

                  <div className="flex items-center justify-center gap-4 py-2">
                    <div className="text-center">
                      <div className="text-2xl font-mono text-white/50 line-through">
                        {formatValue(change.type, change.oldValue)}
                      </div>
                      <div className="text-xs text-white/30">Previous</div>
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, repeat: 3 }}
                      className="text-2xl text-[#00E5FF]"
                    >
                      →
                    </motion.div>
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                        className="text-3xl font-black text-[#00E5FF]"
                        style={{
                          textShadow: '0 0 20px rgba(0,229,255,0.5)',
                        }}
                      >
                        {formatValue(change.type, change.newValue)}
                      </motion.div>
                      <div className="text-xs text-[#00E5FF]/70">New Rate</div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs text-white/40">
                    <span>By: {change.modifiedBy}</span>
                    <span>{new Date(change.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              )}

              {/* Progress bar for auto-dismiss */}
              {autoDismiss && (
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: autoDismiss / 1000, ease: 'linear' }}
                  className="h-1 bg-[#00E5FF]"
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to listen for real-time multiplier changes
 */
export function useSystemOverhaul() {
  const [isActive, setIsActive] = useState(false);
  const [change, setChange] = useState<MultiplierChange | undefined>();
  const [lastMultipliers, setLastMultipliers] = useState<{
    energy: number;
    kaus: number;
    smp: number;
  } | null>(null);

  const checkForChanges = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/system-control/multiplier');
      if (!res.ok) return;

      const data = await res.json();
      if (!data.success || !data.settings) return;

      const current = {
        energy: data.settings.energyMultiplier,
        kaus: data.settings.kausMultiplier,
        smp: data.settings.smpAdjustment,
      };

      if (lastMultipliers) {
        // Check for changes
        if (current.energy !== lastMultipliers.energy) {
          setChange({
            type: 'energy',
            oldValue: lastMultipliers.energy,
            newValue: current.energy,
            modifiedBy: data.settings.modifiedBy || 'EMPEROR',
            timestamp: data.settings.lastModified || new Date().toISOString(),
          });
          setIsActive(true);
        } else if (current.kaus !== lastMultipliers.kaus) {
          setChange({
            type: 'kaus',
            oldValue: lastMultipliers.kaus,
            newValue: current.kaus,
            modifiedBy: data.settings.modifiedBy || 'EMPEROR',
            timestamp: data.settings.lastModified || new Date().toISOString(),
          });
          setIsActive(true);
        } else if (current.smp !== lastMultipliers.smp) {
          setChange({
            type: 'smp',
            oldValue: lastMultipliers.smp,
            newValue: current.smp,
            modifiedBy: data.settings.modifiedBy || 'EMPEROR',
            timestamp: data.settings.lastModified || new Date().toISOString(),
          });
          setIsActive(true);
        }
      }

      setLastMultipliers(current);
    } catch (error) {
      console.error('[System Overhaul] Error checking multipliers:', error);
    }
  }, [lastMultipliers]);

  useEffect(() => {
    // Initial fetch
    checkForChanges();

    // Poll every 10 seconds for changes
    const interval = setInterval(checkForChanges, 10000);
    return () => clearInterval(interval);
  }, [checkForChanges]);

  const dismiss = useCallback(() => {
    setIsActive(false);
    setChange(undefined);
  }, []);

  return {
    isActive,
    change,
    dismiss,
    refresh: checkForChanges,
  };
}

export default SystemOverhaulNotification;
