/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 46: MULTI-ENERGY BROKERAGE - COMPREHENSIVE SOURCE LOGIC
 * ═══════════════════════════════════════════════════════════════════════════════
 * Wind, Thermal, Solar 에너지원의 실시간 SMP 및 탄소배출권 가중치 계산
 * "제국은 모든 에너지를 중개한다"
 */

import {
  ENERGY_SOURCES,
  EnergySource,
  EnergySourceType,
  getSourceCurrentPrice
} from './sources';

// ═══════════════════════════════════════════════════════════════════════════════
// CARBON CREDIT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 탄소배출권 가중치 (CO2 배출량 기준)
 * - 낮을수록 친환경, 높은 프리미엄
 * - 기준: 석탄 화력 평균 820 gCO2/kWh
 */
export const CARBON_INTENSITY_WEIGHTS: Record<EnergySourceType, number> = {
  SOLAR: 0,      // 0 gCO2/kWh - 100% 친환경
  WIND: 0,       // 0 gCO2/kWh - 100% 친환경
  HYDRO: 4,      // 4 gCO2/kWh - 거의 무배출
  NUCLEAR: 12,   // 12 gCO2/kWh - 매우 낮은 배출
  BIOMASS: 50,   // 50 gCO2/kWh - 탄소 중립 (재생)
  THERMAL: 450,  // 450 gCO2/kWh - LNG 기준 (석탄 대비 50% 감소)
};

/**
 * RE100 인증 프리미엄 계수
 * 탄소 중립 에너지는 RE100 기업에 판매시 프리미엄
 */
export const RE100_PREMIUM_MULTIPLIER = 1.15; // 15% 프리미엄

/**
 * 탄소배출권 가격 (KRW/tCO2)
 * 2026년 1월 한국 탄소배출권 시장 기준
 */
export const CARBON_CREDIT_PRICE_KRW = 35000; // ₩35,000/tCO2

// ═══════════════════════════════════════════════════════════════════════════════
// SMP (SYSTEM MARGINAL PRICE) CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface SMPData {
  basePrice: number;           // 기본 SMP (원/kWh)
  currentPrice: number;        // 현재 SMP
  hourlyFactor: number;        // 시간대별 계수
  demandFactor: number;        // 수요 계수
  seasonalFactor: number;      // 계절 계수
  priceChange24h: number;      // 24시간 변동률 (%)
  forecast: SMPForecast[];     // 향후 24시간 예측
}

export interface SMPForecast {
  hour: number;
  predictedPrice: number;
  confidence: number;
}

/**
 * 실시간 SMP 계산
 * - 시간대별 수요 반영
 * - 에너지원별 변동성 적용
 */
export function calculateDynamicSMP(sourceType: EnergySourceType): SMPData {
  const hour = new Date().getHours();
  const month = new Date().getMonth();

  // 기본 SMP (2026년 1월 한국전력거래소 기준)
  const baseSMP = getBaseSMPBySource(sourceType);

  // 시간대별 계수 (피크: 10-12시, 18-21시)
  const hourlyFactor = calculateHourlyFactor(hour);

  // 계절 계수 (여름/겨울 피크)
  const seasonalFactor = calculateSeasonalFactor(month);

  // 수요 계수 (실시간 변동)
  const demandFactor = 0.95 + Math.random() * 0.1;

  // 최종 SMP 계산
  const currentPrice = Math.round(baseSMP * hourlyFactor * seasonalFactor * demandFactor);

  // 24시간 변동률 시뮬레이션
  const priceChange24h = (Math.random() - 0.5) * 10; // -5% ~ +5%

  // 향후 24시간 예측 생성
  const forecast = generateSMPForecast(baseSMP, hour);

  return {
    basePrice: baseSMP,
    currentPrice,
    hourlyFactor,
    demandFactor,
    seasonalFactor,
    priceChange24h,
    forecast,
  };
}

function getBaseSMPBySource(sourceType: EnergySourceType): number {
  const basePrices: Record<EnergySourceType, number> = {
    NUCLEAR: 60,    // 가장 저렴 (기저부하)
    HYDRO: 75,      // 저렴 (피크 대응)
    WIND: 95,       // 변동성 있음
    BIOMASS: 110,   // 중간
    SOLAR: 120,     // 일간 변동 큼
    THERMAL: 140,   // LNG 연료비 반영
  };
  return basePrices[sourceType];
}

