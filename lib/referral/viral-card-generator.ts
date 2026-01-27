/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 57: VIRAL CARD GENERATOR
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * High-performance html-to-image card generation
 * Optimized for mobile: < 1 second generation time
 */

import {
  AuraCardData,
  CardGenerationOptions,
  CARD_DIMENSIONS,
  ShareConfig,
} from './viral-card-types';

// ============================================
// QR Code Generation
// ============================================

export function generateQRCodeUrl(data: string, size: number = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    data
  )}&bgcolor=FFFFFF&color=171717&margin=1`;
}

// ============================================
// Referral Link Generation
// ============================================

export function generateReferralLink(code: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fieldnine.io';
  return `${baseUrl}/join?ref=${code}`;
}

// ============================================
// Share Text Generation
// ============================================

export function generateShareText(
  sovereignNumber: number,
  vibeType: string,
  vibeTypeKo: string,
  referralCode: string
): { en: string; ko: string } {
  const link = generateReferralLink(referralCode);

  return {
    en: `My VIBE-ID reveals I'm a ${vibeType}! ✨\n\nDiscover your unique travel aura at Field Nine.\n\n🎁 Join as Sovereign #${sovereignNumber}'s guest and get exclusive rewards!\n\n${link}`,
    ko: `VIBE-ID 분석 결과: ${vibeTypeKo}! ✨\n\n나만의 여행 아우라를 발견하세요.\n\n🎁 Sovereign #${sovereignNumber}의 게스트로 가입하고 특별 보상을 받으세요!\n\n${link}`,
  };
}

// ============================================
// Card ID Generation
// ============================================

export function generateCardId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `AURA-${timestamp}-${random}`.toUpperCase();
}

// ============================================
// Optimized Image Generation (Client-side)
// ============================================

export async function generateCardImage(
  cardElement: HTMLElement,
  options: CardGenerationOptions
): Promise<string> {
  // Dynamic import for client-side only
  const { toPng, toJpeg } = await import('html-to-image');

  const dimensions = CARD_DIMENSIONS[options.format];
  const pixelRatio = options.quality === 'high' ? 2 : options.quality === 'medium' ? 1.5 : 1;

  // Performance optimization settings
  const imageOptions = {
    width: dimensions.width,
    height: dimensions.height,
    pixelRatio,
    quality: options.quality === 'high' ? 0.95 : 0.85,
    cacheBust: true,
    // Skip fonts that might slow down rendering
    skipFonts: true,
    // Use faster image format for mobile
    style: {
      transform: 'scale(1)',
      transformOrigin: 'top left',
    },
  };

  try {
    // Use JPEG for faster generation on mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (isMobile && options.quality !== 'high') {
      return await toJpeg(cardElement, { ...imageOptions, quality: 0.85 });
    }

    return await toPng(cardElement, imageOptions);
  } catch (error) {
    console.error('Card generation failed:', error);
    throw error;
  }
}

// ============================================
// Native Share API
// ============================================

export async function shareCard(config: ShareConfig): Promise<boolean> {
  const { platform, cardDataUrl, shareText, referralLink } = config;

  // Convert data URL to blob for sharing
  const response = await fetch(cardDataUrl);
  const blob = await response.blob();
  const file = new File([blob], 'field-nine-aura-card.png', { type: 'image/png' });

  switch (platform) {
    case 'native': {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            title: 'My Field Nine VIBE-ID',
            text: shareText,
            url: referralLink,
            files: [file],
          });
          return true;
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            console.error('Native share failed:', error);
          }
          return false;
        }
      }
      // Fallback to clipboard
      return shareCard({ ...config, platform: 'clipboard' });
    }

    case 'instagram': {
      // Instagram doesn't have direct sharing API
      // Best approach: Copy to clipboard and open Instagram
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        // Try to open Instagram
        window.open('instagram://story', '_blank');
        return true;
      } catch {
        // Fallback: download the image
        downloadImage(cardDataUrl, 'field-nine-aura-card.png');
        return true;
      }
    }

    case 'twitter': {
      // Twitter Web Intent with text
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareText
      )}&url=${encodeURIComponent(referralLink)}`;
      window.open(twitterUrl, '_blank', 'width=550,height=420');
      // Also download the image for manual attachment
      downloadImage(cardDataUrl, 'field-nine-aura-card.png');
      return true;
    }

    case 'clipboard': {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        return true;
      } catch {
        // Fallback: copy text only
        await navigator.clipboard.writeText(`${shareText}\n\n${referralLink}`);
        return true;
      }
    }

    default:
      return false;
  }
}

// ============================================
// Download Helper
// ============================================

export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================
// Preload QR Code
// ============================================

export function preloadQRCode(referralCode: string): void {
  const qrUrl = generateQRCodeUrl(generateReferralLink(referralCode), 200);
  const img = new Image();
  img.src = qrUrl;
}

// ============================================
// Create Aura Card Data
// ============================================

export function createAuraCardData(
  userId: string,
  sovereignNumber: number,
  referralCode: string,
  analysis: AuraCardData['analysis'],
  userImageBase64?: string
): AuraCardData {
  return {
    userId,
    sovereignNumber,
    referralCode,
    analysis,
    userImageBase64,
    generatedAt: new Date().toISOString(),
    cardId: generateCardId(),
  };
}
