/**
 * Auth Callback Page
 * OAuth 리다이렉트 처리
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';

export default function AuthCallbackPage() {
  const router = useRouter();
  const locale = useLocale();
  const { setUserProfile, setWallet } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('인증 처리 중...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get session from URL hash
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          setStatus('error');
          setMessage('인증에 실패했습니다.');
          return;
        }

        if (session?.user) {
          // Set user profile
          setUserProfile({
            id: session.user.id,
            userId: session.user.id,
            kycStatus: 'not_submitted',
            kycVerifiedAt: null,
          });

          // Initialize wallet
          setWallet({
            balance: 0,
            currency: 'KRW',
            hasVirtualCard: false,
          });

          setStatus('success');
          setMessage('로그인 성공!');

          // Redirect to dashboard after short delay
          setTimeout(() => {
            router.push(`/${locale}/dashboard`);
          }, 1500);
        } else {
          setStatus('error');
          setMessage('세션을 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('Callback error:', err);
        setStatus('error');
        setMessage('오류가 발생했습니다.');
      }
    };

    handleCallback();
  }, [locale, router, setUserProfile, setWallet]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0F] via-[#0F0F1A] to-[#0A0A0F] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-white/60">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center"
            >
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </motion.div>
            <p className="text-white font-semibold text-lg">{message}</p>
            <p className="text-white/50 text-sm mt-2">잠시 후 대시보드로 이동합니다...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center"
            >
              <XCircle className="w-8 h-8 text-red-400" />
            </motion.div>
            <p className="text-white font-semibold text-lg">{message}</p>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/${locale}/auth/login`)}
              className="mt-4 px-6 py-2 bg-white/10 rounded-xl text-white/70 hover:bg-white/20 transition-colors"
            >
              로그인 페이지로 돌아가기
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  );
}
