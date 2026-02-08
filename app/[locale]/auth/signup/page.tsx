/**
 * Sign Up Page
 * 회원가입 페이지
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
  User,
  Phone,
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { auth } from '@/lib/supabase/client';

export default function SignUpPage() {
  const router = useRouter();
  const locale = useLocale();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Password validation
  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = formData.password === formData.confirmPassword;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!isPasswordValid) {
      setError('비밀번호 조건을 모두 충족해야 합니다.');
      return;
    }

    if (!passwordsMatch) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!agreeTerms) {
      setError('이용약관에 동의해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: authError } = await auth.signUp(
        formData.email,
        formData.password,
        {
          name: formData.name,
          phone: formData.phone,
        }
      );

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('이미 등록된 이메일입니다.');
        } else {
          setError(authError.message);
        }
        return;
      }

      if (data.user) {
        setSuccess(true);
        // Email confirmation이 필요한 경우 안내
        // Supabase 설정에 따라 바로 로그인되거나 이메일 확인이 필요할 수 있음
      }
    } catch (err) {
      console.error('SignUp error:', err);
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A0A0F] via-[#0F0F1A] to-[#0A0A0F] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">가입 완료!</h2>
          <p className="text-white/60 mb-6">
            이메일로 인증 링크를 보내드렸습니다.<br />
            이메일을 확인하고 인증을 완료해주세요.
          </p>
          <Link href={`/${locale}/auth/login`}>
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-semibold"
            >
              로그인 페이지로 이동
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0F] via-[#0F0F1A] to-[#0A0A0F] flex items-center justify-center p-4 py-12">
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
          <h1 className="text-3xl font-bold text-white mb-2">회원가입</h1>
          <p className="text-white/60">K-Universal 계정을 만들어보세요</p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Name Input */}
            <div>
              <label className="block text-sm text-white/60 mb-2">이름</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="홍길동"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm text-white/60 mb-2">이메일</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Phone Input */}
            <div>
              <label className="block text-sm text-white/60 mb-2">전화번호 (선택)</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="010-1234-5678"
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
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

              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <PasswordCheck passed={passwordChecks.length} text="8자 이상" />
                  <PasswordCheck passed={passwordChecks.uppercase} text="대문자 포함" />
                  <PasswordCheck passed={passwordChecks.lowercase} text="소문자 포함" />
                  <PasswordCheck passed={passwordChecks.number} text="숫자 포함" />
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm text-white/60 mb-2">비밀번호 확인</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className={`w-full pl-12 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none transition-colors ${
                    formData.confirmPassword
                      ? passwordsMatch
                        ? 'border-emerald-500/50'
                        : 'border-red-500/50'
                      : 'border-white/10 focus:border-blue-500/50'
                  }`}
                />
              </div>
              {formData.confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-xs text-red-400">비밀번호가 일치하지 않습니다</p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
              />
              <label htmlFor="terms" className="text-sm text-white/60">
                <Link href={`/${locale}/terms`} className="text-blue-400 hover:underline">
                  이용약관
                </Link>
                {' 및 '}
                <Link href={`/${locale}/privacy`} className="text-blue-400 hover:underline">
                  개인정보처리방침
                </Link>
                에 동의합니다
              </label>
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

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading || !isPasswordValid || !passwordsMatch || !agreeTerms}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>회원가입</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Login Link */}
          <p className="text-center text-white/60 mt-6">
            이미 계정이 있으신가요?{' '}
            <Link
              href={`/${locale}/auth/login`}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              로그인
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// Password Check Component
function PasswordCheck({ passed, text }: { passed: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${passed ? 'text-emerald-400' : 'text-white/40'}`}>
      {passed ? (
        <CheckCircle className="w-3 h-3" />
      ) : (
        <div className="w-3 h-3 rounded-full border border-current" />
      )}
      <span>{text}</span>
    </div>
  );
}
