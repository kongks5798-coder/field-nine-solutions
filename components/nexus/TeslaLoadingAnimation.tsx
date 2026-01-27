'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 55: TESLA-STYLE LOADING ANIMATION
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Production-grade loading animations optimized for < 0.5s perceived load time
 * Background: #F9F9F7 | Text: #171717
 */

import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// Types
// ============================================

interface TeslaLoadingProps {
  isLoading: boolean;
  variant?: 'pulse' | 'scan' | 'orbital' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  showProgress?: boolean;
  onComplete?: () => void;
}

interface SkeletonProps {
  variant: 'text' | 'card' | 'chart' | 'table';
  lines?: number;
  className?: string;
}

// ============================================
// Constants - Tesla Design System
// ============================================

const COLORS = {
  background: '#F9F9F7',
  text: '#171717',
  accent: '#1a1a1a',
  muted: '#8E8E93',
  skeleton: '#E5E5E7',
  skeletonHighlight: '#F5F5F7',
};

const SIZES = {
  sm: { width: 24, height: 24, stroke: 2 },
  md: { width: 40, height: 40, stroke: 2.5 },
  lg: { width: 64, height: 64, stroke: 3 },
};

// ============================================
// Tesla Loading Animation Component
// ============================================

const TeslaLoadingAnimation = memo(function TeslaLoadingAnimation({
  isLoading,
  variant = 'minimal',
  size = 'md',
  text,
  showProgress = false,
  onComplete,
}: TeslaLoadingProps) {
  const [progress, setProgress] = useState(0);
  const dimensions = SIZES[size];

  // Simulate progress for visual feedback (max 0.5s)
  useEffect(() => {
    if (!isLoading || !showProgress) return;

    setProgress(0);
    const steps = 10;
    const duration = 400; // 0.4s total
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      setProgress(Math.min((step / steps) * 100, 95));

      if (step >= steps) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isLoading, showProgress]);

  // Complete callback
  useEffect(() => {
    if (!isLoading && progress > 0) {
      setProgress(100);
      onComplete?.();
    }
  }, [isLoading, progress, onComplete]);

  const renderLoader = () => {
    switch (variant) {
      case 'pulse':
        return <PulseLoader size={dimensions} />;
      case 'scan':
        return <ScanLoader size={dimensions} />;
      case 'orbital':
        return <OrbitalLoader size={dimensions} />;
      case 'minimal':
      default:
        return <MinimalLoader size={dimensions} />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex flex-col items-center justify-center gap-3"
          style={{ color: COLORS.text }}
        >
          {renderLoader()}

          {text && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="text-sm font-medium"
              style={{ color: COLORS.muted }}
            >
              {text}
            </motion.p>
          )}

          {showProgress && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              className="h-0.5 w-24 overflow-hidden rounded-full"
              style={{ backgroundColor: COLORS.skeleton }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: COLORS.accent }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// ============================================
// Loader Variants
// ============================================

const MinimalLoader = memo(function MinimalLoader({
  size,
}: {
  size: typeof SIZES.md;
}) {
  return (
    <motion.svg
      width={size.width}
      height={size.height}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={COLORS.skeleton}
        strokeWidth={size.stroke}
      />
      <motion.path
        d="M12 2a10 10 0 0 1 10 10"
        stroke={COLORS.accent}
        strokeWidth={size.stroke}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, repeat: Infinity }}
      />
    </motion.svg>
  );
});

const PulseLoader = memo(function PulseLoader({
  size,
}: {
  size: typeof SIZES.md;
}) {
  return (
    <div className="relative" style={{ width: size.width, height: size.height }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full"
          style={{ border: `${size.stroke}px solid ${COLORS.accent}` }}
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeOut',
          }}
        />
      ))}
      <div
        className="absolute inset-0 m-auto rounded-full"
        style={{
          width: size.width * 0.3,
          height: size.height * 0.3,
          backgroundColor: COLORS.accent,
        }}
      />
    </div>
  );
});

