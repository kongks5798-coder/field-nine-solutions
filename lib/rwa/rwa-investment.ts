/**
 * NEXUS-X RWA Investment Logic
 * @version 1.0.0 - Phase 11 RWA Launchpad
 *
 * Fractional Energy Asset Investment System
 * NXUSD Dividend Distribution
 */

import crypto from 'crypto';
import { energyOracle, EnergyAsset } from './energy-oracle';

// ============================================
// Types
// ============================================

export interface RWAToken {
  tokenId: string;
  assetId: string;
  name: string;
  symbol: string;
  totalSupply: number;
  circulatingSupply: number;
  pricePerToken: number;
  minInvestment: number;
  maxInvestment: number;
  metadata: {
    assetType: string;
    location: string;
    capacity: number;
    projectedAPY: number;
    riskRating: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  status: 'FUNDRAISING' | 'ACTIVE' | 'MATURED' | 'CLOSED';
  createdAt: string;
  maturityDate: string;
}

export interface Investment {
  investmentId: string;
  userId: string;
  tokenId: string;
  tokenAmount: number;
  investmentAmount: number;
  purchasePrice: number;
  currentValue: number;
  unrealizedPnL: number;
  dividendsReceived: number;
  status: 'ACTIVE' | 'REDEEMED' | 'PENDING';
  createdAt: string;
  lastDividendAt?: string;
}

export interface DividendDistribution {
  distributionId: string;
  tokenId: string;
  period: {
    start: string;
    end: string;
  };
  totalAmount: number;
  perTokenAmount: number;
  eligibleHolders: number;
  distributedAt: string;
  txHash: string;
  status: 'PENDING' | 'DISTRIBUTED' | 'FAILED';
}

export interface InvestmentPortfolio {
  userId: string;
  totalInvested: number;
  currentValue: number;
  totalPnL: number;
  totalDividends: number;
  investments: Investment[];
  diversificationScore: number;
}

export interface RWAProductListing {
  productId: string;
  token: RWAToken;
  asset: EnergyAsset | undefined;
  fundraising: {
    targetAmount: number;
    raisedAmount: number;
    progress: number;
    investors: number;
    deadline: string;
  };
  projections: {
    annualYield: number;
    monthlyDividend: number;
    breakEvenMonths: number;
    irr: number;
  };
  documents: {
    whitepaper: string;
    financialModel: string;
    legalOpinion: string;
    dueDiligence: string;
  };
}

// ============================================
// RWA Investment Manager
// ============================================

export class RWAInvestmentManager {
  private tokens: Map<string, RWAToken> = new Map();
  private investments: Map<string, Investment[]> = new Map();
  private dividends: DividendDistribution[] = [];

  constructor() {
    this.initializeSampleTokens();
  }

  // Initialize sample RWA tokens
  private initializeSampleTokens(): void {
    const assets = energyOracle.getAllAssets();

    assets.forEach((asset, index) => {
      const token: RWAToken = {
        tokenId: `RWA-${asset.id}`,
        assetId: asset.id,
        name: `${asset.name} Token`,
        symbol: `FN${asset.type.substring(0, 3)}${index + 1}`,
        totalSupply: Math.floor(asset.financials.totalInvestment / 100),
        circulatingSupply: 0,
        pricePerToken: 100,
        minInvestment: 100,
        maxInvestment: 50000,
        metadata: {
          assetType: asset.type,
          location: `${asset.location.region}, ${asset.location.country}`,
          capacity: asset.capacity.installed,
          projectedAPY: this.calculateProjectedAPY(asset),
          riskRating: asset.type === 'SOLAR' ? 'LOW' : asset.type === 'ESS' ? 'MEDIUM' : 'MEDIUM',
        },
        status: 'FUNDRAISING',
        createdAt: new Date().toISOString(),
        maturityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 5).toISOString(), // 5 years
      };

      this.tokens.set(token.tokenId, token);
    });
  }

