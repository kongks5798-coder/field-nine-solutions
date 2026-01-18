/**
 * K-Universal Social Share Component
 * Share achievements and experiences on social media
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  X,
  Twitter,
  Facebook,
  Linkedin,
  Link2,
  Check,
  MessageCircle,
  Car,
  UtensilsCrossed,
  Plane,
} from 'lucide-react';

type ShareType = 'taxi' | 'food' | 'general' | 'referral';

interface ShareContent {
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  hashtags: string[];
}

const SHARE_CONTENT: Record<ShareType, ShareContent> = {
  taxi: {
    title: 'K-Taxi Ride',
    description: 'Just took a taxi in Korea without a Korean phone number!',
    icon: Car,
    gradient: 'from-yellow-500 to-orange-500',
    hashtags: ['KUniversal', 'KoreaTaxi', 'TravelKorea'],
  },
  food: {
    title: 'K-Food Delivered',
    description: 'Ordered Korean food delivery like a local - no Korean needed!',
    icon: UtensilsCrossed,
    gradient: 'from-red-500 to-pink-500',
    hashtags: ['KUniversal', 'KoreanFood', 'FoodieInKorea'],
  },
  general: {
    title: 'K-Universal',
    description: 'Living in Korea just got easier with K-Universal!',
    icon: Plane,
    gradient: 'from-blue-500 to-purple-600',
    hashtags: ['KUniversal', 'TravelKorea', 'DigitalNomad'],
  },
  referral: {
    title: 'Invite Friends',
    description: 'Join me on K-Universal and get ₩5,000 free credit!',
    icon: Share2,
    gradient: 'from-emerald-500 to-cyan-500',
    hashtags: ['KUniversal', 'KoreaTravel', 'FreeCredit'],
  },
};

const APP_URL = 'https://k-universal.com';

interface SocialShareProps {
  type?: ShareType;
  isOpen: boolean;
  onClose: () => void;
  customTitle?: string;
  customDescription?: string;
  referralCode?: string;
}

export function SocialShare({
  type = 'general',
  isOpen,
  onClose,
  customTitle,
  customDescription,
  referralCode,
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const content = SHARE_CONTENT[type];
  const Icon = content.icon;

  const title = customTitle || content.title;
  const description = customDescription || content.description;
  const shareUrl = referralCode ? `${APP_URL}?ref=${referralCode}` : APP_URL;
  const hashtags = content.hashtags.join(',');

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(description)}&url=${encodeURIComponent(shareUrl)}&hashtags=${hashtags}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(description)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    kakao: `https://story.kakao.com/share?url=${encodeURIComponent(shareUrl)}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: shareUrl,
        });
      } catch {
        // User cancelled or error
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full sm:max-w-md bg-[#12121A] rounded-t-3xl sm:rounded-3xl border border-white/10 overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>

            {/* Share Card Preview */}
            <div className="p-6">
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${content.gradient} p-6`}>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">{title}</h3>
                  <p className="text-white/80 text-sm">{description}</p>
                  <div className="flex gap-2 mt-4">
                    {content.hashtags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-white/20 rounded-full text-white text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Decorative */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-black/10 rounded-full blur-2xl" />
              </div>
            </div>

            {/* Share Options */}
            <div className="px-6 pb-6">
              <p className="text-white/50 text-sm mb-4 text-center">Share via</p>

              <div className="grid grid-cols-4 gap-3 mb-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleShare('twitter')}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1DA1F2] flex items-center justify-center">
                    <Twitter className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white/60 text-xs">Twitter</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleShare('facebook')}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center">
                    <Facebook className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white/60 text-xs">Facebook</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleShare('linkedin')}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#0A66C2] flex items-center justify-center">
                    <Linkedin className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white/60 text-xs">LinkedIn</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleShare('kakao')}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#FEE500] flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-[#3C1E1E]" />
                  </div>
                  <span className="text-white/60 text-xs">KakaoTalk</span>
                </motion.button>
              </div>

              {/* Copy Link & Native Share */}
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 text-sm font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 text-white/60" />
                      <span className="text-white/60 text-sm font-medium">Copy Link</span>
                    </>
                  )}
                </motion.button>

                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNativeShare}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium"
                  >
                    <Share2 className="w-4 h-4" />
                    More
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Quick share button component
interface ShareButtonProps {
  type?: ShareType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ShareButton({ type = 'general', size = 'md', className = '' }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`${sizeClasses[size]} rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors ${className}`}
      >
        <Share2 className={`${iconSizes[size]} text-white/70`} />
      </motion.button>

      <SocialShare type={type} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