const ScanLoader = memo(function ScanLoader({
  size,
}: {
  size: typeof SIZES.md;
}) {
  return (
    <div className="relative overflow-hidden" style={{ width: size.width, height: size.height }}>
      <div
        className="absolute inset-0 rounded"
        style={{ border: `${size.stroke}px solid ${COLORS.accent}` }}
      />
      <motion.div
        className="absolute left-0 right-0 h-0.5"
        style={{ backgroundColor: COLORS.accent }}
        initial={{ top: 0 }}
        animate={{ top: size.height - 2 }}
        transition={{
          duration: 0.4,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
      />
    </div>
  );
});

const OrbitalLoader = memo(function OrbitalLoader({
  size,
}: {
  size: typeof SIZES.md;
}) {
  return (
    <div className="relative" style={{ width: size.width, height: size.height }}>
      {/* Center dot */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: size.width * 0.15,
          height: size.height * 0.15,
          backgroundColor: COLORS.accent,
        }}
      />

      {/* Orbiting dot */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size.width * 0.12,
          height: size.height * 0.12,
          backgroundColor: COLORS.accent,
        }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          ease: 'linear',
        }}
        initial={{ x: size.width * 0.35, y: size.height * 0.35 }}
      >
        <motion.div
          className="rounded-full"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: COLORS.accent,
          }}
          animate={{
            x: [0, size.width * 0.35, 0, -size.width * 0.35, 0],
            y: [size.height * 0.35, 0, -size.height * 0.35, 0, size.height * 0.35],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </motion.div>
    </div>
  );
});

// ============================================
// Skeleton Loading Components
// ============================================

export const TeslaSkeleton = memo(function TeslaSkeleton({
  variant,
  lines = 3,
  className = '',
}: SkeletonProps) {
  const shimmerStyle = {
    background: `linear-gradient(90deg, ${COLORS.skeleton} 0%, ${COLORS.skeletonHighlight} 50%, ${COLORS.skeleton} 100%)`,
    backgroundSize: '200% 100%',
  };

  switch (variant) {
    case 'text':
      return (
        <div className={`space-y-2 ${className}`}>
          {Array.from({ length: lines }).map((_, i) => (
            <motion.div
              key={i}
              className="h-4 rounded"
              style={{
                ...shimmerStyle,
                width: i === lines - 1 ? '60%' : '100%',
              }}
              animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          ))}
        </div>
      );

    case 'card':
      return (
        <motion.div
          className={`rounded-lg p-4 ${className}`}
          style={{ backgroundColor: COLORS.skeleton }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div className="space-y-3">
            <div className="h-5 w-1/3 rounded" style={shimmerStyle} />
            <div className="h-8 w-2/3 rounded" style={shimmerStyle} />
            <div className="h-4 w-full rounded" style={shimmerStyle} />
          </div>
        </motion.div>
      );

    case 'chart':
      return (
        <div className={`space-y-2 ${className}`}>
          <div className="flex items-end gap-1 h-32">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t"
                style={{
                  ...shimmerStyle,
                  height: `${20 + Math.random() * 80}%`,
                }}
                animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: i * 0.05,
                }}
              />
            ))}
          </div>
        </div>
      );

    case 'table':
      return (
        <div className={`space-y-2 ${className}`}>
          {Array.from({ length: lines }).map((_, i) => (
            <motion.div
              key={i}
              className="flex gap-4 p-2"
              style={{ backgroundColor: i === 0 ? COLORS.skeleton : 'transparent' }}
            >
              <div className="h-4 w-1/4 rounded" style={shimmerStyle} />
              <div className="h-4 w-1/4 rounded" style={shimmerStyle} />
              <div className="h-4 w-1/4 rounded" style={shimmerStyle} />
              <div className="h-4 w-1/4 rounded" style={shimmerStyle} />
            </motion.div>
          ))}
        </div>
      );

    default:
      return null;
  }
});

// ============================================
// Page Transition Wrapper
// ============================================

export const TeslaPageTransition = memo(function TeslaPageTransition({
  children,
  isLoading,
}: {
  children: React.ReactNode;
  isLoading: boolean;
}) {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex min-h-[200px] items-center justify-center"
          style={{ backgroundColor: COLORS.background }}
        >
          <TeslaLoadingAnimation isLoading={true} variant="minimal" size="md" />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// ============================================
// Inline Loading Indicator
// ============================================

export const TeslaInlineLoader = memo(function TeslaInlineLoader({
  size = 16,
}: {
  size?: number;
}) {
  return (
    <motion.span
      className="inline-block"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
    >
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke={COLORS.skeleton} strokeWidth="2" />
        <path
          d="M8 2a6 6 0 0 1 6 6"
          stroke={COLORS.accent}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </motion.span>
  );
});

export default TeslaLoadingAnimation;