function calculateHourlyFactor(hour: number): number {
  // 심야 (00-06): 저렴
  if (hour >= 0 && hour < 6) return 0.75;

  // 오전 피크 (10-12): 고가
  if (hour >= 10 && hour < 12) return 1.25;

  // 오후 (13-17): 보통
  if (hour >= 13 && hour < 17) return 1.0;

  // 저녁 피크 (18-21): 최고가
  if (hour >= 18 && hour < 21) return 1.35;

  // 그 외: 보통
  return 1.0;
}

function calculateSeasonalFactor(month: number): number {
  // 여름 (6-8): 냉방 수요
  if (month >= 5 && month <= 7) return 1.2;

  // 겨울 (12-2): 난방 수요
  if (month === 11 || month <= 1) return 1.15;

  // 봄/가을: 평상
  return 1.0;
}

function generateSMPForecast(baseSMP: number, currentHour: number): SMPForecast[] {
  const forecast: SMPForecast[] = [];

  for (let i = 0; i < 24; i++) {
    const hour = (currentHour + i) % 24;
    const hourlyFactor = calculateHourlyFactor(hour);
    const volatility = (Math.random() - 0.5) * 0.15;

    forecast.push({
      hour,
      predictedPrice: Math.round(baseSMP * hourlyFactor * (1 + volatility)),
      confidence: 85 - (i * 2), // 시간이 지날수록 신뢰도 감소
    });
  }

  return forecast;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CARBON CREDIT CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface CarbonCreditValue {
  carbonIntensity: number;      // gCO2/kWh
  carbonOffset: number;         // kgCO2 절감
  creditValue: number;          // 탄소배출권 가치 (KRW)
  creditValueKAUS: number;      // K-AUS 가치
  re100Eligible: boolean;       // RE100 적합 여부
  esgScore: number;             // ESG 점수 (0-100)
}

/**
 * 탄소배출권 가치 계산
 * @param sourceType 에너지원 타입
 * @param amountKWh 거래량 (kWh)
 */
export function calculateCarbonCreditValue(
  sourceType: EnergySourceType,
  amountKWh: number
): CarbonCreditValue {
  const carbonIntensity = CARBON_INTENSITY_WEIGHTS[sourceType];

  // 석탄 대비 절감량 (석탄 = 820 gCO2/kWh)
  const baselineEmission = 820; // gCO2/kWh
  const carbonOffsetGrams = (baselineEmission - carbonIntensity) * amountKWh;
  const carbonOffsetKg = carbonOffsetGrams / 1000;

  // 탄소배출권 가치 (tCO2 기준)
  const carbonOffsetTons = carbonOffsetKg / 1000;
  const creditValue = Math.round(carbonOffsetTons * CARBON_CREDIT_PRICE_KRW);

  // KAUS 환산 (1 KAUS = 120 KRW)
  const creditValueKAUS = Math.round(creditValue / 120 * 100) / 100;

  // RE100 적합성 (탄소 배출 0인 에너지원만)
  const re100Eligible = carbonIntensity === 0;

  // ESG 점수 (탄소 배출량 역비례)
  const esgScore = Math.round(100 - (carbonIntensity / baselineEmission * 100));

  return {
    carbonIntensity,
    carbonOffset: carbonOffsetKg,
    creditValue,
    creditValueKAUS,
    re100Eligible,
    esgScore,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENERGY SOURCE REAL-TIME DATA
// ═══════════════════════════════════════════════════════════════════════════════

export interface MultiSourceLiveData {
  sourceId: string;
  sourceType: EnergySourceType;
  sourceName: string;
  sourceNameKo: string;

  // 가격 데이터
  pricing: {
    smpData: SMPData;
    kausPrice: number;
    krwPrice: number;
    priceChange24h: number;
  };

  // 탄소배출권
  carbon: CarbonCreditValue;

  // 공급 상태
  supply: {
    currentOutput: number;        // 현재 출력 (MW)
    availableCapacity: number;    // 가용 용량 (MW)
    utilizationRate: number;      // 가동률 (%)
    reserveMargin: number;        // 예비율 (%)
  };

  // 메타데이터
  metadata: {
    icon: string;
    color: string;
    gradientFrom: string;
    gradientTo: string;
  };

  lastUpdated: string;
  isLive: boolean;
}

/**
 * 모든 에너지원의 실시간 데이터 조회
 */
export function getAllSourcesLiveData(): MultiSourceLiveData[] {
  return Object.values(ENERGY_SOURCES).map(source =>
    getSourceLiveData(source.id)
  );
}

/**
 * 특정 에너지원의 실시간 데이터 조회
 */
export function getSourceLiveData(sourceId: string): MultiSourceLiveData {
  const source = ENERGY_SOURCES[sourceId];
  if (!source) {
    throw new Error(`Invalid source ID: ${sourceId}`);
  }

  const smpData = calculateDynamicSMP(source.type);
  const kausPrice = getSourceCurrentPrice(sourceId) / 120; // KRW to KAUS
  const carbon = calculateCarbonCreditValue(source.type, 1000); // per 1000 kWh

  // 출력 시뮬레이션 (시간 기반)
  const supply = calculateSupplyData(source);

  return {
    sourceId: source.id,
    sourceType: source.type,
    sourceName: source.name,
    sourceNameKo: source.nameKo,
    pricing: {
      smpData,
      kausPrice: Math.round(kausPrice * 1000) / 1000,
      krwPrice: smpData.currentPrice,
      priceChange24h: smpData.priceChange24h,
    },
    carbon,
    supply,
    metadata: source.metadata,
    lastUpdated: new Date().toISOString(),
    isLive: true,
  };
}

function calculateSupplyData(source: EnergySource): MultiSourceLiveData['supply'] {
  const hour = new Date().getHours();
  let utilizationRate = 0.7; // 기본 가동률 70%

  switch (source.type) {
    case 'SOLAR':
      // 주간에만 발전
      utilizationRate = (hour >= 6 && hour <= 18)
        ? Math.sin((hour - 6) / 12 * Math.PI) * 0.9
        : 0;
      break;
    case 'WIND':
      // 풍속에 따른 변동 (랜덤 시뮬레이션)
      utilizationRate = 0.25 + Math.random() * 0.45;
      break;
    case 'THERMAL':
      // 수요에 따른 조절
      utilizationRate = calculateHourlyFactor(hour) * 0.65;
      break;
    case 'HYDRO':
      // 수량에 따른 변동
      utilizationRate = 0.6 + Math.random() * 0.25;
      break;
    case 'NUCLEAR':
      // 기저부하, 안정적
      utilizationRate = 0.9 + Math.random() * 0.05;
      break;
    case 'BIOMASS':
      // 연료 공급에 따른 변동
      utilizationRate = 0.5 + Math.random() * 0.3;
      break;
  }

  const currentOutput = source.capacity.installed * utilizationRate;
  const availableCapacity = source.capacity.installed - currentOutput;
  const reserveMargin = (availableCapacity / source.capacity.installed) * 100;

  return {
    currentOutput: Math.round(currentOutput * 10) / 10,
    availableCapacity: Math.round(availableCapacity * 10) / 10,
    utilizationRate: Math.round(utilizationRate * 100),
    reserveMargin: Math.round(reserveMargin),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENERGY SWAP CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface EnergySwapQuote {
  fromSource: string;
  toSource: string;
  fromAmount: number;        // kWh
  toAmount: number;          // kWh
  exchangeRate: number;      // to/from ratio
  fromPriceKAUS: number;
  toPriceKAUS: number;
  totalCostKAUS: number;
  carbonDelta: number;       // 탄소 배출 변화 (gCO2)
  esgImpact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  slippage: number;          // 예상 슬리피지 (%)
  expiresAt: string;         // 견적 만료 시간
}

/**
 * 에너지 스왑 견적 생성
 * @param fromSourceId 판매할 에너지원
 * @param toSourceId 구매할 에너지원
 * @param amountKWh 스왑 수량 (kWh)
 */
export function getEnergySwapQuote(
  fromSourceId: string,
  toSourceId: string,
  amountKWh: number
): EnergySwapQuote {
  const fromSource = ENERGY_SOURCES[fromSourceId];
  const toSource = ENERGY_SOURCES[toSourceId];

  if (!fromSource || !toSource) {
    throw new Error('Invalid source ID');
  }

  const fromPriceKAUS = getSourceCurrentPrice(fromSourceId) / 120;
  const toPriceKAUS = getSourceCurrentPrice(toSourceId) / 120;

  // 교환 비율 계산
  const exchangeRate = fromPriceKAUS / toPriceKAUS;
  const toAmount = Math.round(amountKWh * exchangeRate);

  // 총 비용 (스프레드 포함)
  const spread = 0.005; // 0.5% 스프레드
  const totalCostKAUS = Math.round((amountKWh * fromPriceKAUS * (1 + spread)) * 100) / 100;

  // 탄소 배출 변화
  const fromCarbon = CARBON_INTENSITY_WEIGHTS[fromSource.type] * amountKWh;
  const toCarbon = CARBON_INTENSITY_WEIGHTS[toSource.type] * toAmount;
  const carbonDelta = toCarbon - fromCarbon;

  // ESG 영향
  let esgImpact: EnergySwapQuote['esgImpact'] = 'NEUTRAL';
  if (carbonDelta < -100) esgImpact = 'POSITIVE';
  else if (carbonDelta > 100) esgImpact = 'NEGATIVE';

  // 슬리피지 (거래량 기반)
  const slippage = Math.min(2, amountKWh / 100000 * 0.5);

  // 견적 만료 (30초)
  const expiresAt = new Date(Date.now() + 30000).toISOString();

  return {
    fromSource: fromSourceId,
    toSource: toSourceId,
    fromAmount: amountKWh,
    toAmount,
    exchangeRate: Math.round(exchangeRate * 1000) / 1000,
    fromPriceKAUS: Math.round(fromPriceKAUS * 1000) / 1000,
    toPriceKAUS: Math.round(toPriceKAUS * 1000) / 1000,
    totalCostKAUS,
    carbonDelta: Math.round(carbonDelta),
    esgImpact,
    slippage: Math.round(slippage * 100) / 100,
    expiresAt,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASSET INTEGRATION - YEONGDONG & CYBERTRUCK V2G
// ═══════════════════════════════════════════════════════════════════════════════

export interface IntegratedAssetData {
  yeongdong: {
    id: string;
    name: string;
    areaPyung: number;
    capacity: number;          // MW
    currentOutput: number;     // MW
    dailyGeneration: number;   // MWh
    monthlyRevenue: number;    // KRW
    carbonOffset: number;      // tCO2
    coordinates: { lat: number; lng: number };
    isConnected: boolean;
  };
  cybertruck: {
    id: string;
    name: string;
    batteryCapacity: number;   // kWh
    currentSoC: number;        // %
    v2gCapacity: number;       // kW
    isV2GActive: boolean;
    dailyV2GRevenue: number;   // KRW
    lifetimeEarnings: number;  // KRW
    isConnected: boolean;
  };
  combined: {
    totalCapacity: number;     // kW
    totalDailyRevenue: number; // KRW
    totalCarbonOffset: number; // tCO2
    synergyBonus: number;      // % 시너지 보너스
  };
}

/**
 * 통합 자산 데이터 조회
 * 영동 100,000평 태양광 + Cybertruck V2G 연동
 */
export function getIntegratedAssetData(): IntegratedAssetData {
  const hour = new Date().getHours();

  // 영동 태양광 발전소 데이터
  const solarUtilization = (hour >= 6 && hour <= 18)
    ? Math.sin((hour - 6) / 12 * Math.PI)
    : 0;

  const yeongdongOutput = 50 * solarUtilization; // 50MW 설비
  const dailyGeneration = 50 * 5.5 * 0.85; // 평균 5.5시간, 85% 효율
  const smpPrice = 130; // 평균 SMP
  const monthlyRevenue = dailyGeneration * 1000 * smpPrice * 30;

  // Cybertruck V2G 데이터
  const cybertruckSoC = 60 + Math.random() * 20; // 60-80% SoC
  const v2gActive = hour >= 18 && hour <= 21; // 저녁 피크에 V2G
  const v2gRevenue = v2gActive ? 15000 : 0; // 피크 시 시간당 수익

  // 시너지 보너스 (태양광 + V2G 통합 운영)
  const synergyBonus = 5; // 5% 추가 수익

  return {
    yeongdong: {
      id: 'F9-SOLAR-001',
      name: 'Yeongdong Solar Farm',
      areaPyung: 100000,
      capacity: 50,
      currentOutput: Math.round(yeongdongOutput * 10) / 10,
      dailyGeneration: Math.round(dailyGeneration),
      monthlyRevenue,
      carbonOffset: Math.round(dailyGeneration * 0.82 * 30) / 1000, // tCO2
      coordinates: { lat: 37.4292, lng: 128.6561 },
      isConnected: true,
    },
    cybertruck: {
      id: 'F9-CYBER-001',
      name: 'Cybertruck Foundation Series',
      batteryCapacity: 123,
      currentSoC: Math.round(cybertruckSoC),
      v2gCapacity: 11.5,
      isV2GActive: v2gActive,
      dailyV2GRevenue: v2gRevenue * 3, // 3시간 피크
      lifetimeEarnings: 2500000, // 누적 수익
      isConnected: true,
    },
    combined: {
      totalCapacity: 50000 + 11.5, // kW
      totalDailyRevenue: Math.round(dailyGeneration * 1000 * smpPrice + v2gRevenue * 3),
      totalCarbonOffset: Math.round(dailyGeneration * 0.82) / 1000,
      synergyBonus,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT ALL
// ═══════════════════════════════════════════════════════════════════════════════

export {
  ENERGY_SOURCES,
  type EnergySource,
  type EnergySourceType,
};
