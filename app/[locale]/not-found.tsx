/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 89: LOCALE 404 SAFETY NET
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'ko';
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          router.push(`/${locale}/dashboard`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, locale]);

  const handleRedirect = () => {
    router.push(`/${locale}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-[1px] left-0 right-0"
            style={{ top: `${(i + 1) * 10}%` }}
            animate={{ opacity: [0.05, 0.15, 0.05] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
          >
            <div className="h-full w-full bg-gradient-to-r from-transparent via-[#00E5FF]/20 to-transparent" />
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center"
      >
        <motion.div
          animate={{
            textShadow: [
              '0 0 10px rgba(0,229,255,0.3)',
              '0 0 30px rgba(0,229,255,0.5)',
              '0 0 10px rgba(0,229,255,0.3)',
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-[120px] font-black text-[#00E5FF] leading-none mb-4"
        >
          404
        </motion.div>

        <h1 className="text-2xl font-bold text-white mb-2">
          {locale === 'ko' ? '페이지를 찾을 수 없습니다' : 'Page Not Found'}
        </h1>
        <p className="text-white/50 mb-8 max-w-md">
          {locale === 'ko'
            ? '요청하신 경로가 존재하지 않습니다. 대시보드로 이동합니다...'
            : 'This path doesn\'t exist. Redirecting to dashboard...'}
        </p>

        <motion.div
          key={countdown}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 rounded-full border border-white/10">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-[#00E5FF]"
            />
            <span className="text-white/70">
              <span className="text-[#00E5FF] font-bold">{countdown}</span>
              {locale === 'ko' ? '초 후 이동' : 's'}
            </span>
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRedirect}
          className="px-8 py-4 bg-[#00E5FF] text-[#171717] font-bold text-lg rounded-2xl"
          style={{ boxShadow: '0 0 30px rgba(0,229,255,0.3)' }}
        >
          {locale === 'ko' ? '대시보드로 이동' : 'Go to Dashboard'}
        </motion.button>

        <div className="mt-12 text-white/30 text-sm">
          <span className="font-black">FIELD NINE</span> • Energy OS v89.0
        </div>
      </motion.div>
    </div>
  );
}
