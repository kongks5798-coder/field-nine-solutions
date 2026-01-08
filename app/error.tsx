'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Error Boundary (라우트 레벨)
 * 특정 라우트에서 발생하는 에러를 처리합니다.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 로깅
    console.error('🚨 Route Error:', error);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Error Digest:', error.digest);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg border-2 border-red-200 shadow-lg p-8">
        {/* 에러 아이콘 */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* 에러 제목 */}
        <h1 className="text-3xl font-bold text-red-900 text-center mb-4">
          페이지 오류
        </h1>

        {/* 에러 메시지 */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            에러 메시지:
          </h2>
          <p className="text-red-700 font-mono text-sm break-words whitespace-pre-wrap">
            {error.message || '알 수 없는 에러가 발생했습니다.'}
          </p>
        </div>

        {/* 에러 상세 정보 (프로덕션에서도 표시 - 디버깅용) */}
        {error.stack && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              스택 트레이스:
            </h2>
            <pre className="text-xs text-red-700 overflow-auto max-h-96 font-mono whitespace-pre-wrap break-words">
              {error.stack}
            </pre>
          </div>
        )}

        {/* Digest */}
        {error.digest && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Error Digest:</span>{' '}
              <code className="font-mono">{error.digest}</code>
            </p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1A5D3F] text-white rounded-lg hover:bg-[#1A5D3F]/90 transition-colors font-medium"
          >
            <RefreshCw className="w-5 h-5" />
            다시 시도
          </button>
          <a
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <Home className="w-5 h-5" />
            홈으로 가기
          </a>
        </div>
      </div>
    </div>
  );
}
