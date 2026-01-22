/**
 * PAB INTELLIGENCE CORE
 *
 * Phase 19: Personal AI Banker
 * AI 뱅커의 핵심 지능 모듈 - 실시간 모니터링, 의사결정, 보고
 *
 * "당신의 자산이 쉬지 않고 일하게 합니다"
 */

import {
  yieldStrategyEngine,
  RiskProfile,
  MarketCondition,
  AllocationDecision,
  AssetAllocationTarget,
  BASE_YIELDS,
} from './yield-strategy-engine';

// ============================================
// TYPES
// ============================================

export type ActivityType =
  | 'MARKET_SCAN'
  | 'OPPORTUNITY_DETECTED'
  | 'TRADE_EXECUTED'
  | 'REBALANCE_SUGGESTED'
  | 'DIVIDEND_RECEIVED'
  | 'CARD_SETTLEMENT'
  | 'RISK_ALERT'
  | 'PERFORMANCE_UPDATE'
  | 'SLEEP_HARVEST'
  | 'ENERGY_SWAP';

export interface ActivityLog {
  id: string;
  timestamp: Date;
  type: ActivityType;
  title: string;
  description: string;
  impact: {
    kausChange?: number;
    percentageReturn?: number;
    usdEquivalent?: number;
  };
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  read: boolean;
  relatedDecision?: AllocationDecision;
}

export interface AIBriefing {
  id: string;
  timestamp: Date;
  headline: string;
  summary: string;
  keyMetrics: {
    label: string;
    value: string;
    change?: number;
    trend?: 'up' | 'down' | 'stable';
  }[];
  recommendations: string[];
  marketOutlook: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
}

export interface PABStatus {
  isActive: boolean;
  currentTask: string;
  lastScan: Date;
  nextScheduledAction: Date;
  totalActionsToday: number;
  profitToday: number;
  alertsCount: number;
}

export interface UserPreferences {
  notificationFrequency: 'REALTIME' | 'HOURLY' | 'DAILY';
  autoExecute: boolean;
  maxAutoTradeSize: number;
  sleepModeEnabled: boolean;
  sleepHoursStart: number;
  sleepHoursEnd: number;
  riskProfile: RiskProfile;
}

// ============================================
// ACTIVITY TEMPLATES
// ============================================

const ACTIVITY_TEMPLATES: Record<ActivityType, (params: Record<string, unknown>) => Partial<ActivityLog>> = {
  MARKET_SCAN: () => ({
    title: '시장 스캔 완료',
    description: '글로벌 에너지 시장 및 컴퓨트 수요 분석 완료',
    priority: 'LOW',
  }),
  OPPORTUNITY_DETECTED: (p) => ({
    title: '수익 기회 포착',
    description: `${p.market || '호주'} ${p.asset || '에너지'} 시장에서 ${p.opportunity || '가격 상승'} 감지`,
    priority: 'HIGH',
  }),
  TRADE_EXECUTED: (p) => ({
    title: '거래 실행 완료',
    description: `${p.fromAsset || 'K-AUS'}에서 ${p.toAsset || 'Energy Swap'}으로 ${p.amount || 0} K-AUS 전환`,
    priority: 'HIGH',
  }),
  REBALANCE_SUGGESTED: (p) => ({
    title: '리밸런싱 제안',
    description: `포트폴리오 최적화를 위해 ${p.suggestion || '자산 재배분'}을 권장합니다`,
    priority: 'MEDIUM',
  }),
  DIVIDEND_RECEIVED: (p) => ({
    title: '배당금 수령',
    description: `${p.source || '에너지 노드'}에서 ${p.amount || 0} K-AUS 배당금 입금`,
    priority: 'MEDIUM',
  }),
  CARD_SETTLEMENT: (p) => ({
    title: '카드 결제 정산',
    description: `${p.merchant || '가맹점'} 결제 ${p.amount || 0} USD를 ${p.source || '배당금'}으로 자동 정산`,
    priority: 'MEDIUM',
  }),
  RISK_ALERT: (p) => ({
    title: '리스크 경고',
    description: `${p.asset || '자산'}의 변동성이 ${p.threshold || '임계치'}를 초과했습니다`,
    priority: 'CRITICAL',
  }),
  PERFORMANCE_UPDATE: (p) => ({
    title: '성과 리포트',
    description: `이번 주 총 수익률: ${p.return || 0}% (${p.kaus || 0} K-AUS)`,
    priority: 'LOW',
  }),
  SLEEP_HARVEST: (p) => ({
    title: '슬립 하베스트 완료',
    description: `야간 유휴 자원 수확: ${p.earned || 0} K-AUS (+${p.bonus || 25}% 보너스)`,
    priority: 'MEDIUM',
  }),
  ENERGY_SWAP: (p) => ({
    title: '에너지 스왑 실행',
    description: `${p.amount || 0} K-AUS를 ${p.price || 0} AUD/MWh에 에너지로 전환 (+${p.profit || 0}% 수익)`,
    priority: 'HIGH',
  }),
};

