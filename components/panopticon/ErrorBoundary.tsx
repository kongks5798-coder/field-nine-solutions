'use client';

import React, { Component, ReactNode, memo, useEffect, useState } from 'react';

/**
 * ERROR BOUNDARY - Enterprise-grade Error Handling
 * Phase 35: Graceful Degradation for Widgets
 *
 * Features:
 * - Catches JavaScript errors in child components
 * - Shows minimalist error UI within widget bounds
 * - Auto-retry with countdown
 * - Does not break parent layout
 */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  retryDelay?: number;
  widgetName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

// Class-based Error Boundary (required by React)
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.widgetName ? `: ${this.props.widgetName}` : ''}] Caught error:`, error);
    console.error('Error info:', errorInfo);

    this.props.onError?.(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      retryCount: this.state.retryCount + 1,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          retryDelay={this.props.retryDelay || 3}
          onRetry={this.handleRetry}
          widgetName={this.props.widgetName}
        />
      );
    }

    return this.props.children;
  }
}

// Memoized fallback UI component
interface ErrorFallbackProps {
  error: Error | null;
  retryDelay: number;
  onRetry: () => void;
  widgetName?: string;
}

const ErrorFallback = memo(function ErrorFallback({
  error,
  retryDelay,
  onRetry,
  widgetName,
}: ErrorFallbackProps) {
  const [countdown, setCountdown] = useState(retryDelay);

  useEffect(() => {
    if (countdown <= 0) {
      onRetry();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onRetry]);

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderRadius: '12px',
        border: '1px solid rgba(239, 68, 68, 0.15)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          margin: '0 auto 12px',
          borderRadius: '10px',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
        }}
      >
        ⚠️
      </div>

      <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600, color: '#F87171' }}>
        데이터 복구 중
      </p>

      {widgetName && (
        <p style={{ margin: '0 0 8px', fontSize: '10px', color: '#666' }}>
          {widgetName}
        </p>
      )}

      <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#525252' }}>
        Retry in {countdown}s
      </p>

      <button
        onClick={() => {
          setCountdown(0);
          onRetry();
        }}
        style={{
          padding: '6px 16px',
          fontSize: '11px',
          fontWeight: 500,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '6px',
          color: '#F87171',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        Retry Now
      </button>

      {error && process.env.NODE_ENV === 'development' && (
        <details style={{ marginTop: '12px', textAlign: 'left' }}>
          <summary style={{ fontSize: '10px', color: '#666', cursor: 'pointer' }}>
            Debug Info
          </summary>
          <pre
            style={{
              marginTop: '8px',
              padding: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '4px',
              fontSize: '9px',
              color: '#999',
              overflow: 'auto',
              maxHeight: '100px',
            }}
          >
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
});

// HOC wrapper for functional components
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WithErrorBoundary = (props: P) => (
    <ErrorBoundary {...options}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `WithErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithErrorBoundary;
}

export default ErrorBoundary;
