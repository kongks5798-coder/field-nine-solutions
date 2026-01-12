'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

/**
 * Login Page - 사용자 인증 페이지
 * 
 * 비즈니스 목적:
 * - 사용자 로그인으로 개인화된 분석 히스토리 제공
 * - 구독 서비스 전환을 위한 첫 단계
 * - Tesla Style 엄격 준수
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // 로그인 성공 → 대시보드로 이동
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // 회원가입 성공 → 이메일 확인 안내
      alert('이메일을 확인하여 계정을 활성화해주세요.');
    } catch (err: any) {
      setError(err.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border border-[#E5E5E5]" style={{ borderRadius: '4px' }}>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold text-[#171717] text-center">
            TrendStream
          </CardTitle>
          <CardDescription className="text-center text-[#171717]/60">
            로그인하여 트렌드 분석을 시작하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm" style={{ borderRadius: '4px' }}>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[#171717]">
                이메일
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="bg-white border-[#E5E5E5] text-[#171717]"
                style={{ borderRadius: '4px' }}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[#171717]">
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-white border-[#E5E5E5] text-[#171717]"
                style={{ borderRadius: '4px' }}
              />
            </div>

            <div className="space-y-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#C0392B] hover:bg-[#A93226] text-white"
                style={{ borderRadius: '4px' }}
              >
                {isLoading ? '처리 중...' : '로그인'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleSignUp}
                disabled={isLoading}
                className="w-full border-[#E5E5E5] text-[#171717] hover:bg-[#F9F9F7]"
                style={{ borderRadius: '4px' }}
              >
                회원가입
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-[#171717]/60 hover:text-[#C0392B] transition-colors"
            >
              ← 홈으로 돌아가기
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
