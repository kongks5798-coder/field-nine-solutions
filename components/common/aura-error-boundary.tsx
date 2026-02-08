'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 56: AURA-STYLE ERROR BOUNDARY
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Premium error handling with elegant UI.
 * No ugly error screens - only sophisticated guidance.
 */

import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR BOUNDARY CLASS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// Class component for actual error boundary
import { Component, ErrorInfo } from 'react';

export class AuraErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // Log to error tracking service
    console.error('[Aura Error Boundary]', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || <AuraErrorPage error={this.state.error} />;
    }

    return this.props.children;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AURA ERROR PAGE
// ═══════════════════════════════════════════════════════════════════════════════

interface AuraErrorPageProps {
  error?: Error | null;
  reset?: () => void;
  type?: 'error' | 'not-found' | 'unauthorized' | 'maintenance';
}

export function AuraErrorPage({
  error,
  reset,
  type = 'error',
}: AuraErrorPageProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const content = {
    error: {
      icon: '⚡',
      title: '일시적인 문제가 발생했습니다',
      subtitle: '잠시 후 다시 시도해 주세요',
      description: '시스템이 빠르게 복구 중입니다. 문제가 지속되면 고객센터로 문의해 주세요.',
    },
    'not-found': {
      icon: '🔍',
      title: '페이지를 찾을 수 없습니다',
      subtitle: '요청하신 페이지가 존재하지 않습니다',
      description: '주소가 올바른지 확인하거나, 아래 버튼을 눌러 메인 페이지로 이동하세요.',
    },
    unauthorized: {
      icon: '🔐',
      title: '로그인이 필요합니다',
      subtitle: 'Sovereign 멤버 전용 콘텐츠입니다',
      description: 'Field Nine의 Sovereign이 되어 프리미엄 기능을 이용하세요.',
    },
    maintenance: {
      icon: '🔧',
      title: '시스템 점검 중입니다',
      subtitle: '더 나은 서비스를 위해 업그레이드 중입니다',
      description: '잠시 후 더욱 강력해진 Field Nine을 만나보세요.',
    },
  }[type];

  interface Action {
    label: string;
    onClick?: () => void;
    href?: string;
    primary?: boolean;
  }

  const actions: Action[] = {
    error: [
      { label: '다시 시도', onClick: reset, primary: true },
      { label: '홈으로', href: '/' },
    ],
    'not-found': [
      { label: '홈으로', href: '/', primary: true },
      { label: 'NEXUS 탐색', href: '/nexus' },
    ],
    unauthorized: [
      { label: '로그인', href: '/auth/login', primary: true },
      { label: '회원가입', href: '/auth/signup' },
    ],
    maintenance: [
      { label: '상태 확인', href: '/api/health', primary: true },
    ],
  }[type];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F9F9F7] dark:bg-[#0A0A0A] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-6xl mb-8"
        >
          {content.icon}
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-black text-[#171717] dark:text-white mb-3">
          {content.title}
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">
          {content.subtitle}
        </p>

        {/* Description */}
        <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-8">
          {content.description}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {actions.map((action, index) => {
            const buttonClass = action.primary
              ? 'px-6 py-3 bg-[#171717] dark:bg-white text-white dark:text-[#171717] font-bold rounded-full hover:opacity-90 transition-opacity'
              : 'px-6 py-3 border-2 border-neutral-300 dark:border-neutral-700 text-[#171717] dark:text-white font-medium rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors';

            if (action.onClick) {
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={buttonClass}
                >
                  {action.label}
                </button>
              );
            }

            return (
              <Link key={index} href={action.href || '/'} className={buttonClass}>
                {action.label}
              </Link>
            );
          })}
        </div>

        {/* Error details (dev only) */}
        {process.env.NODE_ENV === 'development' && error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-left"
          >
            <div className="text-xs text-red-500 font-mono overflow-auto">
              <strong>Error:</strong> {error.message}
              {error.stack && (
                <pre className="mt-2 text-[10px] opacity-60">
                  {error.stack.split('\n').slice(0, 5).join('\n')}
                </pre>
              )}
            </div>
          </motion.div>
        )}

        {/* Field Nine branding */}
        <div className="mt-12 text-xs text-neutral-400">
          <span className="font-bold">FIELD NINE</span> · Where Fashion Becomes Energy
        </div>
      </motion.div>

      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING STATES
// ═══════════════════════════════════════════════════════════════════════════════

export function AuraLoadingPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F7] dark:bg-[#0A0A0A] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"
        />
        <div className="text-neutral-500 dark:text-neutral-400 text-sm">
          Loading...
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WRAPPER HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useAuraError() {
  const [error, setError] = useState<Error | null>(null);

  const handleError = (err: Error | string) => {
    const error = typeof err === 'string' ? new Error(err) : err;
    setError(error);
    console.error('[Aura]', error);
  };

  const clearError = () => setError(null);

  return {
    error,
    handleError,
    clearError,
    hasError: !!error,
  };
}

export default AuraErrorBoundaryClass;
