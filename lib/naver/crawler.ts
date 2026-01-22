/**
 * Naver Hotel Price Crawler
 * Scrapes lowest hotel prices from Naver for price matching
 *
 * Note: In production, this should use official Naver API or
 * a proper data partnership. This implementation is for demonstration.
 */

import {
  NaverHotelPrice,
  NaverSearchParams,
  CrawlerConfig,
  DEFAULT_CRAWLER_CONFIG,
  NAVER_DESTINATIONS,
  CrawlJobResult,
} from './types';

// ============================================
// Price Extraction (Simulated)
// ============================================

/**
 * In production, this would:
 * 1. Use Naver Travel API (if available)
 * 2. Or scrape Naver Travel search results
 * 3. Parse hotel names and prices
 *
 * For now, we simulate realistic Korean hotel prices
 */

interface SimulatedNaverPrice {
  hotelName: string;
  basePrice: number;  // USD
  variance: number;   // ±percentage
}

// Popular hotels with typical price ranges
const HOTEL_PRICE_TEMPLATES: Record<string, SimulatedNaverPrice[]> = {
  'TYO': [
    { hotelName: 'Park Hyatt Tokyo', basePrice: 650, variance: 0.15 },
    { hotelName: 'Aman Tokyo', basePrice: 1200, variance: 0.10 },
    { hotelName: 'The Peninsula Tokyo', basePrice: 550, variance: 0.12 },
    { hotelName: 'Mandarin Oriental Tokyo', basePrice: 480, variance: 0.15 },
    { hotelName: 'Conrad Tokyo', basePrice: 320, variance: 0.18 },
    { hotelName: 'Hilton Tokyo', basePrice: 180, variance: 0.20 },
    { hotelName: 'Shinjuku Granbell Hotel', basePrice: 120, variance: 0.25 },
    { hotelName: 'Hotel Gracery Shinjuku', basePrice: 95, variance: 0.22 },
    { hotelName: 'APA Hotel Shinjuku', basePrice: 70, variance: 0.30 },
    { hotelName: 'Tokyu Stay Shinjuku', basePrice: 85, variance: 0.25 },
    { hotelName: 'Keio Plaza Hotel Tokyo', basePrice: 150, variance: 0.20 },
    { hotelName: 'Shibuya Stream Excel Hotel', basePrice: 200, variance: 0.18 },
  ],
  'OSA': [
    { hotelName: 'The Ritz-Carlton Osaka', basePrice: 450, variance: 0.12 },
    { hotelName: 'Conrad Osaka', basePrice: 380, variance: 0.15 },
    { hotelName: 'InterContinental Osaka', basePrice: 280, variance: 0.18 },
    { hotelName: 'Swissotel Nankai Osaka', basePrice: 200, variance: 0.20 },
    { hotelName: 'Hotel Nikko Osaka', basePrice: 150, variance: 0.22 },
    { hotelName: 'Cross Hotel Osaka', basePrice: 110, variance: 0.25 },
    { hotelName: 'Osaka Marriott Miyako Hotel', basePrice: 250, variance: 0.15 },
    { hotelName: 'Hotel Granvia Osaka', basePrice: 140, variance: 0.20 },
  ],
  'FUK': [
    { hotelName: 'Hilton Fukuoka Sea Hawk', basePrice: 250, variance: 0.18 },
    { hotelName: 'Hotel Nikko Fukuoka', basePrice: 150, variance: 0.20 },
    { hotelName: 'Grand Hyatt Fukuoka', basePrice: 320, variance: 0.15 },
    { hotelName: 'JR Kyushu Hotel Blossom', basePrice: 100, variance: 0.25 },
    { hotelName: 'Hotel Okura Fukuoka', basePrice: 180, variance: 0.18 },
  ],
  'BKK': [
    { hotelName: 'Mandarin Oriental Bangkok', basePrice: 380, variance: 0.12 },
    { hotelName: 'The Peninsula Bangkok', basePrice: 350, variance: 0.15 },
    { hotelName: 'Four Seasons Bangkok', basePrice: 420, variance: 0.10 },
    { hotelName: 'Shangri-La Hotel Bangkok', basePrice: 180, variance: 0.20 },
    { hotelName: 'Marriott Marquis Queens Park', basePrice: 120, variance: 0.25 },
    { hotelName: 'Grande Centre Point Sukhumvit', basePrice: 85, variance: 0.30 },
    { hotelName: 'Novotel Bangkok Sukhumvit', basePrice: 70, variance: 0.28 },
  ],
  'SIN': [
    { hotelName: 'Marina Bay Sands', basePrice: 450, variance: 0.12 },
    { hotelName: 'Raffles Hotel Singapore', basePrice: 800, variance: 0.08 },
    { hotelName: 'The Fullerton Hotel', basePrice: 350, variance: 0.15 },
    { hotelName: 'Capella Singapore', basePrice: 650, variance: 0.10 },
    { hotelName: 'JW Marriott Singapore', basePrice: 280, variance: 0.18 },
    { hotelName: 'Parkroyal Collection Marina Bay', basePrice: 200, variance: 0.20 },
    { hotelName: 'Holiday Inn Express Clarke Quay', basePrice: 120, variance: 0.25 },
  ],
};

