/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 55: LENDING & BORROWING PROTOCOL
 * ═══════════════════════════════════════════════════════════════════════════════
 * - Supply assets to earn interest
 * - Borrow against collateral
 * - Collateralization ratio management
 * - Liquidation mechanism
 * - Interest rate models
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type AssetType = 'KAUS' | 'ENERGY' | 'CARBON' | 'USDC' | 'ETH';
export type PositionStatus = 'HEALTHY' | 'WARNING' | 'DANGER' | 'LIQUIDATABLE';

export interface LendingMarket {
  id: string;
  asset: AssetType;
  name: string;
  nameKo: string;
  icon: string;
  // Supply side
  totalSupply: number;
  supplyApy: number;
  totalSuppliers: number;
  // Borrow side
  totalBorrow: number;
  borrowApy: number;
  totalBorrowers: number;
  // Utilization
  utilizationRate: number;
  // Collateral settings
  collateralFactor: number; // LTV ratio (e.g., 0.75 = 75%)
  liquidationThreshold: number; // e.g., 0.85 = 85%
  liquidationPenalty: number; // e.g., 0.05 = 5%
  // Prices
  priceKRW: number;
  priceChange24h: number;
  // Status
  isActive: boolean;
  canSupply: boolean;
  canBorrow: boolean;
  canCollateral: boolean;
}

export interface UserSupply {
  id: string;
  asset: AssetType;
  assetName: string;
  assetIcon: string;
  amount: number;
  valueKRW: number;
  apy: number;
  earnedInterest: number;
  isCollateral: boolean;
  suppliedAt: Date;
}

export interface UserBorrow {
  id: string;
  asset: AssetType;
  assetName: string;
  assetIcon: string;
  amount: number;
  valueKRW: number;
  apy: number;
  accruedInterest: number;
  borrowedAt: Date;
}

export interface UserLendingPosition {
  address: string;
  // Supply
  totalSupplyValueKRW: number;
  supplies: UserSupply[];
  totalEarnedInterest: number;
  // Borrow
  totalBorrowValueKRW: number;
  borrows: UserBorrow[];
  totalAccruedInterest: number;
  // Health
  collateralValueKRW: number;
  borrowLimitKRW: number;
  borrowLimitUsed: number; // percentage
  healthFactor: number;
  status: PositionStatus;
  // Net
  netApy: number;
}

export interface LendingStats {
  totalSupplyValueKRW: number;
  totalBorrowValueKRW: number;
  totalMarkets: number;
  activeSuppliers: number;
  activeBorrowers: number;
  averageSupplyApy: number;
  averageBorrowApy: number;
  totalLiquidations24h: number;
}

export interface InterestRateModel {
  baseRate: number;
  multiplier: number;
  jumpMultiplier: number;
  kink: number; // Utilization rate at which jump multiplier kicks in
}

