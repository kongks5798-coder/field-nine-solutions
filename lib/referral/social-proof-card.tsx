/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 54: SOCIAL PROOF CARD 2.0 - IMAGE GENERATOR
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Generates shareable sovereign badge cards for X/Instagram
 * - 9:16 aspect ratio for Instagram Stories/Reels
 * - 16:9 aspect ratio for X/Twitter posts
 * - html-to-image for high-quality export
 *
 * Colors: #F9F9F7 (background), #171717 (text)
 */

'use client';

import { useRef, useState } from 'react';
import { toPng, toJpeg } from 'html-to-image';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface SovereignCardData {
  sovereignNumber: number;
  referralCode: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  totalReferrals: number;
  totalRewards: number;
  joinedDate: string;
  userName?: string;
}

export type CardFormat = 'story' | 'post' | 'square';

interface CardDimensions {
  width: number;
  height: number;
  label: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const CARD_FORMATS: Record<CardFormat, CardDimensions> = {
  story: { width: 1080, height: 1920, label: 'Instagram Story (9:16)' },
  post: { width: 1200, height: 675, label: 'X/Twitter Post (16:9)' },
  square: { width: 1080, height: 1080, label: 'Instagram Post (1:1)' },
};

const TIER_COLORS: Record<string, { primary: string; secondary: string; badge: string }> = {
  BRONZE: { primary: '#CD7F32', secondary: '#8B5A2B', badge: '🥉' },
  SILVER: { primary: '#C0C0C0', secondary: '#808080', badge: '🥈' },
  GOLD: { primary: '#FFD700', secondary: '#B8860B', badge: '🥇' },
  PLATINUM: { primary: '#E5E4E2', secondary: '#9D9D9D', badge: '💎' },
  DIAMOND: { primary: '#B9F2FF', secondary: '#7DF9FF', badge: '👑' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

interface SovereignCardProps {
  data: SovereignCardData;
  format: CardFormat;
}

export function SovereignCard({ data, format }: SovereignCardProps) {
  const dimensions = CARD_FORMATS[format];
  const tierColors = TIER_COLORS[data.tier] || TIER_COLORS.BRONZE;
  const isStory = format === 'story';

  return (
    <div
      style={{
        width: dimensions.width,
        height: dimensions.height,
        background: '#F9F9F7',
        color: '#171717',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle at 1px 1px, #17171710 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Gradient Accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: isStory ? 300 : 150,
          background: `linear-gradient(180deg, ${tierColors.primary}20 0%, transparent 100%)`,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: isStory ? 60 : 30,
          padding: isStory ? '100px 60px' : '40px 60px',
        }}
      >
        {/* Badge Icon */}
        <div
          style={{
            fontSize: isStory ? 120 : 72,
            lineHeight: 1,
          }}
        >
          {tierColors.badge}
        </div>

        {/* Sovereign Number */}
        <div
          style={{
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: isStory ? 28 : 18,
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
              color: '#171717aa',
              marginBottom: isStory ? 20 : 10,
            }}
          >
            I am the
          </div>
          <div
            style={{
              fontSize: isStory ? 140 : 80,
              fontWeight: 900,
              lineHeight: 1,
              background: `linear-gradient(135deg, ${tierColors.primary} 0%, ${tierColors.secondary} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {data.sovereignNumber}
            <sup style={{ fontSize: isStory ? 40 : 24 }}>
              {getOrdinalSuffix(data.sovereignNumber)}
            </sup>
          </div>
          <div
            style={{
              fontSize: isStory ? 48 : 28,
              fontWeight: 700,
              marginTop: isStory ? 20 : 10,
              letterSpacing: '0.1em',
            }}
          >
            SOVEREIGN
          </div>
        </div>

        {/* Tier Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: isStory ? '16px 40px' : '10px 24px',
            background: `${tierColors.primary}20`,
            borderRadius: 100,
            border: `2px solid ${tierColors.primary}`,
          }}
        >
          <span style={{ fontSize: isStory ? 24 : 16 }}>{tierColors.badge}</span>
          <span
            style={{
              fontSize: isStory ? 24 : 16,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: tierColors.secondary,
            }}
          >
            {data.tier} TIER
          </span>
        </div>

        {/* Stats */}
        {isStory && (
          <div
            style={{
              display: 'flex',
              gap: 60,
              marginTop: 40,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, fontWeight: 800 }}>{data.totalReferrals}</div>
              <div style={{ fontSize: 18, color: '#171717aa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Referrals
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, fontWeight: 800 }}>{data.totalRewards.toFixed(0)}</div>
              <div style={{ fontSize: 18, color: '#171717aa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                KAUS Earned
              </div>
            </div>
          </div>
        )}

        {/* Referral Code */}
        <div
          style={{
            marginTop: isStory ? 60 : 20,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: isStory ? 18 : 12,
              color: '#171717aa',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              marginBottom: 10,
            }}
          >
            Join with my code
          </div>
          <div
            style={{
              fontSize: isStory ? 48 : 28,
              fontWeight: 800,
              fontFamily: 'monospace',
              letterSpacing: '0.15em',
              padding: isStory ? '20px 50px' : '12px 30px',
              background: '#171717',
              color: '#F9F9F7',
              borderRadius: 12,
            }}
          >
            {data.referralCode}
          </div>
        </div>

        {/* Brand */}
        <div
          style={{
            position: 'absolute',
            bottom: isStory ? 80 : 40,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <svg width={isStory ? 40 : 24} height={isStory ? 40 : 24} viewBox="0 0 40 40">
            <rect width="40" height="40" rx="8" fill="#171717" />
            <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="#F9F9F7" fontSize="20" fontWeight="bold">
              F9
            </text>
          </svg>
          <span
            style={{
              fontSize: isStory ? 24 : 14,
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}
          >
            FIELD NINE
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATOR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface SocialProofGeneratorProps {
  data: SovereignCardData;
}

export function SocialProofGenerator({ data }: SocialProofGeneratorProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [format, setFormat] = useState<CardFormat>('story');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async (fileType: 'png' | 'jpeg' = 'png') => {
    if (!cardRef.current) return;

    setIsGenerating(true);
    try {
      const dataUrl =
        fileType === 'png'
          ? await toPng(cardRef.current, { quality: 1, pixelRatio: 2 })
          : await toJpeg(cardRef.current, { quality: 0.95, pixelRatio: 2 });

      const link = document.createElement('a');
      link.download = `sovereign-${data.sovereignNumber}-${format}.${fileType}`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to generate image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current || !navigator.share) return;

    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `sovereign-${data.sovereignNumber}.png`, { type: 'image/png' });

      await navigator.share({
        title: `I am the ${data.sovereignNumber}${getOrdinalSuffix(data.sovereignNumber)} Sovereign of Field Nine`,
        text: `Join the empire with my code: ${data.referralCode}`,
        files: [file],
      });
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const dimensions = CARD_FORMATS[format];
  const scale = Math.min(350 / dimensions.width, 600 / dimensions.height);

  return (
    <div className="flex flex-col gap-6">
      {/* Format Selector */}
      <div className="flex gap-2">
        {(Object.keys(CARD_FORMATS) as CardFormat[]).map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              format === f
                ? 'bg-[#171717] text-[#F9F9F7]'
                : 'bg-[#F9F9F7] text-[#171717] border border-[#17171720] hover:border-[#171717]'
            }`}
          >
            {CARD_FORMATS[f].label}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div
        className="relative overflow-hidden rounded-2xl border border-[#17171720]"
        style={{
          width: dimensions.width * scale,
          height: dimensions.height * scale,
        }}
      >
        <div
          ref={cardRef}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <SovereignCard data={data} format={format} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => handleDownload('png')}
          disabled={isGenerating}
          className="flex-1 px-6 py-3 bg-[#171717] text-[#F9F9F7] rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Download PNG'}
        </button>
        {typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function' && (
          <button
            onClick={handleShare}
            disabled={isGenerating}
            className="px-6 py-3 bg-[#F9F9F7] text-[#171717] rounded-xl font-semibold border border-[#171717] hover:bg-[#171717] hover:text-[#F9F9F7] transition-all disabled:opacity-50"
          >
            Share
          </button>
        )}
      </div>

      {/* Share Text */}
      <div className="p-4 bg-[#F9F9F7] rounded-xl border border-[#17171720]">
        <div className="text-xs text-[#171717aa] uppercase tracking-wider mb-2">Copy caption</div>
        <p className="text-sm text-[#171717]">
          I am the {data.sovereignNumber}{getOrdinalSuffix(data.sovereignNumber)} Sovereign of Field Nine 👑
          <br />
          Join the empire with my code: <strong>{data.referralCode}</strong>
          <br />
          <br />
          m.fieldnine.io/join?ref={data.referralCode}
          <br />
          <br />
          #FieldNine #Sovereign #KAUS #Web3
        </p>
      </div>
    </div>
  );
}

export default SocialProofGenerator;
