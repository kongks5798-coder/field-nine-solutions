'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 58: LAZY LOADING COMPONENTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * Optimized lazy loading with suspense boundaries
 */

import { ComponentType, Suspense, lazy, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING SKELETONS
// ═══════════════════════════════════════════════════════════════════════════════

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-48" />
    </div>
  );
}

export function ChartSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-64" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {/* Header */}
      <div className="bg-gray-300 dark:bg-gray-600 rounded h-10" />
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded h-12" />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="bg-gray-200 dark:bg-gray-700 rounded h-8 w-48" />
        <div className="bg-gray-200 dark:bg-gray-700 rounded h-10 w-32" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-28" />
        ))}
      </div>

      {/* Chart Area */}
      <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-72" />

      {/* Table Area */}
      <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-48" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPINNER LOADER
// ═══════════════════════════════════════════════════════════════════════════════

export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <motion.div
      className={`${sizes[size]} border-2 border-gray-300 border-t-amber-500 rounded-full ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FULL PAGE LOADER
// ═══════════════════════════════════════════════════════════════════════════════

export function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">{message}</p>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION LOADER
// ═══════════════════════════════════════════════════════════════════════════════

export function SectionLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <Spinner size="md" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAZY COMPONENT WRAPPER
// ═══════════════════════════════════════════════════════════════════════════════

interface LazyWrapperProps {
  component: () => Promise<{ default: ComponentType<Record<string, unknown>> }>;
  fallback?: React.ReactNode;
  props?: Record<string, unknown>;
}

export function LazyWrapper({
  component,
  fallback = <SectionLoader />,
  props = {},
}: LazyWrapperProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = lazy(component) as React.LazyExoticComponent<React.ComponentType<any>>;

  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRE-BUILT LAZY COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a lazy-loaded component with proper suspense handling
 */
export function createLazyComponent<P extends Record<string, unknown>>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback: React.ReactNode = <SectionLoader />
): React.FC<P> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LazyComponent = lazy(importFn) as React.LazyExoticComponent<React.ComponentType<any>>;

  return function LazyComponentWrapper(props: P) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR BOUNDARY FOR LAZY COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">
        Component Load Failed
      </h3>
      <p className="text-sm text-red-500 dark:text-red-300 mb-4">
        {error?.message || 'An error occurred while loading this section'}
      </p>
      {resetErrorBoundary && (
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERSECTION OBSERVER LAZY LOAD
// ═══════════════════════════════════════════════════════════════════════════════

interface LazyOnViewProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
}

export function LazyOnView({
  children,
  fallback = <SectionLoader />,
  rootMargin = '100px',
  threshold = 0.1,
}: LazyOnViewProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return <div ref={ref}>{isVisible ? children : fallback}</div>;
}
