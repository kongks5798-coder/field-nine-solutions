/**
 * Premium Hotel Card - Tesla Style
 * Ultra-minimalist, magazine-quality hotel card
 */

'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Star,
  MapPin,
  Wifi,
  Car,
  Utensils,
  Coffee,
  Dumbbell,
  Waves,
  Heart,
  Check,
  Sparkles,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface PremiumHotelCardProps {
  id: string;
  name: string;
  brand?: string;
  starRating: number;
  location: {
    city: string;
    cityKo: string;
    district?: string;
  };
  image: string;
  amenities: string[];
  pricing: {
    displayPrice: number;
    pricePerNight: number;
    isNaverMatched: boolean;
    naverProvider?: string;
  };
  reviews: {
    score: number;
    count: number;
    sentiment: 'excellent' | 'very_good' | 'good' | 'fair';
  };
  features: {
    breakfastIncluded: boolean;
    freeCancellation: boolean;
  };
  isLowest?: boolean;
  onSelect: () => void;
  index?: number;
}

// ============================================
// Amenity Icons
// ============================================

const AMENITY_CONFIG: Record<string, { icon: typeof Wifi; label: string }> = {
  'WiFi': { icon: Wifi, label: '무료 와이파이' },
  'wifi': { icon: Wifi, label: '무료 와이파이' },
  'WIFI': { icon: Wifi, label: '무료 와이파이' },
  'Parking': { icon: Car, label: '주차장' },
  'parking': { icon: Car, label: '주차장' },
  'Restaurant': { icon: Utensils, label: '레스토랑' },
  'restaurant': { icon: Utensils, label: '레스토랑' },
  'Gym': { icon: Dumbbell, label: '피트니스' },
  'gym': { icon: Dumbbell, label: '피트니스' },
  'FITNESS_CENTER': { icon: Dumbbell, label: '피트니스' },
  'Pool': { icon: Waves, label: '수영장' },
  'pool': { icon: Waves, label: '수영장' },
  'SWIMMING_POOL': { icon: Waves, label: '수영장' },
  'Spa': { icon: Sparkles, label: '스파' },
  'spa': { icon: Sparkles, label: '스파' },
  'Breakfast': { icon: Coffee, label: '조식' },
  'breakfast': { icon: Coffee, label: '조식' },
};

const SENTIMENT_LABELS = {
  excellent: '최고',
  very_good: '훌륭함',
  good: '좋음',
  fair: '양호',
};

// ============================================
// Price Formatter
// ============================================

const formatPrice = (amount: number) => `₩${amount.toLocaleString('ko-KR')}`;

// ============================================
// Component
// ============================================

