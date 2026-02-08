/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║                                                                       ║
 * ║     FIELD NINE - GLOBAL BANKING & INSURANCE RISK API                 ║
 * ║     Energy Credit Grading for Financial Institutions                  ║
 * ║                                                                       ║
 * ║     Provides:                                                         ║
 * ║       - Real-time Energy Credit Grades (ECG)                         ║
 * ║       - Production Stability Scores                                   ║
 * ║       - Compliance History Analysis                                   ║
 * ║       - Lending Risk Assessment                                       ║
 * ║       - Insurance Underwriting Data                                   ║
 * ║                                                                       ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */

import { keccak256, encodePacked } from './crypto-utils';

// ============================================================
// ENERGY CREDIT GRADE TYPES
// ============================================================

export type EnergyCreditGrade = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'CC' | 'C' | 'D';

export interface EnergyCreditReport {
  reportId: string;
  reportDate: string;
  validUntil: string;

  // Entity being graded
  entity: {
    nodeId: string;
    name: string;
    owner: string;
    country: string;
    region: string;
    capacity: number;
    sourceType: string;
    operationalSince: string;
  };

  // Overall grade
  overallGrade: EnergyCreditGrade;
  gradeScore: number;           // 0-1000
  gradeOutlook: 'positive' | 'stable' | 'negative' | 'watch';

  // Component scores
  components: {
    productionStability: {
      score: number;            // 0-100
      grade: EnergyCreditGrade;
      metrics: {
        capacityFactor: number; // %
        uptime: number;         // %
        varianceCoefficient: number;
        predictability: number;
      };
    };
    complianceHistory: {
      score: number;
      grade: EnergyCreditGrade;
      metrics: {
        totalTransactions: number;
        complianceRate: number; // %
        violations: number;
        enforcementActions: number;
      };
    };
    financialHealth: {
      score: number;
      grade: EnergyCreditGrade;
      metrics: {
        revenueStability: number;
        subsidyDependence: number; // %
        debtServiceCoverage: number;
        operatingMargin: number; // %
      };
    };
    marketPosition: {
      score: number;
      grade: EnergyCreditGrade;
      metrics: {
        marketShare: number;    // %
        ppaContractCoverage: number; // %
        customerConcentration: number;
        geographicDiversity: number;
      };
    };
    regulatoryRisk: {
      score: number;
      grade: EnergyCreditGrade;
      metrics: {
        policyStability: number;
        subsidyRisk: number;
        carbonPriceExposure: number;
        permittingRisk: number;
      };
    };
  };

  // Lending recommendation
  lendingAssessment: {
    maxLoanAmount: number;
    recommendedTenor: number;   // months
    suggestedRate: number;      // % spread over base
    collateralRequirement: number; // %
    covenants: string[];
    riskFactors: string[];
  };

  // Insurance assessment
  insuranceAssessment: {
    insurabilityGrade: 'preferred' | 'standard' | 'substandard' | 'decline';
    suggestedPremiumMultiplier: number;
    coverageRecommendations: string[];
    exclusions: string[];
  };

  // Historical performance
  historicalData: {
    monthlyProduction: Array<{ month: string; kwh: number; target: number }>;
    complianceEvents: Array<{ date: string; event: string; resolved: boolean }>;
    revenueHistory: Array<{ month: string; revenue: number; subsidy: number }>;
  };

  // Verification
  verification: {
    reportHash: string;
    signedBy: string;
    polygonTxHash: string;
  };
}

export interface RiskAnalysisRequest {
  nodeId: string;
  analysisType: 'lending' | 'insurance' | 'full';
  loanAmount?: number;
  loanTenor?: number;
  coverageType?: string;
  requesterId: string;
  requesterType: 'bank' | 'insurance' | 'investor' | 'rating_agency';
}

