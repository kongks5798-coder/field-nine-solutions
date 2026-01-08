"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * React Error Boundary 컴포넌트
 * 앱 전체를 감싸서 예상치 못한 에러를 처리
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅 (향후 로깅 시스템과 통합)
    console.error("[ErrorBoundary] 에러 발생:", error);
    console.error("[ErrorBoundary] 에러 정보:", errorInfo);

    // 에러 리포트 전송 (선택적)
    if (typeof window !== "undefined" && typeof window.navigator !== "undefined" && typeof window.navigator.sendBeacon === "function") {
      try {
        const errorReport = {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        };

        // 에러 리포트를 서버로 전송 (선택적)
        fetch("/api/errors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(errorReport),
          keepalive: true,
        }).catch(() => {
          // 에러 리포트 전송 실패는 무시
        });
      } catch (err) {
        // 에러 리포트 생성 실패는 무시
      }
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg border border-red-200 shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-[#171717] mb-2">
                  예상치 못한 오류가 발생했습니다
                </h1>
                <p className="text-gray-600">
                  죄송합니다. 문제가 발생했습니다. 페이지를 새로고침하거나 홈으로 돌아가주세요.
                </p>
              </div>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">에러 상세 정보 (개발 모드)</h2>
                <pre className="text-xs text-gray-600 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-[#1A5D3F] text-white rounded-lg font-medium hover:bg-[#144A32] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>다시 시도</span>
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>홈으로</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
