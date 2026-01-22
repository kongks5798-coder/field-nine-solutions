/**
 * Tesla-Style Hotel Card
 * Minimalist, premium design with Naver price matching
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import NaverPriceBadge from './naver-price-badge';

// ============================================
// Types
// ============================================

interface HotelPrice {
  amount: number;
  currency: string;
  naverMatched?: boolean;
}

interface ShadowPricing {
  finalPrice: number;
  naverPrice: number;
  stay22NetRate: number;
  margin: number;
  marginPercent: number;
  priceSource: 'naver_cache' | 'naver_crawl' | 'fallback';
  naverProvider?: string;
}

interface TeslaHotelCardProps {
  hotelId: string;
  name: string;
  rating: number;
  address: {
    cityName?: string;
    countryCode?: string;
  };
  price: HotelPrice;
  image: string;
  amenities: string[];
  reviewScore: number;
  reviewCount: number;
  shadowPricing?: ShadowPricing | null;
  breakfastIncluded?: boolean;
  cancellationPolicy?: 'free' | 'non_refundable' | 'partial';
  isLowest?: boolean;
  onSelect: () => void;
}

// ============================================
// Amenity Icons Mapping
// ============================================

const AMENITY_ICONS: Record<string, typeof Wifi> = {
  'WiFi': Wifi, 'wifi': Wifi, 'WIFI': Wifi,
  'Parking': Car, 'parking': Car, 'PARKING': Car,
  'Restaurant': Utensils, 'restaurant': Utensils,
  'Gym': Dumbbell, 'gym': Dumbbell, 'FITNESS_CENTER': Dumbbell,
  'Pool': Waves, 'pool': Waves, 'SWIMMING_POOL': Waves,
  'Spa': Waves, 'spa': Waves, 'SPA': Waves,
  'Breakfast': Coffee, 'breakfast': Coffee,
};

// ============================================
// Price Formatter
// ============================================

const formatPrice = (amount: number, currency: string = 'KRW') => {
  if (currency === 'KRW') {
    return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
  }
  return `$${amount.toLocaleString('en-US')}`;
};

// ============================================
// Component
// ============================================

export default function TeslaHotelCard({
  hotelId,
  name,
  rating,
  address,
  price,
  image,
  amenities,
  reviewScore,
  reviewCount,
  shadowPricing,
  breakfastIncluded,
  cancellationPolicy,
  isLowest,
  onSelect,
}: TeslaHotelCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);

  const defaultImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';
  const isNaverMatched = price.naverMatched || shadowPricing?.priceSource !== 'fallback';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl overflow-hidden border border-[#171717]/5 hover:border-[#171717]/10 transition-all group"
    >
      {/* Image Section */}
      <div className="relative h-56 overflow-hidden">
        <Image
          src={imageError ? defaultImage : image}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          onError={() => setImageError(true)}
        />

        {/* Subtle Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {isLowest && (
            <span className="px-3 py-1.5 bg-[#171717] rounded-full text-xs font-medium text-white tracking-wide">
              최저가
            </span>
          )}
          {rating >= 5 && (
            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-[#171717]">
              Luxury
            </span>
          )}
        </div>

        {/* Like Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isLiked ? 'fill-[#171717] text-[#171717]' : 'text-[#171717]/60'
            }`}
          />
        </button>

        {/* Rating & Stars */}
        <div className="absolute bottom-4 left-4 flex items-center gap-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(rating, 5) }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-white text-white" />
            ))}
          </div>
        </div>

        {/* Review Score */}
        <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-[#171717] rounded-lg">
          <span className="text-white text-sm font-bold">{reviewScore}</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Hotel Name */}
        <h3 className="font-semibold text-[#171717] text-lg mb-1 line-clamp-1 tracking-tight">
          {name}
        </h3>

        {/* Location */}
        <p className="text-[#171717]/50 text-sm flex items-center gap-1.5 mb-4">
          <MapPin className="w-3.5 h-3.5" />
          {address.cityName || 'City Center'}
          {address.countryCode && `, ${address.countryCode}`}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {breakfastIncluded && (
            <span className="px-2.5 py-1 bg-[#171717]/5 rounded-lg text-xs text-[#171717]/70 flex items-center gap-1">
              <Coffee className="w-3 h-3" />
              조식 포함
            </span>
          )}
          {cancellationPolicy === 'free' && (
            <span className="px-2.5 py-1 bg-[#171717]/5 rounded-lg text-xs text-[#171717]/70 flex items-center gap-1">
              <Check className="w-3 h-3" />
              무료 취소
            </span>
          )}
        </div>

        {/* Amenities */}
        <div className="flex gap-2 mb-5">
          {amenities.slice(0, 4).map((amenity) => {
            const Icon = AMENITY_ICONS[amenity] || Wifi;
            return (
              <div
                key={amenity}
                className="w-9 h-9 rounded-lg bg-[#F9F9F7] flex items-center justify-center"
                title={amenity}
              >
                <Icon className="w-4 h-4 text-[#171717]/50" />
              </div>
            );
          })}
          {amenities.length > 4 && (
            <div className="w-9 h-9 rounded-lg bg-[#F9F9F7] flex items-center justify-center text-[#171717]/40 text-xs font-medium">
              +{amenities.length - 4}
            </div>
          )}
        </div>

        {/* Naver Price Badge */}
        {isNaverMatched && (
          <div className="mb-4">
            <NaverPriceBadge
              isMatched={true}
              provider={shadowPricing?.naverProvider}
            />
          </div>
        )}

        {/* Price & CTA */}
        <div className="flex items-end justify-between pt-4 border-t border-[#171717]/5">
          <div>
            <p className="text-[#171717]/40 text-xs mb-1">
              {reviewCount.toLocaleString()} 리뷰
            </p>
            <p className="text-[#171717] font-bold text-2xl tracking-tight">
              {formatPrice(price.amount, price.currency)}
              <span className="text-[#171717]/40 text-sm font-normal ml-1">/ 박</span>
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onSelect}
            className="px-6 py-3 bg-[#171717] hover:bg-[#171717]/90 rounded-xl text-white text-sm font-medium transition-colors"
          >
            예약하기
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
