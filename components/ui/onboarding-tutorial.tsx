/**
 * K-Universal Onboarding Tutorial
 * Interactive 3-step guide for new users
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Wallet,
  Car,
  UtensilsCrossed,
  Globe,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
} from 'lucide-react';

interface OnboardingStep {
  id: number;
  icon: React.ElementType;
  title: string;
  titleKo: string;
  description: string;
  descriptionKo: string;
  highlight: string;
  highlightKo: string;
  color: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    icon: Wallet,
    title: 'Ghost Wallet',
    titleKo: 'Ghost Wallet',
    description: 'Top up instantly with any card. Pay anywhere in Korea without a Korean bank account.',
    descriptionKo: '카드로 바로 충전하고, 한국 어디서나 결제하세요. 한국 계좌 없이도 OK!',
    highlight: 'No Korean Bank Needed',
    highlightKo: '한국 계좌 불필요',
    color: 'from-blue-500 to-purple-600',
  },
  {
    id: 2,
    icon: Car,
    title: 'K-Lifestyle Services',
    titleKo: 'K-Lifestyle 서비스',
    description: 'Call taxis, order food delivery, and book hotels - all in English, no Korean phone number required.',
    descriptionKo: '택시 호출, 배달 주문, 호텔 예약 - 모두 영어로, 한국 번호 없이!',
    highlight: 'Taxi • Food • Hotels',
    highlightKo: '택시 • 배달 • 호텔',
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 3,
    icon: Globe,
    title: 'AI Concierge',
    titleKo: 'AI 컨시어지',
    description: 'Ask anything about Korea. Our AI speaks your language and knows local secrets.',
    descriptionKo: '한국에 대해 뭐든 물어보세요. AI가 현지 정보를 알려드려요.',
    highlight: '24/7 Multilingual Support',
    highlightKo: '24시간 다국어 지원',
    color: 'from-emerald-500 to-cyan-500',
  },
];

const STORAGE_KEY = 'k-universal-onboarding-completed';

interface OnboardingTutorialProps {
  locale?: string;
  forceShow?: boolean;
  onComplete?: () => void;
}

export function OnboardingTutorial({
  locale = 'en',
  forceShow = false,
  onComplete
}: OnboardingTutorialProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  const isKorean = locale === 'ko';

  useEffect(() => {
    // Check if user has completed onboarding
    if (forceShow) {
      setIsVisible(true);
      return;
    }

    const hasCompleted = localStorage.getItem(STORAGE_KEY);
    if (!hasCompleted) {
      // Small delay for smoother experience
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={handleSkip}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-[#12121A] rounded-3xl border border-white/10 overflow-hidden"
        >
          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>

          {/* Progress Indicator */}
          <div className="absolute top-4 left-4 z-10 flex gap-1.5">
            {ONBOARDING_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'w-6 bg-white'
                    : idx < currentStep
                    ? 'w-2 bg-white/60'
                    : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="pt-16 pb-6 px-6">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center`}
                >
                  <Icon className="w-10 h-10 text-white" />
                </motion.div>

                {/* Step Number */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-white/40 text-sm mb-2"
                >
                  Step {step.id} of {ONBOARDING_STEPS.length}
                </motion.p>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-white text-2xl font-bold mb-3"
                >
                  {isKorean ? step.titleKo : step.title}
                </motion.h2>

                {/* Highlight Badge */}
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 }}
                  className={`inline-block px-3 py-1 mb-4 rounded-full text-xs font-bold text-white bg-gradient-to-r ${step.color}`}
                >
                  {isKorean ? step.highlightKo : step.highlight}
                </motion.span>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/60 text-base leading-relaxed"
                >
                  {isKorean ? step.descriptionKo : step.description}
                </motion.p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="px-6 pb-6 flex items-center justify-between">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                currentStep === 0
                  ? 'text-white/20 cursor-not-allowed'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              {isKorean ? '이전' : 'Back'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={isLastStep ? handleComplete : handleNext}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${step.color}`}
            >
              {isLastStep ? (
                <>
                  <Check className="w-4 h-4" />
                  {isKorean ? '시작하기' : 'Get Started'}
                </>
              ) : (
                <>
                  {isKorean ? '다음' : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full blur-3xl" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook to reset onboarding (for testing)
export function useResetOnboarding() {
  return () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };
}