// Exchange rate for KRW
const USD_TO_KRW = 1350;

// ============================================
// Crawler Class
// ============================================

class NaverPriceCrawler {
  private config: CrawlerConfig;

  constructor(config: Partial<CrawlerConfig> = {}) {
    this.config = { ...DEFAULT_CRAWLER_CONFIG, ...config };
  }

  /**
   * Crawl prices for a specific destination and dates
   */
  async crawlPrices(params: NaverSearchParams): Promise<NaverHotelPrice[]> {
    const destination = NAVER_DESTINATIONS[params.destination];
    if (!destination) {
      console.error(`Unknown destination: ${params.destination}`);
      return [];
    }

    // In production, this would make actual HTTP requests to Naver
    // For now, we generate realistic simulated prices
    return this.generateSimulatedPrices(params);
  }

  /**
   * Crawl all configured destinations
   */
  async crawlAllDestinations(checkIn: string, checkOut: string): Promise<CrawlJobResult[]> {
    const results: CrawlJobResult[] = [];
    const destinations = Object.keys(NAVER_DESTINATIONS);

    for (const dest of destinations) {
      const startTime = Date.now();
      const errors: string[] = [];

      try {
        const prices = await this.crawlPrices({
          destination: dest,
          checkIn,
          checkOut,
        });

        results.push({
          destination: dest,
          checkIn,
          checkOut,
          hotelsScraped: prices.length,
          pricesUpdated: prices.length,
          errors,
          duration: Date.now() - startTime,
          completedAt: new Date(),
        });

        // Respect rate limiting
        await this.delay(this.config.requestDelay);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown error');
        results.push({
          destination: dest,
          checkIn,
          checkOut,
          hotelsScraped: 0,
          pricesUpdated: 0,
          errors,
          duration: Date.now() - startTime,
          completedAt: new Date(),
        });
      }
    }

    return results;
  }

