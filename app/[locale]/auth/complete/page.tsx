'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuthClient } from '@/src/utils/supabase/auth-client';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function CompleteHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleComplete = async () => {
      const code = searchParams.get('code');
      const next = searchParams.get('next') || '/ko/dashboard';

      if (!code) {
        setStatus('error');
        setErrorMessage('인증 코드가 없습니다');
        setTimeout(() => router.push('/ko/auth/login?error=인증 코드가 없습니다'), 2000);
        return;
      }

      try {
        const supabase = getAuthClient();
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error('[Complete] Exchange error:', exchangeError);
          setStatus('error');
          setErrorMessage(exchangeError.message);
          setTimeout(() => router.push(`/ko/auth/login?error=${encodeURIComponent(exchangeError.message)}`), 2000);
          return;
        }

        setStatus('success');
        setTimeout(() => router.push(next), 1000);
      } catch (err) {
        console.error('[Complete] Unexpected error:', err);
        setStatus('error');
        setErrorMessage('인증 처리 중 오류가 발생했습니다');
        setTimeout(() => router.push('/ko/auth/login?error=인증 처리 중 오류가 발생했습니다'), 2000);
      }
    };

    handleComplete();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md w-full mx-4">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-[#1A5D3F] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">로그인 처리 중...</h2>
            <p className="text-gray-500">잠시만 기다려주세요</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">로그인 성공!</h2>
            <p className="text-gray-500">대시보드로 이동합니다...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✕</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">로그인 실패</h2>
            <p className="text-red-500 mb-4">{errorMessage}</p>
            <p className="text-gray-400 text-sm">로그인 페이지로 이동합니다...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md w-full mx-4">
            <Loader2 className="w-12 h-12 animate-spin text-[#1A5D3F] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">로그인 처리 중...</h2>
          </div>
        </div>
      }
    >
      <CompleteHandler />
    </Suspense>
  );
}
