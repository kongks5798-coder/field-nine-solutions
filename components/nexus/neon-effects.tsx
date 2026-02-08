/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 76: NEON GHOSTING EFFECTS & FEEDBACK SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Ultra-premium visual and sensory feedback:
 * - Neon Ghosting effect for number count-ups (trailing afterimage)
 * - Haptic vibration patterns for mobile
 * - High-frequency digital sound effects via Web Audio API
 *
 * Features:
 * - CSS-only ghosting effect for 60fps performance
 * - Layered text shadows with animation
 * - Web Vibration API for mobile haptics
 * - Procedurally generated audio for zero-latency feedback
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface NeonCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  color?: 'cyan' | 'emerald' | 'amber' | 'purple' | 'pink';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  enableGhosting?: boolean;
  enableHaptic?: boolean;
  enableSound?: boolean;
  duration?: number;
}

interface HapticPattern {
  pattern: number[];
  intensity?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO CONTEXT SINGLETON
// ═══════════════════════════════════════════════════════════════════════════════

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    } catch (e) {
      console.warn('[NeonEffects] AudioContext not available:', e);
      return null;
    }
  }

  return audioContext;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HAPTIC FEEDBACK
// ═══════════════════════════════════════════════════════════════════════════════

const HAPTIC_PATTERNS: Record<string, HapticPattern> = {
  // Quick tap for small changes
  tick: { pattern: [10] },
  // Double pulse for medium changes
  pulse: { pattern: [20, 30, 20] },
  // Success celebration
  success: { pattern: [50, 30, 50, 30, 100] },
  // Transaction complete
  transaction: { pattern: [30, 50, 30, 50, 80, 30, 150] },
  // Error/warning
  error: { pattern: [100, 50, 100] },
};

export function triggerHaptic(type: keyof typeof HAPTIC_PATTERNS = 'tick'): void {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;

  try {
    const pattern = HAPTIC_PATTERNS[type];
    navigator.vibrate(pattern.pattern);
  } catch (e) {
    // Vibration not supported or blocked
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOUND EFFECTS
// ═══════════════════════════════════════════════════════════════════════════════

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  gain: number;
  fadeOut?: boolean;
}

const SOUND_CONFIGS: Record<string, SoundConfig[]> = {
  // Sci-fi tick sound
  tick: [
    { frequency: 2400, duration: 0.03, type: 'square', gain: 0.08 },
  ],
  // Count up beep
  countUp: [
    { frequency: 1200, duration: 0.05, type: 'sine', gain: 0.1 },
    { frequency: 1600, duration: 0.03, type: 'sine', gain: 0.05 },
  ],
  // Transaction success - futuristic chime
  success: [
    { frequency: 523.25, duration: 0.1, type: 'sine', gain: 0.15 }, // C5
    { frequency: 659.25, duration: 0.1, type: 'sine', gain: 0.12 }, // E5
    { frequency: 783.99, duration: 0.15, type: 'sine', gain: 0.1 }, // G5
    { frequency: 1046.5, duration: 0.2, type: 'sine', gain: 0.08, fadeOut: true }, // C6
  ],
  // Energy exchange whoosh
  exchange: [
    { frequency: 150, duration: 0.3, type: 'sawtooth', gain: 0.08 },
    { frequency: 800, duration: 0.15, type: 'triangle', gain: 0.06 },
    { frequency: 1500, duration: 0.1, type: 'sine', gain: 0.1, fadeOut: true },
  ],
  // High-frequency digital blip
  digitalBlip: [
    { frequency: 3500, duration: 0.02, type: 'square', gain: 0.05 },
    { frequency: 2800, duration: 0.03, type: 'square', gain: 0.07 },
    { frequency: 3200, duration: 0.04, type: 'square', gain: 0.04, fadeOut: true },
  ],
};

export function playSound(type: keyof typeof SOUND_CONFIGS = 'tick'): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume audio context if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const configs = SOUND_CONFIGS[type];
  let startTime = ctx.currentTime;

  configs.forEach((config) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.frequency, startTime);

    gainNode.gain.setValueAtTime(config.gain, startTime);
    if (config.fadeOut) {
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration);
    } else {
      gainNode.gain.setValueAtTime(0, startTime + config.duration);
    }

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + config.duration + 0.01);

    startTime += config.duration * 0.7; // Overlap sounds slightly
  });
}