  /**
   * Generate simulated Naver prices
   * In production, replace with actual scraping logic
   */
  private generateSimulatedPrices(params: NaverSearchParams): NaverHotelPrice[] {
    const templates = HOTEL_PRICE_TEMPLATES[params.destination] || HOTEL_PRICE_TEMPLATES['TYO'];
    const now = new Date();

    // Calculate nights for price adjustment
    const checkInDate = new Date(params.checkIn);
    const checkOutDate = new Date(params.checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    // Weekend/holiday premium
    const isWeekend = checkInDate.getDay() === 5 || checkInDate.getDay() === 6;
    const weekendMultiplier = isWeekend ? 1.15 : 1.0;

    // Days until check-in affects pricing
    const daysUntilCheckin = Math.ceil((checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const demandMultiplier = daysUntilCheckin < 7 ? 1.2 : daysUntilCheckin < 14 ? 1.1 : 1.0;

    return templates.map((template) => {
      // Add random variance to base price
      const variance = (Math.random() * 2 - 1) * template.variance;
      const adjustedPrice = template.basePrice * (1 + variance) * weekendMultiplier * demandMultiplier;

      // Convert to KRW
      const priceKrw = Math.round(adjustedPrice * USD_TO_KRW / 1000) * 1000; // Round to nearest 1000 KRW

      // Simulate occasional discounts
      const hasDiscount = Math.random() > 0.7;
      const originalPrice = hasDiscount ? Math.round(priceKrw * 1.15 / 1000) * 1000 : undefined;
      const discountRate = hasDiscount ? Math.round((1 - priceKrw / (originalPrice || priceKrw)) * 100) : undefined;

      return {
        hotelName: template.hotelName,
        hotelNameNormalized: template.hotelName.toLowerCase().replace(/[^a-z0-9]/g, ''),
        destination: params.destination,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        lowestPriceKrw: priceKrw,
        originalPrice,
        discountRate,
        providerName: this.getRandomProvider(),
        roomType: 'Standard Room',
        lastUpdated: now,
        sourceUrl: `https://search.naver.com/search.naver?query=${encodeURIComponent(template.hotelName + ' 호텔')}`,
      };
    });
  }

  /**
   * Get random hotel booking provider name
   */
  private getRandomProvider(): string {
    const providers = [
      '야놀자',
      '호텔스닷컴',
      '부킹닷컴',
      '아고다',
      '트립닷컴',
      '호텔스컴바인',
      '익스피디아',
    ];
    return providers[Math.floor(Math.random() * providers.length)];
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Match hotel name between Stay22 and Naver
   */
  matchHotelName(stay22Name: string, naverPrices: NaverHotelPrice[]): NaverHotelPrice | null {
    const normalizedStay22 = stay22Name.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Exact match first
    const exactMatch = naverPrices.find(
      p => p.hotelNameNormalized === normalizedStay22
    );
    if (exactMatch) return exactMatch;

    // Partial match (hotel name contains or is contained)
    const partialMatch = naverPrices.find(
      p => p.hotelNameNormalized.includes(normalizedStay22) ||
           normalizedStay22.includes(p.hotelNameNormalized)
    );
    if (partialMatch) return partialMatch;

    // Fuzzy match using key words
    const stay22Words: string[] = normalizedStay22.match(/[a-z]{3,}/g) || [];
    if (stay22Words.length > 0) {
      const fuzzyMatch = naverPrices.find(p => {
        const naverWords: string[] = p.hotelNameNormalized.match(/[a-z]{3,}/g) || [];
        const commonWords = stay22Words.filter(w => naverWords.includes(w));
        return commonWords.length >= Math.min(2, stay22Words.length);
      });
      if (fuzzyMatch) return fuzzyMatch;
    }

    return null;
  }
}

// Export singleton instance
export const naverCrawler = new NaverPriceCrawler();

// Export helper functions
export async function crawlNaverPrices(
  destination: string,
  checkIn: string,
  checkOut: string
): Promise<NaverHotelPrice[]> {
  return naverCrawler.crawlPrices({ destination, checkIn, checkOut });
}

export async function crawlAllNaverPrices(
  checkIn: string,
  checkOut: string
): Promise<CrawlJobResult[]> {
  return naverCrawler.crawlAllDestinations(checkIn, checkOut);
}

export function matchNaverPrice(
  hotelName: string,
  naverPrices: NaverHotelPrice[]
): NaverHotelPrice | null {
  return naverCrawler.matchHotelName(hotelName, naverPrices);
}
