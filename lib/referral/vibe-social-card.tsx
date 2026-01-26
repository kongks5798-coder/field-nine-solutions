/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 55: VIBE-ID ENHANCED SOCIAL PROOF CARD
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Social Proof Card + VIBE-ID Aura Style 자동 합성
 * 더 강력한 '자랑거리' 이미지 생성
 *
 * Colors: #F9F9F7 (background), #171717 (text)
 */

'use client';

import { useRef, useState } from 'react';
import { toPng, toJpeg } from 'html-to-image';
import { VibeAnalysis, VibeArchetype, VIBE_METADATA, VIBE_LABELS } from '@/lib/vibe/types';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface VibeSocialCardData {
  // Sovereign Data
  sovereignNumber: number;
  referralCode: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  totalReferrals: number;
  totalRewards: number;

  // VIBE-ID Data
  vibeAnalysis?: VibeAnalysis;
  userPhoto?: string; // base64 or URL

  // Energy Data (RWA)
  kausBalance?: number;
  energyKwh?: number;
}

export type CardFormat = 'story' | 'post' | 'square';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const CARD_FORMATS: Record<CardFormat, { width: number; height: number; label: string }> = {
  story: { width: 1080, height: 1920, label: 'Story (9:16)' },
  post: { width: 1200, height: 675, label: 'Post (16:9)' },
  square: { width: 1080, height: 1080, label: 'Square (1:1)' },
};