// ============================================
// PAB INTELLIGENCE CLASS
// ============================================

class PABIntelligence {
  private activities: ActivityLog[] = [];
  private briefings: AIBriefing[] = [];
  private userPrefs: Map<string, UserPreferences> = new Map();
  private status: PABStatus;

  constructor() {
    this.status = {
      isActive: true,
      currentTask: '시장 모니터링 중',
      lastScan: new Date(),
      nextScheduledAction: new Date(Date.now() + 300000), // 5 min
      totalActionsToday: 0,
      profitToday: 0,
      alertsCount: 0,
    };

    this.initializeMockData();
  }

  private initializeMockData() {
    // User preferences
    this.userPrefs.set('USER-BOSS', {
      notificationFrequency: 'REALTIME',
      autoExecute: true,
      maxAutoTradeSize: 5000,
      sleepModeEnabled: true,
      sleepHoursStart: 23,
      sleepHoursEnd: 7,
      riskProfile: 'GROWTH',
    });

    // Generate realistic activity history
    const activityData: Array<{
      type: ActivityType;
      params: Record<string, unknown>;
      hoursAgo: number;
      impact?: { kausChange?: number; percentageReturn?: number };
    }> = [
      {
        type: 'ENERGY_SWAP',
        params: { amount: 500, price: 98.5, profit: 2.5 },
        hoursAgo: 0.5,
        impact: { kausChange: 12.5, percentageReturn: 2.5 },
      },
      {
        type: 'MARKET_SCAN',
        params: {},
        hoursAgo: 1,
      },
      {
        type: 'OPPORTUNITY_DETECTED',
        params: { market: '호주', asset: '에너지', opportunity: '피크 시간대 가격 상승' },
        hoursAgo: 1.5,
      },
      {
        type: 'SLEEP_HARVEST',
        params: { earned: 8.7, bonus: 25 },
        hoursAgo: 3,
        impact: { kausChange: 8.7 },
      },
      {
        type: 'DIVIDEND_RECEIVED',
        params: { source: 'Sydney Energy Node #7', amount: 125.5 },
        hoursAgo: 6,
        impact: { kausChange: 125.5 },
      },
      {
        type: 'TRADE_EXECUTED',
        params: { fromAsset: 'Liquid K-AUS', toAsset: 'Compute Lending', amount: 2000 },
        hoursAgo: 8,
        impact: { kausChange: 45, percentageReturn: 2.25 },
      },
      {
        type: 'REBALANCE_SUGGESTED',
        params: { suggestion: 'Energy Swap 비중 5% 증가' },
        hoursAgo: 12,
      },
      {
        type: 'PERFORMANCE_UPDATE',
        params: { return: 3.2, kaus: 387 },
        hoursAgo: 24,
        impact: { kausChange: 387, percentageReturn: 3.2 },
      },
      {
        type: 'CARD_SETTLEMENT',
        params: { merchant: 'Aura Sydney', amount: 450, source: '스테이킹 보상' },
        hoursAgo: 28,
        impact: { kausChange: -182, percentageReturn: 0 },
      },
      {
        type: 'ENERGY_SWAP',
        params: { amount: 1000, price: 105.2, profit: 4.8 },
        hoursAgo: 36,
        impact: { kausChange: 48, percentageReturn: 4.8 },
      },
    ];

    activityData.forEach((data, index) => {
      const template = ACTIVITY_TEMPLATES[data.type](data.params);
      this.activities.push({
        id: `ACT-${String(100 - index).padStart(4, '0')}`,
        timestamp: new Date(Date.now() - data.hoursAgo * 3600000),
        type: data.type,
        title: template.title || '',
        description: template.description || '',
        impact: data.impact || {},
        priority: template.priority || 'MEDIUM',
        read: data.hoursAgo > 2,
      });
    });

    // Generate briefing
    this.briefings.push({
      id: 'BRIEF-001',
      timestamp: new Date(),
      headline: '호주 에너지 시장 강세 지속',
      summary:
        '지난 24시간 동안 호주 동부 그리드의 에너지 가격이 12% 상승했습니다. PAB는 이 기회를 포착하여 3건의 에너지 스왑을 실행, 총 +2.8%의 추가 수익을 창출했습니다.',
      keyMetrics: [
        { label: '24시간 수익', value: '+387 K-AUS', change: 3.2, trend: 'up' },
        { label: '에너지 가격', value: '98.5 AUD', change: 12, trend: 'up' },
        { label: '컴퓨트 수요', value: '78%', change: 5, trend: 'up' },
        { label: '포트폴리오 가치', value: '$308,750', change: 2.1, trend: 'up' },
      ],
      recommendations: [
        'Energy Swap 비중을 5% 증가시키는 것을 권장합니다',
        '오늘 밤 피크 시간대(19:00-22:00) 추가 스왑 기회 예상',
        '컴퓨트 렌딩 이자율이 상승 중 - 추가 배분 고려',
      ],
      marketOutlook: 'BULLISH',
    });

    this.status.totalActionsToday = 7;
    this.status.profitToday = 192.4;
    this.status.alertsCount = 2;
  }

