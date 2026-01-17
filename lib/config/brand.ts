/**
 * NOMAD - Global Travel Subscription Service
 * Brand Configuration
 */

export const BRAND = {
  name: 'NOMAD',
  tagline: 'One subscription. Travel anywhere.',
  taglineKo: '하나의 구독으로, 전 세계 어디든.',
  description: 'Global eSIM + AI Travel Concierge + Hotel & Flight Deals in one subscription',

  // URLs
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://nomad.travel',

  // Social
  social: {
    twitter: '@nomadtravel',
    instagram: '@nomad.travel',
    tiktok: '@nomadtravel',
  },

  // Contact
  support: {
    email: 'support@nomad.travel',
    emergency: '+1-800-NOMAD-00',
  },

  // Colors
  colors: {
    primary: '#6366F1', // Indigo
    secondary: '#8B5CF6', // Violet
    accent: '#06B6D4', // Cyan
    success: '#10B981', // Emerald
    warning: '#F59E0B', // Amber
    error: '#EF4444', // Red
  },

  // Gradients
  gradients: {
    primary: 'from-indigo-500 to-violet-600',
    secondary: 'from-violet-500 to-purple-600',
    accent: 'from-cyan-500 to-blue-600',
    hero: 'from-indigo-600 via-violet-600 to-purple-700',
  },
} as const;

export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceYearly: 0,
    priceId: null,
    priceIdYearly: null,
    features: {
      aiChats: 5,
      esimData: 0,
      hotelDiscount: 0,
      offlineAccess: false,
      prioritySupport: false,
      concierge: false,
    },
    description: 'Try NOMAD with limited features',
    popular: false,
  },
  explorer: {
    id: 'explorer',
    name: 'Explorer',
    price: 14.99,
    priceYearly: 149.99,
    priceId: process.env.STRIPE_PRICE_EXPLORER_MONTHLY,
    priceIdYearly: process.env.STRIPE_PRICE_EXPLORER_YEARLY,
    features: {
      aiChats: -1, // unlimited
      esimData: 3, // GB per month
      hotelDiscount: 0,
      offlineAccess: true,
      prioritySupport: false,
      concierge: false,
    },
    description: 'Perfect for occasional travelers',
    popular: false,
  },
  traveler: {
    id: 'traveler',
    name: 'Traveler',
    price: 29.99,
    priceYearly: 299.99,
    priceId: process.env.STRIPE_PRICE_TRAVELER_MONTHLY,
    priceIdYearly: process.env.STRIPE_PRICE_TRAVELER_YEARLY,
    features: {
      aiChats: -1,
      esimData: 10, // GB per month
      hotelDiscount: 10, // percent
      offlineAccess: true,
      prioritySupport: true,
      concierge: false,
      loungeDiscount: 20,
    },
    description: 'Most popular for frequent travelers',
    popular: true,
  },
  nomad: {
    id: 'nomad',
    name: 'Nomad',
    price: 49.99,
    priceYearly: 499.99,
    priceId: process.env.STRIPE_PRICE_NOMAD_MONTHLY,
    priceIdYearly: process.env.STRIPE_PRICE_NOMAD_YEARLY,
    features: {
      aiChats: -1,
      esimData: -1, // unlimited
      hotelDiscount: 5, // cashback
      offlineAccess: true,
      prioritySupport: true,
      concierge: true,
      loungeAccess: 2, // times per month
      emergencySupport: true,
    },
    description: 'For digital nomads & long-term travelers',
    popular: false,
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 99.99,
    priceYearly: 999.99,
    priceId: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
    priceIdYearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY,
    features: {
      aiChats: -1,
      esimData: -1,
      hotelDiscount: 5,
      offlineAccess: true,
      prioritySupport: true,
      concierge: true,
      loungeAccess: -1, // unlimited
      emergencySupport: true,
      teamMembers: 5,
      expenseReports: true,
      apiAccess: true,
    },
    description: 'For teams & business travelers',
    popular: false,
  },
} as const;