const TIER_COLORS: Record<string, { primary: string; secondary: string; badge: string }> = {
  BRONZE: { primary: '#CD7F32', secondary: '#8B5A2B', badge: '🥉' },
  SILVER: { primary: '#C0C0C0', secondary: '#808080', badge: '🥈' },
  GOLD: { primary: '#FFD700', secondary: '#B8860B', badge: '🥇' },
  PLATINUM: { primary: '#E5E4E2', secondary: '#9D9D9D', badge: '💎' },
  DIAMOND: { primary: '#B9F2FF', secondary: '#7DF9FF', badge: '👑' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
}

function getVibeMetadata(archetype: VibeArchetype) {
  return VIBE_METADATA[archetype] || VIBE_METADATA['urban-explorer'];
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIBE AURA BACKGROUND COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface VibeAuraBackgroundProps {
  primary: VibeArchetype;
  secondary: VibeArchetype;
  colorPalette?: string[];
  isStory: boolean;
}

function VibeAuraBackground({ primary, secondary, colorPalette, isStory }: VibeAuraBackgroundProps) {
  const primaryMeta = getVibeMetadata(primary);
  const secondaryMeta = getVibeMetadata(secondary);

  const colors = colorPalette?.length === 3
    ? colorPalette
    : [primaryMeta.primaryColor, secondaryMeta.primaryColor, primaryMeta.secondaryColor];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
      }}
    >
      {/* Base Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle at 1px 1px, #17171708 1px, transparent 0)`,
          backgroundSize: '30px 30px',
        }}
      />

      {/* Aura Gradient Orbs */}
      <div
        style={{
          position: 'absolute',
          top: isStory ? '-20%' : '-30%',
          right: isStory ? '-10%' : '-20%',
          width: isStory ? '80%' : '60%',
          height: isStory ? '40%' : '80%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors[0]}30 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: isStory ? '10%' : '0%',
          left: isStory ? '-15%' : '-10%',
          width: isStory ? '70%' : '50%',
          height: isStory ? '35%' : '60%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors[1]}25 0%, transparent 70%)`,
          filter: 'blur(50px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: isStory ? '60%' : '40%',
          height: isStory ? '30%' : '40%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors[2]}15 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIBE BADGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface VibeBadgeProps {
  archetype: VibeArchetype;
  isSecondary?: boolean;
  isStory: boolean;
}

function VibeBadge({ archetype, isSecondary = false, isStory }: VibeBadgeProps) {
  const meta = getVibeMetadata(archetype);
  const label = VIBE_LABELS[archetype];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: isStory ? 10 : 6,
        padding: isStory ? '10px 20px' : '6px 12px',
        background: isSecondary ? `${meta.primaryColor}15` : `${meta.primaryColor}25`,
        borderRadius: 100,
        border: `1.5px solid ${meta.primaryColor}${isSecondary ? '40' : '80'}`,
      }}
    >
      <span style={{ fontSize: isStory ? 20 : 14 }}>{meta.emoji}</span>
      <span
        style={{
          fontSize: isStory ? 16 : 11,
          fontWeight: 600,
          color: meta.primaryColor,
          letterSpacing: '0.02em',
        }}
      >
        {label.en}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface VibeSocialCardProps {
  data: VibeSocialCardData;
  format: CardFormat;
}

export function VibeSocialCard({ data, format }: VibeSocialCardProps) {
  const dimensions = CARD_FORMATS[format];
  const tierColors = TIER_COLORS[data.tier] || TIER_COLORS.BRONZE;
  const isStory = format === 'story';

  const hasVibe = !!data.vibeAnalysis;
  const primaryVibe = data.vibeAnalysis?.primary || 'urban-explorer';
  const secondaryVibe = data.vibeAnalysis?.secondary || 'foodie-wanderer';
  const vibeMeta = getVibeMetadata(primaryVibe);

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
      {/* Aura Background (if VIBE data exists) */}
      {hasVibe && (
        <VibeAuraBackground
          primary={primaryVibe}
          secondary={secondaryVibe}
          colorPalette={data.vibeAnalysis?.colorPalette}
          isStory={isStory}
        />
      )}

      {/* Non-VIBE Background */}
      {!hasVibe && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle at 1px 1px, #17171710 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      )}

      {/* Top Tier Accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: isStory ? 200 : 100,
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
          gap: isStory ? 40 : 20,
          padding: isStory ? '80px 60px' : '30px 50px',
        }}
      >
        {/* User Photo (if available) */}
        {data.userPhoto && (
          <div
            style={{
              width: isStory ? 180 : 100,
              height: isStory ? 180 : 100,
              borderRadius: '50%',
              border: `4px solid ${vibeMeta.primaryColor}`,
              overflow: 'hidden',
              boxShadow: `0 0 40px ${vibeMeta.primaryColor}40`,
            }}
          >
            <img
              src={data.userPhoto}
              alt="User"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        )}

        {/* Badge Icon */}
        <div style={{ fontSize: isStory ? 100 : 60, lineHeight: 1 }}>
          {tierColors.badge}
        </div>

        {/* Sovereign Number */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: isStory ? 22 : 14,
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
              color: '#171717aa',
              marginBottom: isStory ? 15 : 8,
            }}
          >
            I am the
          </div>
          <div
            style={{
              fontSize: isStory ? 120 : 70,
              fontWeight: 900,
              lineHeight: 1,
              background: `linear-gradient(135deg, ${tierColors.primary} 0%, ${tierColors.secondary} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {data.sovereignNumber}
            <sup style={{ fontSize: isStory ? 36 : 20 }}>
              {getOrdinalSuffix(data.sovereignNumber)}
            </sup>
          </div>
          <div
            style={{
              fontSize: isStory ? 40 : 24,
              fontWeight: 700,
              marginTop: isStory ? 15 : 8,
              letterSpacing: '0.15em',
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
            gap: 10,
            padding: isStory ? '12px 30px' : '8px 20px',
            background: `${tierColors.primary}20`,
            borderRadius: 100,
            border: `2px solid ${tierColors.primary}`,
          }}
        >
          <span style={{ fontSize: isStory ? 20 : 14 }}>{tierColors.badge}</span>
          <span
            style={{
              fontSize: isStory ? 18 : 12,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: tierColors.secondary,
            }}
          >
            {data.tier} TIER
          </span>
        </div>

        {/* VIBE Archetypes */}
        {hasVibe && (
          <div
            style={{
              display: 'flex',
              flexDirection: isStory ? 'column' : 'row',
              alignItems: 'center',
              gap: isStory ? 12 : 8,
              marginTop: isStory ? 20 : 10,
            }}
          >
            <VibeBadge archetype={primaryVibe} isStory={isStory} />
            <VibeBadge archetype={secondaryVibe} isSecondary isStory={isStory} />
          </div>
        )}

        {/* VIBE Traits */}
        {hasVibe && data.vibeAnalysis?.traits && isStory && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              justifyContent: 'center',
              maxWidth: '80%',
            }}
          >
            {data.vibeAnalysis.traits.map((trait, i) => (
              <span
                key={i}
                style={{
                  padding: '6px 14px',
                  background: '#171717',
                  color: '#F9F9F7',
                  borderRadius: 100,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {trait}
              </span>
            ))}
          </div>
        )}

        {/* Stats (Story only) */}
        {isStory && (
          <div style={{ display: 'flex', gap: 50, marginTop: 30 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, fontWeight: 800 }}>{data.totalReferrals}</div>
              <div style={{ fontSize: 14, color: '#171717aa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Referrals
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, fontWeight: 800 }}>{formatNumber(data.totalRewards)}</div>
              <div style={{ fontSize: 14, color: '#171717aa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                KAUS
              </div>
            </div>
            {data.energyKwh && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, fontWeight: 800 }}>{formatNumber(data.energyKwh)}</div>
                <div style={{ fontSize: 14, color: '#171717aa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  kWh
                </div>
              </div>
            )}
          </div>
        )}

        {/* Referral Code */}
        <div style={{ marginTop: isStory ? 40 : 15, textAlign: 'center' }}>
          <div
            style={{
              fontSize: isStory ? 14 : 10,
              color: '#171717aa',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              marginBottom: 8,
            }}
          >
            Join with my code
          </div>
          <div
            style={{
              fontSize: isStory ? 40 : 24,
              fontWeight: 800,
              fontFamily: 'monospace',
              letterSpacing: '0.12em',
              padding: isStory ? '16px 40px' : '10px 24px',
              background: '#171717',
              color: '#F9F9F7',
              borderRadius: 10,
            }}
          >
            {data.referralCode}
          </div>
        </div>

        {/* Brand */}
        <div
          style={{
            position: 'absolute',
            bottom: isStory ? 60 : 30,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <svg width={isStory ? 36 : 22} height={isStory ? 36 : 22} viewBox="0 0 40 40">
            <rect width="40" height="40" rx="8" fill="#171717" />
            <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="#F9F9F7" fontSize="20" fontWeight="bold">
              F9
            </text>
          </svg>
          <span
            style={{
              fontSize: isStory ? 20 : 12,
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

interface VibeSocialGeneratorProps {
  data: VibeSocialCardData;
}

export function VibeSocialGenerator({ data }: VibeSocialGeneratorProps) {
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
      link.download = `sovereign-vibe-${data.sovereignNumber}-${format}.${fileType}`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to generate image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    if (typeof navigator === 'undefined' || !('share' in navigator) || typeof navigator.share !== 'function') return;

    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `sovereign-vibe-${data.sovereignNumber}.png`, { type: 'image/png' });

      const vibeText = data.vibeAnalysis
        ? ` | ${VIBE_LABELS[data.vibeAnalysis.primary].en}`
        : '';

      await navigator.share({
        title: `I am the ${data.sovereignNumber}${getOrdinalSuffix(data.sovereignNumber)} Sovereign${vibeText}`,
        text: `Join Field Nine with my code: ${data.referralCode}`,
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
      <div className="flex gap-2 flex-wrap">
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
        className="relative overflow-hidden rounded-2xl border border-[#17171720] shadow-lg"
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
          <VibeSocialCard data={data} format={format} />
        </div>
      </div>

      {/* VIBE Status */}
      {data.vibeAnalysis && (
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#22C55E]/10 to-transparent rounded-lg">
          <span className="text-lg">{VIBE_METADATA[data.vibeAnalysis.primary].emoji}</span>
          <span className="text-sm font-medium text-[#171717]">
            VIBE-ID: {VIBE_LABELS[data.vibeAnalysis.primary].ko}
          </span>
          <span className="text-xs text-[#171717]/50">+ {VIBE_LABELS[data.vibeAnalysis.secondary].ko}</span>
        </div>
      )}

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

      {/* Share Caption */}
      <div className="p-4 bg-[#F9F9F7] rounded-xl border border-[#17171720]">
        <div className="text-xs text-[#171717aa] uppercase tracking-wider mb-2">Copy caption</div>
        <p className="text-sm text-[#171717]">
          I am the {data.sovereignNumber}{getOrdinalSuffix(data.sovereignNumber)} Sovereign of Field Nine 👑
          {data.vibeAnalysis && (
            <>
              <br />
              My VIBE: {VIBE_METADATA[data.vibeAnalysis.primary].emoji} {VIBE_LABELS[data.vibeAnalysis.primary].en}
            </>
          )}
          <br /><br />
          Join with my code: <strong>{data.referralCode}</strong>
          <br /><br />
          m.fieldnine.io/join?ref={data.referralCode}
          <br /><br />
          #FieldNine #Sovereign #KAUS {data.vibeAnalysis && `#${VIBE_LABELS[data.vibeAnalysis.primary].en.replace(' ', '')}`}
        </p>
      </div>
    </div>
  );
}

export default VibeSocialGenerator;
