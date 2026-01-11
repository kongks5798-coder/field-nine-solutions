'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, AlertCircle } from 'lucide-react';
import { createClient } from '@/src/utils/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // URL에서 에러 파라미터 확인
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const errorMessage = searchParams.get('message');
    
    if (errorParam) {
      switch (errorParam) {
        case 'no_code':
          setError('인증 코드를 받지 못했습니다. 다시 시도해주세요.');
          break;
        case 'session_exchange_failed':
          setError('세션 생성에 실패했습니다. 다시 시도해주세요.');
          break;
        case 'oauth_error':
          setError(errorMessage || 'OAuth 인증 중 오류가 발생했습니다.');
          break;
        case 'provider_not_enabled':
          setError('OAuth 프로바이더가 활성화되지 않았습니다. 관리자에게 문의하세요.');
          break;
        case 'oauth_config_error':
          setError('OAuth 설정이 완료되지 않았습니다.');
          break;
        case 'rate_limit_exceeded':
          setError('너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.');
          break;
        default:
          setError('로그인 중 오류가 발생했습니다.');
      }
    }
  }, [searchParams]);

  // 이미 로그인된 경우 대시보드로 리다이렉트
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/dashboard');
      }
    };
    checkSession();
  }, [router, supabase]);

  const handleKakaoLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${origin}/auth/callback?next=/dashboard`;

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (authError) {
        let errorMessage = '카카오 로그인 중 오류가 발생했습니다.';
        
        if (authError.message.includes('unsupported_provider') || authError.message.includes('provider is not enabled')) {
          errorMessage = '카카오 로그인이 활성화되지 않았습니다. Supabase 대시보드에서 Kakao 프로바이더를 활성화해주세요.';
        } else if (authError.message.includes('no_relation_for_ref') || authError.message.includes('configuration')) {
          errorMessage = '카카오 OAuth 설정이 완료되지 않았습니다. Supabase 대시보드에서 Client ID와 Secret을 설정해주세요.';
        } else if (authError.message.includes('redirect_uri_mismatch')) {
          errorMessage = '리다이렉트 URL이 일치하지 않습니다. Kakao Developers와 Supabase 설정을 확인해주세요.';
        }
        
        setError(errorMessage);
        setIsLoading(false);
      }
      // 성공 시 OAuth 리다이렉트되므로 로딩 상태는 유지
    } catch (err) {
      console.error('[LoginPage] 카카오 로그인 오류:', err);
      setError('예상치 못한 오류가 발생했습니다. 다시 시도해주세요.');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${origin}/auth/callback?next=/dashboard`;

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (authError) {
        let errorMessage = '구글 로그인 중 오류가 발생했습니다.';
        
        if (authError.message.includes('unsupported_provider') || authError.message.includes('provider is not enabled')) {
          errorMessage = '구글 로그인이 활성화되지 않았습니다. Supabase 대시보드에서 Google 프로바이더를 활성화해주세요.';
        } else if (authError.message.includes('no_relation_for_ref') || authError.message.includes('configuration')) {
          errorMessage = '구글 OAuth 설정이 완료되지 않았습니다. Supabase 대시보드에서 Client ID와 Secret을 설정해주세요.';
        } else if (authError.message.includes('redirect_uri_mismatch')) {
          errorMessage = '리다이렉트 URL이 일치하지 않습니다. Google Cloud Console과 Supabase 설정을 확인해주세요.';
        }
        
        setError(errorMessage);
        setIsLoading(false);
      }
      // 성공 시 OAuth 리다이렉트되므로 로딩 상태는 유지
    } catch (err) {
      console.error('[LoginPage] 구글 로그인 오류:', err);
      setError('예상치 못한 오류가 발생했습니다. 다시 시도해주세요.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F0E9] flex items-center justify-center px-6">
      <Card className="w-full max-w-md border-[#E5E7EB]">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#000000] rounded-lg flex items-center justify-center">
              <Brain className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription className="mt-2">
            Field Nine에 오신 것을 환영합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <Button
            onClick={handleKakaoLogin}
            disabled={isLoading}
            className="w-full bg-[#FEE500] text-[#000000] hover:bg-[#FEE500]/90"
            size="lg"
          >
            {isLoading ? '로그인 중...' : '카카오로 로그인'}
          </Button>
          
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {isLoading ? '로그인 중...' : '구글로 로그인'}
          </Button>

          <div className="text-center text-sm text-[#64748B] mt-6">
            <p>
              로그인하면{' '}
              <Link href="/terms" className="underline hover:text-[#1A1A1A]">
                이용약관
              </Link>
              과{' '}
              <Link href="/privacy" className="underline hover:text-[#1A1A1A]">
                개인정보처리방침
              </Link>
              에 동의하는 것입니다.
            </p>
          </div>

          <div className="text-center mt-6">
            <Link href="/">
              <Button variant="ghost" className="text-sm">
                돌아가기
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
