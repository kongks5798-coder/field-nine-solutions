/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 79: TESLA-STYLE SOCIAL PROOF CARD
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Warm ivory background (#F9F9F7) + Deep black text (#171717)
 * Tesla-grade premium aesthetics for Instagram/X sharing
 *
 * Features:
 * - 9:16 Instagram Story optimized (1080x1920)
 * - 1:1 Instagram Post (1080x1080)
 * - 16:9 Twitter/X optimized (1200x675)
 * - html-to-image high-res generation
 * - Field Nine emblem watermark
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng, toBlob } from 'html-to-image';
import { triggerFeedback } from './neon-effects';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface SocialProofCardProps {
  userName?: string;
  totalProfit: number;
  profitPercent: number;
  kausBalance: number;
  referralCode: string;
  tier?: string;
  memberSince?: string;
  sovereignNumber?: number;
  format?: 'story' | 'post' | 'twitter';
  onClose?: () => void;
}

type CardFormat = 'story' | 'post' | 'twitter';

const FORMAT_SIZES: Record<CardFormat, { width: number; height: number; scale: number }> = {
  story: { width: 1080, height: 1920, scale: 0.2 },
  post: { width: 1080, height: 1080, scale: 0.35 },
  twitter: { width: 1200, height: 675, scale: 0.31 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// FIELD NINE EMBLEM SVG
// ═══════════════════════════════════════════════════════════════════════════════

function FieldNineEmblem({ size = 100, color = '#171717' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer hexagon */}
      <path
        d="M50 5L90 27.5V72.5L50 95L10 72.5V27.5L50 5Z"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      {/* Inner geometric pattern */}
      <path
        d="M50 20L75 35V65L50 80L25 65V35L50 20Z"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      {/* Center energy symbol */}
      <circle cx="50" cy="50" r="12" stroke={color} strokeWidth="2" fill="none" />
      <path
        d="M50 38L56 48H44L50 62V48"
        fill={color}
      />
      {/* Corner accents */}
      <circle cx="50" cy="5" r="3" fill={color} />
      <circle cx="90" cy="27.5" r="3" fill={color} />
      <circle cx="90" cy="72.5" r="3" fill={color} />
      <circle cx="50" cy="95" r="3" fill={color} />
      <circle cx="10" cy="72.5" r="3" fill={color} />
      <circle cx="10" cy="27.5" r="3" fill={color} />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function SocialProofCardV2({
  userName = 'Sovereign',
  totalProfit,
  profitPercent,
  kausBalance,
  referralCode,
  tier = 'GOLD',
  memberSince,
  sovereignNumber,
  format: initialFormat = 'story',
  onClose,
}: SocialProofCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [format, setFormat] = useState<CardFormat>(initialFormat);

  const { width, height, scale } = FORMAT_SIZES[format];

  // Wait for fonts
  useEffect(() => {
    document.fonts.ready.then(() => setIsReady(true));
  }, []);

  const generateImage = useCallback(async (action: 'download' | 'share') => {
    if (!cardRef.current || !isReady) return;

    setIsGenerating(true);
    triggerFeedback('tick', { haptic: true });

    try {
      const options = {
        width,
        height,
        pixelRatio: 2,
        backgroundColor: '#F9F9F7',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
      };

      if (action === 'share' && navigator.share && navigator.canShare) {
        const blob = await toBlob(cardRef.current, options);

        if (blob) {
          const fileName = `field-nine-${format}-${Date.now()}.png`;
          const file = new File([blob], fileName, { type: 'image/png' });

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
      const dataUrl = await toPng(cardRef.current, options);
      const link = document.createElement('a');
      link.download = `field-nine-${format}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      triggerFeedback('success', { haptic: true, sound: true });
    } catch (error) {
      console.error('Image generation failed:', error);
      triggerFeedback('tick', { haptic: true });
    } finally {
      setIsGenerating(false);
    }
  }, [isReady, format, width, height, profitPercent, referralCode]);

  const getTierEmoji = (t: string) => {
    const emojis: Record<string, string> = {
      BRONZE: '🥉',
      SILVER: '🥈',
      GOLD: '🥇',
      PLATINUM: '💎',
      DIAMOND: '👑',
    };
    return emojis[t] || '⚡';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[420px]"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10
              flex items-center justify-center text-white/60 hover:text-white z-10"
          >
            ✕
          </button>

          {/* Format Selector */}
          <div className="flex gap-2 mb-4">
            {(['story', 'post', 'twitter'] as CardFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  format === f
                    ? 'bg-[#171717] text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {f === 'story' ? '📱 Story' : f === 'post' ? '📷 Post' : '🐦 X'}
              </button>
            ))}
          </div>

          {/* Card Preview */}
          <div
            className="relative overflow-hidden rounded-2xl shadow-2xl"
            style={{
              width: `${width * scale}px`,
              height: `${height * scale}px`,
              margin: '0 auto',
            }}
          >
            <div
              ref={cardRef}
              style={{
                width: `${width}px`,
                height: `${height}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                backgroundColor: '#F9F9F7',
              }}
            >
              {/* Tesla-style warm ivory background */}
              <div className="absolute inset-0 bg-[#F9F9F7]" />

              {/* Subtle grid pattern */}
              <div className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `
                    linear-gradient(#171717 1px, transparent 1px),
                    linear-gradient(90deg, #171717 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px',
                }}
              />

              {/* Content */}
              <div className="relative h-full flex flex-col" style={{ padding: format === 'story' ? '60px' : '40px' }}>
                {/* Header with Emblem */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <FieldNineEmblem size={format === 'story' ? 80 : 60} color="#171717" />
                    <div>
                      <h1 style={{
                        fontSize: format === 'story' ? '48px' : '32px',
                        fontWeight: 900,
                        color: '#171717',
                        letterSpacing: '-0.02em',
                      }}>
                        Field Nine
                      </h1>
                      <p style={{
                        fontSize: format === 'story' ? '18px' : '14px',
                        color: '#171717',
                        opacity: 0.5,
                      }}>
                        AI-Powered Energy Trading
                      </p>
                    </div>
                  </div>
                  {sovereignNumber && (
                    <div style={{
                      padding: format === 'story' ? '12px 20px' : '8px 14px',
                      backgroundColor: '#171717',
                      borderRadius: '100px',
                    }}>
                      <span style={{
                        color: '#F9F9F7',
                        fontSize: format === 'story' ? '16px' : '12px',
                        fontWeight: 700,
                      }}>
                        #{sovereignNumber}
                      </span>
                    </div>
                  )}
                </div>

                {/* User Section */}
                <div className="flex-1 flex flex-col justify-center">
                  {/* Name and Tier */}
                  <div className="text-center mb-8">
                    <p style={{
                      fontSize: format === 'story' ? '24px' : '16px',
                      color: '#171717',
                      opacity: 0.5,
                      marginBottom: '8px',
                    }}>
                      {getTierEmoji(tier)} {tier} MEMBER
                    </p>
                    <h2 style={{
                      fontSize: format === 'story' ? '56px' : '36px',
                      fontWeight: 900,
                      color: '#171717',
                      letterSpacing: '-0.02em',
                    }}>
                      {userName}
                    </h2>
                    {memberSince && (
                      <p style={{
                        fontSize: format === 'story' ? '18px' : '14px',
                        color: '#171717',
                        opacity: 0.4,
                        marginTop: '8px',
                      }}>
                        Since {memberSince}
                      </p>
                    )}
                  </div>

                  {/* Profit Display - Hero Section */}
                  <div className="text-center" style={{ marginBottom: format === 'story' ? '60px' : '40px' }}>
                    <p style={{
                      fontSize: format === 'story' ? '24px' : '18px',
                      color: '#171717',
                      opacity: 0.5,
                      marginBottom: '12px',
                    }}>
                      총 수익률
                    </p>
                    <div className="flex items-baseline justify-center">
                      <span style={{
                        fontSize: format === 'story' ? '140px' : '80px',
                        fontWeight: 900,
                        color: '#171717',
                        lineHeight: 1,
                        letterSpacing: '-0.03em',
                      }}>
                        +{profitPercent.toFixed(1)}
                      </span>
                      <span style={{
                        fontSize: format === 'story' ? '60px' : '36px',
                        fontWeight: 700,
                        color: '#171717',
                        opacity: 0.6,
                      }}>
                        %
                      </span>
                    </div>
                    <p style={{
                      fontSize: format === 'story' ? '32px' : '20px',
                      color: '#171717',
                      opacity: 0.6,
                      marginTop: '16px',
                    }}>
                      ₩{totalProfit.toLocaleString()} 수익
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: format === 'story' ? '20px' : '12px',
                    marginBottom: format === 'story' ? '40px' : '24px',
                  }}>
                    <div style={{
                      padding: format === 'story' ? '32px' : '20px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '24px',
                      border: '1px solid rgba(23, 23, 23, 0.08)',
                      textAlign: 'center',
                    }}>
                      <p style={{
                        fontSize: format === 'story' ? '16px' : '12px',
                        color: '#171717',
                        opacity: 0.5,
                        marginBottom: '8px',
                      }}>
                        보유 KAUS
                      </p>
                      <p style={{
                        fontSize: format === 'story' ? '36px' : '24px',
                        fontWeight: 800,
                        color: '#171717',
                      }}>
                        {kausBalance.toLocaleString()}
                      </p>
                    </div>
                    <div style={{
                      padding: format === 'story' ? '32px' : '20px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '24px',
                      border: '1px solid rgba(23, 23, 23, 0.08)',
                      textAlign: 'center',
                    }}>
                      <p style={{
                        fontSize: format === 'story' ? '16px' : '12px',
                        color: '#171717',
                        opacity: 0.5,
                        marginBottom: '8px',
                      }}>
                        예상 연수익
                      </p>
                      <p style={{
                        fontSize: format === 'story' ? '36px' : '24px',
                        fontWeight: 800,
                        color: '#171717',
                      }}>
                        13.5%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Referral CTA */}
                <div style={{
                  padding: format === 'story' ? '40px' : '24px',
                  backgroundColor: '#171717',
                  borderRadius: '24px',
                  textAlign: 'center',
                }}>
                  <p style={{
                    fontSize: format === 'story' ? '20px' : '14px',
                    color: '#F9F9F7',
                    opacity: 0.7,
                    marginBottom: '16px',
                  }}>
                    가입하고 100 KAUS 받기
                  </p>
                  <p style={{
                    fontSize: format === 'story' ? '48px' : '32px',
                    fontWeight: 900,
                    color: '#F9F9F7',
                    letterSpacing: '0.1em',
                  }}>
                    {referralCode}
                  </p>
                  <p style={{
                    fontSize: format === 'story' ? '18px' : '14px',
                    color: '#F9F9F7',
                    opacity: 0.5,
                    marginTop: '12px',
                  }}>
                    m.fieldnine.io
                  </p>
                </div>

                {/* Footer */}
                <div className="text-center" style={{ marginTop: format === 'story' ? '32px' : '20px' }}>
                  <p style={{
                    fontSize: format === 'story' ? '14px' : '10px',
                    color: '#171717',
                    opacity: 0.3,
                  }}>
                    ⚡ 실제 에너지 자산 기반 수익 ⚡
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => generateImage('download')}
              disabled={isGenerating || !isReady}
              className="flex-1 py-4 rounded-2xl bg-white/10 border border-white/20
                font-bold text-white disabled:opacity-50"
            >
              {isGenerating ? '생성 중...' : '💾 저장'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => generateImage('share')}
              disabled={isGenerating || !isReady}
              className="flex-1 py-4 rounded-2xl bg-[#171717] font-bold text-white disabled:opacity-50"
            >
              {isGenerating ? '생성 중...' : '📤 공유'}
            </motion.button>
          </div>

          <p className="text-center text-xs text-white/40 mt-3">
            {format === 'story' ? '인스타그램 스토리 (9:16)' :
             format === 'post' ? '인스타그램 포스트 (1:1)' :
             'X/트위터 (16:9)'}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useSocialProofCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [cardData, setCardData] = useState<Omit<SocialProofCardProps, 'onClose'> | null>(null);

  const openCard = useCallback((data: Omit<SocialProofCardProps, 'onClose'>) => {
    setCardData(data);
    setIsOpen(true);
  }, []);

  const closeCard = useCallback(() => {
    setIsOpen(false);
    setCardData(null);
  }, []);

  const CardComponent = isOpen && cardData ? (
    <SocialProofCardV2 {...cardData} onClose={closeCard} />
  ) : null;

  return {
    isOpen,
    openCard,
    closeCard,
    CardComponent,
  };
}

export default SocialProofCardV2;
