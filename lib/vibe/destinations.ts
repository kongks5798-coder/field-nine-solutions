/**
 * VIBE-ID Destination Mapping
 * Vibe Archetype별 추천 여행지 데이터
 */

import { Destination, VibeArchetype } from './types';

// ============================================
// All Destinations Database
// ============================================

export const DESTINATIONS: Destination[] = [
  // Silent Luxury Destinations
  {
    city: 'Kyoto',
    cityKo: '교토',
    country: 'Japan',
    countryKo: '일본',
    matchScore: 95,
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
    reason: 'Ancient temples and refined Japanese aesthetics match your quiet sophistication',
    reasonKo: '고대 사원과 세련된 일본 미학이 당신의 조용한 세련미와 완벽히 어울립니다',
    priceFrom: 450000,
    currency: 'KRW',
    vibeMatch: ['silent-luxury', 'culture-lover', 'minimalist'],
    highlights: ['Temples', 'Tea Ceremony', 'Gardens', 'Kaiseki'],
    highlightsKo: ['사찰', '다도', '정원', '가이세키'],
  },
  {
    city: 'Paris',
    cityKo: '파리',
    country: 'France',
    countryKo: '프랑스',
    matchScore: 92,
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    reason: 'The city of timeless elegance and understated luxury',
    reasonKo: '영원한 우아함과 절제된 럭셔리의 도시',
    priceFrom: 890000,
    currency: 'KRW',
    vibeMatch: ['silent-luxury', 'romantic-dreamer', 'culture-lover'],
    highlights: ['Art', 'Fashion', 'Cuisine', 'Architecture'],
    highlightsKo: ['예술', '패션', '미식', '건축'],
  },
  {
    city: 'Florence',
    cityKo: '피렌체',
    country: 'Italy',
    countryKo: '이탈리아',
    matchScore: 88,
    image: 'https://images.unsplash.com/photo-1543429258-c5ca3dc2e8d4?w=800',
    reason: 'Renaissance art and Italian craftsmanship for the discerning traveler',
    reasonKo: '르네상스 예술과 이탈리아 장인정신이 안목 높은 여행자에게 어울립니다',
    priceFrom: 780000,
    currency: 'KRW',
    vibeMatch: ['silent-luxury', 'culture-lover', 'romantic-dreamer'],
    highlights: ['Museums', 'Leather', 'Wine', 'History'],
    highlightsKo: ['박물관', '가죽공예', '와인', '역사'],
  },

  // Urban Explorer Destinations
  {
    city: 'Tokyo',
    cityKo: '도쿄',
    country: 'Japan',
    countryKo: '일본',
    matchScore: 96,
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    reason: 'Endless urban adventures from neon streets to hidden alleys',
    reasonKo: '네온 거리부터 숨겨진 골목까지 끝없는 도시 모험',
    priceFrom: 380000,
    currency: 'KRW',
    vibeMatch: ['urban-explorer', 'foodie-wanderer', 'minimalist'],
    highlights: ['Shibuya', 'Akihabara', 'Ramen', 'Shopping'],
    highlightsKo: ['시부야', '아키하바라', '라멘', '쇼핑'],
  },
  {
    city: 'New York',
    cityKo: '뉴욕',
    country: 'USA',
    countryKo: '미국',
    matchScore: 94,
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
    reason: 'The ultimate urban playground for city lovers',
    reasonKo: '도시를 사랑하는 이들을 위한 궁극의 도시 놀이터',
    priceFrom: 1200000,
    currency: 'KRW',
    vibeMatch: ['urban-explorer', 'culture-lover', 'foodie-wanderer'],
    highlights: ['Broadway', 'Museums', 'Food Scene', 'Nightlife'],
    highlightsKo: ['브로드웨이', '박물관', '미식', '나이트라이프'],
  },
  {
    city: 'Hong Kong',
    cityKo: '홍콩',
    country: 'Hong Kong',
    countryKo: '홍콩',
    matchScore: 91,
    image: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800',
    reason: 'A vertical city where East meets West in spectacular fashion',
    reasonKo: '동양과 서양이 화려하게 만나는 수직의 도시',
    priceFrom: 420000,
    currency: 'KRW',
    vibeMatch: ['urban-explorer', 'foodie-wanderer', 'adventure-spirit'],
    highlights: ['Skyline', 'Dim Sum', 'Markets', 'Harbor'],
    highlightsKo: ['스카이라인', '딤섬', '시장', '항구'],
  },

  // Nature Seeker Destinations
  {
    city: 'Jeju',
    cityKo: '제주',
    country: 'South Korea',
    countryKo: '대한민국',
    matchScore: 93,
    image: 'https://images.unsplash.com/photo-1597668725896-a49aba6c2dc4?w=800',
    reason: 'Volcanic landscapes and pristine nature close to home',
    reasonKo: '화산 지형과 청정 자연이 가까이에',
    priceFrom: 180000,
    currency: 'KRW',
    vibeMatch: ['nature-seeker', 'romantic-dreamer', 'beach-soul'],
    highlights: ['Hallasan', 'Beaches', 'Oreum', 'Caves'],
    highlightsKo: ['한라산', '해변', '오름', '동굴'],
  },
  {
    city: 'Bali',
    cityKo: '발리',
    country: 'Indonesia',
    countryKo: '인도네시아',
    matchScore: 95,
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    reason: 'Rice terraces, temples, and tropical serenity',
    reasonKo: '계단식 논, 사원, 그리고 열대의 평온함',
    priceFrom: 520000,
    currency: 'KRW',
    vibeMatch: ['nature-seeker', 'romantic-dreamer', 'minimalist'],
    highlights: ['Ubud', 'Rice Terraces', 'Temples', 'Yoga'],
    highlightsKo: ['우붓', '계단식 논', '사원', '요가'],
  },
  {
    city: 'Swiss Alps',
    cityKo: '스위스 알프스',
    country: 'Switzerland',
    countryKo: '스위스',
    matchScore: 94,
    image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800',
    reason: 'Majestic mountains and pure alpine air',
    reasonKo: '장엄한 산과 순수한 알프스 공기',
    priceFrom: 1500000,
    currency: 'KRW',
    vibeMatch: ['nature-seeker', 'adventure-spirit', 'minimalist'],
    highlights: ['Hiking', 'Skiing', 'Lakes', 'Villages'],
    highlightsKo: ['하이킹', '스키', '호수', '마을'],
  },

  // Culture Lover Destinations
  {
    city: 'Rome',
    cityKo: '로마',
    country: 'Italy',
    countryKo: '이탈리아',
    matchScore: 97,
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
    reason: 'Thousands of years of history at every corner',
    reasonKo: '모든 곳에 수천 년의 역사가 숨쉬는 도시',
    priceFrom: 750000,
    currency: 'KRW',
    vibeMatch: ['culture-lover', 'romantic-dreamer', 'foodie-wanderer'],
    highlights: ['Colosseum', 'Vatican', 'Pasta', 'Art'],
    highlightsKo: ['콜로세움', '바티칸', '파스타', '예술'],
  },
  {
    city: 'Barcelona',
    cityKo: '바르셀로나',
    country: 'Spain',
    countryKo: '스페인',
    matchScore: 92,
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
    reason: 'Gaudí, tapas, and vibrant Catalan culture',
    reasonKo: '가우디, 타파스, 그리고 활기찬 카탈루냐 문화',
    priceFrom: 680000,
    currency: 'KRW',
    vibeMatch: ['culture-lover', 'urban-explorer', 'beach-soul'],
    highlights: ['Sagrada Familia', 'Tapas', 'Beach', 'Art'],
    highlightsKo: ['사그라다 파밀리아', '타파스', '해변', '예술'],
  },
  {
    city: 'Istanbul',
    cityKo: '이스탄불',
    country: 'Turkey',
    countryKo: '튀르키예',
    matchScore: 90,
    image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800',
    reason: 'Where continents and civilizations converge',
    reasonKo: '대륙과 문명이 만나는 곳',
    priceFrom: 580000,
    currency: 'KRW',
    vibeMatch: ['culture-lover', 'foodie-wanderer', 'adventure-spirit'],
    highlights: ['Hagia Sophia', 'Grand Bazaar', 'Bosphorus', 'Kebab'],
    highlightsKo: ['아야 소피아', '그랜드 바자르', '보스포루스', '케밥'],
  },

  // Beach Soul Destinations
  {
    city: 'Maldives',
    cityKo: '몰디브',
    country: 'Maldives',
    countryKo: '몰디브',
    matchScore: 98,
    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800',
    reason: 'Crystal clear waters and overwater villas',
    reasonKo: '수정같이 맑은 바다와 수상 빌라',
    priceFrom: 2500000,
    currency: 'KRW',
    vibeMatch: ['beach-soul', 'romantic-dreamer', 'silent-luxury'],
    highlights: ['Snorkeling', 'Overwater Villa', 'Sunset', 'Spa'],
    highlightsKo: ['스노클링', '수상 빌라', '일몰', '스파'],
  },
  {
    city: 'Phuket',
    cityKo: '푸켓',
    country: 'Thailand',
    countryKo: '태국',
    matchScore: 94,
    image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800',
    reason: 'Stunning beaches and island-hopping adventures',
    reasonKo: '아름다운 해변과 섬 호핑 모험',
    priceFrom: 380000,
    currency: 'KRW',
    vibeMatch: ['beach-soul', 'adventure-spirit', 'foodie-wanderer'],
    highlights: ['Beaches', 'Islands', 'Thai Food', 'Nightlife'],
    highlightsKo: ['해변', '섬투어', '태국음식', '나이트라이프'],
  },
  {
    city: 'Boracay',
    cityKo: '보라카이',
    country: 'Philippines',
    countryKo: '필리핀',
    matchScore: 91,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    reason: 'White sand beaches and turquoise waters',
    reasonKo: '하얀 모래 해변과 청록빛 바다',
    priceFrom: 420000,
    currency: 'KRW',
    vibeMatch: ['beach-soul', 'romantic-dreamer', 'adventure-spirit'],
    highlights: ['White Beach', 'Watersports', 'Sunset', 'Seafood'],
    highlightsKo: ['화이트 비치', '수상스포츠', '일몰', '해산물'],
  },

  // Adventure Spirit Destinations
  {
    city: 'New Zealand',
    cityKo: '뉴질랜드',
    country: 'New Zealand',
    countryKo: '뉴질랜드',
    matchScore: 97,
    image: 'https://images.unsplash.com/photo-1469521669194-babb45599def?w=800',
    reason: 'The ultimate adventure playground',
    reasonKo: '궁극의 모험 놀이터',
    priceFrom: 1800000,
    currency: 'KRW',
    vibeMatch: ['adventure-spirit', 'nature-seeker', 'minimalist'],
    highlights: ['Bungee', 'Hiking', 'Lord of the Rings', 'Skydiving'],
    highlightsKo: ['번지점프', '하이킹', '반지의 제왕', '스카이다이빙'],
  },
  {
    city: 'Iceland',
    cityKo: '아이슬란드',
    country: 'Iceland',
    countryKo: '아이슬란드',
    matchScore: 95,
    image: 'https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=800',
    reason: 'Fire, ice, and otherworldly landscapes',
    reasonKo: '불과 얼음, 그리고 다른 세계 같은 풍경',
    priceFrom: 2200000,
    currency: 'KRW',
    vibeMatch: ['adventure-spirit', 'nature-seeker', 'minimalist'],
    highlights: ['Northern Lights', 'Glaciers', 'Waterfalls', 'Hot Springs'],
    highlightsKo: ['오로라', '빙하', '폭포', '온천'],
  },
  {
    city: 'Peru',
    cityKo: '페루',
    country: 'Peru',
    countryKo: '페루',
    matchScore: 93,
    image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800',
    reason: 'Ancient mysteries and challenging treks',
    reasonKo: '고대의 신비와 도전적인 트레킹',
    priceFrom: 1600000,
    currency: 'KRW',
    vibeMatch: ['adventure-spirit', 'culture-lover', 'nature-seeker'],
    highlights: ['Machu Picchu', 'Inca Trail', 'Amazon', 'Cusco'],
    highlightsKo: ['마추픽추', '잉카 트레일', '아마존', '쿠스코'],
  },

  // Foodie Wanderer Destinations
  {
    city: 'Osaka',
    cityKo: '오사카',
    country: 'Japan',
    countryKo: '일본',
    matchScore: 96,
    image: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800',
    reason: "Japan's kitchen - street food heaven",
    reasonKo: '일본의 부엌 - 스트리트 푸드 천국',
    priceFrom: 350000,
    currency: 'KRW',
    vibeMatch: ['foodie-wanderer', 'urban-explorer', 'culture-lover'],
    highlights: ['Takoyaki', 'Okonomiyaki', 'Dotonbori', 'Markets'],
    highlightsKo: ['타코야키', '오코노미야키', '도톤보리', '시장'],
  },
  {
    city: 'Bangkok',
    cityKo: '방콕',
    country: 'Thailand',
    countryKo: '태국',
    matchScore: 95,
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800',
    reason: 'Explosive flavors and endless food adventures',
    reasonKo: '폭발적인 맛과 끝없는 음식 모험',
    priceFrom: 280000,
    currency: 'KRW',
    vibeMatch: ['foodie-wanderer', 'urban-explorer', 'adventure-spirit'],
    highlights: ['Street Food', 'Pad Thai', 'Markets', 'Temples'],
    highlightsKo: ['길거리음식', '팟타이', '시장', '사원'],
  },
  {
    city: 'Singapore',
    cityKo: '싱가포르',
    country: 'Singapore',
    countryKo: '싱가포르',
    matchScore: 92,
    image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
    reason: 'Hawker centers to Michelin stars',
    reasonKo: '호커센터부터 미슐랭 스타까지',
    priceFrom: 450000,
    currency: 'KRW',
    vibeMatch: ['foodie-wanderer', 'urban-explorer', 'minimalist'],
    highlights: ['Hawker Food', 'Marina Bay', 'Gardens', 'Shopping'],
    highlightsKo: ['호커음식', '마리나베이', '가든스', '쇼핑'],
  },

  // Minimalist Destinations
  {
    city: 'Copenhagen',
    cityKo: '코펜하겐',
    country: 'Denmark',
    countryKo: '덴마크',
    matchScore: 94,
    image: 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800',
    reason: 'The birthplace of hygge and Scandinavian design',
    reasonKo: '휘게와 스칸디나비안 디자인의 본고장',
    priceFrom: 1100000,
    currency: 'KRW',
    vibeMatch: ['minimalist', 'culture-lover', 'foodie-wanderer'],
    highlights: ['Design', 'Nyhavn', 'Bicycles', 'New Nordic'],
    highlightsKo: ['디자인', '뉘하운', '자전거', '뉴 노르딕'],
  },
  {
    city: 'Helsinki',
    cityKo: '헬싱키',
    country: 'Finland',
    countryKo: '핀란드',
    matchScore: 92,
    image: 'https://images.unsplash.com/photo-1538332576228-eb5b4c4de6f5?w=800',
    reason: 'Clean lines, saunas, and quiet sophistication',
    reasonKo: '깔끔한 선, 사우나, 그리고 조용한 세련미',
    priceFrom: 950000,
    currency: 'KRW',
    vibeMatch: ['minimalist', 'nature-seeker', 'silent-luxury'],
    highlights: ['Sauna', 'Design District', 'Islands', 'Coffee'],
    highlightsKo: ['사우나', '디자인 지구', '섬', '커피'],
  },
  {
    city: 'Amsterdam',
    cityKo: '암스테르담',
    country: 'Netherlands',
    countryKo: '네덜란드',
    matchScore: 90,
    image: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800',
    reason: 'Canals, bikes, and Dutch practicality',
    reasonKo: '운하, 자전거, 그리고 네덜란드의 실용성',
    priceFrom: 780000,
    currency: 'KRW',
    vibeMatch: ['minimalist', 'culture-lover', 'urban-explorer'],
    highlights: ['Canals', 'Museums', 'Cycling', 'Tulips'],
    highlightsKo: ['운하', '박물관', '자전거', '튤립'],
  },

  // Romantic Dreamer Destinations
  {
    city: 'Santorini',
    cityKo: '산토리니',
    country: 'Greece',
    countryKo: '그리스',
    matchScore: 98,
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800',
    reason: 'White-washed villages and sunset magic',
    reasonKo: '하얀 마을과 마법같은 일몰',
    priceFrom: 850000,
    currency: 'KRW',
    vibeMatch: ['romantic-dreamer', 'beach-soul', 'silent-luxury'],
    highlights: ['Sunset', 'Oia', 'Wine', 'Views'],
    highlightsKo: ['일몰', '오이아', '와인', '전망'],
  },
  {
    city: 'Venice',
    cityKo: '베니스',
    country: 'Italy',
    countryKo: '이탈리아',
    matchScore: 96,
    image: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=800',
    reason: 'Floating city of gondolas and dreams',
    reasonKo: '곤돌라와 꿈의 물 위의 도시',
    priceFrom: 920000,
    currency: 'KRW',
    vibeMatch: ['romantic-dreamer', 'culture-lover', 'silent-luxury'],
    highlights: ['Gondola', 'St. Marks', 'Glass', 'Canals'],
    highlightsKo: ['곤돌라', '산 마르코', '유리공예', '운하'],
  },
  {
    city: 'Prague',
    cityKo: '프라하',
    country: 'Czech Republic',
    countryKo: '체코',
    matchScore: 93,
    image: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800',
    reason: 'Fairy tale architecture and old-world charm',
    reasonKo: '동화 속 건축과 구세계의 매력',
    priceFrom: 520000,
    currency: 'KRW',
    vibeMatch: ['romantic-dreamer', 'culture-lover', 'minimalist'],
    highlights: ['Old Town', 'Castle', 'Beer', 'Bridges'],
    highlightsKo: ['구시가지', '성', '맥주', '다리'],
  },
];

// ============================================
// Get Destinations by Vibe
// ============================================

export function getDestinationsByVibe(
  primary: VibeArchetype,
  secondary?: VibeArchetype,
  limit: number = 6
): Destination[] {
  // Score destinations based on vibe match
  const scoredDestinations = DESTINATIONS.map((dest) => {
    let score = dest.matchScore;

    // Primary match gets full points
    if (dest.vibeMatch.includes(primary)) {
      score += 20;
    }

    // Secondary match gets partial points
    if (secondary && dest.vibeMatch.includes(secondary)) {
      score += 10;
    }

    // First in vibeMatch array is primary fit
    if (dest.vibeMatch[0] === primary) {
      score += 5;
    }

    return { ...dest, calculatedScore: score };
  });

  // Sort by calculated score and take top results
  return scoredDestinations
    .sort((a, b) => b.calculatedScore - a.calculatedScore)
    .slice(0, limit)
    .map(({ calculatedScore, ...dest }) => dest);
}

// ============================================
// Get Random Destinations (fallback)
// ============================================

export function getRandomDestinations(count: number = 4): Destination[] {
  const shuffled = [...DESTINATIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
