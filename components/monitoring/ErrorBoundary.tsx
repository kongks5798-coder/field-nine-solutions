'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { captureError } from '@/lib/error-handler';

/**
 * ErrorBoundary Component - React 에러 경계
 * 
 * 비즈니스 목적:
 * - 예상치 못한 에러로 앱이 크래시되는 것 방지
 * - 사용자에게 친화적 에러 메시지 제공
 * - 에러를 Sentry로 자동 전송
 */
interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 에러를 Sentry로 전송
    captureError(error, {
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-[#E5E5E5] p-8 text-center" style={{ borderRadius: '4px' }}>
            <AlertCircle className="h-12 w-12 text-[#C0392B] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[#171717] mb-2">
              오류가 발생했습니다
            </h2>
            <p className="text-[#171717]/60 mb-6">
              예상치 못한 오류가 발생했습니다. 페이지를 새로고침해주세요.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-[#C0392B] hover:bg-[#A93226] text-white"
              style={{ borderRadius: '4px' }}
            >
              새로고침
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
