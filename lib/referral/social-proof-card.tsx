/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 57: SOCIAL PROOF CARD 3.0 - VIBE-ID VIRAL AURA CARD
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * VIBE-ID + Referral = Viral Aura Card
 * - 9:16 aspect ratio for Instagram Stories/Reels
 * - 16:9 aspect ratio for X/Twitter posts
 * - html-to-image optimized for mobile (<1 second)
 * - Auto-embedded referral code & QR
 *
 * Tesla-style: #F9F9F7 (background), #171717 (text)
 */

'use client';

import { useRef, useState, useCallback, forwardRef } from 'react';
import { toPng, toJpeg } from 'html-to-image';
import { VibeAnalysis, VIBE_METADATA, VIBE_LABELS, VibeArchetype } from '@/lib/vibe/types';

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

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 57: VIBE-ID AURA CARD INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface AuraTypeConfig {
  gradient: string[];
  accentColor: string;
  glowColor: string;
  badge: string;
  auraEffect: 'radial' | 'linear' | 'conic';
}

export const AURA_TYPE_CONFIG: Record<VibeArchetype, AuraTypeConfig> = {
  'silent-luxury': {
    gradient: ['#1a1a2e', '#2C3E50', '#34495E'],
    accentColor: '#C9B037',
    glowColor: 'rgba(201, 176, 55, 0.3)',
    badge: '👑',
    auraEffect: 'radial',
  },
  'urban-explorer': {
    gradient: ['#1A1A2E', '#16213E', '#0F3460'],
    accentColor: '#FF6B6B',
    glowColor: 'rgba(255, 107, 107, 0.3)',
    badge: '🏙️',
    auraEffect: 'linear',
  },
  'nature-seeker': {
    gradient: ['#1B4332', '#2D5016', '#40916C'],
    accentColor: '#95D5B2',
    glowColor: 'rgba(149, 213, 178, 0.3)',
    badge: '🌿',
    auraEffect: 'radial',
  },
  'culture-lover': {
    gradient: ['#3D1308', '#6B3F1E', '#8B4513'],
    accentColor: '#DDA15E',
    glowColor: 'rgba(221, 161, 94, 0.3)',
    badge: '🎭',
    auraEffect: 'conic',
  },
  'beach-soul': {
    gradient: ['#006D77', '#00CED1', '#83C5BE'],
    accentColor: '#FFEAA7',
    glowColor: 'rgba(255, 234, 167, 0.3)',
    badge: '🏖️',
    auraEffect: 'linear',
  },
  'adventure-spirit': {
    gradient: ['#641220', '#85182A', '#E74C3C'],
    accentColor: '#F4A261',
    glowColor: 'rgba(244, 162, 97, 0.3)',
    badge: '🗻',
    auraEffect: 'radial',
  },
  'foodie-wanderer': {
    gradient: ['#7C2D12', '#D35400', '#E67E22'],
    accentColor: '#FDEBD0',
    glowColor: 'rgba(253, 235, 208, 0.3)',
    badge: '🍜',
    auraEffect: 'conic',
  },
  'minimalist': {
    gradient: ['#F9F9F7', '#EDEDED', '#E5E5E5'],
    accentColor: '#171717',
    glowColor: 'rgba(23, 23, 23, 0.1)',
    badge: '◻️',
    auraEffect: 'linear',
  },
  'romantic-dreamer': {
    gradient: ['#4A1942', '#9B59B6', '#BB8FCE'],
    accentColor: '#FADBD8',
    glowColor: 'rgba(250, 219, 216, 0.3)',
    badge: '💫',
    auraEffect: 'radial',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// VIBE AURA CARD DATA
// ═══════════════════════════════════════════════════════════════════════════════

export interface VibeAuraCardData {
  userId: string;
  sovereignNumber: number;
  referralCode: string;
  analysis: VibeAnalysis;
  cardId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// QR CODE HELPER
// ═══════════════════════════════════════════════════════════════════════════════

function generateQRCodeUrl(data: string, size: number = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    data
  )}&bgcolor=FFFFFF&color=171717&margin=1`;
}

function generateReferralLink(code: string): string {
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://fieldnine.io';
  return `${baseUrl}/join?ref=${code}`;
}

function generateCardId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `AURA-${timestamp}-${random}`.toUpperCase();
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIBE AURA CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface VibeAuraCardProps {
  data: VibeAuraCardData;
  format?: CardFormat;
  showQR?: boolean;
}

export const VibeAuraCard = forwardRef<HTMLDivElement, VibeAuraCardProps>(
  function VibeAuraCard({ data, format = 'story', showQR = true }, ref) {
    const { analysis, sovereignNumber, referralCode } = data;
    const cardId = data.cardId || generateCardId();
    const vibeConfig = AURA_TYPE_CONFIG[analysis.primary];
    const vibeMetadata = VIBE_METADATA[analysis.primary];
    const vibeLabel = VIBE_LABELS[analysis.primary];
    const secondaryLabel = VIBE_LABELS[analysis.secondary];

    const dimensions = CARD_FORMATS[format];
    const referralLink = generateReferralLink(referralCode);
    const qrCodeUrl = generateQRCodeUrl(referralLink, 200);

    const isStory = format === 'story';
    const isMinimalist = vibeMetadata.id === 'minimalist';
    const textColor = isMinimalist ? '#171717' : '#FFFFFF';

    return (
      <div
        ref={ref}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          background: isMinimalist
            ? '#F9F9F7'
            : `linear-gradient(135deg, ${vibeConfig.gradient.join(', ')})`,
          position: 'relative',
          overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Aura Glow Effect */}
        <div
          style={{
            position: 'absolute',
            top: isStory ? '20%' : '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: isStory ? 600 : 400,
            height: isStory ? 600 : 400,
            borderRadius: '50%',
            background: vibeConfig.auraEffect === 'radial'
              ? `radial-gradient(circle, ${vibeConfig.glowColor} 0%, transparent 70%)`
              : vibeConfig.auraEffect === 'conic'
              ? `conic-gradient(from 0deg, ${vibeConfig.glowColor}, transparent, ${vibeConfig.glowColor})`
              : `linear-gradient(180deg, ${vibeConfig.glowColor} 0%, transparent 100%)`,
            filter: 'blur(60px)',
            opacity: 0.8,
          }}
        />

        {/* Content Container */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: isStory ? 60 : 40,
          }}
        >
          {/* Header - Field Nine Logo */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: isStory ? 24 : 18,
                fontWeight: 300,
                letterSpacing: '0.3em',
                color: textColor,
                opacity: 0.9,
              }}
            >
              FIELD NINE
            </div>
            <div
              style={{
                fontSize: isStory ? 14 : 12,
                letterSpacing: '0.2em',
                color: vibeConfig.accentColor,
                marginTop: 8,
                opacity: 0.8,
              }}
            >
              VIBE-ID™
            </div>
          </div>

          {/* Main Content - Vibe Analysis */}
          <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* Aura Badge */}
            <div style={{ fontSize: isStory ? 80 : 60, marginBottom: isStory ? 24 : 16 }}>
              {vibeConfig.badge}
            </div>

            {/* Primary Vibe Type */}
            <div
              style={{
                fontSize: isStory ? 56 : 40,
                fontWeight: 700,
                color: textColor,
                letterSpacing: '0.05em',
                marginBottom: 8,
              }}
            >
              {vibeLabel.en.toUpperCase()}
            </div>
            <div
              style={{
                fontSize: isStory ? 32 : 24,
                fontWeight: 400,
                color: vibeConfig.accentColor,
                marginBottom: isStory ? 40 : 24,
              }}
            >
              {vibeLabel.ko}
            </div>

            {/* Color Palette */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: isStory ? 20 : 12,
                marginBottom: isStory ? 40 : 24,
              }}
            >
              {analysis.colorPalette.map((color, i) => (
                <div
                  key={i}
                  style={{
                    width: isStory ? 56 : 40,
                    height: isStory ? 56 : 40,
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: `0 4px 20px ${color}66`,
                  }}
                />
              ))}
            </div>

            {/* Traits */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: isStory ? 12 : 8,
                marginBottom: isStory ? 40 : 24,
              }}
            >
              {analysis.traits.slice(0, 3).map((trait, i) => (
                <div
                  key={i}
                  style={{
                    padding: isStory ? '10px 24px' : '8px 16px',
                    borderRadius: 999,
                    backgroundColor: isMinimalist
                      ? 'rgba(23, 23, 23, 0.08)'
                      : 'rgba(255, 255, 255, 0.15)',
                    color: textColor,
                    fontSize: isStory ? 18 : 14,
                    fontWeight: 500,
                  }}
                >
                  #{trait}
                </div>
              ))}
            </div>

            {/* Korean Description */}
            <div
              style={{
                fontSize: isStory ? 20 : 16,
                color: textColor,
                opacity: 0.85,
                lineHeight: 1.6,
                maxWidth: isStory ? 800 : 600,
                margin: '0 auto',
                padding: '0 20px',
              }}
            >
              {analysis.koreanDescription}
            </div>

            {/* Secondary Vibe & Confidence */}
            <div
              style={{
                marginTop: isStory ? 32 : 20,
                fontSize: isStory ? 16 : 13,
                color: textColor,
                opacity: 0.6,
              }}
            >
              서브 바이브: {secondaryLabel.ko} · 신뢰도 {Math.round(analysis.confidence * 100)}%
            </div>
          </div>

          {/* Footer - Referral Section */}
          <div
            style={{
              background: isMinimalist
                ? 'rgba(23, 23, 23, 0.05)'
                : 'rgba(255, 255, 255, 0.1)',
              borderRadius: 24,
              padding: isStory ? 32 : 24,
              backdropFilter: 'blur(20px)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 24,
              }}
            >
              {/* Left - Sovereign Info */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: isStory ? 14 : 12,
                    color: textColor,
                    opacity: 0.6,
                    marginBottom: 8,
                    letterSpacing: '0.1em',
                  }}
                >
                  THIS VIBE BELONGS TO
                </div>
                <div
                  style={{
                    fontSize: isStory ? 28 : 22,
                    fontWeight: 700,
                    color: vibeConfig.accentColor,
                    marginBottom: 4,
                  }}
                >
                  SOVEREIGN #{sovereignNumber.toLocaleString()}
                </div>
                <div
                  style={{
                    fontSize: isStory ? 18 : 14,
                    color: textColor,
                    opacity: 0.8,
                    fontFamily: 'monospace',
                    letterSpacing: '0.15em',
                  }}
                >
                  CODE: {referralCode}
                </div>
              </div>

              {/* Right - QR Code */}
              {showQR && (
                <div
                  style={{
                    width: isStory ? 120 : 90,
                    height: isStory ? 120 : 90,
                    borderRadius: 12,
                    backgroundColor: '#FFFFFF',
                    padding: 8,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    crossOrigin="anonymous"
                  />
                </div>
              )}
            </div>

            {/* Call to Action */}
            <div
              style={{
                marginTop: isStory ? 20 : 16,
                textAlign: 'center',
                fontSize: isStory ? 14 : 12,
                color: textColor,
                opacity: 0.7,
              }}
            >
              Scan to discover your VIBE-ID • fieldnine.io
            </div>
          </div>

          {/* Card ID Watermark */}
          <div
            style={{
              position: 'absolute',
              bottom: isStory ? 20 : 12,
              right: isStory ? 24 : 16,
              fontSize: 10,
              color: textColor,
              opacity: 0.3,
              fontFamily: 'monospace',
            }}
          >
            {cardId}
          </div>
        </div>
      </div>
    );
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// VIBE AURA CARD GENERATOR (with Native Share)
// ═══════════════════════════════════════════════════════════════════════════════

interface VibeAuraGeneratorProps {
  data: VibeAuraCardData;
  onShare?: () => void;
}

export function VibeAuraGenerator({ data, onShare }: VibeAuraGeneratorProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [format, setFormat] = useState<CardFormat>('story');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  const vibeLabel = VIBE_LABELS[data.analysis.primary];
  const referralLink = generateReferralLink(data.referralCode);

  const shareText = `✨ VIBE-ID 분석 결과: ${vibeLabel.ko}!

나만의 여행 아우라를 발견하세요.

🎁 Sovereign #${data.sovereignNumber}의 게스트로 가입하고 특별 보상을 받으세요!

${referralLink}

#FieldNine #VIBEID #TravelAura`;

  // Optimized image generation for mobile (<1 second)
  const generateImage = useCallback(async (): Promise<string | null> => {
    if (!cardRef.current) return null;

    const dimensions = CARD_FORMATS[format];
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    try {
      // Use JPEG for faster generation on mobile
      if (isMobile) {
        return await toJpeg(cardRef.current, {
          quality: 0.85,
          pixelRatio: 1.5,
          width: dimensions.width,
          height: dimensions.height,
          cacheBust: true,
          skipFonts: true,
        });
      }

      return await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        width: dimensions.width,
        height: dimensions.height,
        cacheBust: true,
      });
    } catch (error) {
      console.error('Image generation failed:', error);
      return null;
    }
  }, [format]);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const dataUrl = await generateImage();
      if (!dataUrl) return;

      const link = document.createElement('a');
      link.download = `vibe-aura-${data.sovereignNumber}-${format}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return handleDownload();

    setIsGenerating(true);
    try {
      const dataUrl = await generateImage();
      if (!dataUrl) return;

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `vibe-aura-${data.sovereignNumber}.png`, { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `My VIBE-ID: ${vibeLabel.en}`,
          text: shareText,
          url: referralLink,
          files: [file],
        });
        onShare?.();
      } else {
        // Fallback to text-only share
        await navigator.share({
          title: `My VIBE-ID: ${vibeLabel.en}`,
          text: shareText,
          url: referralLink,
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTwitterShare = async () => {
    setIsGenerating(true);
    try {
      const dataUrl = await generateImage();
      if (dataUrl) {
        // Download image for manual attachment
        const link = document.createElement('a');
        link.download = `vibe-aura-${data.sovereignNumber}.png`;
        link.href = dataUrl;
        link.click();
      }

      // Open Twitter intent
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `✨ My VIBE-ID: ${vibeLabel.en} (${vibeLabel.ko})\n\n${referralLink}\n\n#FieldNine #VIBEID`
      )}`;
      window.open(twitterUrl, '_blank', 'width=550,height=420');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInstagramShare = async () => {
    setIsGenerating(true);
    try {
      const dataUrl = await generateImage();
      if (!dataUrl) return;

      // Try to copy image to clipboard
      try {
        const blob = await (await fetch(dataUrl)).blob();
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 3000);
      } catch {
        // Fallback: download the image
        const link = document.createElement('a');
        link.download = `vibe-aura-${data.sovereignNumber}.png`;
        link.href = dataUrl;
        link.click();
      }

      // Try to open Instagram
      window.open('instagram://story', '_blank');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(shareText);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const dimensions = CARD_FORMATS[format];
  const scale = Math.min(350 / dimensions.width, 600 / dimensions.height);

  return (
    <div className="flex flex-col gap-6">
      {/* Format Selector */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(CARD_FORMATS) as CardFormat[]).map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
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
        className="relative overflow-hidden rounded-2xl border border-[#17171720] mx-auto"
        style={{
          width: dimensions.width * scale,
          height: dimensions.height * scale,
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <VibeAuraCard ref={cardRef} data={data} format={format} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {/* Primary Action */}
        <button
          onClick={handleNativeShare}
          disabled={isGenerating}
          className="w-full px-6 py-4 bg-[#171717] text-[#F9F9F7] rounded-xl font-semibold hover:opacity-90 transition-all duration-300 disabled:opacity-50"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </span>
          ) : (
            '📤 Share Your Vibe'
          )}
        </button>

        {/* Secondary Actions */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleInstagramShare}
            disabled={isGenerating}
            className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
          >
            📷 Instagram
          </button>
          <button
            onClick={handleTwitterShare}
            disabled={isGenerating}
            className="px-4 py-3 bg-black text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
          >
            𝕏 Twitter
          </button>
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="px-4 py-3 bg-[#F9F9F7] text-[#171717] border border-[#171717] rounded-xl text-sm font-medium hover:bg-[#171717] hover:text-[#F9F9F7] transition-all disabled:opacity-50"
          >
            💾 Download
          </button>
        </div>
      </div>

      {/* Share Text */}
      <div className="p-4 bg-[#F9F9F7] rounded-xl border border-[#17171720]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#171717aa] uppercase tracking-wider">Share Caption</span>
          <button
            onClick={handleCopyText}
            className="text-xs text-[#171717] font-medium hover:underline"
          >
            {showCopied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-sm text-[#171717] whitespace-pre-line">{shareText}</p>
      </div>
    </div>
  );
}
