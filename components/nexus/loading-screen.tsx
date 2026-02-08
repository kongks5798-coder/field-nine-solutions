/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 72: MOBILE FULLSCREEN LOADING SCREEN
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 앱 로딩 및 페이지 전환 시 표시되는 풀스크린 로딩 화면
 * - Tesla FSD 스타일 스캐닝 애니메이션
 * - NEXUS 브랜딩
 * - 로딩 진행률 표시
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
  variant?: 'app' | 'page' | 'action';
}

export function LoadingScreen({
  isLoading,
  message = 'Loading...',
  progress,
  variant = 'page',
}: LoadingScreenProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (variant === 'action') {
    return (
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 shadow-2xl text-center"
            >
              <LoadingSpinner size="md" />
              <p className="mt-4 text-sm text-[#171717]/70">{message}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] bg-[#F9F9F7] flex flex-col items-center justify-center p-6"
        >
          {/* Scanning Lines Animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ y: '-100%' }}
                animate={{ y: '200%' }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: 'linear',
                }}
                className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#171717]/10 to-transparent"
              />
            ))}
          </div>

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative mb-8"
          >
            {/* Outer Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="w-24 h-24 rounded-full border-2 border-[#171717]/10 border-t-[#171717] absolute inset-0"
            />

            {/* Inner Circle */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#171717] to-[#3d3d3d] flex items-center justify-center">
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-4xl"
              >
                ⚡
              </motion.span>
            </div>

            {/* Glow Effect */}
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -inset-4 bg-[#171717]/5 blur-xl rounded-full"
            />
          </motion.div>

          {/* Brand */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl font-black text-[#171717] tracking-tight">
              NEXUS
            </h1>
            <p className="text-sm text-[#171717]/50 mt-1">Energy Empire</p>
          </motion.div>

          {/* Loading Message */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <p className="text-sm text-[#171717]/70 font-medium">
              {message}
              <span className="inline-block w-6 text-left">{dots}</span>
            </p>
          </motion.div>

          {/* Progress Bar */}
          {typeof progress === 'number' && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-48 mt-6"
            >
              <div className="h-1 bg-[#171717]/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-[#171717] rounded-full"
                />
              </div>
              <p className="text-xs text-[#171717]/40 text-center mt-2">
                {progress}%
              </p>
            </motion.div>
          )}

          {/* Decorative Elements */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                animate={{
                  opacity: [0.2, 1, 0.2],
                  scale: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
                className="w-1.5 h-1.5 rounded-full bg-[#171717]"
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Skeleton Loading Component
 */
export function Skeleton({
  className = '',
  variant = 'rect',
}: {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
}) {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className={`bg-[#171717]/10 ${
        variant === 'circle' ? 'rounded-full' :
        variant === 'text' ? 'rounded h-4' :
        'rounded-lg'
      } ${className}`}
    />
  );
}

/**
 * Loading Spinner Component
 */
export function LoadingSpinner({
  size = 'md',
  color = 'primary',
}: {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'amber';
}) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  const colorClasses = {
    primary: 'border-[#171717]/20 border-t-[#171717]',
    white: 'border-white/20 border-t-white',
    amber: 'border-amber-500/20 border-t-amber-500',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={`rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}
    />
  );
}

/**
 * Page Loading Skeleton - 페이지 로딩 시 표시
 */
export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F9F9F7] p-4">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="w-32 h-8" />
        <Skeleton className="w-10 h-10" variant="circle" />
      </div>

      {/* Hero Card Skeleton */}
      <Skeleton className="w-full h-40 mb-4" />

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>

      {/* List Skeleton */}
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-12 h-12" variant="circle" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-3/4 h-4" variant="text" />
              <Skeleton className="w-1/2 h-3" variant="text" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Card Loading Skeleton
 */
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-[#171717]/5">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10" variant="circle" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-24 h-4" variant="text" />
          <Skeleton className="w-16 h-3" variant="text" />
        </div>
      </div>
      <Skeleton className="w-full h-20 mb-3" />
      <div className="flex gap-2">
        <Skeleton className="flex-1 h-10" />
        <Skeleton className="flex-1 h-10" />
      </div>
    </div>
  );
}

/**
 * App Initial Loading - 앱 시작 시 표시
 */
export function AppLoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Initializing...');

  useEffect(() => {
    const messages = [
      'Initializing...',
      'Loading assets...',
      'Connecting to server...',
      'Almost ready...',
    ];

    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 20 + 5;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
      }
      setProgress(Math.min(current, 100));

      const messageIndex = Math.min(
        Math.floor(current / 25),
        messages.length - 1
      );
      setMessage(messages[messageIndex]);
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <LoadingScreen
      isLoading={true}
      message={message}
      progress={Math.round(progress)}
      variant="app"
    />
  );
}
