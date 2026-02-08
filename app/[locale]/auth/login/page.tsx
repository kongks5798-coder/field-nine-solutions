/**
 * Login Page - Tesla Style
 * 테슬라 스타일 미니멀리스트 로그인 페이지
 * @version 2.0.0 - Production Grade
 *
 * Design System:
 * - Background: #F9F9F7 (Warm White)
 * - Text Primary: #171717 (Near Black)
 * - Text Secondary: #525252 (Gray)
 * - Border: #E5E5E5 (Light Gray)
 * - Accent: #171717 (Black for buttons)
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { auth } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // URL에서 에러 메시지 확인
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const { data, error: authError } = await auth.signIn(email, password);

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data?.user) {
        const redirectTo = searchParams.get('redirect') || `/${locale}/dashboard`;
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err) {
      console.error('[Login] Exception:', err);
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'kakao' | 'google') => {
    setError('');
    setLoadingProvider(provider);

    try {
      const { error: authError } = await auth.signInWithOAuth(provider);

      if (authError) {
        setError(authError.message);
        setLoadingProvider(null);
      }
      // OAuth는 리다이렉트되므로 성공 시 로딩 상태 유지
    } catch (err) {
      console.error('[OAuth] Exception:', err);
      setError('소셜 로그인 중 오류가 발생했습니다.');
      setLoadingProvider(null);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const { error: authError } = await auth.signInWithOtp(email);

      if (authError) {
        setError(authError.message);
        return;
      }

      setSuccess('로그인 링크가 이메일로 전송되었습니다. 이메일을 확인해주세요.');
    } catch (err) {
      console.error('[MagicLink] Exception:', err);
      setError('이메일 전송 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F9F9F7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Link
            href={`/${locale}`}
            style={{
              display: 'inline-block',
              marginBottom: '24px',
              textDecoration: 'none',
            }}
          >
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 600,
                color: '#171717',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              K-Universal
            </h1>
          </Link>
          <p
            style={{
              fontSize: '15px',
              color: '#525252',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            글로벌 결제의 새로운 기준
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '14px 16px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#DC2626"
              strokeWidth="2"
              style={{ flexShrink: 0, marginTop: '1px' }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontSize: '14px', color: '#DC2626', lineHeight: 1.5 }}>
              {error}
            </span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div
            style={{
              padding: '14px 16px',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '8px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#16A34A"
              strokeWidth="2"
              style={{ flexShrink: 0, marginTop: '1px' }}
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span style={{ fontSize: '14px', color: '#16A34A', lineHeight: 1.5 }}>
              {success}
            </span>
          </div>
        )}

        {/* Social Login Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {/* Kakao */}
          <button
            type="button"
            onClick={() => handleOAuthLogin('kakao')}
            disabled={!!loadingProvider}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: '#FEE500',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 500,
              color: '#191919',
              cursor: loadingProvider ? 'not-allowed' : 'pointer',
              opacity: loadingProvider && loadingProvider !== 'kakao' ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'opacity 0.15s ease',
            }}
          >
            {loadingProvider === 'kakao' ? (
              <LoadingSpinner color="#191919" />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#191919">
                  <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.8 5.16 4.5 6.54-.18.66-.66 2.4-.75 2.76-.12.48.18.48.36.36.15-.09 2.28-1.56 3.21-2.19.87.12 1.77.21 2.68.21 5.52 0 10-3.48 10-7.8S17.52 3 12 3z" />
                </svg>
                카카오로 계속하기
              </>
            )}
          </button>

          {/* Google */}
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            disabled={!!loadingProvider}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: '#FFFFFF',
              border: '1px solid #E5E5E5',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 500,
              color: '#171717',
              cursor: loadingProvider ? 'not-allowed' : 'pointer',
              opacity: loadingProvider && loadingProvider !== 'google' ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'opacity 0.15s ease',
            }}
          >
            {loadingProvider === 'google' ? (
              <LoadingSpinner color="#171717" />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google로 계속하기
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: '#E5E5E5' }} />
          <span style={{ fontSize: '13px', color: '#737373' }}>또는 이메일로 로그인</span>
          <div style={{ flex: 1, height: '1px', background: '#E5E5E5' }} />
        </div>

        {/* Email Login Form */}
        <form onSubmit={handleEmailLogin}>
          {/* Email Input */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#171717',
                marginBottom: '8px',
              }}
            >
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              autoComplete="email"
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '15px',
                color: '#171717',
                background: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.15s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#171717')}
              onBlur={(e) => (e.target.style.borderColor = '#E5E5E5')}
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <label
                htmlFor="password"
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#171717',
                }}
              >
                비밀번호
              </label>
              <Link
                href={`/${locale}/auth/forgot-password`}
                style={{
                  fontSize: '13px',
                  color: '#525252',
                  textDecoration: 'none',
                }}
              >
                비밀번호 찾기
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '14px 48px 14px 16px',
                  fontSize: '15px',
                  color: '#171717',
                  background: '#FFFFFF',
                  border: '1px solid #E5E5E5',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#171717')}
                onBlur={(e) => (e.target.style.borderColor = '#E5E5E5')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: '#171717',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 500,
              color: '#FFFFFF',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity 0.15s ease',
            }}
          >
            {isLoading ? <LoadingSpinner color="#FFFFFF" /> : '로그인'}
          </button>

          {/* Magic Link Button */}
          <button
            type="button"
            onClick={handleMagicLink}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: 'transparent',
              border: '1px solid #E5E5E5',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 500,
              color: '#171717',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              marginTop: '12px',
              transition: 'opacity 0.15s ease, border-color 0.15s ease',
            }}
          >
            이메일 링크로 로그인
          </button>
        </form>

        {/* Sign Up Link */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '14px',
            color: '#525252',
            marginTop: '32px',
          }}
        >
          계정이 없으신가요?{' '}
          <Link
            href={`/${locale}/auth/signup`}
            style={{
              color: '#171717',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            회원가입
          </Link>
        </p>

        {/* Footer */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#A3A3A3',
            marginTop: '48px',
            lineHeight: 1.6,
          }}
        >
          로그인함으로써{' '}
          <Link href={`/${locale}/terms`} style={{ color: '#737373', textDecoration: 'underline' }}>
            이용약관
          </Link>
          과{' '}
          <Link href={`/${locale}/privacy`} style={{ color: '#737373', textDecoration: 'underline' }}>
            개인정보처리방침
          </Link>
          에 동의합니다.
        </p>
      </div>
    </div>
  );
}

/**
 * Loading Spinner Component
 */
function LoadingSpinner({ color = '#171717' }: { color?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      style={{
        animation: 'spin 1s linear infinite',
      }}
    >
      <style>
        {`@keyframes spin { to { transform: rotate(360deg); } }`}
      </style>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
        strokeDashoffset="10"
        opacity="0.25"
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
        strokeDashoffset="60"
      />
    </svg>
  );
}