  // Get PAB status
  getStatus(): PABStatus {
    return { ...this.status };
  }

  // Get user preferences
  getPreferences(userId: string): UserPreferences | undefined {
    return this.userPrefs.get(userId);
  }

  // Update preferences
  updatePreferences(userId: string, prefs: Partial<UserPreferences>): void {
    const current = this.userPrefs.get(userId);
    if (current) {
      this.userPrefs.set(userId, { ...current, ...prefs });
    }
  }

  // Get activity log
  getActivities(limit: number = 20, unreadOnly: boolean = false): ActivityLog[] {
    let activities = [...this.activities].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    if (unreadOnly) {
      activities = activities.filter((a) => !a.read);
    }

    return activities.slice(0, limit);
  }

  // Mark activity as read
  markAsRead(activityId: string): void {
    const activity = this.activities.find((a) => a.id === activityId);
    if (activity) {
      activity.read = true;
    }
  }

  // Mark all as read
  markAllAsRead(): void {
    this.activities.forEach((a) => (a.read = true));
  }

  // Get latest briefing
  getLatestBriefing(): AIBriefing | undefined {
    return this.briefings[0];
  }

  // Generate new activity
  logActivity(
    type: ActivityType,
    params: Record<string, unknown>,
    impact?: { kausChange?: number; percentageReturn?: number; usdEquivalent?: number }
  ): ActivityLog {
    const template = ACTIVITY_TEMPLATES[type](params);
    const activity: ActivityLog = {
      id: `ACT-${Date.now()}`,
      timestamp: new Date(),
      type,
      title: template.title || '',
      description: template.description || '',
      impact: impact || {},
      priority: template.priority || 'MEDIUM',
      read: false,
    };

    this.activities.unshift(activity);
    this.status.totalActionsToday++;

    if (impact?.kausChange && impact.kausChange > 0) {
      this.status.profitToday += impact.kausChange;
    }

    return activity;
  }

