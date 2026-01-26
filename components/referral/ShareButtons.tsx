/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 54: MOBILE-FIRST SHARE BUTTONS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Optimized share UI for mobile devices
 * - Native share API support
 * - Platform-specific share options (X, Instagram, KakaoTalk, WhatsApp)
 * - Copy link fallback
 *
 * Colors: #F9F9F7 (background), #171717 (text)
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ShareButtonsProps {
  referralCode: string;
  sovereignNumber: number;
  onShare?: (platform: string) => void;
}

interface SharePlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  getUrl: (code: string, text: string) => string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ICONS (SVG)
// ═══════════════════════════════════════════════════════════════════════════════

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const KakaoIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 3c-5.562 0-10.078 3.59-10.078 8.018 0 2.78 1.838 5.224 4.604 6.627-.175.63-.629 2.28-.721 2.632-.115.442.162.436.34.317.14-.093 2.23-1.522 3.129-2.136.882.132 1.793.2 2.726.2 5.562 0 10.078-3.59 10.078-8.018C22.078 6.59 17.562 3 12 3z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const LinkIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// SHARE PLATFORMS CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const SHARE_PLATFORMS: SharePlatform[] = [
  {
    id: 'x',
    name: 'X',
    icon: <XIcon />,
    color: '#000000',
    bgColor: '#00000010',
    getUrl: (code, text) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(`https://m.fieldnine.io/join?ref=${code}`)}`,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: <InstagramIcon />,
    color: '#E4405F',
    bgColor: '#E4405F10',
    getUrl: () => 'instagram://camera', // Opens Instagram for stories
  },
  {
    id: 'kakao',
    name: 'KakaoTalk',
    icon: <KakaoIcon />,
    color: '#FEE500',
    bgColor: '#FEE50020',
    getUrl: (code, text) =>
      `https://sharer.kakao.com/talk/friends/picker/link?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&url=${encodeURIComponent(`https://m.fieldnine.io/join?ref=${code}`)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: <WhatsAppIcon />,
    color: '#25D366',
    bgColor: '#25D36610',
    getUrl: (code, text) =>
      `https://wa.me/?text=${encodeURIComponent(`${text}\n\nhttps://m.fieldnine.io/join?ref=${code}`)}`,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export function ShareButtons({ referralCode, sovereignNumber, onShare }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const shareText = `I am the ${sovereignNumber}${getOrdinalSuffix(sovereignNumber)} Sovereign of Field Nine 👑 Join the empire with my code: ${referralCode}`;
  const shareUrl = `https://m.fieldnine.io/join?ref=${referralCode}`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Field Nine',
          text: shareText,
          url: shareUrl,
        });
        onShare?.('native');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }
  };

  const handlePlatformShare = (platform: SharePlatform) => {
    const url = platform.getUrl(referralCode, shareText);
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
    onShare?.(platform.id);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setShowToast(true);
      setTimeout(() => {
        setCopied(false);
        setShowToast(false);
      }, 2000);
      onShare?.('copy');
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Referral Code Display */}
      <div className="bg-[#F9F9F7] rounded-2xl p-6 text-center border border-[#17171710]">
        <div className="text-xs text-[#171717aa] uppercase tracking-wider mb-2">
          Your Referral Code
        </div>
        <div className="text-3xl font-bold font-mono text-[#171717] tracking-wider">
          {referralCode}
        </div>
        <div className="mt-3 text-sm text-[#171717aa]">
          Earn <span className="font-semibold text-[#171717]">2% KAUS</span> on every purchase
        </div>
      </div>

      {/* Native Share Button (Mobile) */}
      {typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function' && (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleNativeShare}
          className="w-full flex items-center justify-center gap-3 py-4 bg-[#171717] text-[#F9F9F7] rounded-2xl font-semibold"
        >
          <ShareIcon />
          <span>Share Your Code</span>
        </motion.button>
      )}

      {/* Platform Share Buttons */}
      <div className="grid grid-cols-4 gap-3">
        {SHARE_PLATFORMS.map((platform) => (
          <motion.button
            key={platform.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePlatformShare(platform)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl transition-colors"
            style={{ backgroundColor: platform.bgColor }}
          >
            <div style={{ color: platform.color }}>{platform.icon}</div>
            <span className="text-xs font-medium text-[#171717]">{platform.name}</span>
          </motion.button>
        ))}
      </div>

      {/* Copy Link Button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleCopyLink}
        className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold border-2 transition-all ${
          copied
            ? 'bg-green-500 border-green-500 text-white'
            : 'bg-[#F9F9F7] border-[#17171720] text-[#171717] hover:border-[#171717]'
        }`}
      >
        {copied ? (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Copied!</span>
          </>
        ) : (
          <>
            <LinkIcon />
            <span>Copy Link</span>
          </>
        )}
      </motion.button>

      {/* Share URL Display */}
      <div className="flex items-center gap-2 p-3 bg-[#17171708] rounded-xl">
        <div className="flex-1 text-sm text-[#171717aa] truncate font-mono">{shareUrl}</div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 bg-[#171717] text-[#F9F9F7] rounded-full text-sm font-medium shadow-lg z-50"
          >
            Link copied to clipboard! 🔗
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT VERSION (for smaller spaces)
// ═══════════════════════════════════════════════════════════════════════════════

export function ShareButtonsCompact({ referralCode, sovereignNumber, onShare }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `https://m.fieldnine.io/join?ref=${referralCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShare?.('copy');
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 px-4 py-2 bg-[#F9F9F7] rounded-lg border border-[#17171710]">
        <div className="text-xs text-[#171717aa]">Your code</div>
        <div className="font-bold font-mono text-[#171717]">{referralCode}</div>
      </div>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleCopy}
        className={`p-3 rounded-lg transition-all ${
          copied ? 'bg-green-500 text-white' : 'bg-[#171717] text-[#F9F9F7]'
        }`}
      >
        {copied ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <LinkIcon />
        )}
      </motion.button>
      {typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function' && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={async () => {
            await navigator.share({
              title: 'Join Field Nine',
              text: `Join Field Nine with my code: ${referralCode}`,
              url: shareUrl,
            });
            onShare?.('native');
          }}
          className="p-3 bg-[#171717] text-[#F9F9F7] rounded-lg"
        >
          <ShareIcon />
        </motion.button>
      )}
    </div>
  );
}

export default ShareButtons;
