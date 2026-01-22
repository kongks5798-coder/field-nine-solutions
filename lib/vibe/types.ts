/**
 * VIBE-ID Type Definitions
 * AI 셀피 분석 & 여행지 추천 시스템
 */

// ============================================
// Vibe Archetypes
// ============================================

export const VIBE_ARCHETYPES = [
  'silent-luxury',
  'urban-explorer',
  'nature-seeker',
  'culture-lover',
  'beach-soul',
  'adventure-spirit',
  'foodie-wanderer',
  'minimalist',
  'romantic-dreamer',
] as const;

export type VibeArchetype = (typeof VIBE_ARCHETYPES)[number];

// ============================================
// Vibe Labels (Simple name lookup)
// ============================================

export const VIBE_LABELS: Record<VibeArchetype, { en: string; ko: string }> = {
  'silent-luxury': { en: 'Silent Luxury', ko: '조용한 럭셔리' },
  'urban-explorer': { en: 'Urban Explorer', ko: '도시 탐험가' },
  'nature-seeker': { en: 'Nature Seeker', ko: '자연 추구자' },
  'culture-lover': { en: 'Culture Lover', ko: '문화 애호가' },
  'beach-soul': { en: 'Beach Soul', ko: '해변 영혼' },
  'adventure-spirit': { en: 'Adventure Spirit', ko: '모험 정신' },
  'foodie-wanderer': { en: 'Foodie Wanderer', ko: '미식 방랑자' },
  'minimalist': { en: 'Minimalist', ko: '미니멀리스트' },
  'romantic-dreamer': { en: 'Romantic Dreamer', ko: '로맨틱 드리머' },
};

// ============================================
// Archetype Metadata
// ============================================

export interface VibeMetadata {
  id: VibeArchetype;
  name: string;
  nameKo: string;
  emoji: string;
  description: string;
  descriptionKo: string;
  keywords: string[];
  keywordsKo: string[];
  primaryColor: string;
  secondaryColor: string;
}

