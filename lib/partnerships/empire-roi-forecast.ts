/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * EMPIRE ROI FORECAST v1.0
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 26: Real-time ROI Forecasting Based on Live Data
 *
 * 실물 경제 데이터 기반 수익 예측 시스템
 * - KEPCO SMP 기반 에너지 거래 수익
 * - Tesla V2G 기반 차량 수익
 * - DEX 유동성 풀 수익
 * - TVL 기반 스테이킹 수익
 */

import {
  getLiveSMP,
  getLiveTeslaData,
  getLiveExchangeData,
  getLiveTVL,
  type LiveSMPData,
  type LiveTeslaData,
  type LiveExchangeData,
  type LiveTVLData,
} from './live-data-service';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ROIForecast {
  timestamp: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';

  // Revenue Streams
  energyTrading: {
    revenue: number;
    basis: string;
    confidence: number;
  };
  teslaV2G: {
    revenue: number;
    basis: string;
    confidence: number;
  };
  liquidityPool: {
    revenue: number;
    basis: string;
    confidence: number;
  };
  staking: {
    revenue: number;
    basis: string;
    confidence: number;
  };

  // Totals
  totalRevenue: number;
  totalROI: number; // Percentage
  tvlBasis: number;

  // Data Quality
  dataQuality: {
    liveDataPercentage: number;
    verifiedSources: string[];
    lastUpdate: string;
  };
}

export interface EmpireStats {
  timestamp: string;
  totalAssets: number;
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  yearlyProjection: number;
  roi30Day: number;
  roi365Day: number;
  verifiedByAPI: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROI CALCULATION PARAMETERS
// ═══════════════════════════════════════════════════════════════════════════════

const ROI_PARAMS = {
  // Energy Trading (KEPCO)
  ENERGY_TRADE_MARGIN: 0.08, // 8% margin on SMP arbitrage
  DAILY_ENERGY_VOLUME_KWH: 50000, // Daily energy volume

  // Tesla V2G
  V2G_HOURLY_RATE: 5.5, // USD per vehicle per hour
  V2G_HOURS_PER_DAY: 6, // Average V2G hours per vehicle

  // Liquidity Pool (DEX)
  LP_APY: 0.12, // 12% annual LP yield

  // Staking
  STAKING_APY: 0.15, // 15% annual staking yield
};

// ═══════════════════════════════════════════════════════════════════════════════
// FORECAST ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export async function calculateROIForecast(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily'): Promise<ROIForecast> {
  // Fetch all live data
  const [smp, tesla, exchange, tvl] = await Promise.all([
    getLiveSMP(),
    getLiveTeslaData(),
    getLiveExchangeData(),
    getLiveTVL(),
  ]);

  const multiplier = getPeriodMultiplier(period);

  // Calculate Energy Trading Revenue
  const energyRevenue = calculateEnergyRevenue(smp, multiplier);

  // Calculate Tesla V2G Revenue
  const v2gRevenue = calculateV2GRevenue(tesla, multiplier);

  // Calculate LP Revenue
  const lpRevenue = calculateLPRevenue(tvl, multiplier);

  // Calculate Staking Revenue
  const stakingRevenue = calculateStakingRevenue(tvl, multiplier);

  // Total calculations
  const totalRevenue = energyRevenue.revenue + v2gRevenue.revenue + lpRevenue.revenue + stakingRevenue.revenue;
  const totalROI = tvl.totalTVL > 0 ? (totalRevenue / tvl.totalTVL) * 100 : 0;

  // Data quality assessment
  const liveSources = [smp, tesla, exchange, tvl].filter(d => d.isLive);
  const verifiedSources = liveSources.map(d => d.source);

  return {
    timestamp: new Date().toISOString(),
    period,
    energyTrading: energyRevenue,
    teslaV2G: v2gRevenue,
    liquidityPool: lpRevenue,
    staking: stakingRevenue,
    totalRevenue,
    totalROI,
    tvlBasis: tvl.totalTVL,
    dataQuality: {
      liveDataPercentage: (liveSources.length / 4) * 100,
      verifiedSources,
      lastUpdate: new Date().toISOString(),
    },
  };
}