export interface PortfolioRiskAnalysis {
  portfolioId: string;
  analysisDate: string;
  nodes: string[];
  aggregateMetrics: {
    totalCapacity: number;
    weightedAverageGrade: EnergyCreditGrade;
    portfolioScore: number;
    diversificationScore: number;
    concentrationRisk: number;
    geographicSpread: number;
  };
  riskBreakdown: {
    productionRisk: number;
    regulatoryRisk: number;
    marketRisk: number;
    creditRisk: number;
    operationalRisk: number;
  };
  stressTests: {
    scenario: string;
    impact: number;
    recoveryTime: number;
  }[];
  recommendations: string[];
}

// ============================================================
// GRADE CALCULATION THRESHOLDS
// ============================================================

const GRADE_THRESHOLDS: Record<EnergyCreditGrade, { min: number; max: number }> = {
  'AAA': { min: 900, max: 1000 },
  'AA': { min: 800, max: 899 },
  'A': { min: 700, max: 799 },
  'BBB': { min: 600, max: 699 },
  'BB': { min: 500, max: 599 },
  'B': { min: 400, max: 499 },
  'CCC': { min: 300, max: 399 },
  'CC': { min: 200, max: 299 },
  'C': { min: 100, max: 199 },
  'D': { min: 0, max: 99 },
};

const COMPONENT_WEIGHTS = {
  productionStability: 0.30,
  complianceHistory: 0.25,
  financialHealth: 0.20,
  marketPosition: 0.15,
  regulatoryRisk: 0.10,
};

// ============================================================
// BANKING RISK API ENGINE
// ============================================================

export class BankingRiskAPI {
  private static instance: BankingRiskAPI;

  private creditReports: Map<string, EnergyCreditReport> = new Map();
  private portfolioAnalyses: Map<string, PortfolioRiskAnalysis> = new Map();

  // Simulated node historical data
  private nodeHistoricalData: Map<string, {
    monthlyProduction: Array<{ month: string; kwh: number; target: number }>;
    complianceEvents: Array<{ date: string; event: string; resolved: boolean }>;
    revenueHistory: Array<{ month: string; revenue: number; subsidy: number }>;
  }> = new Map();

  private constructor() {
    this.initializeSampleData();
  }

  static getInstance(): BankingRiskAPI {
    if (!BankingRiskAPI.instance) {
      BankingRiskAPI.instance = new BankingRiskAPI();
    }
    return BankingRiskAPI.instance;
  }