export interface LiquidationEvent {
  id: string;
  borrower: string;
  liquidator: string;
  debtAsset: AssetType;
  collateralAsset: AssetType;
  debtAmount: number;
  collateralSeized: number;
  timestamp: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const ASSET_PRICES: Record<AssetType, number> = {
  KAUS: 120,
  ENERGY: 85,
  CARBON: 32,
  USDC: 1400, // ~$1
  ETH: 4000000, // ~$2857
};

const INTEREST_RATE_MODELS: Record<AssetType, InterestRateModel> = {
  KAUS: { baseRate: 0.02, multiplier: 0.1, jumpMultiplier: 3, kink: 0.8 },
  ENERGY: { baseRate: 0.03, multiplier: 0.12, jumpMultiplier: 2.5, kink: 0.75 },
  CARBON: { baseRate: 0.025, multiplier: 0.08, jumpMultiplier: 2, kink: 0.85 },
  USDC: { baseRate: 0.01, multiplier: 0.05, jumpMultiplier: 4, kink: 0.9 },
  ETH: { baseRate: 0.015, multiplier: 0.08, jumpMultiplier: 3.5, kink: 0.85 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_MARKETS: LendingMarket[] = [
  {
    id: 'market-kaus',
    asset: 'KAUS',
    name: 'KAUS',
    nameKo: 'KAUS 토큰',
    icon: '👑',
    totalSupply: 5000000,
    supplyApy: 8.5,
    totalSuppliers: 1847,
    totalBorrow: 2500000,
    borrowApy: 12.3,
    totalBorrowers: 623,
    utilizationRate: 50,
    collateralFactor: 0.75,
    liquidationThreshold: 0.85,
    liquidationPenalty: 0.05,
    priceKRW: 120,
    priceChange24h: 2.5,
    isActive: true,
    canSupply: true,
    canBorrow: true,
    canCollateral: true,
  },
  {
    id: 'market-energy',
    asset: 'ENERGY',
    name: 'Energy Token',
    nameKo: '에너지 토큰',
    icon: '⚡',
    totalSupply: 3000000,
    supplyApy: 10.2,
    totalSuppliers: 892,
    totalBorrow: 1800000,
    borrowApy: 15.5,
    totalBorrowers: 345,
    utilizationRate: 60,
    collateralFactor: 0.65,
    liquidationThreshold: 0.80,
    liquidationPenalty: 0.08,
    priceKRW: 85,
    priceChange24h: -1.2,
    isActive: true,
    canSupply: true,
    canBorrow: true,
    canCollateral: true,
  },
  {
    id: 'market-carbon',
    asset: 'CARBON',
    name: 'Carbon Credit',
    nameKo: '탄소 크레딧',
    icon: '🌿',
    totalSupply: 8000000,
    supplyApy: 6.8,
    totalSuppliers: 567,
    totalBorrow: 3200000,
    borrowApy: 9.5,
    totalBorrowers: 189,
    utilizationRate: 40,
    collateralFactor: 0.60,
    liquidationThreshold: 0.75,
    liquidationPenalty: 0.10,
    priceKRW: 32,
    priceChange24h: 0.8,
    isActive: true,
    canSupply: true,
    canBorrow: true,
    canCollateral: true,
  },
  {
    id: 'market-usdc',
    asset: 'USDC',
    name: 'USD Coin',
    nameKo: 'USDC 스테이블코인',
    icon: '💵',
    totalSupply: 10000000,
    supplyApy: 5.2,
    totalSuppliers: 2134,
    totalBorrow: 7500000,
    borrowApy: 7.8,
    totalBorrowers: 1256,
    utilizationRate: 75,
    collateralFactor: 0.85,
    liquidationThreshold: 0.90,
    liquidationPenalty: 0.03,
    priceKRW: 1400,
    priceChange24h: 0.0,
    isActive: true,
    canSupply: true,
    canBorrow: true,
    canCollateral: true,
  },
  {
    id: 'market-eth',
    asset: 'ETH',
    name: 'Ethereum',
    nameKo: '이더리움',
    icon: '⟠',
    totalSupply: 500,
    supplyApy: 4.5,
    totalSuppliers: 456,
    totalBorrow: 200,
    borrowApy: 6.8,
    totalBorrowers: 123,
    utilizationRate: 40,
    collateralFactor: 0.80,
    liquidationThreshold: 0.88,
    liquidationPenalty: 0.05,
    priceKRW: 4000000,
    priceChange24h: 3.2,
    isActive: true,
    canSupply: true,
    canBorrow: true,
    canCollateral: true,
  },
];

const MOCK_USER_SUPPLIES: UserSupply[] = [
  {
    id: 'supply-1',
    asset: 'KAUS',
    assetName: 'KAUS 토큰',
    assetIcon: '👑',
    amount: 10000,
    valueKRW: 1200000,
    apy: 8.5,
    earnedInterest: 42.5,
    isCollateral: true,
    suppliedAt: new Date(Date.now() - 86400000 * 30),
  },
  {
    id: 'supply-2',
    asset: 'USDC',
    assetName: 'USDC 스테이블코인',
    assetIcon: '💵',
    amount: 5000,
    valueKRW: 7000000,
    apy: 5.2,
    earnedInterest: 21.7,
    isCollateral: true,
    suppliedAt: new Date(Date.now() - 86400000 * 15),
  },
];

const MOCK_USER_BORROWS: UserBorrow[] = [
  {
    id: 'borrow-1',
    asset: 'ENERGY',
    assetName: '에너지 토큰',
    assetIcon: '⚡',
    amount: 2000,
    valueKRW: 170000,
    apy: 15.5,
    accruedInterest: 12.8,
    borrowedAt: new Date(Date.now() - 86400000 * 10),
  },
];

const MOCK_LIQUIDATIONS: LiquidationEvent[] = [
  {
    id: 'liq-1',
    borrower: '0x1234...5678',
    liquidator: '0xabcd...efgh',
    debtAsset: 'KAUS',
    collateralAsset: 'ETH',
    debtAmount: 5000,
    collateralSeized: 0.15,
    timestamp: new Date(Date.now() - 3600000 * 2),
  },
  {
    id: 'liq-2',
    borrower: '0x9876...5432',
    liquidator: '0xfedc...ba98',
    debtAsset: 'USDC',
    collateralAsset: 'KAUS',
    debtAmount: 3000,
    collateralSeized: 3750,
    timestamp: new Date(Date.now() - 3600000 * 5),
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MARKET FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getMarkets(): LendingMarket[] {
  return [...MOCK_MARKETS].sort((a, b) => b.totalSupply * b.priceKRW - a.totalSupply * a.priceKRW);
}

export function getMarket(asset: AssetType): LendingMarket | null {
  return MOCK_MARKETS.find(m => m.asset === asset) || null;
}

export function getMarketById(id: string): LendingMarket | null {
  return MOCK_MARKETS.find(m => m.id === id) || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTEREST RATE CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function calculateBorrowRate(asset: AssetType, utilizationRate: number): number {
  const model = INTEREST_RATE_MODELS[asset];
  const util = utilizationRate / 100;

  if (util <= model.kink) {
    return (model.baseRate + util * model.multiplier) * 100;
  } else {
    const normalRate = model.baseRate + model.kink * model.multiplier;
    const excessUtil = util - model.kink;
    return (normalRate + excessUtil * model.jumpMultiplier) * 100;
  }
}

export function calculateSupplyRate(asset: AssetType, utilizationRate: number): number {
  const borrowRate = calculateBorrowRate(asset, utilizationRate);
  const util = utilizationRate / 100;
  // Supply rate = Borrow rate * Utilization * (1 - Reserve Factor)
  const reserveFactor = 0.1; // 10% goes to protocol reserves
  return borrowRate * util * (1 - reserveFactor);
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER POSITION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getUserPosition(address: string): UserLendingPosition {
  const supplies = MOCK_USER_SUPPLIES;
  const borrows = MOCK_USER_BORROWS;

  const totalSupplyValueKRW = supplies.reduce((sum, s) => sum + s.valueKRW, 0);
  const totalBorrowValueKRW = borrows.reduce((sum, b) => sum + b.valueKRW, 0);
  const totalEarnedInterest = supplies.reduce((sum, s) => sum + s.earnedInterest * ASSET_PRICES[s.asset], 0);
  const totalAccruedInterest = borrows.reduce((sum, b) => sum + b.accruedInterest * ASSET_PRICES[b.asset], 0);

  // Calculate collateral value (only assets marked as collateral)
  const collateralValueKRW = supplies
    .filter(s => s.isCollateral)
    .reduce((sum, s) => {
      const market = getMarket(s.asset);
      return sum + s.valueKRW * (market?.collateralFactor || 0);
    }, 0);

  const borrowLimitKRW = collateralValueKRW;
  const borrowLimitUsed = borrowLimitKRW > 0 ? (totalBorrowValueKRW / borrowLimitKRW) * 100 : 0;

  // Health factor calculation
  const weightedLiquidationThreshold = supplies
    .filter(s => s.isCollateral)
    .reduce((sum, s) => {
      const market = getMarket(s.asset);
      return sum + s.valueKRW * (market?.liquidationThreshold || 0);
    }, 0);

  const healthFactor = totalBorrowValueKRW > 0
    ? weightedLiquidationThreshold / totalBorrowValueKRW
    : Infinity;

  // Determine status
  let status: PositionStatus = 'HEALTHY';
  if (healthFactor < 1) status = 'LIQUIDATABLE';
  else if (healthFactor < 1.1) status = 'DANGER';
  else if (healthFactor < 1.25) status = 'WARNING';

  // Net APY calculation
  const supplyYield = supplies.reduce((sum, s) => sum + (s.valueKRW * s.apy) / 100, 0);
  const borrowCost = borrows.reduce((sum, b) => sum + (b.valueKRW * b.apy) / 100, 0);
  const netApy = totalSupplyValueKRW > 0
    ? ((supplyYield - borrowCost) / totalSupplyValueKRW) * 100
    : 0;

  return {
    address,
    totalSupplyValueKRW,
    supplies,
    totalEarnedInterest,
    totalBorrowValueKRW,
    borrows,
    totalAccruedInterest,
    collateralValueKRW,
    borrowLimitKRW,
    borrowLimitUsed,
    healthFactor: Math.min(healthFactor, 10),
    status,
    netApy,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPPLY & BORROW ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function supply(asset: AssetType, amount: number): UserSupply | null {
  const market = getMarket(asset);
  if (!market || !market.canSupply || amount <= 0) return null;

  const newSupply: UserSupply = {
    id: `supply-${Date.now()}`,
    asset,
    assetName: market.nameKo,
    assetIcon: market.icon,
    amount,
    valueKRW: amount * market.priceKRW,
    apy: market.supplyApy,
    earnedInterest: 0,
    isCollateral: false,
    suppliedAt: new Date(),
  };

  return newSupply;
}

export function withdraw(supplyId: string, amount: number): boolean {
  const supply = MOCK_USER_SUPPLIES.find(s => s.id === supplyId);
  if (!supply || amount > supply.amount) return false;

  // Check if withdrawal would cause liquidation
  const position = getUserPosition('0xuser');
  const withdrawValueKRW = amount * ASSET_PRICES[supply.asset];
  const market = getMarket(supply.asset);

  if (supply.isCollateral && market) {
    const newCollateralValue = position.collateralValueKRW - withdrawValueKRW * market.collateralFactor;
    if (position.totalBorrowValueKRW > newCollateralValue) {
      return false; // Would cause liquidation
    }
  }

  return true;
}

export function borrow(asset: AssetType, amount: number): UserBorrow | null {
  const market = getMarket(asset);
  if (!market || !market.canBorrow || amount <= 0) return null;

  const position = getUserPosition('0xuser');
  const borrowValueKRW = amount * market.priceKRW;

  // Check if borrow is within limits
  if (position.totalBorrowValueKRW + borrowValueKRW > position.borrowLimitKRW) {
    return null; // Exceeds borrow limit
  }

  const newBorrow: UserBorrow = {
    id: `borrow-${Date.now()}`,
    asset,
    assetName: market.nameKo,
    assetIcon: market.icon,
    amount,
    valueKRW: borrowValueKRW,
    apy: market.borrowApy,
    accruedInterest: 0,
    borrowedAt: new Date(),
  };

  return newBorrow;
}

export function repay(borrowId: string, amount: number): boolean {
  const borrow = MOCK_USER_BORROWS.find(b => b.id === borrowId);
  if (!borrow || amount <= 0) return false;
  return true;
}

export function toggleCollateral(supplyId: string): boolean {
  const supply = MOCK_USER_SUPPLIES.find(s => s.id === supplyId);
  if (!supply) return false;

  // If disabling collateral, check if it would cause issues
  if (supply.isCollateral) {
    const position = getUserPosition('0xuser');
    const market = getMarket(supply.asset);
    if (market) {
      const newCollateralValue = position.collateralValueKRW - supply.valueKRW * market.collateralFactor;
      if (position.totalBorrowValueKRW > newCollateralValue) {
        return false; // Would cause liquidation
      }
    }
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIQUIDATION
// ═══════════════════════════════════════════════════════════════════════════════

export function getLiquidatablePositions(): string[] {
  // In real implementation, this would scan all positions
  return ['0x1234...5678', '0x9876...5432'];
}

export function getRecentLiquidations(limit: number = 10): LiquidationEvent[] {
  return MOCK_LIQUIDATIONS.slice(0, limit);
}

export function calculateLiquidationAmount(
  borrower: string,
  debtAsset: AssetType,
  collateralAsset: AssetType
): { debtToCover: number; collateralToSeize: number } | null {
  // Simplified calculation
  const debtMarket = getMarket(debtAsset);
  const collateralMarket = getMarket(collateralAsset);

  if (!debtMarket || !collateralMarket) return null;

  const debtToCover = 1000; // Example: 1000 units of debt
  const collateralToSeize = (debtToCover * debtMarket.priceKRW * (1 + collateralMarket.liquidationPenalty)) / collateralMarket.priceKRW;

  return { debtToCover, collateralToSeize };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════════════════════

export function getLendingStats(): LendingStats {
  const markets = MOCK_MARKETS;

  const totalSupplyValueKRW = markets.reduce((sum, m) => sum + m.totalSupply * m.priceKRW, 0);
  const totalBorrowValueKRW = markets.reduce((sum, m) => sum + m.totalBorrow * m.priceKRW, 0);
  const activeSuppliers = markets.reduce((sum, m) => sum + m.totalSuppliers, 0);
  const activeBorrowers = markets.reduce((sum, m) => sum + m.totalBorrowers, 0);

  const avgSupplyApy = markets.reduce((sum, m) => sum + m.supplyApy, 0) / markets.length;
  const avgBorrowApy = markets.reduce((sum, m) => sum + m.borrowApy, 0) / markets.length;

  return {
    totalSupplyValueKRW,
    totalBorrowValueKRW,
    totalMarkets: markets.length,
    activeSuppliers,
    activeBorrowers,
    averageSupplyApy: Math.round(avgSupplyApy * 10) / 10,
    averageBorrowApy: Math.round(avgBorrowApy * 10) / 10,
    totalLiquidations24h: 3,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export function getHealthFactorColor(healthFactor: number): string {
  if (healthFactor >= 2) return 'emerald';
  if (healthFactor >= 1.5) return 'green';
  if (healthFactor >= 1.25) return 'yellow';
  if (healthFactor >= 1.1) return 'orange';
  if (healthFactor >= 1) return 'red';
  return 'red';
}

export function getStatusLabel(status: PositionStatus): { label: string; labelKo: string; color: string } {
  const labels: Record<PositionStatus, { label: string; labelKo: string; color: string }> = {
    HEALTHY: { label: 'Healthy', labelKo: '안전', color: 'emerald' },
    WARNING: { label: 'Warning', labelKo: '주의', color: 'yellow' },
    DANGER: { label: 'Danger', labelKo: '위험', color: 'orange' },
    LIQUIDATABLE: { label: 'Liquidatable', labelKo: '청산 가능', color: 'red' },
  };
  return labels[status];
}

export function formatHealthFactor(hf: number): string {
  if (hf >= 10) return '∞';
  return hf.toFixed(2);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const LendingEngine = {
  // Markets
  getMarkets,
  getMarket,
  getMarketById,
  // Interest rates
  calculateBorrowRate,
  calculateSupplyRate,
  // User position
  getUserPosition,
  // Actions
  supply,
  withdraw,
  borrow,
  repay,
  toggleCollateral,
  // Liquidation
  getLiquidatablePositions,
  getRecentLiquidations,
  calculateLiquidationAmount,
  // Stats
  getLendingStats,
  // Utilities
  getHealthFactorColor,
  getStatusLabel,
  formatHealthFactor,
  // Constants
  ASSET_PRICES,
};

export default LendingEngine;
