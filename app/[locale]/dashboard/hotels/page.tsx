/**
 * NOMAD - Global Hotels Search (Effective Price Model)
 *
 * Affiliate Business Logic:
 * - Display partner prices from global OTA platforms
 * - For Guests: Show standard price, we keep 100% commission
 * - For Members: Show "Effective Price" = Standard - Payback
 * - Payback = Commission returned to member as NOMAD Credits
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  Hotel,
  MapPin,
  Star,
  Search,
  Filter,
  ExternalLink,
  Calendar,
  Users,
  ArrowLeft,
  Sparkles,
  Building2,
  Globe,
  Check,
  X,
  Crown,
  Gift,
  Lock,
} from 'lucide-react';
import HotelEffectivePriceCard, {
  type HotelData,
  type UserTier,
  calculateEffectivePrice,
} from '@/components/booking/hotel-effective-price-card';
import { useUserTier, getTierDisplayName } from '@/lib/hooks/use-user-tier';

// ============================================
// Popular Destinations
// ============================================
const POPULAR_DESTINATIONS = [
  { city: 'Tokyo', country: 'Japan', flag: '🇯🇵', image: '🗼' },
  { city: 'Paris', country: 'France', flag: '🇫🇷', image: '🗼' },
  { city: 'New York', country: 'USA', flag: '🇺🇸', image: '🗽' },
  { city: 'London', country: 'UK', flag: '🇬🇧', image: '🎡' },
  { city: 'Seoul', country: 'Korea', flag: '🇰🇷', image: '🏯' },
  { city: 'Bangkok', country: 'Thailand', flag: '🇹🇭', image: '🛕' },
  { city: 'Rome', country: 'Italy', flag: '🇮🇹', image: '🏛️' },
  { city: 'Barcelona', country: 'Spain', flag: '🇪🇸', image: '⛪' },
];

// ============================================
// Booking Platforms (Affiliate Partners)
// ============================================
const BOOKING_PLATFORMS = [
  {
    id: 'platform-a',
    name: 'Hotel Platform A',
    nameKo: '호텔 플랫폼 A',
    logo: '🏨',
    color: 'from-blue-600 to-blue-500',
    commission: '6%',
    url: '#',
  },
  {
    id: 'platform-b',
    name: 'Hotel Platform B',
    nameKo: '호텔 플랫폼 B',
    logo: '🌟',
    color: 'from-red-500 to-rose-500',
    commission: '8%',
    url: '#',
  },
  {
    id: 'platform-c',
    name: 'OTA Partner C',
    nameKo: 'OTA 파트너 C',
    logo: '⭐',
    color: 'from-rose-500 to-red-500',
    commission: '5%',
    url: '#',
  },
  {
    id: 'platform-d',
    name: 'Travel Platform D',
    nameKo: '여행 플랫폼 D',
    logo: '✈️',
    color: 'from-yellow-500 to-amber-500',
    commission: '7%',
    url: '#',
  },
];

// ============================================
// Sample Hotels (Affiliate Data)
// In production: Fetch from partner APIs
// ============================================
const SAMPLE_HOTELS: HotelData[] = [
  {
    id: '1',
    name: 'Park Hyatt Tokyo',
    location: 'Shinjuku, Tokyo',
    city: 'Tokyo',
    country: 'Japan',
    rating: 4.9,
    reviewCount: 3456,
    stars: 5,
    displayPrice: 650, // Partner price
    originalPrice: 750,
    currency: 'USD',
    image: '🏨',
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant'],
    affiliateUrl: '#',
    partner: 'platform-a',
    featured: true,
  },
  {
    id: '2',
    name: 'The Peninsula Paris',
    location: '16th Arrondissement, Paris',
    city: 'Paris',
    country: 'France',
    rating: 4.8,
    reviewCount: 2890,
    stars: 5,
    displayPrice: 890,
    originalPrice: 1050,
    currency: 'USD',
    image: '🏰',
    amenities: ['wifi', 'spa', 'gym', 'restaurant'],
    affiliateUrl: '#',
    partner: 'platform-b',
    featured: true,
  },
  {
    id: '3',
    name: 'RYSE Hotel Seoul',
    location: 'Hongdae, Seoul',
    city: 'Seoul',
    country: 'Korea',
    rating: 4.7,
    reviewCount: 1234,
    stars: 4,
    displayPrice: 180,
    originalPrice: 220,
    currency: 'USD',
    image: '🎨',
    amenities: ['wifi', 'gym', 'restaurant'],
    affiliateUrl: '#',
    partner: 'platform-a',
    featured: false,
  },
  {
    id: '4',
    name: 'Mandarin Oriental Bangkok',
    location: 'Riverside, Bangkok',
    city: 'Bangkok',
    country: 'Thailand',
    rating: 4.9,
    reviewCount: 4567,
    stars: 5,
    displayPrice: 320,
    originalPrice: 400,
    currency: 'USD',
    image: '🌴',
    amenities: ['wifi', 'pool', 'spa', 'gym', 'restaurant'],
    affiliateUrl: '#',
    partner: 'platform-c',
    featured: true,
  },
  {
    id: '5',
    name: 'The Ritz London',
    location: 'Piccadilly, London',
    city: 'London',
    country: 'UK',
    rating: 4.8,
    reviewCount: 3210,
    stars: 5,
    displayPrice: 780,
    originalPrice: 920,
    currency: 'USD',
    image: '🎩',
    amenities: ['wifi', 'spa', 'restaurant'],
    affiliateUrl: '#',
    partner: 'platform-d',
    featured: false,
  },
  {
    id: '6',
    name: 'Aman Tokyo',
    location: 'Otemachi, Tokyo',
    city: 'Tokyo',
    country: 'Japan',
    rating: 4.9,
    reviewCount: 1890,
    stars: 5,
    displayPrice: 1200,
    originalPrice: 1400,
    currency: 'USD',
    image: '🗻',
    amenities: ['wifi', 'pool', 'spa', 'gym', 'restaurant'],
    affiliateUrl: '#',
    partner: 'platform-b',
    featured: true,
  },
];

// ============================================
// Hotels Search Page
// ============================================
export default function HotelsPage() {
  const locale = useLocale();
  const { tier, isLoading: tierLoading } = useUserTier();

  const [searchQuery, setSearchQuery] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<HotelData | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1500]);
  const [selectedStars, setSelectedStars] = useState<number[]>([]);

  const isGuest = tier === 'guest';
  const isMember = !isGuest;

  // Filter hotels
  const filteredHotels = SAMPLE_HOTELS.filter((hotel) => {
    const matchesSearch =
      hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotel.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotel.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice =
      hotel.displayPrice >= priceRange[0] && hotel.displayPrice <= priceRange[1];
    const matchesStars =
      selectedStars.length === 0 || selectedStars.includes(hotel.stars);
    return matchesSearch && matchesPrice && matchesStars;
  });

  // Calculate total potential savings for member
  const totalPotentialSavings = SAMPLE_HOTELS.reduce((sum, hotel) => {
    const { paybackAmount } = calculateEffectivePrice(hotel.displayPrice, hotel.partner, 'nomad');
    return sum + paybackAmount;
  }, 0);

  // Build affiliate URL with tracking
  const buildAffiliateUrl = (baseUrl: string, destination: string) => {
    const params = new URLSearchParams({
      ss: destination,
      checkin: checkIn || '',
      checkout: checkOut || '',
      group_adults: guests.toString(),
      no_rooms: rooms.toString(),
      aid: 'NOMAD', // Our affiliate ID
    });
    return `${baseUrl}/searchresults.html?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/${locale}`}>
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <Hotel className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">Hotels</h1>
                  <p className="text-xs text-white/50">
                    {isMember ? (
                      <span className="text-emerald-400">
                        <Gift className="w-3 h-3 inline mr-1" />
                        {getTierDisplayName(tier)} Payback Active
                      </span>
                    ) : (
                      'Subscribe for member payback'
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Tier Badge */}
              {isMember && (
                <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400">
                  <Crown className="w-3 h-3" />
                  {getTierDisplayName(tier)}
                </div>
              )}

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Guest Upgrade Banner */}
        {isGuest && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-[#FF4D4D]/10 via-rose-500/10 to-orange-500/10 rounded-2xl border border-[#FF4D4D]/20 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FF4D4D]/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-[#FF4D4D]" />
                </div>
                <div>
                  <p className="font-bold text-white">Unlock Member Payback</p>
                  <p className="text-sm text-white/60">
                    Save up to <span className="text-[#FF4D4D] font-bold">${totalPotentialSavings}</span> on these hotels as a Nomad member
                  </p>
                </div>
              </div>
              <Link
                href={`/${locale}/pricing`}
                className="px-4 py-2 bg-[#FF4D4D] hover:bg-[#e64444] text-white rounded-lg font-semibold text-sm transition-colors"
              >
                Upgrade Now
              </Link>
            </div>
          </motion.div>
        )}

        {/* Member Savings Summary */}
        {isMember && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-2xl border border-emerald-500/20 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Gift className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-white">{getTierDisplayName(tier)} Payback Active</p>
                <p className="text-sm text-emerald-400">
                  You'll earn payback on all bookings. Credits arrive within 48h of checkout.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search Section */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Where are you going?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none appearance-none"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n} className="bg-[#12121A]">
                    {n} Guest{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <select
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
                className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none appearance-none"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n} className="bg-[#12121A]">
                    {n} Room{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Partner Platforms */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            Our Affiliate Partners
            {isMember && (
              <span className="text-xs font-normal text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                Payback on all bookings
              </span>
            )}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BOOKING_PLATFORMS.map((platform) => (
              <motion.a
                key={platform.id}
                href={buildAffiliateUrl(platform.url, searchQuery || 'Tokyo')}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 bg-gradient-to-br ${platform.color} rounded-xl text-white relative overflow-hidden`}
              >
                <div className="text-2xl mb-2">{platform.logo}</div>
                <p className="font-bold">{platform.name}</p>
                <p className="text-xs opacity-80">
                  {isMember ? `Up to ${platform.commission} payback` : `Search ${platform.name}`}
                </p>
                <ExternalLink className="absolute top-3 right-3 w-4 h-4 opacity-50" />
              </motion.a>
            ))}
          </div>
        </section>

        {/* Popular Destinations */}
        <section>
          <h2 className="text-lg font-bold mb-4">Popular Destinations</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {POPULAR_DESTINATIONS.map((dest) => (
              <motion.button
                key={dest.city}
                onClick={() => setSearchQuery(dest.city)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-shrink-0 p-4 rounded-xl border transition-colors ${
                  searchQuery === dest.city
                    ? 'bg-emerald-500/20 border-emerald-500/50'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="text-3xl mb-2">{dest.image}</div>
                <p className="font-medium text-white">{dest.city}</p>
                <p className="text-xs text-white/50">{dest.flag} {dest.country}</p>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-4">
                <h3 className="font-bold">Filters</h3>

                <div>
                  <p className="text-sm text-white/60 mb-2">Star Rating</p>
                  <div className="flex gap-2">
                    {[3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() =>
                          setSelectedStars((prev) =>
                            prev.includes(star)
                              ? prev.filter((s) => s !== star)
                              : [...prev, star]
                          )
                        }
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg border transition-colors ${
                          selectedStars.includes(star)
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                            : 'border-white/10 text-white/60'
                        }`}
                      >
                        {star}
                        <Star className="w-3 h-3 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-white/60 mb-2">
                    Price per night: ${priceRange[0]} - ${priceRange[1]}
                  </p>
                  <input
                    type="range"
                    min="0"
                    max="1500"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Featured Hotels - Using Effective Price Cards */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            Featured Hotels
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHotels
              .filter((h) => h.featured)
              .map((hotel) => (
                <HotelEffectivePriceCard
                  key={hotel.id}
                  hotel={hotel}
                  userTier={tier}
                  onClick={() => setSelectedHotel(hotel)}
                />
              ))}
          </div>
        </section>

        {/* All Hotels */}
        <section>
          <h2 className="text-lg font-bold mb-4">
            All Hotels
            <span className="text-sm font-normal text-white/50 ml-2">
              ({filteredHotels.length} results)
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHotels.map((hotel) => (
              <HotelEffectivePriceCard
                key={hotel.id}
                hotel={hotel}
                userTier={tier}
                onClick={() => setSelectedHotel(hotel)}
                compact
              />
            ))}
          </div>

          {filteredHotels.length === 0 && (
            <div className="text-center py-12">
              <Hotel className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/50">No hotels found</p>
              <p className="text-sm text-white/30">Try a different search</p>
            </div>
          )}
        </section>

        {/* How Payback Works */}
        <section className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-2xl border border-emerald-500/20 p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            How NOMAD Payback Works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                title: 'Book via NOMAD',
                desc: 'Click any hotel to book through our partner sites.',
              },
              {
                step: '2',
                title: 'Complete Your Stay',
                desc: 'Enjoy your hotel. We track your booking automatically.',
              },
              {
                step: '3',
                title: 'Get Payback',
                desc: 'Receive NOMAD Credits within 48h of checkout.',
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="text-sm text-white/50">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Payback Rates Table */}
          <div className="mt-6 p-4 bg-black/20 rounded-xl">
            <p className="text-sm font-medium text-white/70 mb-3">Payback Rates by Tier</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
              {[
                { tier: 'Guest', rate: '0%', color: 'text-white/40' },
                { tier: 'Explorer', rate: '50%', color: 'text-blue-400' },
                { tier: 'Traveler', rate: '75%', color: 'text-purple-400' },
                { tier: 'Nomad', rate: '100%', color: 'text-emerald-400' },
                { tier: 'Business', rate: '100%', color: 'text-amber-400' },
              ].map((item) => (
                <div key={item.tier} className={`text-center p-2 rounded-lg bg-white/5 ${item.color}`}>
                  <p className="font-bold">{item.rate}</p>
                  <p className="text-xs opacity-70">{item.tier}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/40 mt-2">
              * Percentage of partner commission returned to you as NOMAD Credits
            </p>
          </div>
        </section>
      </main>

      {/* Hotel Detail Modal */}
      <AnimatePresence>
        {selectedHotel && (
          <HotelDetailModal
            hotel={selectedHotel}
            userTier={tier}
            onClose={() => setSelectedHotel(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Hotel Detail Modal (Effective Price)
// ============================================
function HotelDetailModal({
  hotel,
  userTier,
  onClose,
}: {
  hotel: HotelData;
  userTier: UserTier;
  onClose: () => void;
}) {
  const {
    displayPrice,
    effectivePrice,
    paybackAmount,
    savingsPercent,
  } = calculateEffectivePrice(hotel.displayPrice, hotel.partner, userTier);

  const isGuest = userTier === 'guest';
  const isMember = !isGuest;
  const hasPayback = paybackAmount > 0;

  const potentialSavings = calculateEffectivePrice(
    hotel.displayPrice,
    hotel.partner,
    'nomad'
  ).paybackAmount;

  const handleBook = () => {
    // Track affiliate click (analytics would go here in production)
    window.open(hotel.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="relative w-full sm:max-w-lg bg-[#12121A] rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header Image */}
        <div className="h-48 bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center text-8xl relative">
          {hotel.image}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Partner Badge */}
          <div className="absolute top-4 left-4 px-3 py-1 bg-black/30 rounded-full text-sm text-white capitalize backdrop-blur-sm">
            via {hotel.partner}
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              {Array.from({ length: hotel.stars }).map((_, i) => (
                <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <h2 className="text-2xl font-bold text-white">{hotel.name}</h2>
            <p className="text-white/50 flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" />
              {hotel.location}
            </p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-emerald-500 text-white rounded-lg font-bold">
              {hotel.rating}
            </div>
            <div>
              <p className="text-white font-medium">Excellent</p>
              <p className="text-sm text-white/50">{hotel.reviewCount.toLocaleString()} reviews</p>
            </div>
          </div>

          {/* Effective Price Section */}
          <div className={`rounded-xl p-4 border ${
            isMember
              ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20'
              : 'bg-gradient-to-r from-[#FF4D4D]/10 to-rose-500/10 border-[#FF4D4D]/20'
          }`}>
            {isGuest ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white/50">Standard Price</p>
                  <p className="text-3xl font-bold text-white">${displayPrice}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2 text-[#FF4D4D]">
                    <Lock className="w-4 h-4" />
                    <span className="text-sm">Member Effective Price</span>
                  </div>
                  <p className="text-lg font-bold text-[#FF4D4D]">
                    ${displayPrice - potentialSavings}
                  </p>
                </div>
                <p className="text-xs text-[#FF4D4D]/70 mt-2">
                  Subscribe to get ${potentialSavings} back on this booking
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm text-white/50">Partner Price</p>
                    <p className="text-lg text-white/40 line-through">${displayPrice}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-emerald-400">Your Effective Price</p>
                    <p className="text-3xl font-bold text-white">${effectivePrice}</p>
                  </div>
                </div>
                {hasPayback && (
                  <div className="flex items-center gap-2 pt-2 border-t border-emerald-500/20 text-emerald-400">
                    <Gift className="w-4 h-4" />
                    <span className="text-sm">
                      +${paybackAmount} NOMAD Credits ({savingsPercent}% payback)
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* How it works for members */}
          {isMember && hasPayback && (
            <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
              <p className="text-xs text-emerald-300">
                <strong>How it works:</strong> Pay ${displayPrice} at {hotel.partner}. After checkout, we'll add ${paybackAmount} to your NOMAD Credits within 48 hours.
              </p>
            </div>
          )}

          {/* Book Now */}
          <div className="space-y-3">
            <button
              onClick={handleBook}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                isMember
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-white hover:bg-white/90 text-black'
              }`}
            >
              Book on {hotel.partner}
              <ExternalLink className="w-4 h-4" />
            </button>
            <p className="text-xs text-white/40 text-center">
              You'll complete booking on our partner's site. {isMember && 'Payback tracked automatically.'}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
