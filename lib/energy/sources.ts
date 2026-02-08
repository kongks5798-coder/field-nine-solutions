/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 46: MULTI-ENERGY BROKERAGE - SOURCE DEFINITIONS
 * ═══════════════════════════════════════════════════════════════════════════════
 * Wind, Thermal, Solar, Hydro, Nuclear - 모든 에너지원의 통합 스키마
 * "제국은 모든 에너지를 중개한다"
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ENERGY SOURCE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type EnergySourceType =
  | 'SOLAR'
  | 'WIND'
  | 'THERMAL'
  | 'HYDRO'
  | 'NUCLEAR'
  | 'BIOMASS';

export type EnergyTradeStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'SOLD'
  | 'PENDING';

// ═══════════════════════════════════════════════════════════════════════════════
// BASE ENERGY SOURCE SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export interface EnergySource {
  id: string;                    // Unique API ID (e.g., "F9-SOLAR-001")
  type: EnergySourceType;
  name: string;
  nameKo: string;
  location: {
    country: string;
    region: string;
    coordinates: { lat: number; lng: number };
  };
  capacity: {
    installed: number;           // MW
    current: number;             // Current output MW
    efficiency: number;          // 0-1 percentage
  };
  pricing: {
    basePrice: number;           // KRW per kWh
    currentSMP: number;          // System Marginal Price
    kausPrice: number;           // KAUS per kWh
    priceChange24h: number;      // % change
  };
  certification: {
    re100Certified: boolean;
    esgRating: 'A+' | 'A' | 'B+' | 'B' | 'C';
    carbonIntensity: number;     // gCO2/kWh
    originCertificate: boolean;
  };
  availability: {
    status: EnergyTradeStatus;
    availableKWh: number;
    reservedKWh: number;
    nextAvailable: string;       // ISO timestamp
  };
  metadata: {
    icon: string;
    color: string;
    gradientFrom: string;
    gradientTo: string;
  };
  lastUpdated: string;
  isLive: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENERGY SOURCE REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

