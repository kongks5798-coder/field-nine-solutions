/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 54: SOCIAL PROOF CARD 2.0
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * High-resolution shareable card for X(Twitter) and Instagram
 * "I am the Xth Sovereign of Field Nine"
 *
 * Features:
 * - Canvas-based image generation
 * - QR code with referral link
 * - One-tap share buttons (mobile-first)
 * - Tesla Minimalism design (#F9F9F7, #171717)
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SocialProofCardProps {
  sovereignNumber: number;
  userName?: string;
  tier: 'Pioneer' | 'Sovereign' | 'Emperor';
  referralCode: string;
  referralLink: string;
  totalReferrals?: number;
  totalEarnings?: number;
  badges?: string[];
  onShare?: (platform: 'twitter' | 'instagram' | 'copy') => void;
}

export function SocialProofCard({
  sovereignNumber,
  userName,
  tier,
  referralCode,
  referralLink,
  totalReferrals = 0,
  totalEarnings = 0,
  badges = ['Early Bird Sovereign'],
  onShare,
}: SocialProofCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate ordinal suffix
  const getOrdinalSuffix = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  // Tier colors
  const tierColors = {
    Pioneer: { bg: '#10b981', text: '#ffffff' },
    Sovereign: { bg: '#8b5cf6', text: '#ffffff' },
    Emperor: { bg: '#f59e0b', text: '#ffffff' },
  };

  // Generate high-resolution image
  const generateImage = useCallback(async () => {
    if (!canvasRef.current) return;

    setIsGenerating(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High resolution (1080x1920 for Instagram stories / Twitter cards)
    const width = 1080;
    const height = 1350; // 4:5 aspect ratio for Instagram
    canvas.width = width;
    canvas.height = height;

    // Background - Tesla Minimalism
    ctx.fillStyle = '#F9F9F7';
    ctx.fillRect(0, 0, width, height);

    // Top gradient accent
    const gradient = ctx.createLinearGradient(0, 0, width, 300);
    gradient.addColorStop(0, '#171717');
    gradient.addColorStop(1, '#2a2a2a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, 300);

    // Logo text
    ctx.fillStyle = '#F9F9F7';
    ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FIELD NINE', width / 2, 80);

    ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#888888';
    ctx.fillText('SOVEREIGN EMPIRE', width / 2, 120);

    // Crown icon (emoji as text)
    ctx.font = '120px serif';
    ctx.fillText('👑', width / 2, 240);

    // Main message
    ctx.fillStyle = '#171717';
    ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('I am the', width / 2, 420);

    // Sovereign number (large)
    ctx.font = 'bold 140px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = tierColors[tier].bg;
    ctx.fillText(`${sovereignNumber}${getOrdinalSuffix(sovereignNumber)}`, width / 2, 560);

    // "Sovereign of Field Nine"
    ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#171717';
    ctx.fillText('Sovereign of Field Nine', width / 2, 650);

    // User name if provided
    if (userName) {
      ctx.font = '32px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#666666';
      ctx.fillText(userName, width / 2, 710);
    }

    // Tier badge
    const tierBadgeY = userName ? 780 : 750;
    ctx.fillStyle = tierColors[tier].bg;
    const tierText = `${tier.toUpperCase()} TIER`;
    const tierMetrics = ctx.measureText(tierText);
    const tierBadgeWidth = tierMetrics.width + 60;
    const tierBadgeX = (width - tierBadgeWidth) / 2;

    // Rounded rectangle for tier badge
    ctx.beginPath();
    ctx.roundRect(tierBadgeX, tierBadgeY - 35, tierBadgeWidth, 50, 25);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(tierText, width / 2, tierBadgeY);

    // Stats section
    const statsY = tierBadgeY + 100;

    // Stats boxes
    const boxWidth = 300;
    const boxHeight = 120;
    const boxGap = 40;
    const startX = (width - (boxWidth * 2 + boxGap)) / 2;

    // Box 1: Referrals
    ctx.fillStyle = '#171717';
    ctx.beginPath();
    ctx.roundRect(startX, statsY, boxWidth, boxHeight, 16);
    ctx.fill();

    ctx.fillStyle = '#888888';
    ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('REFERRALS', startX + boxWidth / 2, statsY + 40);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(totalReferrals.toString(), startX + boxWidth / 2, statsY + 90);

    // Box 2: Earnings
    ctx.fillStyle = '#171717';
    ctx.beginPath();
    ctx.roundRect(startX + boxWidth + boxGap, statsY, boxWidth, boxHeight, 16);
    ctx.fill();

    ctx.fillStyle = '#888888';
    ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('KAUS EARNED', startX + boxWidth + boxGap + boxWidth / 2, statsY + 40);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(totalEarnings.toLocaleString(), startX + boxWidth + boxGap + boxWidth / 2, statsY + 90);

    // Badges section
    if (badges.length > 0) {
      const badgesY = statsY + boxHeight + 60;
      ctx.fillStyle = '#666666';
      ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('🏆 ' + badges.join(' • '), width / 2, badgesY);
    }

    // Referral code section
    const codeY = height - 280;

    ctx.fillStyle = '#171717';
    ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('JOIN WITH MY CODE', width / 2, codeY);

    // Code box
    ctx.fillStyle = '#171717';
    ctx.beginPath();
    ctx.roundRect(width / 2 - 200, codeY + 20, 400, 80, 16);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 48px monospace';
    ctx.fillText(referralCode, width / 2, codeY + 75);

    // Footer
    ctx.fillStyle = '#888888';
    ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('m.fieldnine.io', width / 2, height - 80);

    ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('#FieldNine #Sovereign #KAUS', width / 2, height - 50);

    // Convert to image URL
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    setImageUrl(dataUrl);
    setIsGenerating(false);
  }, [sovereignNumber, userName, tier, referralCode, totalReferrals, totalEarnings, badges]);

  // Generate image on mount
  useEffect(() => {
    generateImage();
  }, [generateImage]);

  // Share handlers
  const handleShare = async (platform: 'twitter' | 'instagram' | 'copy') => {
    const shareText = `I am the ${sovereignNumber}${getOrdinalSuffix(sovereignNumber)} Sovereign of Field Nine 👑\n\nJoin the empire with my code: ${referralCode}\n\n${referralLink}\n\n#FieldNine #Sovereign #KAUS`;

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else if (platform === 'twitter') {
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (platform === 'instagram') {
      // Instagram doesn't have a direct share URL, so we download the image
      if (imageUrl) {
        const link = document.createElement('a');
        link.download = `sovereign-${sovereignNumber}-fieldnine.png`;
        link.href = imageUrl;
        link.click();
        // Show instructions
        alert('Image downloaded! Open Instagram and share from your gallery.');
      }
    }

    onShare?.(platform);
  };

  // Download image
  const downloadImage = () => {
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.download = `sovereign-${sovereignNumber}-fieldnine.png`;
    link.href = imageUrl;
    link.click();
  };

  return (
    <div className="bg-[#F9F9F7] rounded-2xl overflow-hidden border border-[#171717]/10">
      {/* Hidden canvas for image generation */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Preview Card */}
      <div className="aspect-[4/5] bg-gradient-to-b from-[#171717] to-[#2a2a2a] p-6 flex flex-col">
        {/* Header */}
        <div className="text-center text-white mb-4">
          <div className="text-lg font-bold tracking-widest">FIELD NINE</div>
          <div className="text-xs text-white/50 tracking-wider">SOVEREIGN EMPIRE</div>
        </div>

        {/* Crown */}
        <div className="text-6xl text-center mb-4">👑</div>

        {/* Main Content */}
        <div className="flex-1 bg-[#F9F9F7] rounded-xl p-6 text-center">
          <div className="text-[#171717] text-lg mb-2">I am the</div>
          <div className={`text-5xl font-bold mb-2`} style={{ color: tierColors[tier].bg }}>
            {sovereignNumber}{getOrdinalSuffix(sovereignNumber)}
          </div>
          <div className="text-[#171717] text-lg mb-4">Sovereign of Field Nine</div>

          {userName && (
            <div className="text-[#171717]/60 text-sm mb-4">{userName}</div>
          )}

          {/* Tier Badge */}
          <div
            className="inline-block px-4 py-2 rounded-full text-white text-sm font-bold mb-6"
            style={{ backgroundColor: tierColors[tier].bg }}
          >
            {tier.toUpperCase()} TIER
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#171717] rounded-lg p-3 text-center">
              <div className="text-[#888] text-xs">REFERRALS</div>
              <div className="text-emerald-400 text-2xl font-bold">{totalReferrals}</div>
            </div>
            <div className="bg-[#171717] rounded-lg p-3 text-center">
              <div className="text-[#888] text-xs">KAUS EARNED</div>
              <div className="text-amber-400 text-2xl font-bold">{totalEarnings.toLocaleString()}</div>
            </div>
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div className="text-xs text-[#171717]/60 mb-4">
              🏆 {badges.join(' • ')}
            </div>
          )}

          {/* Referral Code */}
          <div className="text-xs text-[#171717]/50 mb-2">JOIN WITH MY CODE</div>
          <div className="bg-[#171717] rounded-lg py-3 px-6 inline-block">
            <span className="text-emerald-400 font-mono text-xl font-bold">{referralCode}</span>
          </div>
        </div>
      </div>

      {/* Share Buttons - Mobile First */}
      <div className="p-4 bg-white border-t border-[#171717]/10">
        <div className="text-xs text-[#171717]/50 text-center mb-3">SHARE YOUR SOVEREIGN STATUS</div>

        <div className="grid grid-cols-3 gap-3">
          {/* Twitter/X Share */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleShare('twitter')}
            className="flex flex-col items-center justify-center p-4 bg-[#171717] rounded-xl text-white hover:bg-[#171717]/90 transition-all"
          >
            <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="text-xs">X/Twitter</span>
          </motion.button>

          {/* Instagram Share */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleShare('instagram')}
            className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-xl text-white hover:opacity-90 transition-all"
          >
            <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span className="text-xs">Instagram</span>
          </motion.button>

          {/* Copy Link */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleShare('copy')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-[#F9F9F7] border border-[#171717]/20 text-[#171717] hover:bg-[#171717]/5'
            }`}
          >
            {copied ? (
              <>
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span className="text-xs">Copy</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Download Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={downloadImage}
          disabled={isGenerating || !imageUrl}
          className="w-full mt-3 py-3 bg-[#171717] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#171717]/90 transition-all disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download High-Res Image
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

export default SocialProofCard;
