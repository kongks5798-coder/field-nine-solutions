'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 83: GRAND INTRO - FIELD NINE OS BOOT SEQUENCE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Tesla-grade entrance experience:
 * - Cyan data streams scanning the viewport
 * - 3D globe emerging from darkness
 * - System initialization messages
 * - 1.5s total duration
 */

import { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GrandIntroProps {
  onComplete?: () => void;
  showOnce?: boolean;
  duration?: number;
}

// Boot sequence messages
const BOOT_MESSAGES = [
  'FIELD NINE OS v83.0',
  'Initializing Neural Network...',
  'Connecting to Energy Nodes...',
  'Syncing Market Oracle...',
  'Loading Sovereign Assets...',
  'System Ready',
];

// Data stream component
const DataStream = memo(function DataStream({
  delay,
  direction,
}: {
  delay: number;
  direction: 'horizontal' | 'vertical';
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        x: direction === 'horizontal' ? '-100%' : 0,
        y: direction === 'vertical' ? '-100%' : 0,
      }}
      animate={{
        opacity: [0, 1, 1, 0],
        x: direction === 'horizontal' ? ['0%', '100%'] : 0,
        y: direction === 'vertical' ? ['0%', '100%'] : 0,
      }}
      transition={{
        duration: 0.8,
        delay,
        ease: 'linear',
      }}
      className={`absolute ${
        direction === 'horizontal'
          ? 'h-[1px] w-full bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent'
          : 'w-[1px] h-full bg-gradient-to-b from-transparent via-[#00E5FF] to-transparent'
      }`}
      style={{
        [direction === 'horizontal' ? 'top' : 'left']: `${Math.random() * 100}%`,
      }}
    />
  );
});

// Globe component (simplified SVG representation)
const Globe = memo(function Globe({ progress }: { progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: progress, scale: 0.8 + progress * 0.2 }}
      className="relative w-48 h-48"
    >
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(0,229,255,${0.3 * progress}) 0%, transparent 70%)`,
          filter: `blur(${20 * progress}px)`,
        }}
      />

      {/* Globe SVG */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ filter: `drop-shadow(0 0 ${10 * progress}px rgba(0,229,255,0.5))` }}
      >
        {/* Main circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#00E5FF"
          strokeWidth="1"
          opacity={progress}
        />

        {/* Longitude lines */}
        {[0, 30, 60, 90, 120, 150].map((angle, i) => (
          <ellipse
            key={`long-${i}`}
            cx="50"
            cy="50"
            rx={45 * Math.cos((angle * Math.PI) / 180)}
            ry="45"
            fill="none"
            stroke="#00E5FF"
            strokeWidth="0.5"
            opacity={progress * 0.5}
            transform={`rotate(${angle} 50 50)`}
          />
        ))}

        {/* Latitude lines */}
        {[-60, -30, 0, 30, 60].map((lat, i) => (
          <ellipse
            key={`lat-${i}`}
            cx="50"
            cy="50"
            rx={45 * Math.cos((lat * Math.PI) / 180)}
            ry={45 * Math.cos((lat * Math.PI) / 180) * 0.3}
            fill="none"
            stroke="#00E5FF"
            strokeWidth="0.5"
            opacity={progress * 0.5}
            transform={`translate(0, ${lat * 0.75})`}
          />
        ))}

        {/* Korea highlight */}
        <motion.circle
          cx="65"
          cy="40"
          r="3"
          fill="#00E5FF"
          animate={{
            r: [3, 5, 3],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Energy nodes */}
        {[
          { x: 30, y: 55 }, // South America
          { x: 48, y: 30 }, // Europe
          { x: 75, y: 60 }, // Australia
          { x: 25, y: 35 }, // North America
        ].map((node, i) => (
          <motion.circle
            key={`node-${i}`}
            cx={node.x}
            cy={node.y}
            r="2"
            fill="#00E5FF"
            opacity={progress * 0.7}
            animate={{
              opacity: [0.7, 0.3, 0.7],
            }}
            transition={{
              duration: 2,
              delay: i * 0.3,
              repeat: Infinity,
            }}
          />
        ))}
      </svg>

      {/* Rotating ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="url(#ringGradient)"
            strokeWidth="0.5"
            strokeDasharray="8 4"
            opacity={progress * 0.5}
          />
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E5FF" stopOpacity="0" />
              <stop offset="50%" stopColor="#00E5FF" stopOpacity="1" />
              <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </motion.div>
  );
});

export function GrandIntro({
  onComplete,
  showOnce = true,
  duration = 1500,
}: GrandIntroProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [progress, setProgress] = useState(0);

  // Check if already shown
  useEffect(() => {
    if (showOnce && typeof sessionStorage !== 'undefined') {
      const hasShown = sessionStorage.getItem('f9_intro_shown');
      if (hasShown) {
        setIsVisible(false);
        onComplete?.();
        return;
      }
    }
  }, [showOnce, onComplete]);

  // Progress animation
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + (1000 / duration) / 10;
        return Math.min(next, 1);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isVisible, duration]);

  // Message cycling
  useEffect(() => {
    if (!isVisible) return;

    const messageInterval = duration / BOOT_MESSAGES.length;
    const interval = setInterval(() => {
      setCurrentMessage(prev => Math.min(prev + 1, BOOT_MESSAGES.length - 1));
    }, messageInterval);

    return () => clearInterval(interval);
  }, [isVisible, duration]);

  // Complete and hide
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      if (showOnce && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('f9_intro_shown', 'true');
      }
      onComplete?.();
    }, duration + 200);

    return () => clearTimeout(timer);
  }, [isVisible, duration, showOnce, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Data streams */}
          {Array.from({ length: 8 }).map((_, i) => (
            <DataStream
              key={`h-${i}`}
              delay={i * 0.1}
              direction="horizontal"
            />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <DataStream
              key={`v-${i}`}
              delay={0.3 + i * 0.1}
              direction="vertical"
            />
          ))}

          {/* Scan line effect */}
          <motion.div
            initial={{ top: 0 }}
            animate={{ top: '100%' }}
            transition={{ duration: 1, ease: 'linear' }}
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-b from-transparent via-[#00E5FF]/50 to-transparent pointer-events-none"
          />

          {/* Globe */}
          <Globe progress={progress} />

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 text-center"
          >
            <h1 className="text-3xl font-black text-white tracking-wider">
              FIELD<span className="text-[#00E5FF]">NINE</span>
            </h1>
            <p className="text-xs text-[#00E5FF]/70 tracking-[0.3em] mt-1">
              SOVEREIGN ENERGY NETWORK
            </p>
          </motion.div>

          {/* Boot messages */}
          <div className="mt-8 h-6 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-mono text-[#00E5FF]/70"
              >
                {BOOT_MESSAGES[currentMessage]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div className="mt-6 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              className="h-full bg-gradient-to-r from-[#00E5FF]/50 to-[#00E5FF]"
            />
          </div>

          {/* Progress percentage */}
          <motion.div
            className="mt-2 text-xs font-mono text-white/30"
          >
            {Math.round(progress * 100)}%
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE TRANSITION WRAPPER
// ═══════════════════════════════════════════════════════════════════════════════

interface FluidTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function FluidTransition({ children, className = '' }: FluidTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1], // Tesla-style easing
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default GrandIntro;
