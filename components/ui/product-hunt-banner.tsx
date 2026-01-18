/**
 * K-Universal Product Hunt Launch Banner
 * Countdown timer and launch notification
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Bell, ExternalLink, X, Users, Clock } from 'lucide-react';

const LAUNCH_DATE = new Date('2025-01-21T00:01:00-08:00'); // PT timezone for PH
const PH_URL = 'https://www.producthunt.com/posts/k-universal';
const STORAGE_KEY = 'k-universal-ph-banner-dismissed';

interface ProductHuntBannerProps {
  variant?: 'floating' | 'inline' | 'header';
  locale?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function ProductHuntBanner({
  variant = 'floating',
  locale = 'en',
}: ProductHuntBannerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [signupCount, setSignupCount] = useState(847);
  const [isLaunched, setIsLaunched] = useState(false);

  const isKorean = locale === 'ko';

  useEffect(() => {
    // Check if dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed && variant === 'floating') {
      setIsVisible(false);
    }

    // Calculate time left
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = LAUNCH_DATE.getTime() - now.getTime();

      if (difference <= 0) {
        setIsLaunched(true);
        return null;
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Simulate increasing signup count
    const signupTimer = setInterval(() => {
      setSignupCount((prev) => prev + Math.floor(Math.random() * 3));
    }, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(signupTimer);
    };
  }, [variant]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
  };

  const handleNotifyMe = () => {
    window.open(PH_URL, '_blank');
  };

  if (!isVisible) return null;

  // Floating variant (bottom banner)
  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ delay: 1, type: 'spring', damping: 20 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe"
      >
        <div className="max-w-lg mx-auto">
          <div className="relative bg-gradient-to-r from-[#DA552F] to-[#EA7246] rounded-2xl p-4 shadow-2xl">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>

            <div className="flex items-center gap-4">
              {/* Product Hunt Cat */}
              <div className="hidden sm:flex w-14 h-14 rounded-xl bg-white flex-shrink-0 items-center justify-center">
                <img
                  src="https://ph-static.imgix.net/ph-logo-1.png"
                  alt="Product Hunt"
                  className="w-10 h-10"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Rocket className="w-4 h-4 text-white" />
                  <span className="text-white font-bold text-sm">
                    {isLaunched
                      ? (isKorean ? 'Product Hunt 런칭!' : 'We\'re Live on Product Hunt!')
                      : (isKorean ? 'Product Hunt 런칭 예정' : 'Launching on Product Hunt')}
                  </span>
                </div>

                {!isLaunched && timeLeft && (
                  <div className="flex items-center gap-3">
                    <CountdownUnit value={timeLeft.days} label={isKorean ? '일' : 'd'} />
                    <span className="text-white/60">:</span>
                    <CountdownUnit value={timeLeft.hours} label={isKorean ? '시' : 'h'} />
                    <span className="text-white/60">:</span>
                    <CountdownUnit value={timeLeft.minutes} label={isKorean ? '분' : 'm'} />
                    <span className="text-white/60">:</span>
                    <CountdownUnit value={timeLeft.seconds} label={isKorean ? '초' : 's'} />
                  </div>
                )}

                {isLaunched && (
                  <p className="text-white/80 text-sm">
                    {isKorean ? '지금 투표하고 응원해주세요!' : 'Support us with your upvote!'}
                  </p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNotifyMe}
                className="flex-shrink-0 px-4 py-2 bg-white rounded-xl text-[#DA552F] text-sm font-bold flex items-center gap-2"
              >
                {isLaunched ? (
                  <>
                    <span>{isKorean ? '투표하기' : 'Upvote'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    <span>{isKorean ? '알림받기' : 'Notify Me'}</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Inline variant (for landing page)
  if (variant === 'inline') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#DA552F]/10 to-[#EA7246]/10 border border-[#DA552F]/30 rounded-2xl p-6"
      >
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#DA552F] to-[#EA7246] flex items-center justify-center">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold">
                {isLaunched
                  ? (isKorean ? 'Product Hunt 런칭 중!' : 'Live on Product Hunt!')
                  : (isKorean ? 'Product Hunt 런칭' : 'Product Hunt Launch')}
              </h3>
              <p className="text-white/60 text-sm">
                {isLaunched
                  ? (isKorean ? '지금 투표해주세요!' : 'Vote for us now!')
                  : 'January 21, 2025'}
              </p>
            </div>
          </div>

          {!isLaunched && timeLeft && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
              <Clock className="w-4 h-4 text-[#DA552F]" />
              <span className="text-white font-mono">
                {String(timeLeft.days).padStart(2, '0')}:
                {String(timeLeft.hours).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-white font-bold">{signupCount.toLocaleString()}</span>
            <span className="text-white/60 text-sm">{isKorean ? '명 대기중' : 'waiting'}</span>
          </div>

          <motion.a
            href={PH_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2.5 bg-gradient-to-r from-[#DA552F] to-[#EA7246] rounded-xl text-white text-sm font-bold flex items-center gap-2"
          >
            {isLaunched ? (
              <>
                <span>{isKorean ? '투표하기' : 'Upvote Now'}</span>
                <ExternalLink className="w-4 h-4" />
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                <span>{isKorean ? '알림받기' : 'Get Notified'}</span>
              </>
            )}
          </motion.a>
        </div>
      </motion.div>
    );
  }

  // Header variant (compact top banner)
  if (variant === 'header') {
    return (
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-gradient-to-r from-[#DA552F] to-[#EA7246] text-white text-center py-2 px-4"
      >
        <a
          href={PH_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm font-medium hover:underline"
        >
          <Rocket className="w-4 h-4" />
          <span>
            {isLaunched
              ? (isKorean ? 'Product Hunt에서 투표해주세요!' : 'We\'re live on Product Hunt! Vote for us')
              : (isKorean ? '1월 21일 Product Hunt 런칭 - 알림 받기' : 'Launching Jan 21 on Product Hunt - Get notified')}
          </span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </motion.div>
    );
  }

  return null;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-0.5">
      <span className="text-white font-bold text-lg font-mono">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-white/60 text-xs">{label}</span>
    </div>
  );
}

// Official Product Hunt Badge
export function ProductHuntBadge({ theme = 'dark' }: { theme?: 'light' | 'dark' }) {
  return (
    <a
      href={PH_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block"
    >
      <img
        src={`https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=123456&theme=${theme}`}
        alt="K-Universal on Product Hunt"
        style={{ width: '250px', height: '54px' }}
        width="250"
        height="54"
      />
    </a>
  );
}