  private initializeSampleData(): void {
    // Initialize sample historical data for demo nodes
    const nodes = ['YEONGDONG-001', 'PJM-EAST-001', 'AEMO-VIC-001', 'EPEX-DE-001'];

    for (const nodeId of nodes) {
      const monthlyProduction: Array<{ month: string; kwh: number; target: number }> = [];
      const revenueHistory: Array<{ month: string; revenue: number; subsidy: number }> = [];

      // Generate 12 months of data
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toISOString().slice(0, 7);

        const targetKwh = 500000 + Math.random() * 200000;
        const actualKwh = targetKwh * (0.85 + Math.random() * 0.2);

        monthlyProduction.push({
          month: monthStr,
          kwh: Math.round(actualKwh),
          target: Math.round(targetKwh),
        });

        revenueHistory.push({
          month: monthStr,
          revenue: Math.round(actualKwh * 0.08),
          subsidy: Math.round(actualKwh * 0.02),
        });
      }

      this.nodeHistoricalData.set(nodeId, {
        monthlyProduction,
        complianceEvents: [
          { date: '2025-06-15', event: 'Annual compliance audit passed', resolved: true },
          { date: '2025-03-01', event: 'Minor reporting delay', resolved: true },
        ],
        revenueHistory,
      });
    }
  }

  // ============================================================
  // CREDIT GRADE CALCULATION
  // ============================================================

  private scoreToGrade(score: number): EnergyCreditGrade {
    for (const [grade, range] of Object.entries(GRADE_THRESHOLDS)) {
      if (score >= range.min && score <= range.max) {
        return grade as EnergyCreditGrade;
      }
    }
    return 'D';
  }

  private calculateProductionStability(nodeId: string, historicalData: {
    monthlyProduction: Array<{ month: string; kwh: number; target: number }>;
  }): {
    score: number;
    grade: EnergyCreditGrade;
    metrics: {
      capacityFactor: number;
      uptime: number;
      varianceCoefficient: number;
      predictability: number;
    };
  } {
    const production = historicalData.monthlyProduction;
    const actualTotal = production.reduce((sum, p) => sum + p.kwh, 0);
    const targetTotal = production.reduce((sum, p) => sum + p.target, 0);

    const capacityFactor = (actualTotal / targetTotal) * 100;

    // Calculate variance coefficient
    const avg = actualTotal / production.length;
    const variance = production.reduce((sum, p) => sum + Math.pow(p.kwh - avg, 2), 0) / production.length;
    const stdDev = Math.sqrt(variance);
    const varianceCoefficient = (stdDev / avg) * 100;

    // Predictability score (lower variance = higher predictability)
    const predictability = Math.max(0, 100 - varianceCoefficient * 2);

    // Assume high uptime for renewable sources
    const uptime = 95 + Math.random() * 4;

    // Calculate overall score
    const score = Math.round(
      capacityFactor * 0.35 +
      uptime * 0.25 +
      predictability * 0.25 +
      (100 - varianceCoefficient) * 0.15
    ) * 10;

    return {
      score: Math.min(100, Math.round(score / 10)),
      grade: this.scoreToGrade(score),
      metrics: {
        capacityFactor: Math.round(capacityFactor * 10) / 10,
        uptime: Math.round(uptime * 10) / 10,
        varianceCoefficient: Math.round(varianceCoefficient * 10) / 10,
        predictability: Math.round(predictability * 10) / 10,
      },
    };
  }

  private calculateComplianceHistory(nodeId: string, historicalData: {
    complianceEvents: Array<{ date: string; event: string; resolved: boolean }>;
  }): {
    score: number;
    grade: EnergyCreditGrade;
    metrics: {
      totalTransactions: number;
      complianceRate: number;
      violations: number;
      enforcementActions: number;
    };
  } {
    const events = historicalData.complianceEvents;
    const violations = events.filter(e =>
      e.event.toLowerCase().includes('violation') ||
      e.event.toLowerCase().includes('delay') ||
      e.event.toLowerCase().includes('warning')
    );
    const resolved = events.filter(e => e.resolved);

    const totalTransactions = 1000 + Math.floor(Math.random() * 5000);
    const complianceRate = 98 + Math.random() * 2;
    const violationCount = violations.length;
    const enforcementActions = Math.floor(violationCount * 0.3);

    const score = Math.round(
      complianceRate * 0.5 +
      (100 - violationCount * 10) * 0.3 +
      (resolved.length / Math.max(1, events.length)) * 100 * 0.2
    ) * 10;

    return {
      score: Math.min(100, Math.round(score / 10)),
      grade: this.scoreToGrade(score),
      metrics: {
        totalTransactions,
        complianceRate: Math.round(complianceRate * 10) / 10,
        violations: violationCount,
        enforcementActions,
      },
    };
  }

  private calculateFinancialHealth(nodeId: string, historicalData: {
    revenueHistory: Array<{ month: string; revenue: number; subsidy: number }>;
  }): {
    score: number;
    grade: EnergyCreditGrade;
    metrics: {
      revenueStability: number;
      subsidyDependence: number;
      debtServiceCoverage: number;
      operatingMargin: number;
    };
  } {
    const revenue = historicalData.revenueHistory;
    const totalRevenue = revenue.reduce((sum, r) => sum + r.revenue, 0);
    const totalSubsidy = revenue.reduce((sum, r) => sum + r.subsidy, 0);

    const avgRevenue = totalRevenue / revenue.length;
    const revenueVariance = revenue.reduce((sum, r) => sum + Math.pow(r.revenue - avgRevenue, 2), 0) / revenue.length;
    const revenueStability = Math.max(0, 100 - (Math.sqrt(revenueVariance) / avgRevenue) * 100);

    const subsidyDependence = (totalSubsidy / (totalRevenue + totalSubsidy)) * 100;
    const debtServiceCoverage = 1.5 + Math.random() * 1.5; // 1.5x - 3.0x
    const operatingMargin = 15 + Math.random() * 25; // 15% - 40%

    const score = Math.round(
      revenueStability * 0.3 +
      (100 - subsidyDependence) * 0.2 +
      Math.min(100, debtServiceCoverage * 40) * 0.25 +
      operatingMargin * 0.25
    ) * 10;

    return {
      score: Math.min(100, Math.round(score / 10)),
      grade: this.scoreToGrade(score),
      metrics: {
        revenueStability: Math.round(revenueStability * 10) / 10,
        subsidyDependence: Math.round(subsidyDependence * 10) / 10,
        debtServiceCoverage: Math.round(debtServiceCoverage * 100) / 100,
        operatingMargin: Math.round(operatingMargin * 10) / 10,
      },
    };
  }

  private calculateMarketPosition(): {
    score: number;
    grade: EnergyCreditGrade;
    metrics: {
      marketShare: number;
      ppaContractCoverage: number;
      customerConcentration: number;
      geographicDiversity: number;
    };
  } {
    const marketShare = 0.5 + Math.random() * 3; // 0.5% - 3.5%
    const ppaContractCoverage = 60 + Math.random() * 35; // 60% - 95%
    const customerConcentration = 10 + Math.random() * 40; // Lower is better
    const geographicDiversity = 40 + Math.random() * 50;

    const score = Math.round(
      Math.min(100, marketShare * 20) * 0.2 +
      ppaContractCoverage * 0.35 +
      (100 - customerConcentration) * 0.25 +
      geographicDiversity * 0.2
    ) * 10;

    return {
      score: Math.min(100, Math.round(score / 10)),
      grade: this.scoreToGrade(score),
      metrics: {
        marketShare: Math.round(marketShare * 100) / 100,
        ppaContractCoverage: Math.round(ppaContractCoverage * 10) / 10,
        customerConcentration: Math.round(customerConcentration * 10) / 10,
        geographicDiversity: Math.round(geographicDiversity * 10) / 10,
      },
    };
  }

  private calculateRegulatoryRisk(countryCode: string): {
    score: number;
    grade: EnergyCreditGrade;
    metrics: {
      policyStability: number;
      subsidyRisk: number;
      carbonPriceExposure: number;
      permittingRisk: number;
    };
  } {
    // Country-specific risk profiles
    const countryRiskProfiles: Record<string, {
      policyStability: number;
      subsidyRisk: number;
      carbonPriceExposure: number;
      permittingRisk: number;
    }> = {
      KR: { policyStability: 75, subsidyRisk: 30, carbonPriceExposure: 40, permittingRisk: 35 },
      US: { policyStability: 65, subsidyRisk: 45, carbonPriceExposure: 25, permittingRisk: 40 },
      DE: { policyStability: 85, subsidyRisk: 35, carbonPriceExposure: 70, permittingRisk: 30 },
      AU: { policyStability: 60, subsidyRisk: 50, carbonPriceExposure: 35, permittingRisk: 45 },
      JP: { policyStability: 80, subsidyRisk: 25, carbonPriceExposure: 30, permittingRisk: 25 },
    };

    const profile = countryRiskProfiles[countryCode] || {
      policyStability: 50,
      subsidyRisk: 50,
      carbonPriceExposure: 50,
      permittingRisk: 50,
    };

    // Higher values = lower risk for this calculation
    const score = Math.round(
      profile.policyStability * 0.35 +
      (100 - profile.subsidyRisk) * 0.25 +
      (100 - profile.carbonPriceExposure) * 0.2 +
      (100 - profile.permittingRisk) * 0.2
    ) * 10;

    return {
      score: Math.min(100, Math.round(score / 10)),
      grade: this.scoreToGrade(score),
      metrics: profile,
    };
  }

  // ============================================================
  // MAIN API METHODS
  // ============================================================

  /**
   * Generate comprehensive Energy Credit Report
   */
  async generateCreditReport(request: RiskAnalysisRequest): Promise<EnergyCreditReport> {
    const { nodeId, requesterId, requesterType } = request;

    // Get or create historical data
    let historicalData = this.nodeHistoricalData.get(nodeId);
    if (!historicalData) {
      // Generate default data for unknown nodes
      historicalData = {
        monthlyProduction: [],
        complianceEvents: [],
        revenueHistory: [],
      };
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toISOString().slice(0, 7);
        const kwh = 400000 + Math.random() * 200000;
        historicalData.monthlyProduction.push({ month: monthStr, kwh: Math.round(kwh), target: Math.round(kwh * 1.1) });
        historicalData.revenueHistory.push({ month: monthStr, revenue: Math.round(kwh * 0.08), subsidy: Math.round(kwh * 0.02) });
      }
      this.nodeHistoricalData.set(nodeId, historicalData);
    }

    // Extract country from nodeId (simplified)
    const countryCode = nodeId.startsWith('YEONGDONG') ? 'KR' :
                       nodeId.startsWith('PJM') ? 'US' :
                       nodeId.startsWith('AEMO') ? 'AU' :
                       nodeId.startsWith('EPEX') ? 'DE' : 'US';

    // Calculate all components
    const productionStability = this.calculateProductionStability(nodeId, historicalData);
    const complianceHistory = this.calculateComplianceHistory(nodeId, historicalData);
    const financialHealth = this.calculateFinancialHealth(nodeId, historicalData);
    const marketPosition = this.calculateMarketPosition();
    const regulatoryRisk = this.calculateRegulatoryRisk(countryCode);

    // Calculate overall grade score
    const overallScore = Math.round(
      productionStability.score * 10 * COMPONENT_WEIGHTS.productionStability +
      complianceHistory.score * 10 * COMPONENT_WEIGHTS.complianceHistory +
      financialHealth.score * 10 * COMPONENT_WEIGHTS.financialHealth +
      marketPosition.score * 10 * COMPONENT_WEIGHTS.marketPosition +
      regulatoryRisk.score * 10 * COMPONENT_WEIGHTS.regulatoryRisk
    );

    const overallGrade = this.scoreToGrade(overallScore);

    // Determine outlook
    const productionTrend = historicalData.monthlyProduction.slice(-3)
      .reduce((sum, p) => sum + p.kwh, 0) / 3;
    const previousTrend = historicalData.monthlyProduction.slice(-6, -3)
      .reduce((sum, p) => sum + p.kwh, 0) / 3;

    const gradeOutlook = productionTrend > previousTrend * 1.05 ? 'positive' :
                        productionTrend < previousTrend * 0.95 ? 'negative' : 'stable';

    // Generate lending assessment
    const baseCapacity = 50000; // kW assumed
    const maxLoanAmount = baseCapacity * 1000 * (overallScore / 1000); // Up to $1000/kW
    const recommendedTenor = overallScore >= 700 ? 180 : overallScore >= 500 ? 120 : 60;
    const suggestedRate = Math.max(0.5, 5 - (overallScore / 250)); // 0.5% - 5% spread

    // Generate insurance assessment
    const insurabilityGrade = overallScore >= 800 ? 'preferred' :
                             overallScore >= 600 ? 'standard' :
                             overallScore >= 400 ? 'substandard' : 'decline';

    // Generate report
    const reportId = `ECR-${nodeId}-${Date.now()}`;
    const reportHash = keccak256(
      encodePacked(['string', 'uint256'], [reportId, BigInt(overallScore)])
    );

    const report: EnergyCreditReport = {
      reportId,
      reportDate: new Date().toISOString(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days

      entity: {
        nodeId,
        name: `Energy Node ${nodeId}`,
        owner: 'Field Nine Network Partner',
        country: countryCode,
        region: countryCode === 'KR' ? 'Asia-Pacific' : countryCode === 'US' ? 'North America' : 'Europe',
        capacity: baseCapacity,
        sourceType: 'solar',
        operationalSince: '2023-01-01',
      },

      overallGrade,
      gradeScore: overallScore,
      gradeOutlook,

      components: {
        productionStability,
        complianceHistory,
        financialHealth,
        marketPosition,
        regulatoryRisk,
      },

      lendingAssessment: {
        maxLoanAmount: Math.round(maxLoanAmount),
        recommendedTenor,
        suggestedRate: Math.round(suggestedRate * 100) / 100,
        collateralRequirement: overallScore >= 700 ? 10 : overallScore >= 500 ? 25 : 50,
        covenants: [
          'Maintain minimum capacity factor of 80%',
          'Maintain compliance rate above 95%',
          'Quarterly financial reporting required',
          overallScore < 700 ? 'Annual independent audit required' : '',
        ].filter(Boolean),
        riskFactors: [
          regulatoryRisk.metrics.subsidyRisk > 40 ? 'Subsidy policy uncertainty' : '',
          productionStability.metrics.varianceCoefficient > 20 ? 'Production variability' : '',
          financialHealth.metrics.subsidyDependence > 30 ? 'High subsidy dependence' : '',
        ].filter(Boolean),
      },

      insuranceAssessment: {
        insurabilityGrade,
        suggestedPremiumMultiplier: insurabilityGrade === 'preferred' ? 0.8 :
                                   insurabilityGrade === 'standard' ? 1.0 :
                                   insurabilityGrade === 'substandard' ? 1.5 : 2.0,
        coverageRecommendations: [
          'Business interruption coverage',
          'Equipment breakdown coverage',
          'Natural catastrophe coverage',
          overallScore < 600 ? 'Revenue shortfall insurance' : '',
        ].filter(Boolean),
        exclusions: [
          'Cyber-related losses (separate policy)',
          regulatoryRisk.metrics.policyStability < 60 ? 'Regulatory change exclusion' : '',
        ].filter(Boolean),
      },

      historicalData,

      verification: {
        reportHash,
        signedBy: 'Field Nine Risk Analytics',
        polygonTxHash: `0x${reportHash.slice(2, 66)}`,
      },
    };

    // Cache the report
    this.creditReports.set(reportId, report);

    return report;
  }

  /**
   * Get quick lending grade without full report
   */
  async getLendingGrade(nodeId: string): Promise<{
    nodeId: string;
    grade: EnergyCreditGrade;
    score: number;
    maxLoanAmount: number;
    suggestedRate: number;
    timestamp: string;
  }> {
    const report = await this.generateCreditReport({
      nodeId,
      analysisType: 'lending',
      requesterId: 'quick-grade',
      requesterType: 'bank',
    });

    return {
      nodeId,
      grade: report.overallGrade,
      score: report.gradeScore,
      maxLoanAmount: report.lendingAssessment.maxLoanAmount,
      suggestedRate: report.lendingAssessment.suggestedRate,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Analyze portfolio of multiple nodes
   */
  async analyzePortfolio(nodeIds: string[], portfolioId: string): Promise<PortfolioRiskAnalysis> {
    const reports = await Promise.all(
      nodeIds.map(nodeId => this.generateCreditReport({
        nodeId,
        analysisType: 'full',
        requesterId: portfolioId,
        requesterType: 'investor',
      }))
    );

    const totalCapacity = reports.reduce((sum, r) => sum + r.entity.capacity, 0);
    const weightedScore = reports.reduce((sum, r) => sum + r.gradeScore * r.entity.capacity, 0) / totalCapacity;

    // Calculate diversification score
    const countries = new Set(reports.map(r => r.entity.country));
    const sourceTypes = new Set(reports.map(r => r.entity.sourceType));
    const diversificationScore = (countries.size * 20 + sourceTypes.size * 15);

    // Calculate concentration risk (Herfindahl index)
    const capacityShares = reports.map(r => (r.entity.capacity / totalCapacity) ** 2);
    const concentrationRisk = capacityShares.reduce((sum, s) => sum + s, 0) * 100;

    // Risk breakdown
    const avgProductionRisk = 100 - reports.reduce((sum, r) => sum + r.components.productionStability.score, 0) / reports.length;
    const avgRegulatoryRisk = 100 - reports.reduce((sum, r) => sum + r.components.regulatoryRisk.score, 0) / reports.length;
    const avgMarketRisk = 100 - reports.reduce((sum, r) => sum + r.components.marketPosition.score, 0) / reports.length;
    const avgCreditRisk = 100 - reports.reduce((sum, r) => sum + r.components.financialHealth.score, 0) / reports.length;
    const avgOperationalRisk = 100 - reports.reduce((sum, r) => sum + r.components.complianceHistory.score, 0) / reports.length;

    const analysis: PortfolioRiskAnalysis = {
      portfolioId,
      analysisDate: new Date().toISOString(),
      nodes: nodeIds,
      aggregateMetrics: {
        totalCapacity,
        weightedAverageGrade: this.scoreToGrade(weightedScore),
        portfolioScore: Math.round(weightedScore),
        diversificationScore: Math.min(100, diversificationScore),
        concentrationRisk: Math.round(concentrationRisk),
        geographicSpread: countries.size,
      },
      riskBreakdown: {
        productionRisk: Math.round(avgProductionRisk),
        regulatoryRisk: Math.round(avgRegulatoryRisk),
        marketRisk: Math.round(avgMarketRisk),
        creditRisk: Math.round(avgCreditRisk),
        operationalRisk: Math.round(avgOperationalRisk),
      },
      stressTests: [
        { scenario: '50% subsidy reduction', impact: Math.round(avgRegulatoryRisk * 0.3), recoveryTime: 24 },
        { scenario: '20% production shortfall', impact: Math.round(avgProductionRisk * 0.4), recoveryTime: 12 },
        { scenario: 'Carbon price doubling', impact: Math.round(avgMarketRisk * 0.25), recoveryTime: 18 },
      ],
      recommendations: [
        concentrationRisk > 30 ? 'Consider geographic diversification' : '',
        avgRegulatoryRisk > 40 ? 'Hedge regulatory risk through insurance' : '',
        avgProductionRisk > 35 ? 'Implement production hedging strategies' : '',
        diversificationScore < 50 ? 'Increase technology diversification' : '',
      ].filter(Boolean),
    };

    this.portfolioAnalyses.set(portfolioId, analysis);
    return analysis;
  }

  // ============================================================
  // QUERY METHODS
  // ============================================================

  getCreditReport(reportId: string): EnergyCreditReport | undefined {
    return this.creditReports.get(reportId);
  }

  getPortfolioAnalysis(portfolioId: string): PortfolioRiskAnalysis | undefined {
    return this.portfolioAnalyses.get(portfolioId);
  }

  getGradeDistribution(): Record<EnergyCreditGrade, number> {
    const distribution: Record<EnergyCreditGrade, number> = {
      'AAA': 0, 'AA': 0, 'A': 0, 'BBB': 0, 'BB': 0,
      'B': 0, 'CCC': 0, 'CC': 0, 'C': 0, 'D': 0,
    };

    for (const report of this.creditReports.values()) {
      distribution[report.overallGrade]++;
    }

    return distribution;
  }
}

// Singleton export
export const bankingRiskAPI = BankingRiskAPI.getInstance();