  // Calculate projected APY
  private calculateProjectedAPY(asset: EnergyAsset): number {
    const annualRevenue = asset.performance.yearlyGeneration *
      (asset.financials.tariffRate + asset.financials.subsidyRate);
    const netRevenue = annualRevenue - asset.financials.operatingCost;
    const apy = (netRevenue / asset.financials.totalInvestment) * 100;
    return Math.round(apy * 100) / 100;
  }

  // Invest in RWA token
  invest(
    userId: string,
    tokenId: string,
    amount: number
  ): { success: boolean; investment?: Investment; error?: string } {
    const token = this.tokens.get(tokenId);
    if (!token) {
      return { success: false, error: 'Token not found' };
    }

    if (token.status !== 'FUNDRAISING' && token.status !== 'ACTIVE') {
      return { success: false, error: 'Token not available for investment' };
    }

    if (amount < token.minInvestment) {
      return { success: false, error: `Minimum investment is $${token.minInvestment}` };
    }

    if (amount > token.maxInvestment) {
      return { success: false, error: `Maximum investment is $${token.maxInvestment}` };
    }

    const tokenAmount = Math.floor(amount / token.pricePerToken);
    const actualInvestment = tokenAmount * token.pricePerToken;

    if (token.circulatingSupply + tokenAmount > token.totalSupply) {
      return { success: false, error: 'Insufficient token supply' };
    }

    const investment: Investment = {
      investmentId: `INV-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      userId,
      tokenId,
      tokenAmount,
      investmentAmount: actualInvestment,
      purchasePrice: token.pricePerToken,
      currentValue: actualInvestment,
      unrealizedPnL: 0,
      dividendsReceived: 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    // Update token supply
    token.circulatingSupply += tokenAmount;
    this.tokens.set(tokenId, token);

    // Store investment
    const userInvestments = this.investments.get(userId) || [];
    userInvestments.push(investment);
    this.investments.set(userId, userInvestments);

    return { success: true, investment };
  }

  // Process dividend distribution
  distributeDividends(tokenId: string): DividendDistribution | null {
    const token = this.tokens.get(tokenId);
    if (!token || token.circulatingSupply === 0) return null;

    const asset = energyOracle.getAsset(token.assetId);
    if (!asset) return null;

    // Calculate monthly dividend
    const monthlyGeneration = asset.performance.monthlyGeneration;
    const revenue = monthlyGeneration * (asset.financials.tariffRate + asset.financials.subsidyRate);
    const operatingCost = asset.financials.operatingCost / 12;
    const netIncome = revenue - operatingCost;

    // 80% distributed to token holders
    const distributionAmount = netIncome * 0.8;
    const perTokenAmount = distributionAmount / token.circulatingSupply;

    const distribution: DividendDistribution = {
      distributionId: `DIV-${tokenId}-${Date.now()}`,
      tokenId,
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
      totalAmount: Math.round(distributionAmount * 100) / 100,
      perTokenAmount: Math.round(perTokenAmount * 10000) / 10000,
      eligibleHolders: this.getTokenHolderCount(tokenId),
      distributedAt: new Date().toISOString(),
      txHash: '0x' + crypto.randomBytes(32).toString('hex'),
      status: 'DISTRIBUTED',
    };

    // Update investor dividends
    this.investments.forEach((userInvestments, userId) => {
      userInvestments.forEach(inv => {
        if (inv.tokenId === tokenId && inv.status === 'ACTIVE') {
          inv.dividendsReceived += inv.tokenAmount * perTokenAmount;
          inv.lastDividendAt = new Date().toISOString();
        }
      });
      this.investments.set(userId, userInvestments);
    });

    this.dividends.push(distribution);
    return distribution;
  }

  // Get token holder count
  private getTokenHolderCount(tokenId: string): number {
    let count = 0;
    this.investments.forEach(userInvestments => {
      if (userInvestments.some(inv => inv.tokenId === tokenId && inv.status === 'ACTIVE')) {
        count++;
      }
    });
    return count;
  }

  // Get user portfolio
  getUserPortfolio(userId: string): InvestmentPortfolio {
    const userInvestments = this.investments.get(userId) || [];

    let totalInvested = 0;
    let currentValue = 0;
    let totalDividends = 0;

    userInvestments.forEach(inv => {
      if (inv.status === 'ACTIVE') {
        totalInvested += inv.investmentAmount;
        currentValue += inv.currentValue;
        totalDividends += inv.dividendsReceived;
      }
    });

    // Calculate diversification score
    const uniqueAssets = new Set(userInvestments.map(inv => {
      const token = this.tokens.get(inv.tokenId);
      return token?.metadata.assetType;
    })).size;
    const diversificationScore = Math.min(100, uniqueAssets * 33);

    return {
      userId,
      totalInvested: Math.round(totalInvested * 100) / 100,
      currentValue: Math.round(currentValue * 100) / 100,
      totalPnL: Math.round((currentValue - totalInvested) * 100) / 100,
      totalDividends: Math.round(totalDividends * 100) / 100,
      investments: userInvestments,
      diversificationScore,
    };
  }

  // Get RWA product listings
  getProductListings(): RWAProductListing[] {
    return Array.from(this.tokens.values()).map(token => {
      const asset = energyOracle.getAsset(token.assetId);
      const targetAmount = token.totalSupply * token.pricePerToken;
      const raisedAmount = token.circulatingSupply * token.pricePerToken;

      return {
        productId: token.tokenId,
        token,
        asset,
        fundraising: {
          targetAmount,
          raisedAmount,
          progress: Math.round((raisedAmount / targetAmount) * 10000) / 100,
          investors: this.getTokenHolderCount(token.tokenId),
          deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        },
        projections: {
          annualYield: token.metadata.projectedAPY,
          monthlyDividend: Math.round((token.metadata.projectedAPY / 12) * 100) / 100,
          breakEvenMonths: Math.round(1200 / token.metadata.projectedAPY),
          irr: token.metadata.projectedAPY + 2, // Simplified IRR
        },
        documents: {
          whitepaper: `/docs/rwa/${token.tokenId}/whitepaper.pdf`,
          financialModel: `/docs/rwa/${token.tokenId}/financial-model.xlsx`,
          legalOpinion: `/docs/rwa/${token.tokenId}/legal-opinion.pdf`,
          dueDiligence: `/docs/rwa/${token.tokenId}/due-diligence.pdf`,
        },
      };
    });
  }

  // Get token by ID
  getToken(tokenId: string): RWAToken | undefined {
    return this.tokens.get(tokenId);
  }

  // Get all tokens
  getAllTokens(): RWAToken[] {
    return Array.from(this.tokens.values());
  }

  // Get dividend history
  getDividendHistory(tokenId?: string): DividendDistribution[] {
    if (tokenId) {
      return this.dividends.filter(d => d.tokenId === tokenId);
    }
    return this.dividends;
  }

  // Get platform statistics
  getPlatformStats(): {
    totalAssets: number;
    totalRaised: number;
    totalInvestors: number;
    totalDividendsPaid: number;
    avgAPY: number;
  } {
    let totalRaised = 0;
    let totalAPY = 0;

    this.tokens.forEach(token => {
      totalRaised += token.circulatingSupply * token.pricePerToken;
      totalAPY += token.metadata.projectedAPY;
    });

    const totalDividendsPaid = this.dividends.reduce((sum, d) => sum + d.totalAmount, 0);

    let totalInvestors = 0;
    this.investments.forEach(() => totalInvestors++);

    return {
      totalAssets: this.tokens.size,
      totalRaised: Math.round(totalRaised * 100) / 100,
      totalInvestors,
      totalDividendsPaid: Math.round(totalDividendsPaid * 100) / 100,
      avgAPY: Math.round((totalAPY / this.tokens.size) * 100) / 100,
    };
  }
}

// Export singleton
export const rwaInvestmentManager = new RWAInvestmentManager();