// Combined feedback function
export function triggerFeedback(
  type: 'tick' | 'success' | 'transaction' | 'exchange' = 'tick',
  options?: { haptic?: boolean; sound?: boolean }
): void {
  const { haptic = true, sound = true } = options || {};

  if (haptic) {
    triggerHaptic(type === 'exchange' ? 'transaction' : type);
  }
  if (sound) {
    playSound(type === 'tick' ? 'digitalBlip' : type === 'transaction' ? 'success' : type);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEON GHOSTING COUNTER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const COLOR_CONFIGS = {
  cyan: {
    primary: '#00E5FF',
    glow: 'rgba(0, 229, 255, 0.8)',
    ghost: 'rgba(0, 229, 255, 0.3)',
  },
  emerald: {
    primary: '#10B981',
    glow: 'rgba(16, 185, 129, 0.8)',
    ghost: 'rgba(16, 185, 129, 0.3)',
  },
  amber: {
    primary: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.8)',
    ghost: 'rgba(245, 158, 11, 0.3)',
  },
  purple: {
    primary: '#A855F7',
    glow: 'rgba(168, 85, 247, 0.8)',
    ghost: 'rgba(168, 85, 247, 0.3)',
  },
  pink: {
    primary: '#EC4899',
    glow: 'rgba(236, 72, 153, 0.8)',
    ghost: 'rgba(236, 72, 153, 0.3)',
  },
};

const SIZE_CONFIGS = {
  sm: { fontSize: 'text-lg', fontWeight: 'font-bold' },
  md: { fontSize: 'text-2xl', fontWeight: 'font-bold' },
  lg: { fontSize: 'text-4xl', fontWeight: 'font-black' },
  xl: { fontSize: 'text-6xl', fontWeight: 'font-black' },
};

export function NeonCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 2,
  color = 'cyan',
  size = 'md',
  enableGhosting = true,
  enableHaptic = true,
  enableSound = true,
  duration = 1000,
}: NeonCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [ghostValues, setGhostValues] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValue = useRef(value);
  const animationRef = useRef<number | null>(null);

  const colorConfig = COLOR_CONFIGS[color];
  const sizeConfig = SIZE_CONFIGS[size];

  // Animate value changes
  useEffect(() => {
    if (value === prevValue.current) return;

    const startValue = prevValue.current;
    const endValue = value;
    const diff = endValue - startValue;
    const startTime = performance.now();

    setIsAnimating(true);

    // Capture ghost values during animation
    const ghosts: number[] = [];
    let lastGhostTime = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + diff * eased;

      setDisplayValue(currentValue);

      // Add ghost value every 100ms
      if (enableGhosting && currentTime - lastGhostTime > 100) {
        ghosts.push(currentValue);
        if (ghosts.length > 5) ghosts.shift();
        setGhostValues([...ghosts]);
        lastGhostTime = currentTime;
      }

      // Trigger feedback at milestones
      if (enableHaptic || enableSound) {
        const progressPercent = Math.floor(progress * 10);
        const prevProgressPercent = Math.floor((elapsed - 16) / duration * 10);
        if (progressPercent > prevProgressPercent && progressPercent < 10) {
          triggerFeedback('tick', { haptic: enableHaptic, sound: enableSound });
        }
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setGhostValues([]);
        prevValue.current = value;

        // Final success feedback
        if (diff !== 0 && (enableHaptic || enableSound)) {
          triggerFeedback('success', { haptic: enableHaptic, sound: enableSound });
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, enableGhosting, enableHaptic, enableSound]);

  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <div className="relative inline-flex items-center font-mono">
      {/* Ghost layers (afterimage effect) */}
      {enableGhosting && (
        <AnimatePresence>
          {ghostValues.map((ghost, idx) => (
            <motion.span
              key={`ghost-${idx}-${ghost}`}
              initial={{ opacity: 0.4, scale: 1 }}
              animate={{ opacity: 0, scale: 1.05, y: -2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`absolute inset-0 ${sizeConfig.fontSize} ${sizeConfig.fontWeight}`}
              style={{
                color: colorConfig.ghost,
                textShadow: `0 0 20px ${colorConfig.ghost}`,
                filter: 'blur(2px)',
                zIndex: -1 - idx,
              }}
            >
              {prefix}{formatNumber(ghost)}{suffix}
            </motion.span>
          ))}
        </AnimatePresence>
      )}

      {/* Main value */}
      <motion.span
        className={`relative ${sizeConfig.fontSize} ${sizeConfig.fontWeight}`}
        style={{
          color: colorConfig.primary,
          textShadow: isAnimating
            ? `0 0 10px ${colorConfig.glow}, 0 0 20px ${colorConfig.glow}, 0 0 40px ${colorConfig.glow}`
            : `0 0 10px ${colorConfig.glow}`,
        }}
        animate={isAnimating ? {
          textShadow: [
            `0 0 10px ${colorConfig.glow}, 0 0 20px ${colorConfig.glow}`,
            `0 0 20px ${colorConfig.glow}, 0 0 40px ${colorConfig.glow}, 0 0 60px ${colorConfig.glow}`,
            `0 0 10px ${colorConfig.glow}, 0 0 20px ${colorConfig.glow}`,
          ],
        } : {}}
        transition={{ duration: 0.3, repeat: isAnimating ? Infinity : 0 }}
      >
        {prefix}{formatNumber(displayValue)}{suffix}
      </motion.span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSACTION SUCCESS EFFECT
// ═══════════════════════════════════════════════════════════════════════════════

export function TransactionSuccessEffect({
  isActive,
  onComplete,
  type = 'exchange',
}: {
  isActive: boolean;
  onComplete?: () => void;
  type?: 'exchange' | 'stake' | 'withdraw';
}) {
  useEffect(() => {
    if (isActive) {
      // Trigger combined feedback
      triggerFeedback('transaction', { haptic: true, sound: true });

      // Call onComplete after animation
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.2 }}
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
    >
      {/* Radial burst */}
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="absolute w-32 h-32 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0,229,255,0.8) 0%, transparent 70%)',
        }}
      />

      {/* Success icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center"
        style={{
          boxShadow: '0 0 60px rgba(0,229,255,0.8), 0 0 100px rgba(16,185,129,0.5)',
        }}
      >
        <motion.svg
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-12 h-12 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <motion.path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </motion.svg>
      </motion.div>

      {/* Particle burst */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{
            scale: [0, 1, 0],
            x: Math.cos((i * Math.PI * 2) / 12) * 150,
            y: Math.sin((i * Math.PI * 2) / 12) * 150,
          }}
          transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
          className="absolute w-3 h-3 rounded-full bg-cyan-400"
          style={{ boxShadow: '0 0 10px #00E5FF' }}
        />
      ))}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK FOR EASY INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

export function useNeonFeedback() {
  const playTickSound = useCallback(() => playSound('tick'), []);
  const playSuccessSound = useCallback(() => playSound('success'), []);
  const playExchangeSound = useCallback(() => playSound('exchange'), []);

  const triggerTickHaptic = useCallback(() => triggerHaptic('tick'), []);
  const triggerSuccessHaptic = useCallback(() => triggerHaptic('success'), []);
  const triggerTransactionHaptic = useCallback(() => triggerHaptic('transaction'), []);

  const triggerExchangeSuccess = useCallback(() => {
    triggerFeedback('exchange', { haptic: true, sound: true });
  }, []);

  const triggerTransactionSuccess = useCallback(() => {
    triggerFeedback('transaction', { haptic: true, sound: true });
  }, []);

  return {
    playTickSound,
    playSuccessSound,
    playExchangeSound,
    triggerTickHaptic,
    triggerSuccessHaptic,
    triggerTransactionHaptic,
    triggerExchangeSuccess,
    triggerTransactionSuccess,
    triggerFeedback,
  };
}

export default NeonCounter;
