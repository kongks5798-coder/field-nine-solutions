/**
 * K-UNIVERSAL Markup Engine
 * Real-time pricing with configurable margins
 *
 * Calculates final consumer prices from B2B wholesale prices
 */

// ============================================
// Types
// ============================================

export interface PricingConfig {
  // Base markup percentage (e.g., 0.03 = 3%)
  baseMarkup: number;
  // Minimum markup in absolute amount
  minMarkup: number;
  // Maximum markup in absolute amount
  maxMarkup: number;
  // Currency for min/max amounts
  currency: string;
}

export interface PricingResult {
  basePrice: number;
  markup: number;
  markupPercentage: number;
  finalPrice: number;
  currency: string;
  breakdown: {
    wholesalePrice: number;
    platformFee: number;
    taxes: number;
    total: number;
  };
}

export type ProductCategory = 'flights' | 'hotels' | 'activities' | 'transfers';

// ============================================
// Pricing Configuration by Product Category
// ============================================

const PRICING_CONFIG: Record<ProductCategory, PricingConfig> = {
  flights: {
    baseMarkup: 0.03,  // 3% markup
    minMarkup: 5,      // Minimum $5 markup
    maxMarkup: 100,    // Maximum $100 markup
    currency: 'USD',
  },
  hotels: {
    baseMarkup: 0.05,  // 5% markup
    minMarkup: 3,      // Minimum $3 markup per night
    maxMarkup: 150,    // Maximum $150 markup per booking
    currency: 'USD',
  },
  activities: {
    baseMarkup: 0.08,  // 8% markup
    minMarkup: 2,      // Minimum $2 markup
    maxMarkup: 50,     // Maximum $50 markup
    currency: 'USD',
  },
  transfers: {
    baseMarkup: 0.10,  // 10% markup
    minMarkup: 3,      // Minimum $3 markup
    maxMarkup: 30,     // Maximum $30 markup
    currency: 'USD',
  },
};

// Dynamic markup adjustments based on demand/booking window
const DEMAND_MULTIPLIERS = {
  // Days until departure
  lastMinute: { daysThreshold: 3, multiplier: 1.2 },    // 20% higher markup
  shortTerm: { daysThreshold: 7, multiplier: 1.1 },     // 10% higher markup
  standard: { daysThreshold: 30, multiplier: 1.0 },     // Standard markup
  advance: { daysThreshold: 60, multiplier: 0.9 },      // 10% discount
  earlyBird: { daysThreshold: 90, multiplier: 0.85 },   // 15% discount
};

// ============================================
// Core Markup Functions
// ============================================

/**
 * Calculate markup for a given product
 */
