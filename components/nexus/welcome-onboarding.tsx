/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 79: ZERO-INSTRUCTION ONBOARDING POPUP
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 로그인 직후 0.5초 이내 표시되는 웰컴 팝업
 * - "Welcome Boss" 메시지
 * - 제국 총 자산(TVL $127M) 표시
 * - 지갑 연결 튜토리얼
 * - 원터치 시작 가이드
 *
 * Design: Tesla-style warm ivory + deep black
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface WelcomeOnboardingProps {
  userName?: string;
  isNewUser?: boolean;
  onComplete?: () => void;
}

interface EmpireStats {
  tvl: number;
  activeUsers: number;
  dailyYield: number;
  smpPrice: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STORAGE KEYS
// ═══════════════════════════════════════════════════════════════════════════════

const ONBOARDING_COMPLETE_KEY = 'nexus_onboarding_complete';
const ONBOARDING_SHOWN_KEY = 'nexus_onboarding_shown_at';

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════════════════════

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 400 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: { duration: 0.2 },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function WelcomeStep({
  stats,
  userName,
  onNext,
}: {
  stats: EmpireStats;
  userName?: string;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-center"
    >
      {/* Crown Animation */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: 'spring', damping: 15 }}
        className="text-6xl mb-4"
      >
        👑
      </motion.div>

      {/* Welcome Message */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-black text-[#171717] mb-2"
      >
        Welcome, {userName || 'Boss'}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-[#171717]/60 mb-8"
      >
        Field Nine 제국에 오신 것을 환영합니다
      </motion.p>

      {/* Empire Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 gap-3 mb-8"
      >
        <div className="bg-[#171717] rounded-2xl p-4 text-center">
          <div className="text-[#F9F9F7]/60 text-xs mb-1">제국 총 자산</div>
          <div className="text-2xl font-black text-[#F9F9F7]">
            ${(stats.tvl / 1000000).toFixed(0)}M
          </div>
          <div className="text-emerald-400 text-xs">TVL</div>
        </div>
        <div className="bg-[#171717] rounded-2xl p-4 text-center">
          <div className="text-[#F9F9F7]/60 text-xs mb-1">활성 사용자</div>
          <div className="text-2xl font-black text-[#F9F9F7]">
            {stats.activeUsers.toLocaleString()}
          </div>
          <div className="text-cyan-400 text-xs">Members</div>
        </div>
        <div className="bg-[#171717] rounded-2xl p-4 text-center">
          <div className="text-[#F9F9F7]/60 text-xs mb-1">일일 수익률</div>
          <div className="text-2xl font-black text-emerald-400">
            {stats.dailyYield.toFixed(2)}%
          </div>
          <div className="text-[#F9F9F7]/40 text-xs">APY 기준</div>
        </div>
        <div className="bg-[#171717] rounded-2xl p-4 text-center">
          <div className="text-[#F9F9F7]/60 text-xs mb-1">현재 SMP</div>
          <div className="text-2xl font-black text-amber-400">
            ₩{stats.smpPrice.toFixed(0)}
          </div>
          <div className="text-[#F9F9F7]/40 text-xs">KRW/kWh</div>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={onNext}
        className="w-full py-4 bg-[#171717] text-[#F9F9F7] rounded-2xl font-bold text-lg hover:bg-[#171717]/90 transition-all"
      >
        시작하기 →
      </motion.button>
    </motion.div>
  );
}

function TutorialStep({
  step,
  onNext,
  onSkip,
}: {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const tutorials = [
    {
      icon: '⚡',
      title: '실시간 에너지 수익',
      description: '영동 50MW 태양광 + 테슬라 V2G에서 발생하는 실제 전력 판매 수익이 KAUS 보유자에게 배당됩니다.',
      tip: '에너지 탭에서 실시간 발전량 확인',
    },
    {
      icon: '💰',
      title: 'KAUS 토큰 환전',
      description: '거래소에서 KAUS를 구매/판매하고 스테이킹으로 추가 수익을 얻으세요.',
      tip: '환전 탭에서 실시간 시세 확인',
    },
    {
      icon: '🎁',
      title: '추천인 보상',
      description: '친구를 초대하면 양측 모두 10 KAUS 즉시 지급! 리퍼럴 코드를 공유하세요.',
      tip: '프로필에서 내 추천 코드 확인',
    },
  ];

  const current = tutorials[step] || tutorials[0];

  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="text-center"
    >
      {/* Step Indicator */}
      <div className="flex justify-center gap-2 mb-6">
        {tutorials.map((_, idx) => (
          <div
            key={idx}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === step ? 'w-6 bg-[#171717]' : 'bg-[#171717]/20'
            }`}
          />
        ))}
      </div>

      {/* Icon */}
      <div className="text-5xl mb-4">{current.icon}</div>

      {/* Content */}
      <h2 className="text-2xl font-bold text-[#171717] mb-3">{current.title}</h2>
      <p className="text-[#171717]/60 mb-6 leading-relaxed">{current.description}</p>

      {/* Tip Box */}
      <div className="bg-[#171717]/5 rounded-xl p-4 mb-8">
        <div className="text-xs text-[#171717]/40 mb-1">💡 TIP</div>
        <div className="text-sm text-[#171717]/80">{current.tip}</div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onSkip}
          className="flex-1 py-3 border-2 border-[#171717]/20 text-[#171717]/60 rounded-xl font-medium hover:bg-[#171717]/5 transition-all"
        >
          건너뛰기
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-3 bg-[#171717] text-[#F9F9F7] rounded-xl font-bold hover:bg-[#171717]/90 transition-all"
        >
          {step === tutorials.length - 1 ? '완료' : '다음'}
        </button>
      </div>
    </motion.div>
  );
}

function CompleteStep({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 10 }}
        className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <motion.span
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl text-white"
        >
          ✓
        </motion.span>
      </motion.div>

      <h2 className="text-2xl font-bold text-[#171717] mb-2">준비 완료!</h2>
      <p className="text-[#171717]/60 mb-8">
        이제 Field Nine 제국의 모든 기능을 이용하실 수 있습니다
      </p>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <a
          href="/ko/nexus/energy"
          className="p-4 bg-[#171717]/5 rounded-xl hover:bg-[#171717]/10 transition-all"
        >
          <div className="text-2xl mb-1">⚡</div>
          <div className="text-xs text-[#171717]/60">에너지</div>
        </a>
        <a
          href="/ko/nexus/exchange"
          className="p-4 bg-[#171717]/5 rounded-xl hover:bg-[#171717]/10 transition-all"
        >
          <div className="text-2xl mb-1">💱</div>
          <div className="text-xs text-[#171717]/60">환전</div>
        </a>
        <a
          href="/ko/nexus/profile"
          className="p-4 bg-[#171717]/5 rounded-xl hover:bg-[#171717]/10 transition-all"
        >
          <div className="text-2xl mb-1">👤</div>
          <div className="text-xs text-[#171717]/60">프로필</div>
        </a>
      </div>

      <button
        onClick={onClose}
        className="w-full py-4 bg-[#171717] text-[#F9F9F7] rounded-2xl font-bold text-lg hover:bg-[#171717]/90 transition-all"
      >
        제국 입장 →
      </button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function WelcomeOnboarding({
  userName,
  isNewUser = false,
  onComplete,
}: WelcomeOnboardingProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState<'welcome' | 'tutorial' | 'complete'>('welcome');
  const [tutorialStep, setTutorialStep] = useState(0);
  const [stats, setStats] = useState<EmpireStats>({
    tvl: 127000000,
    activeUsers: 47892,
    dailyYield: 0.117,
    smpPrice: 112,
  });

  // Check if should show onboarding
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Skip if already completed and not a new user
    const isComplete = localStorage.getItem(ONBOARDING_COMPLETE_KEY);
    if (isComplete && !isNewUser) return;

    // Show after 500ms delay
    const timer = setTimeout(() => {
      setIsVisible(true);
      localStorage.setItem(ONBOARDING_SHOWN_KEY, Date.now().toString());
    }, 500);

    return () => clearTimeout(timer);
  }, [isNewUser]);

  // Fetch live stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/energy/live');
        const data = await response.json();
        if (data.success) {
          setStats((prev) => ({
            ...prev,
            smpPrice: data.market?.smpPrice || prev.smpPrice,
          }));
        }
      } catch {
        // Use default stats
      }
    };

    fetchStats();
  }, []);

  const handleWelcomeNext = useCallback(() => {
    setCurrentStep('tutorial');
  }, []);

  const handleTutorialNext = useCallback(() => {
    if (tutorialStep < 2) {
      setTutorialStep((prev) => prev + 1);
    } else {
      setCurrentStep('complete');
    }
  }, [tutorialStep]);

  const handleSkip = useCallback(() => {
    setCurrentStep('complete');
  }, []);

  const handleClose = useCallback(() => {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    setIsVisible(false);
    onComplete?.();
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-[201]"
          >
            <div className="bg-[#F9F9F7] rounded-3xl p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#171717]/5 flex items-center justify-center text-[#171717]/40 hover:bg-[#171717]/10 hover:text-[#171717]/60 transition-all"
              >
                ✕
              </button>

              {/* Content */}
              <AnimatePresence mode="wait">
                {currentStep === 'welcome' && (
                  <WelcomeStep
                    key="welcome"
                    stats={stats}
                    userName={userName}
                    onNext={handleWelcomeNext}
                  />
                )}
                {currentStep === 'tutorial' && (
                  <TutorialStep
                    key={`tutorial-${tutorialStep}`}
                    step={tutorialStep}
                    onNext={handleTutorialNext}
                    onSkip={handleSkip}
                  />
                )}
                {currentStep === 'complete' && (
                  <CompleteStep key="complete" onClose={handleClose} />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK FOR MANUAL TRIGGER
// ═══════════════════════════════════════════════════════════════════════════════

export function useWelcomeOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  const triggerOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    setShowOnboarding(true);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    localStorage.removeItem(ONBOARDING_SHOWN_KEY);
  }, []);

  return {
    showOnboarding,
    setShowOnboarding,
    triggerOnboarding,
    resetOnboarding,
  };
}

export default WelcomeOnboarding;
