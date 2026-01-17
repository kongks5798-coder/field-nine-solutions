'use client';

import React from 'react';
import { Star, MapPin, Lock, Gift, ExternalLink } from 'lucide-react';

/**
 * NOMAD - Hotel Pricing Card (Effective Price Model)
 *
 * Business Logic:
 * - We receive commission (8%) from affiliate partners (Agoda/Booking)
 * - Guests: Display standard price, we keep commission
 * - Members: Display "Effective Price" = Standard - Payback
 * - Payback = Commission returned to member (via credits/PayPal)
 */

export type UserTier = 'guest' | 'explorer' | 'traveler' | 'nomad' | 'business';

interface HotelPricingCardProps {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviewCount?: number;
  imageUrl: string;
  displayPrice: number; // Standard OTA Price (what partner shows)
  originalPrice?: number; // Original price before partner discount (for strikethrough)
  currency?: string;
  affiliateUrl: string; // Partner booking link
  partner: 'agoda' | 'booking' | 'expedia' | 'hotels';
  userTier: UserTier;
  nights?: number;
}

// Commission rates by partner (what we receive)
const PARTNER_COMMISSION: Record<string, number> = {
  agoda: 0.08,      // 8%
  booking: 0.06,    // 6%
  expedia: 0.07,    // 7%
  hotels: 0.05,     // 5%
};

// Payback rates by tier (what % of commission we return to member)
const TIER_PAYBACK_RATE: Record<UserTier, number> = {
  guest: 0,         // 0% - we keep all commission
  explorer: 0.50,   // 50% of commission returned
  traveler: 0.75,   // 75% of commission returned
  nomad: 1.0,       // 100% of commission returned
  business: 1.0,    // 100% of commission returned
};

const TIER_LABELS: Record<UserTier, string> = {
  guest: 'Standard',
  explorer: 'Explorer',
  traveler: 'Traveler',
  nomad: 'Nomad',
  business: 'Business',
};

const HotelPricingCard: React.FC<HotelPricingCardProps> = ({
  name,
  location,
  rating,
  reviewCount = 0,
  imageUrl,
  displayPrice,
  originalPrice,
  currency = 'USD',
  affiliateUrl,
  partner,
  userTier,
  nights = 1,
}) => {
  // Calculate pricing
  const commissionRate = PARTNER_COMMISSION[partner] || 0.06;
  const paybackRate = TIER_PAYBACK_RATE[userTier];

  const totalCommission = Math.floor(displayPrice * commissionRate);
  const paybackAmount = Math.floor(totalCommission * paybackRate);
  const effectivePrice = displayPrice - paybackAmount;
  const ourProfit = totalCommission - paybackAmount;

  const isGuest = userTier === 'guest';
  const isMember = !isGuest;
  const hasPayback = paybackAmount > 0;

  // Format currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Calculate potential savings for guest nudge
  const potentialSavings = Math.floor(displayPrice * commissionRate * TIER_PAYBACK_RATE.nomad);

  const handleBooking = () => {
    // Track affiliate click
    console.log(`[Affiliate] User ${userTier} clicked booking`, {
      partner,
      displayPrice,
      effectivePrice,
      paybackAmount,
      ourProfit,
    });

    // Open affiliate link in new tab
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="group relative w-full max-w-sm overflow-hidden rounded-2xl bg-[#F9F9F7] border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Image Section */}
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Rating Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#171717] backdrop-blur-sm">
          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          <span>{rating.toFixed(1)}</span>
          {reviewCount > 0 && (
            <span className="text-gray-400">({reviewCount.toLocaleString()})</span>
          )}
        </div>

        {/* Partner Badge */}
        <div className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-600 backdrop-blur-sm capitalize">
          via {partner}
        </div>

        {/* Guest Nudge - Subscribe & Save */}
        {isGuest && potentialSavings > 0 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-[#FF4D4D] px-3 py-1.5 text-xs font-bold text-white shadow-lg animate-pulse">
            Subscribe & Save {formatPrice(potentialSavings)}
          </div>
        )}

        {/* Member Tier Badge */}
        {isMember && (
          <div className="absolute bottom-3 left-3 rounded-full bg-[#171717] px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
            {TIER_LABELS[userTier]} Member
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-[#171717] line-clamp-1">{name}</h3>
        <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
          <MapPin className="h-3.5 w-3.5" />
          {location}
        </p>

        {nights > 1 && (
          <p className="text-xs text-gray-400 mt-1">{nights} nights</p>
        )}

        <div className="h-px w-full bg-gray-200 my-4" />

        {/* Pricing Section */}
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            {isGuest ? (
              // Guest View - Standard Price + Subscription Nudge
              <>
                <span className="text-xs text-gray-400">Standard Rate</span>
                <div className="flex items-baseline gap-2">
                  {originalPrice && originalPrice > displayPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatPrice(originalPrice)}
                    </span>
                  )}
                  <span className="text-2xl font-bold text-[#171717]">
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
              // Member View - Effective Price with Payback
              <>
                <span className="text-xs text-[#FF4D4D] font-medium">
                  {TIER_LABELS[userTier]} Effective Price
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(displayPrice)}
                  </span>
                  <span className="text-2xl font-bold text-[#171717]">
                    {formatPrice(effectivePrice)}
                  </span>
                </div>
                {hasPayback && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
                    <Gift className="h-3.5 w-3.5" />
                    <span>
                      Includes <strong>{formatPrice(paybackAmount)}</strong> Payback
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Book Button */}
          <button
            onClick={handleBooking}
            className={`flex items-center gap-1.5 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 ${
              isGuest
                ? 'bg-[#171717] text-white hover:bg-[#2a2a2a]'
                : 'bg-[#FF4D4D] text-white shadow-lg hover:bg-[#e64444] hover:shadow-xl'
            }`}
          >
            Book
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Payback Explanation for Members */}
        {isMember && hasPayback && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
            <p className="text-xs text-emerald-700">
              Book at {formatPrice(displayPrice)}, get {formatPrice(paybackAmount)} back as NOMAD Credits within 48h after checkout.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelPricingCard;

// Export types for use in other components
export type { HotelPricingCardProps };
