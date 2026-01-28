/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 78: VIRAL PROOF CARD GENERATOR
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 인스타그램 스토리 사이즈(9:16)에 최적화된 High-End 리퍼럴 카드 생성
 *
 * Features:
 * - html-to-image 기반 이미지 생성
 * - 9:16 비율 (1080x1920)
 * - 프리미엄 글래스모피즘 디자인
 * - 유저 수익률 표시
 * - 리퍼럴 코드 QR
 * - 원클릭 저장/공유
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng, toBlob } from 'html-to-image';
import { triggerFeedback } from './neon-effects';

interface ViralProofCardProps {
  userName?: string;
  totalProfit: number;
  profitPercent: number;
  kausBalance: number;
  referralCode: string;
  tier?: string;
  memberSince?: string;
  onClose?: () => void;
}

export function ViralProofCard({
  userName = 'Sovereign',
  totalProfit,
  profitPercent,
  kausBalance,
  referralCode,
  tier = 'GOLD',
  memberSince,
  onClose,
}: ViralProofCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Wait for fonts to load
  useEffect(() => {
    document.fonts.ready.then(() => {
      setIsReady(true);
    });
  }, []);

  const generateImage = useCallback(async (format: 'png' | 'share') => {
    if (!cardRef.current || !isReady) return;

    setIsGenerating(true);
    triggerFeedback('tick', { haptic: true });

    try {
      // Generate high-res image
      const dataUrl = await toPng(cardRef.current, {
        width: 1080,
        height: 1920,
        pixelRatio: 2,
        backgroundColor: '#0a0a0a',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
      });

      if (format === 'share' && navigator.share && navigator.canShare) {
        const blob = await toBlob(cardRef.current, {
          width: 1080,
          height: 1920,
          pixelRatio: 2,
          backgroundColor: '#0a0a0a',
        });

        if (blob) {
          const file = new File([blob], `field-nine-profit-${Date.now()}.png`, { type: 'image/png' });

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Field Nine 수익 인증',
              text: `나의 Field Nine 수익률 +${profitPercent.toFixed(1)}%! 추천코드: ${referralCode}`,
            });
            triggerFeedback('success', { haptic: true, sound: true });
            return;
          }
        }
      }

      // Fallback: download
      const link = document.createElement('a');
      link.download = `field-nine-profit-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      triggerFeedback('success', { haptic: true, sound: true });

    } catch (error) {
      console.error('Image generation failed:', error);
      triggerFeedback('tick', { haptic: true });
    } finally {
      setIsGenerating(false);
    }
  }, [isReady, profitPercent, referralCode]);

  const getTierColor = (t: string) => {
    const colors: Record<string, string> = {
      BRONZE: 'from-amber-700 to-amber-900',
      SILVER: 'from-neutral-400 to-neutral-600',
      GOLD: 'from-amber-400 to-amber-600',
      PLATINUM: 'from-cyan-400 to-blue-600',
      DIAMOND: 'from-purple-400 to-pink-600',
    };
    return colors[t] || colors.GOLD;
  };

  const getTierIcon = (t: string) => {
    const icons: Record<string, string> = {
      BRONZE: '🥉',
      SILVER: '🥈',
      GOLD: '🥇',
      PLATINUM: '💎',
      DIAMOND: '👑',
    };
    return icons[t] || '🥇';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[375px]"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10
              flex items-center justify-center text-white/60 hover:text-white z-10"
          >
            ✕
          </button>

          {/* Card Preview (Scaled for screen) */}
          <div
            ref={cardRef}
            className="relative overflow-hidden rounded-3xl"
            style={{
              width: '1080px',
              height: '1920px',
              transform: 'scale(0.347)',
              transformOrigin: 'top left',
              marginBottom: '-1253px', // Compensate for scale
              marginRight: '-705px',
            }}
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0f1419] to-[#0a0a0a]" />

            {/* Animated Grid */}
            <div className="absolute inset-0 opacity-30">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-[#00E5FF]/40 to-transparent"
                  style={{ top: `${i * 10 + 5}%` }}
                />
              ))}
            </div>

            {/* Glow Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]
              bg-gradient-to-b from-[#00E5FF]/20 to-transparent blur-[100px] rounded-full" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px]
              bg-gradient-to-t from-[#00FF88]/20 to-transparent blur-[80px] rounded-full" />

            {/* Content */}
            <div className="relative h-full flex flex-col p-16">
              {/* Header */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full
                  bg-white/5 border border-white/10 mb-8">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getTierColor(tier)}`} />
                  <span className="text-[32px] font-bold text-white/80">
                    {getTierIcon(tier)} {tier} MEMBER
                  </span>
                </div>

                <h1 className="text-[64px] font-black text-white mb-4">
                  Field Nine Empire
                </h1>
                <p className="text-[28px] text-white/60">
                  AI-Powered Energy Trading Platform
                </p>
              </div>

              {/* User Info */}
              <div className="text-center mb-16">
                <div className="w-[180px] h-[180px] mx-auto mb-8 rounded-full
                  bg-gradient-to-br from-[#00E5FF] to-[#00FF88] p-[3px]">
                  <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center">
                    <span className="text-[80px]">👑</span>
                  </div>
                </div>
                <h2 className="text-[48px] font-bold text-white mb-2">{userName}</h2>
                {memberSince && (
                  <p className="text-[24px] text-white/40">Member since {memberSince}</p>
                )}
              </div>

              {/* Profit Display */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-center mb-16">
                  <p className="text-[32px] text-[#00E5FF] mb-4 font-medium">총 수익</p>
                  <div className="flex items-baseline justify-center gap-4">
                    <span className="text-[120px] font-black text-white leading-none">
                      +{profitPercent.toFixed(1)}
                    </span>
                    <span className="text-[60px] font-bold text-[#00E5FF]">%</span>
                  </div>
                  <p className="text-[36px] text-white/60 mt-4">
                    ₩{totalProfit.toLocaleString()} 수익
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-8 mb-16">
                  <div className="text-center p-8 rounded-3xl bg-white/5 border border-white/10">
                    <p className="text-[28px] text-white/60 mb-2">보유 잔고</p>
                    <p className="text-[44px] font-bold text-white">
                      {kausBalance.toLocaleString()}
                    </p>
                    <p className="text-[24px] text-[#00E5FF]">KAUS</p>
                  </div>
                  <div className="text-center p-8 rounded-3xl bg-white/5 border border-white/10">
                    <p className="text-[28px] text-white/60 mb-2">예상 연수익</p>
                    <p className="text-[44px] font-bold text-white">13.5%</p>
                    <p className="text-[24px] text-[#00FF88]">APY</p>
                  </div>
                </div>
              </div>

              {/* Referral Section */}
              <div className="mt-auto">
                <div className="p-10 rounded-3xl bg-gradient-to-r from-[#00E5FF]/10 to-[#00FF88]/10
                  border border-[#00E5FF]/30">
                  <p className="text-center text-[28px] text-white/60 mb-6">
                    지금 가입하고 100 KAUS 받기
                  </p>
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                      <p className="text-[24px] text-white/40 mb-2">추천 코드</p>
                      <p className="text-[56px] font-black text-white tracking-wider">
                        {referralCode}
                      </p>
                    </div>
                  </div>
                  <p className="text-center text-[24px] text-[#00E5FF] mt-6">
                    m.fieldnine.io
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-12">
                <div className="flex items-center justify-center gap-4 text-white/40">
                  <span className="text-[24px]">⚡</span>
                  <span className="text-[24px]">실제 에너지 자산 기반 수익</span>
                  <span className="text-[24px]">⚡</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => generateImage('png')}
              disabled={isGenerating || !isReady}
              className="flex-1 py-4 rounded-2xl bg-white/10 border border-white/20
                font-bold text-white disabled:opacity-50"
            >
              {isGenerating ? '생성 중...' : '💾 이미지 저장'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => generateImage('share')}
              disabled={isGenerating || !isReady}
              className="flex-1 py-4 rounded-2xl font-bold text-[#171717] disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #00E5FF 0%, #00FF88 100%)',
              }}
            >
              {isGenerating ? '생성 중...' : '📤 공유하기'}
            </motion.button>
          </div>

          <p className="text-center text-xs text-white/40 mt-4">
            인스타그램 스토리에 최적화된 9:16 비율
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook for generating proof card
export function useViralProofCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [cardData, setCardData] = useState<Omit<ViralProofCardProps, 'onClose'> | null>(null);

  const openCard = useCallback((data: Omit<ViralProofCardProps, 'onClose'>) => {
    setCardData(data);
    setIsOpen(true);
  }, []);

  const closeCard = useCallback(() => {
    setIsOpen(false);
    setCardData(null);
  }, []);

  const CardComponent = isOpen && cardData ? (
    <ViralProofCard {...cardData} onClose={closeCard} />
  ) : null;

  return {
    isOpen,
    openCard,
    closeCard,
    CardComponent,
  };
}

// Button to trigger card generation
interface GenerateCardButtonProps {
  data: Omit<ViralProofCardProps, 'onClose'>;
  className?: string;
  children?: React.ReactNode;
}

export function GenerateCardButton({ data, className = '', children }: GenerateCardButtonProps) {
  const { openCard, CardComponent } = useViralProofCard();

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => openCard(data)}
        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl
          bg-gradient-to-r from-[#00E5FF]/20 to-[#00FF88]/20 border border-[#00E5FF]/30
          text-white font-medium hover:border-[#00E5FF]/50 transition-all ${className}`}
      >
        <span>📸</span>
        {children || '수익 인증 카드 만들기'}
      </motion.button>
      {CardComponent}
    </>
  );
}

export default ViralProofCard;