export function calculateMarkup(
  wholesalePrice: number,
  category: ProductCategory,
  options?: {
    departureDate?: Date;
    currency?: string;
    forceMarkup?: number;
  }
): PricingResult {
  const config = PRICING_CONFIG[category];
  const currency = options?.currency || config.currency;

  // Apply demand-based multiplier if departure date provided
  let effectiveMarkup = config.baseMarkup;
  if (options?.departureDate) {
    const daysUntilDeparture = Math.ceil(
      (options.departureDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    effectiveMarkup *= getDemandMultiplier(daysUntilDeparture);
  }

  // Allow force override (for promotions, etc.)
  if (options?.forceMarkup !== undefined) {
    effectiveMarkup = options.forceMarkup;
  }

  // Calculate raw markup
  let markup = wholesalePrice * effectiveMarkup;

  // Apply min/max bounds
  markup = Math.max(config.minMarkup, Math.min(config.maxMarkup, markup));

  // Round to 2 decimal places
  markup = Math.round(markup * 100) / 100;

  const finalPrice = wholesalePrice + markup;

  return {
    basePrice: wholesalePrice,
    markup,
    markupPercentage: (markup / wholesalePrice) * 100,
    finalPrice,
    currency,
    breakdown: {
      wholesalePrice,
      platformFee: markup,
      taxes: 0, // Can be extended for tax calculations
      total: finalPrice,
    },
  };
}

/**
 * Get demand multiplier based on booking window
 */
function getDemandMultiplier(daysUntilDeparture: number): number {
  if (daysUntilDeparture <= DEMAND_MULTIPLIERS.lastMinute.daysThreshold) {
    return DEMAND_MULTIPLIERS.lastMinute.multiplier;
  }
  if (daysUntilDeparture <= DEMAND_MULTIPLIERS.shortTerm.daysThreshold) {
    return DEMAND_MULTIPLIERS.shortTerm.multiplier;
  }
  if (daysUntilDeparture <= DEMAND_MULTIPLIERS.standard.daysThreshold) {
    return DEMAND_MULTIPLIERS.standard.multiplier;
  }
  if (daysUntilDeparture <= DEMAND_MULTIPLIERS.advance.daysThreshold) {
    return DEMAND_MULTIPLIERS.advance.multiplier;
  }
  return DEMAND_MULTIPLIERS.earlyBird.multiplier;
}

/**
 * Calculate price for multiple nights (hotels)
 */
export function calculateHotelPricing(
  nightlyRate: number,
  nights: number,
  options?: {
    checkInDate?: Date;
    currency?: string;
  }
): PricingResult & { perNight: number } {
  const totalWholesale = nightlyRate * nights;
  const result = calculateMarkup(totalWholesale, 'hotels', {
    departureDate: options?.checkInDate,
    currency: options?.currency,
  });

  return {
    ...result,
    perNight: result.finalPrice / nights,
  };
}

/**
 * Calculate price for multiple passengers (flights)
 */
export function calculateFlightPricing(
  perPersonPrice: number,
  passengers: number,
  options?: {
    departureDate?: Date;
    currency?: string;
  }
): PricingResult & { perPerson: number } {
  const totalWholesale = perPersonPrice * passengers;
  const result = calculateMarkup(totalWholesale, 'flights', {
    departureDate: options?.departureDate,
    currency: options?.currency,
  });

  return {
    ...result,
    perPerson: result.finalPrice / passengers,
  };
}

// ============================================
// Currency Conversion Helpers
// ============================================

const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  KRW: 1350,
  EUR: 0.92,
  JPY: 150,
  GBP: 0.79,
  CNY: 7.25,
  THB: 35.5,
  SGD: 1.34,
};

/**
 * Convert price between currencies
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
  const toRate = EXCHANGE_RATES[toCurrency] || 1;

  // Convert to USD first, then to target currency
  const usdAmount = amount / fromRate;
  const converted = usdAmount * toRate;

  return Math.round(converted * 100) / 100;
}

/**
 * Format price for display
 */
export function formatPrice(
  amount: number,
  currency: string,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ============================================
// Commission & Revenue Tracking
// ============================================

export interface BookingRevenue {
  bookingId: string;
  category: ProductCategory;
  wholesalePrice: number;
  finalPrice: number;
  markup: number;
  markupPercentage: number;
  currency: string;
  bookedAt: Date;
}

/**
 * Calculate commission/revenue from a booking
 */
export function calculateBookingRevenue(
  bookingId: string,
  category: ProductCategory,
  wholesalePrice: number,
  finalPrice: number,
  currency: string
): BookingRevenue {
  const markup = finalPrice - wholesalePrice;

  return {
    bookingId,
    category,
    wholesalePrice,
    finalPrice,
    markup,
    markupPercentage: (markup / wholesalePrice) * 100,
    currency,
    bookedAt: new Date(),
  };
}

/**
 * Get platform fee breakdown for transparency
 */
export function getPlatformFeeBreakdown(pricing: PricingResult): {
  baseFee: string;
  percentage: string;
  description: string;
} {
  return {
    baseFee: formatPrice(pricing.markup, pricing.currency),
    percentage: `${pricing.markupPercentage.toFixed(1)}%`,
    description: 'Service fee for booking management, 24/7 support, and price protection.',
  };
}
