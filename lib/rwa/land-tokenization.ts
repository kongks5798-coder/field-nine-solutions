/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 49: YEONGDONG LAND RWA TOKENIZATION
 * ═══════════════════════════════════════════════════════════════════════════════
 * 영동 100,000평 → Digital Tiles로 분할 토큰화
 * "제국은 땅으로 증명한다"
 */

// ============================================
// Constants
// ============================================

export const YEONGDONG_LAND = {
  totalArea: 100000, // 100,000평
  location: '충청북도 영동군',
  coordinates: { lat: 36.1747, lng: 127.7833 },
  solarCapacity: 50, // 50MW
  acquisitionValue: 50000000, // $50M
  currentValue: 150000000, // $150M
  apy: 12.5, // 12.5% annual yield
  pricePerPyeong: 1500, // $1,500 per pyeong
  kausPerPyeong: 16667, // KAUS per pyeong (at $0.09)
};

export const TILE_CONFIG = {
  gridSize: 100, // 100x100 grid = 10,000 tiles
  pyeongPerTile: 10, // 10평 per tile
  minPurchase: 1, // min 1 tile
  maxPurchase: 100, // max 100 tiles per transaction
};

// ============================================
// Types
// ============================================

export interface LandTile {
  id: string;
  gridX: number;
  gridY: number;
  pyeongCount: number;
  status: 'AVAILABLE' | 'OWNED' | 'RESERVED' | 'LOCKED';
  ownerId?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue: number;
  monthlyYield: number;
  solarOutput: number; // kW capacity
}

export interface TileOwnership {
  tileId: string;
  userId: string;
  pyeongCount: number;
  purchasePrice: number;
  purchaseDate: string;
  currentValue: number;
  totalYieldEarned: number;
  monthlyYield: number;
}

export interface LandInvestmentStats {
  totalTiles: number;
  ownedTiles: number;
  availableTiles: number;
  totalInvestors: number;
  totalValueLocked: number;
  avgYieldRate: number;
  totalYieldDistributed: number;
}

export interface DividendProjection {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  currency: 'KAUS' | 'USD' | 'KRW';
}

// ============================================
// Tile Generation
// ============================================

export function generateTileGrid(): LandTile[] {
  const tiles: LandTile[] = [];
  const gridSize = TILE_CONFIG.gridSize;

  // Generate sample ownership pattern (some tiles sold)
  const soldTileIds = new Set<string>();
  for (let i = 0; i < 850; i++) { // 8.5% sold
    const x = Math.floor(Math.random() * gridSize);
    const y = Math.floor(Math.random() * gridSize);
    soldTileIds.add(`${x}-${y}`);
  }

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const tileId = `TILE-${x.toString().padStart(3, '0')}-${y.toString().padStart(3, '0')}`;
      const isSold = soldTileIds.has(`${x}-${y}`);

      // Calculate solar output based on position (center = optimal)
      const distFromCenter = Math.sqrt(Math.pow(x - 50, 2) + Math.pow(y - 50, 2));
      const solarFactor = 1 - (distFromCenter / 70) * 0.3; // 0.7 - 1.0 range
      const solarOutput = 5 * solarFactor; // 5kW per tile at optimal

      tiles.push({
        id: tileId,
        gridX: x,
        gridY: y,
        pyeongCount: TILE_CONFIG.pyeongPerTile,
        status: isSold ? 'OWNED' : 'AVAILABLE',
        ownerId: isSold ? `USER-${Math.random().toString(36).substr(2, 8)}` : undefined,
        purchaseDate: isSold ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        currentValue: YEONGDONG_LAND.pricePerPyeong * TILE_CONFIG.pyeongPerTile,
        monthlyYield: (YEONGDONG_LAND.pricePerPyeong * TILE_CONFIG.pyeongPerTile * YEONGDONG_LAND.apy / 100) / 12,
        solarOutput: solarOutput,
      });
    }
  }

  return tiles;
}

// ============================================
// Investment Functions
// ============================================