export const VIBE_METADATA: Record<VibeArchetype, VibeMetadata> = {
  'silent-luxury': {
    id: 'silent-luxury',
    name: 'Silent Luxury',
    nameKo: '조용한 럭셔리',
    emoji: '✨',
    description: 'Understated elegance, quality over quantity',
    descriptionKo: '절제된 우아함, 양보다 질을 추구하는 세련미',
    keywords: ['sophisticated', 'refined', 'timeless', 'elegant'],
    keywordsKo: ['세련됨', '품격', '클래식', '우아함'],
    primaryColor: '#2C3E50',
    secondaryColor: '#ECF0F1',
  },
  'urban-explorer': {
    id: 'urban-explorer',
    name: 'Urban Explorer',
    nameKo: '도시 탐험가',
    emoji: '🏙️',
    description: 'Thrives in bustling cities, loves hidden gems',
    descriptionKo: '활기찬 도시의 에너지, 숨겨진 명소를 찾는 탐험가',
    keywords: ['dynamic', 'curious', 'trendy', 'energetic'],
    keywordsKo: ['활동적', '호기심', '트렌디', '에너지'],
    primaryColor: '#1A1A2E',
    secondaryColor: '#FF6B6B',
  },
  'nature-seeker': {
    id: 'nature-seeker',
    name: 'Nature Seeker',
    nameKo: '자연 추구자',
    emoji: '🌿',
    description: 'Finds peace in mountains, forests, and natural wonders',
    descriptionKo: '산, 숲, 자연의 경이로움에서 평화를 찾는 영혼',
    keywords: ['peaceful', 'grounded', 'mindful', 'organic'],
    keywordsKo: ['평화로움', '안정감', '명상적', '자연친화'],
    primaryColor: '#2D5016',
    secondaryColor: '#A8E6CF',
  },
  'culture-lover': {
    id: 'culture-lover',
    name: 'Culture Lover',
    nameKo: '문화 애호가',
    emoji: '🎭',
    description: 'Seeks museums, history, and artistic experiences',
    descriptionKo: '박물관, 역사, 예술적 경험을 추구하는 지성인',
    keywords: ['intellectual', 'artistic', 'curious', 'thoughtful'],
    keywordsKo: ['지적', '예술적', '탐구심', '사려깊음'],
    primaryColor: '#8B4513',
    secondaryColor: '#FFF8DC',
  },
  'beach-soul': {
    id: 'beach-soul',
    name: 'Beach Soul',
    nameKo: '해변 영혼',
    emoji: '🏖️',
    description: 'Lives for sun, sand, and ocean vibes',
    descriptionKo: '태양, 모래, 바다의 자유로운 영혼',
    keywords: ['relaxed', 'carefree', 'sunny', 'free-spirited'],
    keywordsKo: ['여유로움', '자유분방', '밝음', '긍정적'],
    primaryColor: '#00CED1',
    secondaryColor: '#FFEAA7',
  },
  'adventure-spirit': {
    id: 'adventure-spirit',
    name: 'Adventure Spirit',
    nameKo: '모험 정신',
    emoji: '🗻',
    description: 'Chases thrills and unique experiences',
    descriptionKo: '스릴과 특별한 경험을 쫓는 모험가',
    keywords: ['bold', 'adventurous', 'fearless', 'spontaneous'],
    keywordsKo: ['대담함', '모험심', '두려움없음', '즉흥적'],
    primaryColor: '#E74C3C',
    secondaryColor: '#2C3E50',
  },
  'foodie-wanderer': {
    id: 'foodie-wanderer',
    name: 'Foodie Wanderer',
    nameKo: '미식 방랑자',
    emoji: '🍜',
    description: 'Travels for culinary experiences and local flavors',
    descriptionKo: '맛있는 음식과 현지의 맛을 찾아 떠나는 미식가',
    keywords: ['sensory', 'curious', 'social', 'experimental'],
    keywordsKo: ['감각적', '호기심', '사교적', '실험적'],
    primaryColor: '#D35400',
    secondaryColor: '#FDEBD0',
  },
  'minimalist': {
    id: 'minimalist',
    name: 'Minimalist',
    nameKo: '미니멀리스트',
    emoji: '◻️',
    description: 'Appreciates clean design and simple pleasures',
    descriptionKo: '깔끔한 디자인과 단순한 즐거움을 추구',
    keywords: ['simple', 'intentional', 'calm', 'focused'],
    keywordsKo: ['단순함', '의도적', '차분함', '집중력'],
    primaryColor: '#FFFFFF',
    secondaryColor: '#171717',
  },
  'romantic-dreamer': {
    id: 'romantic-dreamer',
    name: 'Romantic Dreamer',
    nameKo: '로맨틱 드리머',
    emoji: '💫',
    description: 'Seeks magical moments and picturesque views',
    descriptionKo: '마법같은 순간과 그림같은 풍경을 꿈꾸는 낭만가',
    keywords: ['dreamy', 'romantic', 'whimsical', 'sentimental'],
    keywordsKo: ['몽환적', '낭만적', '감성적', '서정적'],
    primaryColor: '#9B59B6',
    secondaryColor: '#FADBD8',
  },
};

// ============================================
// Analysis Result
// ============================================

export interface VibeAnalysis {
  primary: VibeArchetype;
  secondary: VibeArchetype;
  confidence: number;
  traits: string[];
  colorPalette: string[];
  description: string;
  koreanDescription: string;
}

// ============================================
// Destination
// ============================================

export interface Destination {
  city: string;
  cityKo: string;
  country: string;
  countryKo: string;
  matchScore: number;
  image: string;
  reason: string;
  reasonKo: string;
  priceFrom: number;
  currency: string;
  vibeMatch: VibeArchetype[];
  highlights: string[];
  highlightsKo: string[];
}

// ============================================
// API Response
// ============================================

export interface VibeAnalyzeResponse {
  success: boolean;
  analysis?: VibeAnalysis;
  destinations?: Destination[];
  error?: string;
}
