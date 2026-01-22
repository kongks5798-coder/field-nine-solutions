/**
 * Airport Search API
 * Amadeus Airport & City Search API 연동
 * 전세계 공항 자동완성 검색
 *
 * GET /api/airports/search?keyword=tokyo
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAmadeusClient } from '@/lib/amadeus/client';

// Cache for airport search (10 minutes)
const airportCache = new Map<string, { data: AirportResult[]; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000;

interface AirportResult {
  iataCode: string;
  name: string;
  cityName: string;
  cityCode: string;
  countryCode: string;
  countryName: string;
  type: 'airport' | 'city';
}

// Popular airports for quick suggestions
const POPULAR_AIRPORTS: AirportResult[] = [
  { iataCode: 'ICN', name: '인천국제공항', cityName: '서울', cityCode: 'SEL', countryCode: 'KR', countryName: '대한민국', type: 'airport' },
  { iataCode: 'GMP', name: '김포국제공항', cityName: '서울', cityCode: 'SEL', countryCode: 'KR', countryName: '대한민국', type: 'airport' },
  { iataCode: 'PUS', name: '김해국제공항', cityName: '부산', cityCode: 'PUS', countryCode: 'KR', countryName: '대한민국', type: 'airport' },
  { iataCode: 'CJU', name: '제주국제공항', cityName: '제주', cityCode: 'CJU', countryCode: 'KR', countryName: '대한민국', type: 'airport' },
  { iataCode: 'NRT', name: '나리타국제공항', cityName: '도쿄', cityCode: 'TYO', countryCode: 'JP', countryName: '일본', type: 'airport' },
  { iataCode: 'HND', name: '하네다공항', cityName: '도쿄', cityCode: 'TYO', countryCode: 'JP', countryName: '일본', type: 'airport' },
  { iataCode: 'KIX', name: '간사이국제공항', cityName: '오사카', cityCode: 'OSA', countryCode: 'JP', countryName: '일본', type: 'airport' },
  { iataCode: 'FUK', name: '후쿠오카공항', cityName: '후쿠오카', cityCode: 'FUK', countryCode: 'JP', countryName: '일본', type: 'airport' },
  { iataCode: 'BKK', name: '수완나품공항', cityName: '방콕', cityCode: 'BKK', countryCode: 'TH', countryName: '태국', type: 'airport' },
  { iataCode: 'SIN', name: '창이공항', cityName: '싱가포르', cityCode: 'SIN', countryCode: 'SG', countryName: '싱가포르', type: 'airport' },
  { iataCode: 'HKG', name: '홍콩국제공항', cityName: '홍콩', cityCode: 'HKG', countryCode: 'HK', countryName: '홍콩', type: 'airport' },
  { iataCode: 'TPE', name: '타오위안국제공항', cityName: '타이페이', cityCode: 'TPE', countryCode: 'TW', countryName: '대만', type: 'airport' },
  { iataCode: 'PVG', name: '푸동국제공항', cityName: '상하이', cityCode: 'SHA', countryCode: 'CN', countryName: '중국', type: 'airport' },
  { iataCode: 'PEK', name: '베이징수도국제공항', cityName: '베이징', cityCode: 'BJS', countryCode: 'CN', countryName: '중국', type: 'airport' },
  { iataCode: 'DPS', name: '응우라라이공항', cityName: '발리', cityCode: 'DPS', countryCode: 'ID', countryName: '인도네시아', type: 'airport' },
  { iataCode: 'MNL', name: '니노이아키노공항', cityName: '마닐라', cityCode: 'MNL', countryCode: 'PH', countryName: '필리핀', type: 'airport' },
  { iataCode: 'SGN', name: '탄손낫공항', cityName: '호치민', cityCode: 'SGN', countryCode: 'VN', countryName: '베트남', type: 'airport' },
  { iataCode: 'HAN', name: '노이바이공항', cityName: '하노이', cityCode: 'HAN', countryCode: 'VN', countryName: '베트남', type: 'airport' },
  { iataCode: 'DAD', name: '다낭공항', cityName: '다낭', cityCode: 'DAD', countryCode: 'VN', countryName: '베트남', type: 'airport' },
  { iataCode: 'LAX', name: '로스앤젤레스국제공항', cityName: '로스앤젤레스', cityCode: 'LAX', countryCode: 'US', countryName: '미국', type: 'airport' },
  { iataCode: 'JFK', name: '존 F. 케네디공항', cityName: '뉴욕', cityCode: 'NYC', countryCode: 'US', countryName: '미국', type: 'airport' },
  { iataCode: 'SFO', name: '샌프란시스코국제공항', cityName: '샌프란시스코', cityCode: 'SFO', countryCode: 'US', countryName: '미국', type: 'airport' },
  { iataCode: 'CDG', name: '샤를드골공항', cityName: '파리', cityCode: 'PAR', countryCode: 'FR', countryName: '프랑스', type: 'airport' },
  { iataCode: 'LHR', name: '히드로공항', cityName: '런던', cityCode: 'LON', countryCode: 'GB', countryName: '영국', type: 'airport' },
  { iataCode: 'FCO', name: '피우미치노공항', cityName: '로마', cityCode: 'ROM', countryCode: 'IT', countryName: '이탈리아', type: 'airport' },
  { iataCode: 'BCN', name: '바르셀로나공항', cityName: '바르셀로나', cityCode: 'BCN', countryCode: 'ES', countryName: '스페인', type: 'airport' },
  { iataCode: 'SYD', name: '시드니공항', cityName: '시드니', cityCode: 'SYD', countryCode: 'AU', countryName: '호주', type: 'airport' },
  { iataCode: 'DXB', name: '두바이국제공항', cityName: '두바이', cityCode: 'DXB', countryCode: 'AE', countryName: 'UAE', type: 'airport' },
];

// Country name mapping for Korean
const COUNTRY_NAMES_KO: Record<string, string> = {
  'KR': '대한민국', 'JP': '일본', 'CN': '중국', 'TW': '대만', 'HK': '홍콩',
  'TH': '태국', 'VN': '베트남', 'SG': '싱가포르', 'MY': '말레이시아', 'ID': '인도네시아',
  'PH': '필리핀', 'US': '미국', 'CA': '캐나다', 'GB': '영국', 'FR': '프랑스',
  'DE': '독일', 'IT': '이탈리아', 'ES': '스페인', 'AU': '호주', 'NZ': '뉴질랜드',
  'AE': 'UAE', 'QA': '카타르', 'TR': '터키', 'RU': '러시아', 'IN': '인도',
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get('keyword')?.trim() || '';

  // Return popular airports if no keyword
  if (!keyword || keyword.length < 2) {
    return NextResponse.json({
      success: true,
      airports: POPULAR_AIRPORTS.slice(0, 10),
      source: 'popular',
    });
  }

  // Check cache
  const cacheKey = keyword.toLowerCase();
  const cached = airportCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({
      success: true,
      airports: cached.data,
      source: 'cache',
    });
  }

  // First, filter popular airports by keyword
  const keywordLower = keyword.toLowerCase();
  const matchedPopular = POPULAR_AIRPORTS.filter(
    (a) =>
      a.iataCode.toLowerCase().includes(keywordLower) ||
      a.name.toLowerCase().includes(keywordLower) ||
      a.cityName.toLowerCase().includes(keywordLower) ||
      a.countryName.toLowerCase().includes(keywordLower)
  );

  try {
    const amadeus = getAmadeusClient();

    // Search using Amadeus Airport & City Search API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (amadeus as any).referenceData.locations.get({
      keyword,
      subType: 'AIRPORT,CITY',
      'page[limit]': 20,
    });

    if (!response.data || response.data.length === 0) {
      // Return matched popular airports if Amadeus returns nothing
      return NextResponse.json({
        success: true,
        airports: matchedPopular.length > 0 ? matchedPopular : [],
        source: 'popular',
      });
    }

    interface AmadeusLocation {
      iataCode: string;
      name: string;
      subType: 'AIRPORT' | 'CITY';
      address?: {
        cityName?: string;
        cityCode?: string;
        countryCode?: string;
        countryName?: string;
      };
    }

    const airports: AirportResult[] = (response.data as AmadeusLocation[]).map((location) => ({
      iataCode: location.iataCode,
      name: location.name,
      cityName: location.address?.cityName || location.name,
      cityCode: location.address?.cityCode || location.iataCode,
      countryCode: location.address?.countryCode || '',
      countryName: COUNTRY_NAMES_KO[location.address?.countryCode || ''] || location.address?.countryName || '',
      type: location.subType === 'AIRPORT' ? 'airport' : 'city',
    }));

    // Merge with popular airports (popular first, then API results)
    const mergedResults = [...matchedPopular];
    for (const airport of airports) {
      if (!mergedResults.some(a => a.iataCode === airport.iataCode)) {
        mergedResults.push(airport);
      }
    }

    // Cache results
    airportCache.set(cacheKey, { data: mergedResults, timestamp: Date.now() });

    return NextResponse.json({
      success: true,
      airports: mergedResults.slice(0, 20),
      total: mergedResults.length,
      source: 'amadeus',
    });
  } catch (error) {
    console.error('Airport search error:', error);

    // Return matched popular airports on error
    return NextResponse.json({
      success: true,
      airports: matchedPopular.length > 0 ? matchedPopular : POPULAR_AIRPORTS.slice(0, 10),
      source: 'fallback',
    });
  }
}
