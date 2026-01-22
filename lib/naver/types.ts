/**
 * Naver Hotel Price Crawler Types
 * Types for crawling and caching Naver lowest prices
 */

// ============================================
// Crawled Data Types
// ============================================

export interface NaverHotelPrice {
  hotelName: string;
  hotelNameNormalized: string;  // lowercase, trimmed for matching
  destination: string;
  checkIn: string;   // YYYY-MM-DD
  checkOut: string;  // YYYY-MM-DD
  lowestPriceKrw: number;
  originalPrice?: number;  // 정가 (할인 전)
  discountRate?: number;   // 할인율
  providerName?: string;   // 최저가 제공 업체명
  roomType?: string;
  lastUpdated: Date;
  sourceUrl?: string;
}

export interface NaverPriceCache {
  id: string;
  hotelName: string;
  destination: string;
  checkIn: string;
  checkOut: string;
  lowestPriceKrw: number;
  crawledAt: Date;
  expiresAt: Date;  // crawledAt + 10분
  isActive: boolean;
}

// ============================================
// Crawler Configuration
// ============================================

export interface CrawlerConfig {
  maxConcurrency: number;
  requestDelay: number;  // ms between requests
  timeout: number;       // request timeout in ms
  userAgent: string;
  retryAttempts: number;
}

export const DEFAULT_CRAWLER_CONFIG: CrawlerConfig = {
  maxConcurrency: 3,
  requestDelay: 1000,  // 1 second between requests
  timeout: 10000,      // 10 second timeout
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  retryAttempts: 2,
};

// ============================================
// Search Parameters
// ============================================

export interface NaverSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
  rooms?: number;
}

// ============================================
// Destination Mapping
// ============================================

export const NAVER_DESTINATIONS: Record<string, {
  name: string;
  nameKo: string;
  searchQuery: string;
  region: string;
}> = {
  'TYO': { name: 'Tokyo', nameKo: '도쿄', searchQuery: '도쿄 호텔', region: 'japan' },
  'OSA': { name: 'Osaka', nameKo: '오사카', searchQuery: '오사카 호텔', region: 'japan' },
  'FUK': { name: 'Fukuoka', nameKo: '후쿠오카', searchQuery: '후쿠오카 호텔', region: 'japan' },
  'BKK': { name: 'Bangkok', nameKo: '방콕', searchQuery: '방콕 호텔', region: 'thailand' },
  'SIN': { name: 'Singapore', nameKo: '싱가포르', searchQuery: '싱가포르 호텔', region: 'singapore' },
  'HKG': { name: 'Hong Kong', nameKo: '홍콩', searchQuery: '홍콩 호텔', region: 'hongkong' },
  'TPE': { name: 'Taipei', nameKo: '타이페이', searchQuery: '타이베이 호텔', region: 'taiwan' },
  'SGN': { name: 'Ho Chi Minh', nameKo: '호치민', searchQuery: '호치민 호텔', region: 'vietnam' },
  'DPS': { name: 'Bali', nameKo: '발리', searchQuery: '발리 호텔', region: 'indonesia' },
  'PAR': { name: 'Paris', nameKo: '파리', searchQuery: '파리 호텔', region: 'france' },
  'LON': { name: 'London', nameKo: '런던', searchQuery: '런던 호텔', region: 'uk' },
  'NYC': { name: 'New York', nameKo: '뉴욕', searchQuery: '뉴욕 호텔', region: 'usa' },
};

// ============================================
// Price Alert Types (Safety Protocol)
// ============================================

export interface PriceAlert {
  id: string;
  hotelName: string;
  naverPriceKrw: number;
  stay22NetRateKrw: number;
  deficitKrw: number;
  deficitPercent: number;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: Date;
  resolvedAt?: Date;
  notes?: string;
}

export type PriceAlertStatus = PriceAlert['status'];

// ============================================
// Cron Job Types
// ============================================

export interface CrawlJobResult {
  destination: string;
  checkIn: string;
  checkOut: string;
  hotelsScraped: number;
  pricesUpdated: number;
  errors: string[];
  duration: number;  // ms
  completedAt: Date;
}

export interface CrawlSchedule {
  destinations: string[];
  checkInOffsets: number[];  // days from today
  interval: number;  // minutes
}

export const DEFAULT_CRAWL_SCHEDULE: CrawlSchedule = {
  destinations: ['TYO', 'OSA', 'FUK', 'BKK', 'SIN'],
  checkInOffsets: [7, 14, 30],  // 7일, 14일, 30일 후
  interval: 10,  // 10분마다
};
