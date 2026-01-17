'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

/**
 * OAuth 콜백 - Implicit Flow
 */
export default function AuthCallbackPage() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('로그인 처리 중...');

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            auth: {
              flowType: 'implicit',
              persistSession: true,
              detectSessionInUrl: true,
            }
          }
        );

        // URL hash에서 토큰 확인
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        // URL query에서 에러 확인
        const query = window.location.search.substring(1);
        const queryParams = new URLSearchParams(query);
        const error = queryParams.get('error') || hashParams.get('error');

        if (error) {
          throw new Error(queryParams.get('error_description') || error);
        }

        // access_token이 있으면 세션 설정
        if (accessToken) {
          const { error: setError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          if (setError) throw setError;
        }

        // 세션 감지 대기
        await new Promise(r => setTimeout(r, 500));

        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setMessage('로그인 성공!');
          setStatus('success');
          setTimeout(() => { window.location.href = '/ko/dashboard'; }, 500);
        } else {
          await new Promise(r => setTimeout(r, 1000));
          const { data: { session: retry } } = await supabase.auth.getSession();
          if (retry) {
            setMessage('로그인 성공!');
            setStatus('success');
            setTimeout(() => { window.location.href = '/ko/dashboard'; }, 500);
          } else {
            throw new Error('세션을 생성할 수 없습니다');
          }
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : '오류 발생';
        setMessage(errorMessage);
        setStatus('error');
        setTimeout(() => {
          window.location.href = `/ko/auth/login?error=${encodeURIComponent(errorMessage)}`;
        }, 2000);
      }
    };

    handleAuth();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F5F5F0',
      fontFamily: 'system-ui',
    }}>
      <div style={{ textAlign: 'center', padding: 32 }}>
        {status === 'loading' && (
          <div style={{
            width: 40, height: 40,
            border: '4px solid #E5E5E5',
            borderTopColor: '#1A5D3F',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
        )}
        {status === 'success' && (
          <div style={{
            width: 40, height: 40,
            background: '#D1FAE5',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#059669',
            fontSize: 20,
          }}>✓</div>
        )}
        {status === 'error' && (
          <div style={{
            width: 40, height: 40,
            background: '#FEE2E2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#DC2626',
            fontSize: 20,
          }}>✕</div>
        )}
        <p style={{
          fontSize: 16,
          fontWeight: 600,
          color: status === 'error' ? '#DC2626' : '#171717',
        }}>{message}</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