  // Generate voice briefing text
  generateVoiceBriefing(userId: string): string {
    const briefing = this.getLatestBriefing();
    const activities = this.getActivities(3);
    const portfolio = yieldStrategyEngine.getPortfolio(userId);

    if (!briefing || !portfolio) return '';

    const recentProfit = activities
      .filter((a) => a.impact?.kausChange && a.impact.kausChange > 0)
      .reduce((sum, a) => sum + (a.impact?.kausChange || 0), 0);

    return `
안녕하세요, ${userId}님. PAB 일일 브리핑입니다.

${briefing.headline}

최근 ${activities.length}건의 활동을 수행했으며, 총 ${recentProfit.toFixed(2)} K-AUS의 수익을 창출했습니다.

현재 포트폴리오 총 가치는 ${portfolio.totalKaus.toLocaleString()} K-AUS이며,
시장 전망은 ${briefing.marketOutlook === 'BULLISH' ? '긍정적' : briefing.marketOutlook === 'BEARISH' ? '부정적' : '중립'}입니다.

${briefing.recommendations[0]}

추가 지시가 있으시면 말씀해 주세요.
    `.trim();
  }

  // Simulate market scan
  performMarketScan(): ActivityLog {
    const market = yieldStrategyEngine.getMarketAnalysis();

    this.status.lastScan = new Date();
    this.status.currentTask = '시장 분석 완료';

    if (market.opportunity.opportunity > 0.6) {
      return this.logActivity('OPPORTUNITY_DETECTED', {
        market: '호주',
        asset: market.opportunity.bestTarget,
        opportunity: market.opportunity.reasoning,
      });
    }

    return this.logActivity('MARKET_SCAN', {});
  }

  // Calculate optimal settlement source
  calculateOptimalSettlement(
    userId: string,
    amount: number
  ): {
    source: 'DIVIDEND' | 'STAKING_REWARD' | 'LIQUID_KAUS' | 'CARD_BALANCE';
    kausNeeded: number;
    conversionFee: number;
    recommendation: string;
  } {
    const portfolio = yieldStrategyEngine.getPortfolio(userId);
    if (!portfolio) {
      return {
        source: 'LIQUID_KAUS',
        kausNeeded: amount / 2.47,
        conversionFee: 0,
        recommendation: '포트폴리오를 찾을 수 없습니다',
      };
    }

    const kausNeeded = amount / 2.47;
    const options = [
      {
        source: 'CARD_BALANCE' as const,
        available: portfolio.cardBalance,
        fee: 0,
        priority: 1,
      },
      {
        source: 'DIVIDEND' as const,
        available: portfolio.liquidKaus * 0.1, // Assume 10% is pending dividends
        fee: 0,
        priority: 2,
      },
      {
        source: 'STAKING_REWARD' as const,
        available: portfolio.stakedKaus * 0.01, // Monthly staking reward
        fee: 0.001,
        priority: 3,
      },
      {
        source: 'LIQUID_KAUS' as const,
        available: portfolio.liquidKaus,
        fee: 0.005,
        priority: 4,
      },
    ];

    // Find best source
    for (const option of options) {
      if (option.available >= kausNeeded) {
        return {
          source: option.source,
          kausNeeded,
          conversionFee: kausNeeded * option.fee,
          recommendation: `${option.source}에서 ${kausNeeded.toFixed(2)} K-AUS 사용 권장 (수수료: ${(option.fee * 100).toFixed(2)}%)`,
        };
      }
    }

    // Combine sources
    return {
      source: 'LIQUID_KAUS',
      kausNeeded,
      conversionFee: kausNeeded * 0.005,
      recommendation: '여러 소스를 조합하여 결제 금액을 충당합니다',
    };
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const pabIntelligence = new PABIntelligence();

// Convenience exports
export const getPABStatus = () => pabIntelligence.getStatus();
export const getActivities = (limit?: number, unreadOnly?: boolean) =>
  pabIntelligence.getActivities(limit, unreadOnly);
export const getLatestBriefing = () => pabIntelligence.getLatestBriefing();
export const markActivityAsRead = (id: string) => pabIntelligence.markAsRead(id);
export const generateVoiceBriefing = (userId: string) => pabIntelligence.generateVoiceBriefing(userId);
export const performMarketScan = () => pabIntelligence.performMarketScan();
export const calculateOptimalSettlement = (userId: string, amount: number) =>
  pabIntelligence.calculateOptimalSettlement(userId, amount);
export const getPreferences = (userId: string) => pabIntelligence.getPreferences(userId);
export const updatePreferences = (userId: string, prefs: Partial<UserPreferences>) =>
  pabIntelligence.updatePreferences(userId, prefs);