export default function PremiumHotelCard({
  id,
  name,
  brand,
  starRating,
  location,
  image,
  amenities,
  pricing,
  reviews,
  features,
  isLowest,
  onSelect,
  index = 0,
}: PremiumHotelCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  // 3D tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-100, 100], [5, -5]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-5, 5]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const defaultImage = 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80';

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="group relative bg-white rounded-[24px] overflow-hidden cursor-pointer"
      onClick={onSelect}
    >
      {/* Subtle Shadow */}
      <div className="absolute inset-0 rounded-[24px] shadow-[0_4px_60px_-12px_rgba(0,0,0,0.08)] group-hover:shadow-[0_20px_80px_-20px_rgba(0,0,0,0.15)] transition-shadow duration-500" />

      {/* Image Section */}
      <div className="relative h-[280px] overflow-hidden">
        <motion.div
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0"
        >
          <Image
            src={imageError ? defaultImage : image}
            alt={name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </motion.div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />

        {/* Top Left - Badges */}
        <div className="absolute top-5 left-5 flex flex-col gap-2">
          {isLowest && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="px-3 py-1.5 bg-white rounded-full text-xs font-semibold text-[#171717] tracking-wide shadow-lg"
            >
              BEST PRICE
            </motion.div>
          )}
          {starRating >= 5 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="px-3 py-1.5 bg-[#171717]/80 backdrop-blur-md rounded-full text-xs font-semibold text-white tracking-wide"
            >
              LUXURY
            </motion.div>
          )}
        </div>

        {/* Top Right - Like Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          whileTap={{ scale: 0.9 }}
          className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg hover:bg-white transition-colors"
        >
          <Heart
            className={`w-5 h-5 transition-all duration-300 ${
              isLiked ? 'fill-[#171717] text-[#171717] scale-110' : 'text-[#171717]/60'
            }`}
          />
        </motion.button>

        {/* Bottom - Hotel Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {/* Stars */}
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: Math.min(starRating, 5) }).map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-white text-white" />
            ))}
          </div>

          {/* Brand */}
          {brand && (
            <p className="text-white/70 text-xs font-medium tracking-[0.15em] uppercase mb-1">
              {brand}
            </p>
          )}

          {/* Name */}
          <h3 className="text-white text-xl font-semibold tracking-tight line-clamp-1 mb-1">
            {name}
          </h3>

          {/* Location */}
          <p className="text-white/70 text-sm flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {location.cityKo}
            {location.district && ` · ${location.district}`}
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        {/* Review Score */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#171717] flex items-center justify-center">
              <span className="text-white font-bold text-sm">{reviews.score}</span>
            </div>
            <div>
              <p className="text-[#171717] font-semibold text-sm">
                {SENTIMENT_LABELS[reviews.sentiment]}
              </p>
              <p className="text-[#171717]/40 text-xs">
                {reviews.count.toLocaleString()}개 리뷰
              </p>
            </div>
          </div>

          {/* Naver Badge */}
          {pricing.isNaverMatched && (
            <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-[#03C75A]/10 rounded-full">
              <div className="w-4 h-4 bg-[#03C75A] rounded flex items-center justify-center">
                <span className="text-white text-[9px] font-bold">N</span>
              </div>
              <span className="text-[#03C75A] text-xs font-medium">동일가</span>
            </div>
          )}
        </div>

        {/* Features Tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {features.freeCancellation && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F9F9F7] rounded-full text-xs text-[#171717]/70">
              <Check className="w-3 h-3 text-green-600" />
              무료 취소
            </span>
          )}
          {features.breakfastIncluded && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F9F9F7] rounded-full text-xs text-[#171717]/70">
              <Coffee className="w-3 h-3" />
              조식 포함
            </span>
          )}
        </div>

        {/* Amenities */}
        <div className="flex gap-2 mb-6">
          {amenities.slice(0, 4).map((amenity) => {
            const config = AMENITY_CONFIG[amenity];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <div
                key={amenity}
                className="w-10 h-10 rounded-xl bg-[#F9F9F7] flex items-center justify-center group/amenity relative"
              >
                <Icon className="w-4 h-4 text-[#171717]/40" />
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#171717] rounded text-white text-[10px] whitespace-nowrap opacity-0 group-hover/amenity:opacity-100 transition-opacity pointer-events-none">
                  {config.label}
                </div>
              </div>
            );
          })}
          {amenities.length > 4 && (
            <div className="w-10 h-10 rounded-xl bg-[#F9F9F7] flex items-center justify-center text-[#171717]/40 text-xs font-medium">
              +{amenities.length - 4}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-[#171717]/5 mb-5" />

        {/* Price & CTA */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[#171717]/40 text-xs mb-1">1박 요금</p>
            <p className="text-[#171717] font-bold text-2xl tracking-tight">
              {formatPrice(pricing.pricePerNight)}
            </p>
            {pricing.isNaverMatched && (
              <p className="text-[#171717]/30 text-[10px] mt-0.5">
                네이버 최저가 동일
              </p>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="px-7 py-3.5 bg-[#171717] rounded-2xl text-white font-medium text-sm tracking-wide hover:bg-[#171717]/90 transition-colors"
          >
            예약하기
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
