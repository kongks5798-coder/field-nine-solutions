/**
 * Login Page
 * 로그인 페이지
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { auth } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const { setUserProfile, setWallet } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error: authError } = await auth.signIn(email, password);

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('이메일 인증이 필요합니다. 이메일을 확인해주세요.');
        } else {
          setError(authError.message);
        }
        return;
      }

      if (data.user) {
        // Set user profile in store
        setUserProfile({
          id: data.user.id,
          userId: data.user.id,
          kycStatus: 'not_submitted',
          kycVerifiedAt: null,
        });

        // Initialize wallet
        setWallet({
          balance: 0,
          currency: 'KRW',
          hasVirtualCard: false,
        });

        // Redirect to dashboard
        router.push(`/${locale}/dashboard`);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'kakao' | 'google') => {
    setError('');
    setIsLoading(true);

    try {
      const { error: authError } = await auth.signInWithOAuth(provider);

      if (authError) {
        setError(authError.message);
      }
    } catch (err) {
      console.error('OAuth error:', err);
      setError('소셜 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0F] via-[#0F0F1A] to-[#0A0A0F] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back Button */}
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>홈으로</span>
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">K-Universal</h1>
          <p className="text-white/60">로그인하고 모든 서비스를 이용하세요</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-sm text-white/60 mb-2">이메일</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm text-white/60 mb-2">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Forgot Password */}
            <div className="text-right">
              <Link
                href={`/${locale}/auth/forgot-password`}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>로그인</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#0F0F1A] text-white/40">또는</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <motion.button
              type="button"
              onClick={() => handleOAuthLogin('kakao')}
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-[#FEE500] rounded-xl text-[#191919] font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.8 5.16 4.5 6.54-.18.66-.66 2.4-.75 2.76-.12.48.18.48.36.36.15-.09 2.28-1.56 3.21-2.19.87.12 1.77.21 2.68.21 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"/>
              </svg>
              <span>카카오로 로그인</span>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-white rounded-xl text-gray-800 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Google로 로그인</span>
            </motion.button>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-white/60 mt-6">
            계정이 없으신가요?{' '}
            <Link
              href={`/${locale}/auth/signup`}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              회원가입
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
