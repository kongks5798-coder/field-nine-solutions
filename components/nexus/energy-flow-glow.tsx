/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 80: ENERGY FLOW GLOW EFFECT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Directional glow effect when energy is exchanged
 * - Screen-wide lighting shift in energy flow direction
 * - Particle trail following the transaction path
 * - Haptic feedback synchronized with visual
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { triggerFeedback } from './neon-effects';

interface EnergyFlowGlowProps {
  /** Is the flow animation active? */
  isActive: boolean;
  /** Direction of energy flow */
  direction: 'in' | 'out';
  /** Amount being transferred */
  amount?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Color theme */
  color?: 'cyan' | 'emerald' | 'amber';
}

export function EnergyFlowGlow({
  isActive,
  direction,
  amount,
  onComplete,
  color = 'cyan',
}: EnergyFlowGlowProps) {
  const colors = {
    cyan: { primary: '#00E5FF', secondary: '#00B4D8', glow: 'rgba(0,229,255,0.5)' },
    emerald: { primary: '#00FF88', secondary: '#10B981', glow: 'rgba(0,255,136,0.5)' },
    amber: { primary: '#F59E0B', secondary: '#D97706', glow: 'rgba(245,158,11,0.5)' },
  };

  const c = colors[color];

  useEffect(() => {
    if (!isActive) return;

    // Haptic pattern for energy flow
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      // Pattern: fast pulses getting stronger toward center
      navigator.vibrate([20, 40, 30, 40, 40, 40, 50, 40, 60, 40, 100]);
    }

    // Sound feedback
    triggerFeedback('exchange', { haptic: false, sound: true });

    if (onComplete) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  const isIncoming = direction === 'in';

  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
          {/* Directional gradient sweep */}
          <motion.div
            initial={{
              opacity: 0,
              x: isIncoming ? '100%' : '-100%',
            }}
            animate={{
              opacity: [0, 0.6, 0.6, 0],
              x: isIncoming ? [100, 0, 0, -100] : [-100, 0, 0, 100],
            }}
            transition={{
              duration: 1.5,
              times: [0, 0.3, 0.7, 1],
              ease: 'easeInOut',
            }}
            className="absolute inset-0"
            style={{
              background: `linear-gradient(${isIncoming ? '270deg' : '90deg'},
                transparent 0%,
                ${c.glow} 30%,
                ${c.primary}80 50%,
                ${c.glow} 70%,
                transparent 100%
              )`,
            }}
          />

          {/* Particle stream */}
          {[...Array(20)].map((_, i) => {
            const yOffset = (Math.random() - 0.5) * 80;
            const delay = i * 0.05;
            const duration = 1 + Math.random() * 0.5;

            return (
              <motion.div
                key={i}
                initial={{
                  x: isIncoming ? '120vw' : '-20vw',
                  y: `calc(50vh + ${yOffset}vh)`,
                  scale: 0,
                  opacity: 0,
                }}
                animate={{
                  x: isIncoming ? '-20vw' : '120vw',
                  scale: [0, 1, 1, 0],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration,
                  delay,
                  ease: 'easeInOut',
                }}
                className="absolute w-4 h-4 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${c.primary} 0%, transparent 70%)`,
                  boxShadow: `0 0 15px ${c.primary}, 0 0 30px ${c.glow}`,
                }}
              />
            );
          })}

          {/* Central energy burst */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1.5, 2],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 0.8,
              delay: 0.5,
              ease: 'easeOut',
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full"
            style={{
              background: `radial-gradient(circle, ${c.primary}60 0%, ${c.glow} 40%, transparent 70%)`,
              boxShadow: `0 0 60px ${c.primary}, 0 0 120px ${c.glow}`,
            }}
          />

          {/* Amount display (if provided) */}
          {amount && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ delay: 0.3 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
            >
              <motion.div
                animate={{
                  textShadow: [
                    `0 0 10px ${c.glow}`,
                    `0 0 30px ${c.primary}, 0 0 60px ${c.glow}`,
                    `0 0 10px ${c.glow}`,
                  ],
                }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="text-5xl font-black"
                style={{ color: c.primary }}
              >
                {isIncoming ? '+' : '-'}{amount.toLocaleString()}
              </motion.div>
              <div className="text-lg text-white/70 mt-2">
                {isIncoming ? 'Energy Received' : 'Energy Sent'}
              </div>
            </motion.div>
          )}

          {/* Edge glow effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
            style={{
              boxShadow: `inset ${isIncoming ? '100px' : '-100px'} 0 100px -50px ${c.glow}`,
            }}
          />
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * Transaction celebration effect
 * Full-screen dramatic success animation
 */
export function TransactionCelebration({
  isActive,
  type,
  amount,
  currency,
  onComplete,
}: {
  isActive: boolean;
  type: 'exchange' | 'stake' | 'withdraw';
  amount: number;
  currency: string;
  onComplete?: () => void;
}) {
  useEffect(() => {
    if (!isActive) return;

    // Trigger haptic celebration
    triggerFeedback('success', { haptic: true, sound: true });

    if (onComplete) {
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  const typeEmojis = {
    exchange: '💱',
    stake: '🔒',
    withdraw: '💸',
  };

  const typeLabels = {
    exchange: 'Exchange Complete',
    stake: 'Staking Confirmed',
    withdraw: 'Withdrawal Processed',
  };

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center"
        >
          {/* Particle explosion */}
          {[...Array(30)].map((_, i) => {
            const angle = (i / 30) * Math.PI * 2;
            const distance = 150 + Math.random() * 100;
            return (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{
                  x: Math.cos(angle) * distance,
                  y: Math.sin(angle) * distance,
                  scale: 0,
                  opacity: 0,
                }}
                transition={{ duration: 1, delay: Math.random() * 0.3 }}
                className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-[#00E5FF]"
                style={{
                  boxShadow: '0 0 10px #00E5FF',
                }}
              />
            );
          })}

          {/* Central content */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="text-center"
          >
            {/* Success icon */}
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-7xl mb-4"
            >
              {typeEmojis[type]}
            </motion.div>

            {/* Success checkmark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center"
              style={{
                boxShadow: '0 0 40px rgba(0,229,255,0.5)',
              }}
            >
              <motion.svg
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="w-10 h-10 text-white"
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

            {/* Amount */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="text-4xl font-black text-[#00E5FF] mb-2"
                style={{ textShadow: '0 0 20px rgba(0,229,255,0.5)' }}
              >
                {amount.toLocaleString()} {currency}
              </div>
              <div className="text-white/70 text-lg">
                {typeLabels[type]}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default EnergyFlowGlow;