export function getTilePrice(tileCount: number): {
  kaus: number;
  usd: number;
  krw: number;
} {
  const pyeongCount = tileCount * TILE_CONFIG.pyeongPerTile;
  const usdPrice = pyeongCount * YEONGDONG_LAND.pricePerPyeong;

  return {
    kaus: Math.ceil(usdPrice / 0.09), // KAUS at $0.09
    usd: usdPrice,
    krw: usdPrice * 1320,
  };
}

export function calculateYield(tileCount: number): DividendProjection {
  const pyeongCount = tileCount * TILE_CONFIG.pyeongPerTile;
  const investmentValue = pyeongCount * YEONGDONG_LAND.pricePerPyeong;
  const yearlyYield = investmentValue * (YEONGDONG_LAND.apy / 100);

  return {
    daily: yearlyYield / 365,
    weekly: yearlyYield / 52,
    monthly: yearlyYield / 12,
    yearly: yearlyYield,
    currency: 'USD',
  };
}

export function calculateYieldInKaus(tileCount: number): DividendProjection {
  const usdYield = calculateYield(tileCount);
  const kausRate = 0.09;

  return {
    daily: usdYield.daily / kausRate,
    weekly: usdYield.weekly / kausRate,
    monthly: usdYield.monthly / kausRate,
    yearly: usdYield.yearly / kausRate,
    currency: 'KAUS',
  };
}

export function getLandStats(): LandInvestmentStats {
  const totalTiles = TILE_CONFIG.gridSize * TILE_CONFIG.gridSize;
  const ownedTiles = 850; // 8.5% sold

  return {
    totalTiles,
    ownedTiles,
    availableTiles: totalTiles - ownedTiles,
    totalInvestors: 127,
    totalValueLocked: ownedTiles * TILE_CONFIG.pyeongPerTile * YEONGDONG_LAND.pricePerPyeong,
    avgYieldRate: YEONGDONG_LAND.apy,
    totalYieldDistributed: 425000, // $425K distributed so far
  };
}

// ============================================
// Dividend Engine
// ============================================

export interface UserDividend {
  userId: string;
  tilesOwned: number;
  pyeongOwned: number;
  investmentValue: number;
  pendingDividend: number;
  claimedDividend: number;
  nextDistribution: string;
  projectedMonthly: number;
  projectedYearly: number;
}

export function getUserDividends(userId: string, tilesOwned: number): UserDividend {
  const pyeongOwned = tilesOwned * TILE_CONFIG.pyeongPerTile;
  const investmentValue = pyeongOwned * YEONGDONG_LAND.pricePerPyeong;
  const yearlyYield = investmentValue * (YEONGDONG_LAND.apy / 100);
  const monthlyYield = yearlyYield / 12;

  // Calculate days since last distribution
  const daysSinceDistribution = Math.floor(Math.random() * 28) + 1;
  const pendingDividend = (yearlyYield / 365) * daysSinceDistribution;

  // Next distribution is 1st of next month
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return {
    userId,
    tilesOwned,
    pyeongOwned,
    investmentValue,
    pendingDividend,
    claimedDividend: monthlyYield * 2.5, // Claimed 2.5 months worth
    nextDistribution: nextMonth.toISOString(),
    projectedMonthly: monthlyYield,
    projectedYearly: yearlyYield,
  };
}

// ============================================
// AI Auto-Pilot Profit Sharing
// ============================================

export interface AutoPilotProfitShare {
  tradingProfit: number;
  userSharePercentage: number;
  userShareAmount: number;
  platformFee: number;
  netUserProfit: number;
  period: string;
}

export function calculateAutoPilotShare(
  totalTradingProfit: number,
  userTilesOwned: number,
  totalTilesOwned: number
): AutoPilotProfitShare {
  // User's share is proportional to their tile ownership
  const userSharePercentage = (userTilesOwned / totalTilesOwned) * 100;
  const userShareAmount = totalTradingProfit * (userSharePercentage / 100);
  const platformFee = userShareAmount * 0.1; // 10% platform fee
  const netUserProfit = userShareAmount - platformFee;

  return {
    tradingProfit: totalTradingProfit,
    userSharePercentage,
    userShareAmount,
    platformFee,
    netUserProfit,
    period: new Date().toISOString().split('T')[0],
  };
}