export type PlanId = keyof typeof SUBSCRIPTION_PLANS;

export const ESIM_REGIONS = [
  { id: 'global', name: 'Global', countries: 190, flag: '🌍' },
  { id: 'asia', name: 'Asia Pacific', countries: 30, flag: '🌏' },
  { id: 'europe', name: 'Europe', countries: 45, flag: '🇪🇺' },
  { id: 'americas', name: 'Americas', countries: 35, flag: '🌎' },
] as const;

export const SUPPORTED_COUNTRIES = [
  // Asia
  { code: 'KR', name: 'South Korea', nameLocal: '한국', region: 'asia' },
  { code: 'JP', name: 'Japan', nameLocal: '日本', region: 'asia' },
  { code: 'CN', name: 'China', nameLocal: '中国', region: 'asia' },
  { code: 'TH', name: 'Thailand', nameLocal: 'ประเทศไทย', region: 'asia' },
  { code: 'VN', name: 'Vietnam', nameLocal: 'Việt Nam', region: 'asia' },
  { code: 'SG', name: 'Singapore', nameLocal: 'Singapore', region: 'asia' },
  { code: 'MY', name: 'Malaysia', nameLocal: 'Malaysia', region: 'asia' },
  { code: 'ID', name: 'Indonesia', nameLocal: 'Indonesia', region: 'asia' },
  { code: 'PH', name: 'Philippines', nameLocal: 'Pilipinas', region: 'asia' },
  { code: 'TW', name: 'Taiwan', nameLocal: '台灣', region: 'asia' },
  { code: 'HK', name: 'Hong Kong', nameLocal: '香港', region: 'asia' },
  { code: 'IN', name: 'India', nameLocal: 'भारत', region: 'asia' },

  // Europe
  { code: 'FR', name: 'France', nameLocal: 'France', region: 'europe' },
  { code: 'DE', name: 'Germany', nameLocal: 'Deutschland', region: 'europe' },
  { code: 'IT', name: 'Italy', nameLocal: 'Italia', region: 'europe' },
  { code: 'ES', name: 'Spain', nameLocal: 'España', region: 'europe' },
  { code: 'GB', name: 'United Kingdom', nameLocal: 'UK', region: 'europe' },
  { code: 'NL', name: 'Netherlands', nameLocal: 'Nederland', region: 'europe' },
  { code: 'PT', name: 'Portugal', nameLocal: 'Portugal', region: 'europe' },
  { code: 'CH', name: 'Switzerland', nameLocal: 'Schweiz', region: 'europe' },
  { code: 'AT', name: 'Austria', nameLocal: 'Österreich', region: 'europe' },
  { code: 'BE', name: 'Belgium', nameLocal: 'België', region: 'europe' },
  { code: 'GR', name: 'Greece', nameLocal: 'Ελλάδα', region: 'europe' },
  { code: 'CZ', name: 'Czech Republic', nameLocal: 'Česko', region: 'europe' },

  // Americas
  { code: 'US', name: 'United States', nameLocal: 'USA', region: 'americas' },
  { code: 'CA', name: 'Canada', nameLocal: 'Canada', region: 'americas' },
  { code: 'MX', name: 'Mexico', nameLocal: 'México', region: 'americas' },
  { code: 'BR', name: 'Brazil', nameLocal: 'Brasil', region: 'americas' },
  { code: 'AR', name: 'Argentina', nameLocal: 'Argentina', region: 'americas' },
  { code: 'CL', name: 'Chile', nameLocal: 'Chile', region: 'americas' },
  { code: 'CO', name: 'Colombia', nameLocal: 'Colombia', region: 'americas' },
  { code: 'PE', name: 'Peru', nameLocal: 'Perú', region: 'americas' },

  // Oceania
  { code: 'AU', name: 'Australia', nameLocal: 'Australia', region: 'asia' },
  { code: 'NZ', name: 'New Zealand', nameLocal: 'New Zealand', region: 'asia' },
] as const;
