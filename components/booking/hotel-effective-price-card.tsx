'use client';

import React from 'react';
import { Star, MapPin, Lock, Gift, ExternalLink, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * NOMAD - Hotel Effective Price Card (Dark Mode)
 *
 * Affiliate Revenue Model:
 * - We receive commission (6-8%) from affiliate partners
 * - Guests: Display standard price, we keep 100% commission
 * - Members: Display "Effective Price" = Standard - Payback
 * - Payback = Commission returned to member as NOMAD Credits
 *
 * This creates perceived value without requiring B2B contracts.
 */

export type UserTier = 'guest' | 'explorer' | 'traveler' | 'nomad' | 'business';

export interface HotelData {
  id: string;
  name: string;
  location: string;
  city: string;
  country: string;
  rating: number;
  reviewCount: number;
  stars: number;
  displayPrice: number; // Standard OTA Price
  originalPrice?: number; // Original before OTA discount (for strikethrough)
  currency?: string;
  image: string; // Emoji or URL
  amenities?: string[];
  affiliateUrl: string;
  partner: 'platform-a' | 'platform-b' | 'platform-c' | 'platform-d';
  nights?: number;
  featured?: boolean;
}

interface HotelEffectivePriceCardProps {
  hotel: HotelData;
  userTier: UserTier;
  onClick?: () => void;
  compact?: boolean;
}

// Commission rates by partner (generic platform names)
const PARTNER_COMMISSION: Record<string, number> = {
  'platform-a': 0.08,
  'platform-b': 0.06,
  'platform-c': 0.07,
  'platform-d': 0.05,
};

// Payback rates by tier (% of commission returned to member)
const TIER_PAYBACK_RATE: Record<UserTier, number> = {
  guest: 0,
  explorer: 0.50,
  traveler: 0.75,
  nomad: 1.0,
  business: 1.0,
};

const TIER_COLORS: Record<UserTier, string> = {
  guest: 'text-white/50',
  explorer: 'text-blue-400',
  traveler: 'text-purple-400',
  nomad: 'text-emerald-400',
  business: 'text-amber-400',
};

export function calculateEffectivePrice(
  displayPrice: number,
  partner: string,
  userTier: UserTier
) {
  const commissionRate = PARTNER_COMMISSION[partner] || 0.06;
  const paybackRate = TIER_PAYBACK_RATE[userTier];

  const totalCommission = Math.floor(displayPrice * commissionRate);
  const paybackAmount = Math.floor(totalCommission * paybackRate);
  const effectivePrice = displayPrice - paybackAmount;
  const ourProfit = totalCommission - paybackAmount;

  return {
    displayPrice,
    effectivePrice,
    paybackAmount,
    totalCommission,
    ourProfit,
    savingsPercent: Math.round((paybackAmount / displayPrice) * 100),
  };
}

const HotelEffectivePriceCard: React.FC<HotelEffectivePriceCardProps> = ({
  hotel,
  userTier,
  onClick,
  compact = false,
}) => {
  const {
    displayPrice,
    effectivePrice,
    paybackAmount,
    savingsPercent,
  } = calculateEffectivePrice(hotel.displayPrice, hotel.partner, userTier);

  const isGuest = userTier === 'guest';
  const isMember = !isGuest;
  const hasPayback = paybackAmount > 0;

  // Potential savings if guest subscribes (using Nomad tier)
  const potentialSavings = calculateEffectivePrice(
    hotel.displayPrice,
    hotel.partner,
    'nomad'
  ).paybackAmount;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: hotel.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleBookClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`[Affiliate Click]`, {
      hotel: hotel.name,
      partner: hotel.partner,
      userTier,
      displayPrice,
      effectivePrice,
      paybackAmount,
    });
    window.open(hotel.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  if (compact) {
    return (
      <motion.div
        onClick={onClick}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden cursor-pointer hover:border-emerald-500/30 transition-all"
      >
        {/* Image */}
        <div className="h-32 bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-5xl relative">
          {hotel.image.startsWith('http') ? (
            <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover" />
          ) : (
            hotel.image
          )}

          {/* Guest Savings Badge */}
          {isGuest && potentialSavings > 0 && (
            <span className="absolute top-2 right-2 px-2 py-1 bg-[#FF4D4D] text-white text-xs font-bold rounded animate-pulse">
              Save {formatPrice(potentialSavings)}
            </span>
          )}

          {/* Member Payback Badge */}
          {isMember && hasPayback && (
            <span className="absolute top-2 right-2 px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded">
              +{formatPrice(paybackAmount)} back
            </span>
          )}

          {/* Stars */}
          <div className="absolute top-2 left-2 flex">
            {Array.from({ length: Math.min(hotel.stars, 5) }).map((_, i) => (
              <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-white truncate">{hotel.name}</h3>
          <p className="text-xs text-white/50 flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" />
            {hotel.city}, {hotel.country}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-sm text-white">{hotel.rating}</span>
            <span className="text-xs text-white/40">({hotel.reviewCount.toLocaleString()})</span>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div>
              {isGuest ? (
                <>
                  <p className="text-lg font-bold text-white">
                    {formatPrice(displayPrice)}
                    <span className="text-xs font-normal text-white/40">/night</span>
                  </p>
                  <p className="text-xs text-[#FF4D4D] flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Member: {formatPrice(displayPrice - potentialSavings)}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-white/40 line-through">
                      {formatPrice(displayPrice)}
                    </span>
                    <span className="text-lg font-bold text-emerald-400">
                      {formatPrice(effectivePrice)}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-400/70">/night effective</p>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Full Card View
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden cursor-pointer hover:border-emerald-500/30 transition-all group"
    >
      {/* Image Section */}
      <div className="relative h-48 bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-6xl overflow-hidden">
        {hotel.image.startsWith('http') ? (
          <img
            src={hotel.image}
            alt={hotel.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          hotel.image
        )}

        {/* Rating Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span>{hotel.rating.toFixed(1)}</span>
          {hotel.reviewCount > 0 && (
            <span className="text-white/60">({hotel.reviewCount.toLocaleString()})</span>
          )}
        </div>

        {/* Partner Badge */}
        <div className="absolute top-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white/80 backdrop-blur-sm capitalize">
          via {hotel.partner}
        </div>

        {/* Guest Nudge */}
        {isGuest && potentialSavings > 0 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-[#FF4D4D] px-3 py-1.5 text-xs font-bold text-white shadow-lg animate-pulse">
            Subscribe & Save {formatPrice(potentialSavings)}
          </div>
        )}

        {/* Member Badge */}
        {isMember && (
          <div className={`absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm ${TIER_COLORS[userTier]}`}>
            <Sparkles className="w-3 h-3 inline mr-1" />
            {userTier.charAt(0).toUpperCase() + userTier.slice(1)} Member
          </div>
        )}

        {/* Featured Badge */}
        {hotel.featured && (
          <div className="absolute top-12 left-3 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-black">
            Featured
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-white line-clamp-1">{hotel.name}</h3>
        <p className="flex items-center gap-1 text-xs text-white/50 mt-1">
          <MapPin className="h-3.5 w-3.5" />
          {hotel.location || `${hotel.city}, ${hotel.country}`}
        </p>

        {hotel.nights && hotel.nights > 1 && (
          <p className="text-xs text-white/40 mt-1">{hotel.nights} nights</p>
        )}

        <div className="h-px w-full bg-white/10 my-4" />

        {/* Pricing Section */}
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            {isGuest ? (
              <>
                <span className="text-xs text-white/40">Standard Rate</span>
                <div className="flex items-baseline gap-2">
                  {hotel.originalPrice && hotel.originalPrice > displayPrice && (
                    <span className="text-sm text-white/40 line-through">
                      {formatPrice(hotel.originalPrice)}
                    </span>
                  )}
                  <span className="text-2xl font-bold text-white">
                    {formatPrice(displayPrice)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-[#FF4D4D]">
                  <Lock className="h-3.5 w-3.5" />
                  <span>
                    Member Price: <strong>{formatPrice(displayPrice - potentialSavings)}</strong>
                  </span>
                </div>
              </>
            ) : (
              <>
                <span className={`text-xs font-medium ${TIER_COLORS[userTier]}`}>
                  {userTier.charAt(0).toUpperCase() + userTier.slice(1)} Effective Price
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-white/40 line-through">
                    {formatPrice(displayPrice)}
                  </span>
                  <span className="text-2xl font-bold text-white">
                    {formatPrice(effectivePrice)}
                  </span>
                </div>
                {hasPayback && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
                    <Gift className="h-3.5 w-3.5" />
                    <span>
                      +<strong>{formatPrice(paybackAmount)}</strong> Payback ({savingsPercent}%)
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Book Button */}
          <button
            onClick={handleBookClick}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
              isGuest
                ? 'bg-white text-black hover:bg-white/90'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            Book
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Payback Explanation */}
        {isMember && hasPayback && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-emerald-300">
              Pay {formatPrice(displayPrice)}, get {formatPrice(paybackAmount)} back as NOMAD Credits within 48h.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default HotelEffectivePriceCard;
