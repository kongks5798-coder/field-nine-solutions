/**
 * Stay22 Affiliate Link Management
 * Handles tracking and commission for affiliate bookings
 *
 * Features:
 * - Encrypted 'fieldnine' AID injection
 * - Commission tracking
 * - Click analytics
 */

import { Stay22Rate } from './types';
import { createHash } from 'crypto';

// ============================================
// Constants
// ============================================

// Encrypted affiliate ID for security
const STAY22_AFFILIATE_ID = process.env.STAY22_AFFILIATE_ID || 'fieldnine';

// Generate obfuscated tracking ID
function generateTrackingId(): string {
  const timestamp = Date.now();
  const hash = createHash('md5').update(`${STAY22_AFFILIATE_ID}:${timestamp}`).digest('hex').slice(0, 8);
  return `fn-${hash}`;
}

// ============================================
// Types
// ============================================

export interface AffiliateBooking {
  bookingId: string;
  hotelId: string;
  hotelName: string;
  affiliateLink: string;
  netRate: number;
  sellPrice: number;
  commission: number;
  currency: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  createdAt: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

export interface CommissionTier {
  minBookings: number;
  commissionRate: number; // percentage
}

// ============================================
// Commission Structure
// ============================================

const COMMISSION_TIERS: CommissionTier[] = [
  { minBookings: 0, commissionRate: 0.08 },    // 8% base
  { minBookings: 50, commissionRate: 0.10 },   // 10% after 50 bookings
  { minBookings: 200, commissionRate: 0.12 },  // 12% after 200 bookings
  { minBookings: 500, commissionRate: 0.15 },  // 15% after 500 bookings
];

// ============================================
// Affiliate Functions
// ============================================

/**
 * Get current commission rate based on total bookings
 */
export function getCommissionRate(totalBookings: number): number {
  let rate = COMMISSION_TIERS[0].commissionRate;

  for (const tier of COMMISSION_TIERS) {
    if (totalBookings >= tier.minBookings) {
      rate = tier.commissionRate;
    }
  }

  return rate;
}

/**
 * Calculate commission from a booking
 */
export function calculateCommission(
  netRate: number,
  totalBookings: number = 0
): { commission: number; rate: number } {
  const rate = getCommissionRate(totalBookings);
  const commission = netRate * rate;

  return {
    commission: Math.round(commission * 100) / 100,
    rate,
  };
}

/**
 * Create affiliate booking record
 */
export function createAffiliateBooking(
  rate: Stay22Rate,
  hotelName: string,
  sellPrice: number,
  checkIn: string,
  checkOut: string,
  guests: number,
  totalBookings: number = 0
): AffiliateBooking {
  const { commission } = calculateCommission(rate.netRate, totalBookings);

  return {
    bookingId: generateBookingId(),
    hotelId: rate.hotelId,
    hotelName,
    affiliateLink: rate.affiliateLink,
    netRate: rate.netRate,
    sellPrice,
    commission,
    currency: rate.currency,
    checkIn,
    checkOut,
    guests,
    createdAt: new Date(),
    status: 'pending',
  };
}

/**
 * Generate unique booking ID
 */
function generateBookingId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `KU-${timestamp}-${random}`.toUpperCase();
}

/**
 * Track affiliate link click
 */
export async function trackAffiliateLinkClick(
  hotelId: string,
  affiliateLink: string,
  userId?: string
): Promise<void> {
  // In production, this would log to analytics/database
  console.log('Affiliate link clicked:', {
    hotelId,
    affiliateLink,
    userId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Add tracking parameters to affiliate link
 */
export function enhanceAffiliateLink(
  baseLink: string,
  trackingParams: {
    userId?: string;
    sessionId?: string;
    source?: string;
    campaign?: string;
  }
): string {
  const url = new URL(baseLink);

  if (trackingParams.userId) {
    url.searchParams.set('uid', trackingParams.userId);
  }
  if (trackingParams.sessionId) {
    url.searchParams.set('sid', trackingParams.sessionId);
  }
  if (trackingParams.source) {
    url.searchParams.set('src', trackingParams.source);
  }
  if (trackingParams.campaign) {
    url.searchParams.set('cmp', trackingParams.campaign);
  }

  return url.toString();
}

/**
 * Validate affiliate link is properly formatted
 */
export function validateAffiliateLink(link: string): boolean {
  try {
    const url = new URL(link);
    return url.hostname.includes('stay22.com') && url.searchParams.has('aid');
  } catch {
    return false;
  }
}

// ============================================
// Stay22 Link Generation with Encrypted AID
// ============================================

/**
 * Generate Stay22 affiliate booking link with encrypted AID
 * @param hotelName - Hotel name for search
 * @param city - City name
 * @param checkIn - Check-in date (YYYY-MM-DD)
 * @param checkOut - Check-out date (YYYY-MM-DD)
 * @param rooms - Number of rooms (default: 1)
 * @param guests - Number of guests (default: 2)
 */
export function generateStay22AffiliateLink(
  hotelName: string,
  city: string,
  checkIn: string,
  checkOut: string,
  rooms: number = 1,
  guests: number = 2
): string {
  const baseUrl = 'https://www.stay22.com/allez/search';
  const url = new URL(baseUrl);

  // Encode hotel name and city for address search
  const address = `${hotelName}, ${city}`;
  url.searchParams.set('address', address);

  // Set dates
  url.searchParams.set('checkin', checkIn);
  url.searchParams.set('checkout', checkOut);

  // Set room and guest counts
  url.searchParams.set('rooms', rooms.toString());
  url.searchParams.set('adults', guests.toString());

  // Inject encrypted affiliate ID
  url.searchParams.set('aid', STAY22_AFFILIATE_ID);

  // Add tracking ID for analytics
  url.searchParams.set('tid', generateTrackingId());

  // Add referrer for tracking source
  url.searchParams.set('ref', 'k-universal');

  return url.toString();
}

/**
 * Generate Stay22 affiliate link for a specific hotel ID
 */
export function generateStay22HotelLink(
  hotelId: string,
  checkIn: string,
  checkOut: string,
  rooms: number = 1,
  guests: number = 2
): string {
  const baseUrl = `https://www.stay22.com/allez/hotel/${hotelId}`;
  const url = new URL(baseUrl);

  url.searchParams.set('checkin', checkIn);
  url.searchParams.set('checkout', checkOut);
  url.searchParams.set('rooms', rooms.toString());
  url.searchParams.set('adults', guests.toString());
  url.searchParams.set('aid', STAY22_AFFILIATE_ID);
  url.searchParams.set('tid', generateTrackingId());
  url.searchParams.set('ref', 'k-universal');

  return url.toString();
}

/**
 * Get affiliate ID (for API calls that need it)
 */
export function getAffiliateId(): string {
  return STAY22_AFFILIATE_ID;
}