export async function getEmpireStats(): Promise<EmpireStats> {
  const [daily, weekly, monthly, yearly] = await Promise.all([
    calculateROIForecast('daily'),
    calculateROIForecast('weekly'),
    calculateROIForecast('monthly'),
    calculateROIForecast('yearly'),
  ]);

  const tvl = await getLiveTVL();

  return {
    timestamp: new Date().toISOString(),
    totalAssets: tvl.totalTVL,
    dailyRevenue: daily.totalRevenue,
    weeklyRevenue: weekly.totalRevenue,
    monthlyRevenue: monthly.totalRevenue,
    yearlyProjection: yearly.totalRevenue,
    roi30Day: monthly.totalROI,
    roi365Day: yearly.totalROI,
    verifiedByAPI: daily.dataQuality.liveDataPercentage >= 75,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function getPeriodMultiplier(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): number {
  switch (period) {
    case 'daily': return 1;
    case 'weekly': return 7;
    case 'monthly': return 30;
    case 'yearly': return 365;
  }
}

function calculateEnergyRevenue(smp: LiveSMPData, multiplier: number) {
  // Revenue = (SMP Price * Volume * Margin) * Period
  const dailyRevenue = smp.price > 0
    ? (smp.priceUSD * ROI_PARAMS.DAILY_ENERGY_VOLUME_KWH * ROI_PARAMS.ENERGY_TRADE_MARGIN)
    : 0;

  return {
    revenue: dailyRevenue * multiplier,
    basis: smp.isLive
      ? `Live SMP: ₩${smp.price}/kWh from ${smp.source}`
      : 'Awaiting KPX API connection',
    confidence: smp.isLive ? 95 : 0,
  };
}

function calculateV2GRevenue(tesla: LiveTeslaData, multiplier: number) {
  // Revenue = Vehicles * Hourly Rate * Hours * Period
  const dailyRevenue = tesla.totalVehicles > 0
    ? (tesla.totalVehicles * ROI_PARAMS.V2G_HOURLY_RATE * ROI_PARAMS.V2G_HOURS_PER_DAY)
    : 0;

  return {
    revenue: dailyRevenue * multiplier,
    basis: tesla.isLive
      ? `Live Fleet: ${tesla.totalVehicles} vehicles from ${tesla.source}`
      : 'Awaiting Tesla Fleet API connection',
    confidence: tesla.isLive ? 90 : 0,
  };
}

function calculateLPRevenue(tvl: LiveTVLData, multiplier: number) {
  // Revenue = LP TVL * APY / 365 * Period
  const liquidityTVL = tvl.breakdown.liquidity;
  const dailyRevenue = liquidityTVL > 0
    ? (liquidityTVL * ROI_PARAMS.LP_APY / 365)
    : 0;

  return {
    revenue: dailyRevenue * multiplier,
    basis: tvl.isLive
      ? `On-chain LP: $${liquidityTVL.toLocaleString()} from ${tvl.source}`
      : 'Awaiting Alchemy API connection',
    confidence: tvl.isLive ? 85 : 0,
  };
}

function calculateStakingRevenue(tvl: LiveTVLData, multiplier: number) {
  // Revenue = Staking TVL * APY / 365 * Period
  const stakingTVL = tvl.breakdown.staking;
  const dailyRevenue = stakingTVL > 0
    ? (stakingTVL * ROI_PARAMS.STAKING_APY / 365)
    : 0;

  return {
    revenue: dailyRevenue * multiplier,
    basis: tvl.isLive
      ? `On-chain Staking: $${stakingTVL.toLocaleString()} from ${tvl.source}`
      : 'Awaiting Alchemy API connection',
    confidence: tvl.isLive ? 85 : 0,
  };
}
