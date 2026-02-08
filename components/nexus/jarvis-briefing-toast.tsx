'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 83: JARVIS PROACTIVE BRIEFING TOAST - IMPERIAL GRADE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Real-time briefings from the Economic Brain
 * - Cyan glow for system updates
 * - Scan-line visual effect
 * - Digital noise audio on appearance
 * - Animated entry/exit
 * - Auto-dismiss with manual override
 * - Haptic feedback on mobile
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvisBriefings } from '@/hooks/use-system-events';
import { useTactileFeedback } from '@/hooks/use-tactile-feedback';
import type { JarvisBriefing } from '@/lib/system-events';

// Digital noise sound generator
function playDigitalNoise(duration: number = 200) {
  if (typeof window === 'undefined' || !window.AudioContext) return;

  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Create white noise
    const bufferSize = audioContext.sampleRate * (duration / 1000);
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.1; // Low volume noise
    }

    // Create source and filter
    const source = audioContext.createBufferSource();
    source.buffer = buffer;

    const filter = audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;

    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.08, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);

    source.start();
    source.stop(audioContext.currentTime + duration / 1000);
  } catch {
    // Audio not supported
  }
}

interface JarvisBriefingToastProps {
  autoDismissMs?: number;
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
}

export function JarvisBriefingToast({
  autoDismissMs = 8000,
  position = 'top-right',
}: JarvisBriefingToastProps) {
  const { currentBriefing, dismissBriefing, queueLength, isConnected } = useJarvisBriefings();
  const [isVisible, setIsVisible] = useState(false);
  const [showScanLine, setShowScanLine] = useState(false);
  const tactile = useTactileFeedback();
  const hasPlayedRef = useRef(false);

  // Show/hide animation with sound and scan-line
  useEffect(() => {
    if (currentBriefing && !hasPlayedRef.current) {
      setIsVisible(true);
      setShowScanLine(true);

      // Play digital noise sound
      playDigitalNoise(300);

      // Tactile feedback based on priority
      if (currentBriefing.priority === 'critical') {
        tactile.critical();
      } else if (currentBriefing.priority === 'high') {
        tactile.notification();
      } else {
        tactile.tap();
      }

      hasPlayedRef.current = true;

      // Hide scan-line after animation
      setTimeout(() => setShowScanLine(false), 500);

      // Auto-dismiss (unless critical)
      if (currentBriefing.priority !== 'critical') {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(dismissBriefing, 300);
        }, autoDismissMs);

        return () => clearTimeout(timer);
      }
    }

    // Reset ref when briefing changes
    if (!currentBriefing) {
      hasPlayedRef.current = false;
    }
  }, [currentBriefing, autoDismissMs, dismissBriefing, tactile]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(dismissBriefing, 300);
  }, [dismissBriefing]);

  // Position styles
  const positionStyles: Record<string, string> = {
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  // Priority styles
  const getPriorityStyles = (priority: JarvisBriefing['priority']) => {
    switch (priority) {
      case 'critical':
        return {
          border: 'border-red-500/50',
          glow: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]',
          accent: 'text-red-400',
          bg: 'bg-red-950/20',
        };
      case 'high':
        return {
          border: 'border-cyan-500/50',
          glow: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]',
          accent: 'text-cyan-400',
          bg: 'bg-cyan-950/20',
        };
      default:
        return {
          border: 'border-white/10',
          glow: 'shadow-xl',
          accent: 'text-neutral-400',
          bg: 'bg-neutral-900/80',
        };
    }
  };

  if (!currentBriefing) return null;

  const styles = getPriorityStyles(currentBriefing.priority);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`fixed ${positionStyles[position]} z-50 max-w-md`}
        >
          <div
            className={`
              relative overflow-hidden rounded-xl border backdrop-blur-xl
              ${styles.border} ${styles.glow} ${styles.bg}
            `}
          >
            {/* Animated top accent line */}
            <motion.div
              className={`absolute top-0 left-0 h-0.5 ${
                currentBriefing.priority === 'critical' ? 'bg-red-500' : 'bg-cyan-500'
              }`}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: autoDismissMs / 1000, ease: 'linear' }}
            />

            {/* Content */}
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  {/* Jarvis Avatar */}
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      ${currentBriefing.priority === 'critical' ? 'bg-red-500/20' : 'bg-cyan-500/20'}
                    `}
                  >
                    <svg
                      className={`w-4 h-4 ${currentBriefing.priority === 'critical' ? 'text-red-400' : 'text-cyan-400'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>

                  <div>
                    <div className={`text-xs font-medium uppercase tracking-wider ${styles.accent}`}>
                      JARVIS
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      {new Date(currentBriefing.timestamp).toLocaleTimeString('ko-KR')}
                    </div>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={handleDismiss}
                  className="text-neutral-500 hover:text-white transition-colors p-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Title */}
              <h4 className="text-white font-semibold text-sm mb-1">
                {currentBriefing.title}
              </h4>

              {/* Message */}
              <p className="text-neutral-300 text-sm leading-relaxed">
                {currentBriefing.message}
              </p>

              {/* Recommendation */}
              {currentBriefing.recommendation && (
                <div
                  className={`
                    mt-3 px-3 py-2 rounded-lg text-xs font-medium
                    ${currentBriefing.priority === 'critical'
                      ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                      : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                    }
                  `}
                >
                  {currentBriefing.recommendation}
                </div>
              )}

              {/* Queue indicator */}
              {queueLength > 0 && (
                <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
                  <div className="flex -space-x-1">
                    {Array.from({ length: Math.min(queueLength, 3) }).map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-neutral-600"
                        style={{ opacity: 1 - i * 0.2 }}
                      />
                    ))}
                  </div>
                  <span>+{queueLength} more</span>
                </div>
              )}
            </div>

            {/* PHASE 83: Scan-line effect */}
            <AnimatePresence>
              {showScanLine && (
                <motion.div
                  initial={{ top: 0 }}
                  animate={{ top: '100%' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'linear' }}
                  className="absolute left-0 right-0 h-[2px] bg-gradient-to-b from-transparent via-[#00E5FF]/80 to-transparent pointer-events-none z-10"
                  style={{ boxShadow: '0 0 10px rgba(0,229,255,0.5)' }}
                />
              )}
            </AnimatePresence>

            {/* CRT scanlines overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
              }}
            />

            {/* Pulse animation for critical */}
            {currentBriefing.priority === 'critical' && (
              <motion.div
                className="absolute inset-0 border-2 border-red-500/50 rounded-xl pointer-events-none"
                animate={{ opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STANDALONE CONNECTION STATUS INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════

export function SystemEventConnectionStatus() {
  const { isConnected } = useJarvisBriefings();

  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`}
      />
      <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
        {isConnected ? 'Economic Brain Connected' : 'Disconnected'}
      </span>
    </div>
  );
}