export const ENERGY_SOURCES: Record<string, EnergySource> = {
  'F9-SOLAR-001': {
    id: 'F9-SOLAR-001',
    type: 'SOLAR',
    name: 'Yeongdong Solar Farm',
    nameKo: '영동 태양광 발전단지',
    location: {
      country: 'KR',
      region: '강원도 영동',
      coordinates: { lat: 37.4292, lng: 128.6561 },
    },
    capacity: {
      installed: 50,
      current: 0,
      efficiency: 0.21,
    },
    pricing: {
      basePrice: 120,
      currentSMP: 130,
      kausPrice: 1.08,
      priceChange24h: 2.5,
    },
    certification: {
      re100Certified: true,
      esgRating: 'A+',
      carbonIntensity: 0,
      originCertificate: true,
    },
    availability: {
      status: 'AVAILABLE',
      availableKWh: 250000,
      reservedKWh: 50000,
      nextAvailable: new Date().toISOString(),
    },
    metadata: {
      icon: '☀️',
      color: '#f59e0b',
      gradientFrom: '#f59e0b',
      gradientTo: '#ea580c',
    },
    lastUpdated: new Date().toISOString(),
    isLive: true,
  },
  'F9-WIND-001': {
    id: 'F9-WIND-001',
    type: 'WIND',
    name: 'Jeju Offshore Wind',
    nameKo: '제주 해상 풍력단지',
    location: {
      country: 'KR',
      region: '제주도 서귀포',
      coordinates: { lat: 33.2541, lng: 126.5601 },
    },
    capacity: {
      installed: 100,
      current: 0,
      efficiency: 0.35,
    },
    pricing: {
      basePrice: 95,
      currentSMP: 105,
      kausPrice: 0.875,
      priceChange24h: -1.2,
    },
    certification: {
      re100Certified: true,
      esgRating: 'A+',
      carbonIntensity: 0,
      originCertificate: true,
    },
    availability: {
      status: 'AVAILABLE',
      availableKWh: 800000,
      reservedKWh: 120000,
      nextAvailable: new Date().toISOString(),
    },
    metadata: {
      icon: '💨',
      color: '#06b6d4',
      gradientFrom: '#06b6d4',
      gradientTo: '#0284c7',
    },
    lastUpdated: new Date().toISOString(),
    isLive: true,
  },
  'F9-THERMAL-001': {
    id: 'F9-THERMAL-001',
    type: 'THERMAL',
    name: 'Dangjin LNG Power',
    nameKo: '당진 LNG 복합화력',
    location: {
      country: 'KR',
      region: '충남 당진',
      coordinates: { lat: 36.9312, lng: 126.6323 },
    },
    capacity: {
      installed: 500,
      current: 0,
      efficiency: 0.58,
    },
    pricing: {
      basePrice: 140,
      currentSMP: 155,
      kausPrice: 1.29,
      priceChange24h: 3.8,
    },
    certification: {
      re100Certified: false,
      esgRating: 'B+',
      carbonIntensity: 450,
      originCertificate: true,
    },
    availability: {
      status: 'AVAILABLE',
      availableKWh: 2000000,
      reservedKWh: 500000,
      nextAvailable: new Date().toISOString(),
    },
    metadata: {
      icon: '🔥',
      color: '#ef4444',
      gradientFrom: '#ef4444',
      gradientTo: '#dc2626',
    },
    lastUpdated: new Date().toISOString(),
    isLive: true,
  },
  'F9-HYDRO-001': {
    id: 'F9-HYDRO-001',
    type: 'HYDRO',
    name: 'Chungju Hydro Dam',
    nameKo: '충주 수력발전소',
    location: {
      country: 'KR',
      region: '충북 충주',
      coordinates: { lat: 36.9911, lng: 127.9527 },
    },
    capacity: {
      installed: 412,
      current: 0,
      efficiency: 0.90,
    },
    pricing: {
      basePrice: 75,
      currentSMP: 82,
      kausPrice: 0.683,
      priceChange24h: 0.5,
    },
    certification: {
      re100Certified: true,
      esgRating: 'A',
      carbonIntensity: 4,
      originCertificate: true,
    },
    availability: {
      status: 'AVAILABLE',
      availableKWh: 1500000,
      reservedKWh: 300000,
      nextAvailable: new Date().toISOString(),
    },
    metadata: {
      icon: '💧',
      color: '#3b82f6',
      gradientFrom: '#3b82f6',
      gradientTo: '#2563eb',
    },
    lastUpdated: new Date().toISOString(),
    isLive: true,
  },
  'F9-NUCLEAR-001': {
    id: 'F9-NUCLEAR-001',
    type: 'NUCLEAR',
    name: 'Hanul Nuclear Plant',
    nameKo: '한울 원자력발전소',
    location: {
      country: 'KR',
      region: '경북 울진',
      coordinates: { lat: 37.0927, lng: 129.3834 },
    },
    capacity: {
      installed: 5900,
      current: 0,
      efficiency: 0.92,
    },
    pricing: {
      basePrice: 60,
      currentSMP: 65,
      kausPrice: 0.542,
      priceChange24h: 0.0,
    },
    certification: {
      re100Certified: false,
      esgRating: 'B',
      carbonIntensity: 12,
      originCertificate: true,
    },
    availability: {
      status: 'AVAILABLE',
      availableKWh: 10000000,
      reservedKWh: 2000000,
      nextAvailable: new Date().toISOString(),
    },
    metadata: {
      icon: '⚛️',
      color: '#a855f7',
      gradientFrom: '#a855f7',
      gradientTo: '#9333ea',
    },
    lastUpdated: new Date().toISOString(),
    isLive: true,
  },
  'F9-BIOMASS-001': {
    id: 'F9-BIOMASS-001',
    type: 'BIOMASS',
    name: 'Hwaseong Bio Power',
    nameKo: '화성 바이오매스 발전소',
    location: {
      country: 'KR',
      region: '경기 화성',
      coordinates: { lat: 37.1994, lng: 126.8312 },
    },
    capacity: {
      installed: 30,
      current: 0,
      efficiency: 0.25,
    },
    pricing: {
      basePrice: 110,
      currentSMP: 118,
      kausPrice: 0.983,
      priceChange24h: 1.2,
    },
    certification: {
      re100Certified: true,
      esgRating: 'A',
      carbonIntensity: 50,
      originCertificate: true,
    },
    availability: {
      status: 'AVAILABLE',
      availableKWh: 150000,
      reservedKWh: 30000,
      nextAvailable: new Date().toISOString(),
    },
    metadata: {
      icon: '🌱',
      color: '#22c55e',
      gradientFrom: '#22c55e',
      gradientTo: '#16a34a',
    },
    lastUpdated: new Date().toISOString(),
    isLive: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// REAL-TIME PRICE FEED
// ═══════════════════════════════════════════════════════════════════════════════

const CACHE_TTL = 30000; // 30 seconds
let cachedPrices: Map<string, { price: number; timestamp: number }> = new Map();

export function getSourceCurrentPrice(sourceId: string): number {
  const source = ENERGY_SOURCES[sourceId];
  if (!source) return 0;

  const cached = cachedPrices.get(sourceId);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.price;
  }

  // Calculate dynamic price based on time, demand, and source type
  const hour = new Date().getHours();
  const isPeakHour = (hour >= 10 && hour <= 12) || (hour >= 18 && hour <= 21);

  let volatility = 0;
  switch (source.type) {
    case 'SOLAR':
      // Solar: higher during daytime
      volatility = hour >= 6 && hour <= 18 ? 0.1 : -0.15;
      break;
    case 'WIND':
      // Wind: random fluctuation
      volatility = (Math.random() - 0.5) * 0.2;
      break;
    case 'THERMAL':
      // Thermal: follows demand closely
      volatility = isPeakHour ? 0.15 : -0.05;
      break;
    case 'HYDRO':
      // Hydro: very stable
      volatility = (Math.random() - 0.5) * 0.05;
      break;
    case 'NUCLEAR':
      // Nuclear: most stable
      volatility = (Math.random() - 0.5) * 0.02;
      break;
    case 'BIOMASS':
      // Biomass: moderate fluctuation
      volatility = (Math.random() - 0.5) * 0.1;
      break;
  }

  const price = source.pricing.basePrice * (1 + volatility);
  cachedPrices.set(sourceId, { price, timestamp: now });

  return Math.round(price * 100) / 100;
}

export function getAllSourcePrices(): Record<string, number> {
  const prices: Record<string, number> = {};
  for (const sourceId of Object.keys(ENERGY_SOURCES)) {
    prices[sourceId] = getSourceCurrentPrice(sourceId);
  }
  return prices;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENERGY MIX CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface EnergyMix {
  type: EnergySourceType;
  percentage: number;
  totalKWh: number;
  color: string;
  icon: string;
}

export function calculateEnergyMix(): EnergyMix[] {
  const sources = Object.values(ENERGY_SOURCES);
  const totalReserved = sources.reduce((sum, s) => sum + s.availability.reservedKWh, 0);

  if (totalReserved === 0) {
    // Return simulated mix for demo
    return [
      { type: 'SOLAR', percentage: 25, totalKWh: 250000, color: '#f59e0b', icon: '☀️' },
      { type: 'WIND', percentage: 30, totalKWh: 300000, color: '#06b6d4', icon: '💨' },
      { type: 'THERMAL', percentage: 15, totalKWh: 150000, color: '#ef4444', icon: '🔥' },
      { type: 'HYDRO', percentage: 15, totalKWh: 150000, color: '#3b82f6', icon: '💧' },
      { type: 'NUCLEAR', percentage: 12, totalKWh: 120000, color: '#a855f7', icon: '⚛️' },
      { type: 'BIOMASS', percentage: 3, totalKWh: 30000, color: '#22c55e', icon: '🌱' },
    ];
  }

  const mixByType = new Map<EnergySourceType, number>();

  for (const source of sources) {
    const current = mixByType.get(source.type) || 0;
    mixByType.set(source.type, current + source.availability.reservedKWh);
  }

  const result: EnergyMix[] = [];

  for (const [type, kWh] of mixByType) {
    const source = sources.find(s => s.type === type);
    if (source) {
      result.push({
        type,
        percentage: Math.round((kWh / totalReserved) * 100),
        totalKWh: kWh,
        color: source.metadata.color,
        icon: source.metadata.icon,
      });
    }
  }

  return result.sort((a, b) => b.percentage - a.percentage);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORIGIN CERTIFICATE
// ═══════════════════════════════════════════════════════════════════════════════

export interface OriginCertificate {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceType: EnergySourceType;
  purchaseAmount: number;      // kWh
  purchasePrice: number;       // Total KAUS
  carbonOffset: number;        // kg CO2 avoided
  issuedAt: string;
  validUntil: string;
  qrCode: string;              // Verification QR
  re100Eligible: boolean;
  blockchainTxHash?: string;
}

export function generateOriginCertificate(
  sourceId: string,
  amountKWh: number,
  priceKaus: number
): OriginCertificate {
  const source = ENERGY_SOURCES[sourceId];
  if (!source) {
    throw new Error('Invalid source ID');
  }

  const certId = `F9-CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const carbonOffset = source.certification.carbonIntensity === 0
    ? amountKWh * 0.5 // kg CO2 avoided per kWh (compared to coal)
    : 0;

  const issuedAt = new Date();
  const validUntil = new Date(issuedAt);
  validUntil.setFullYear(validUntil.getFullYear() + 1);

  return {
    id: certId,
    sourceId,
    sourceName: source.name,
    sourceType: source.type,
    purchaseAmount: amountKWh,
    purchasePrice: priceKaus,
    carbonOffset,
    issuedAt: issuedAt.toISOString(),
    validUntil: validUntil.toISOString(),
    qrCode: `https://m.fieldnine.io/verify/${certId}`,
    re100Eligible: source.certification.re100Certified,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORDER BOOK TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface EnergyOrder {
  id: string;
  type: 'BUY' | 'SELL';
  sourceId: string;
  amount: number;              // kWh
  pricePerKWh: number;         // KAUS
  totalPrice: number;          // KAUS
  status: 'PENDING' | 'FILLED' | 'CANCELLED';
  userId: string;
  createdAt: string;
}

export interface OrderBook {
  sourceId: string;
  bids: Array<{ price: number; amount: number; orders: number }>;
  asks: Array<{ price: number; amount: number; orders: number }>;
  lastPrice: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

export function generateOrderBook(sourceId: string): OrderBook {
  const source = ENERGY_SOURCES[sourceId];
  if (!source) {
    throw new Error('Invalid source ID');
  }

  const basePrice = source.pricing.kausPrice;
  const bids: OrderBook['bids'] = [];
  const asks: OrderBook['asks'] = [];

  // Generate bid orders (buy orders)
  for (let i = 0; i < 5; i++) {
    bids.push({
      price: basePrice * (1 - (i + 1) * 0.005),
      amount: Math.floor(10000 + Math.random() * 50000),
      orders: Math.floor(1 + Math.random() * 10),
    });
  }

  // Generate ask orders (sell orders)
  for (let i = 0; i < 5; i++) {
    asks.push({
      price: basePrice * (1 + (i + 1) * 0.005),
      amount: Math.floor(10000 + Math.random() * 50000),
      orders: Math.floor(1 + Math.random() * 10),
    });
  }

  return {
    sourceId,
    bids: bids.sort((a, b) => b.price - a.price),
    asks: asks.sort((a, b) => a.price - b.price),
    lastPrice: basePrice,
    volume24h: source.availability.reservedKWh * 2,
    high24h: basePrice * 1.05,
    low24h: basePrice * 0.95,
  };
}
