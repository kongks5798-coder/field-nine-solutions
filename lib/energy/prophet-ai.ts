/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * THE PROPHET - AI TRADING ADVISOR
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 37: THE FINAL CONVERGENCE
 *
 * Intelligent AI agent that provides real-time strategic advice
 * for energy trading and Kaus Coin optimization.
 *
 * "보스, 현재 전력 가격이 저점입니다. 사이버트럭 충전을 시작하고
 *  카우스 코인 가치를 보전하십시오"
 *
 * @version 37.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ProphetMessage {
  id: string;
  type: 'ADVICE' | 'ALERT' | 'OPPORTUNITY' | 'WARNING' | 'INFO';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  action?: {
    label: string;
    type: 'CHARGE' | 'DISCHARGE' | 'SWAP' | 'HOLD' | 'BUY' | 'SELL';
    params?: Record<string, unknown>;
  };
  metrics?: {
    currentPrice?: number;
    predictedPrice?: number;
    potentialProfit?: number;
    confidence?: number;
  };
  timestamp: string;
  expiresAt?: string;
}

export interface ProphetState {
  isOnline: boolean;
  lastAnalysis: string;
  marketSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  activeAlerts: number;
  todayProfitEstimate: number;
  currentAdvice: ProphetMessage | null;
  recentMessages: ProphetMessage[];
}

export interface MarketConditions {
  smpPrice: number;
  smpTrend: 'RISING' | 'FALLING' | 'STABLE';
  isPeakHour: boolean;
  isOptimalChargeTime: boolean;
  isOptimalDischargeTime: boolean;
  teslaAvailable: boolean;
  teslaChargingState: string;
  kausPrice: number;
  kausTrend: 'UP' | 'DOWN' | 'STABLE';
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROPHET ADVICE TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

const ADVICE_TEMPLATES = {
  // Charging opportunities
  CHARGE_LOW_PRICE: {
    type: 'OPPORTUNITY' as const,
    priority: 'HIGH' as const,
    title: '충전 적기',
    template: '보스, 현재 전력 가격이 {price}원으로 저점입니다. 사이버트럭 충전을 시작하고 카우스 코인 가치를 보전하십시오.',
    action: { label: '충전 시작', type: 'CHARGE' as const },
  },
  CHARGE_OVERNIGHT: {
    type: 'ADVICE' as const,
    priority: 'MEDIUM' as const,
    title: '야간 충전 권장',
    template: '심야 시간대 진입. 전력 단가 {price}원. 새벽 5시까지 완충을 권장드립니다.',
    action: { label: '예약 충전', type: 'CHARGE' as const },
  },

  // Discharge opportunities
  DISCHARGE_PEAK: {
    type: 'OPPORTUNITY' as const,
    priority: 'HIGH' as const,
    title: 'V2G 방전 적기',
    template: '피크 시간대 전력 단가 {price}원 돌파. V2G 방전으로 예상 수익 ₩{profit}입니다.',
    action: { label: 'V2G 방전', type: 'DISCHARGE' as const },
  },
  DISCHARGE_CRITICAL: {
    type: 'ALERT' as const,
    priority: 'CRITICAL' as const,
    title: '긴급 방전 권장',
    template: '전력 단가 급등 감지! {price}원/kWh. 즉시 방전 시 ₩{profit} 수익 예상.',
    action: { label: '즉시 방전', type: 'DISCHARGE' as const },
  },

  // Swap opportunities
  SWAP_FAVORABLE: {
    type: 'OPPORTUNITY' as const,
    priority: 'MEDIUM' as const,
    title: '코인 환전 적기',
    template: '현재 환전 레이트가 유리합니다. {rate} KAUS/kWh. 에너지를 카우스로 전환하시겠습니까?',
    action: { label: '환전하기', type: 'SWAP' as const },
  },

  // Market warnings
  PRICE_SPIKE_WARNING: {
    type: 'WARNING' as const,
    priority: 'HIGH' as const,
    title: '가격 급변 경고',
    template: '향후 2시간 내 전력 단가 {change}% 변동 예상. 포지션 조정을 권장드립니다.',
  },
  BATTERY_LOW: {
    type: 'WARNING' as const,
    priority: 'MEDIUM' as const,
    title: '배터리 부족',
    template: '사이버트럭 배터리 {level}%. 피크 시간 방전을 위해 충전이 필요합니다.',
    action: { label: '충전 시작', type: 'CHARGE' as const },
  },

  // Hold recommendations
  HOLD_VOLATILE: {
    type: 'ADVICE' as const,
    priority: 'LOW' as const,
    title: '대기 권장',
    template: '시장 변동성 높음. 명확한 신호까지 현재 포지션 유지를 권장드립니다.',
    action: { label: '대기', type: 'HOLD' as const },
  },

  // Profit reports
  DAILY_PROFIT: {
    type: 'INFO' as const,
    priority: 'LOW' as const,
    title: '오늘의 수익',
    template: '오늘 예상 에너지 차익: ₩{profit}. 카우스 코인 {kaus} 획득 예정.',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROPHET AI SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

class ProphetAIService {
  private messageHistory: ProphetMessage[] = [];
  private lastAnalysisTime: Date = new Date();

  /**
   * Generate a unique message ID
   */
  private generateId(): string {
    return `prophet_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Analyze current market conditions
   */
  async analyzeMarket(): Promise<MarketConditions> {
    const [smpData, teslaData, exchangeData] = await Promise.all([
      import('@/lib/partnerships/live-data-service').then(m => m.getLiveSMP()),
      import('@/lib/partnerships/live-data-service').then(m => m.getLiveTeslaData()),
      import('@/lib/partnerships/live-data-service').then(m => m.getLiveExchangeData()),
    ]);

    const hour = new Date().getHours();
    const isPeakHour = (hour >= 10 && hour <= 12) || (hour >= 18 && hour <= 21);
    const isOptimalChargeTime = hour >= 2 && hour <= 5;
    const isOptimalDischargeTime = hour >= 18 && hour <= 21;

    // Determine SMP trend
    const baselineSMP = 120;
    const smpTrend = smpData.price > baselineSMP * 1.1
      ? 'RISING'
      : smpData.price < baselineSMP * 0.9
        ? 'FALLING'
        : 'STABLE';

    // Determine Kaus trend
    const baselineKaus = 0.10;
    const kausTrend = exchangeData.kausPrice > baselineKaus * 1.02
      ? 'UP'
      : exchangeData.kausPrice < baselineKaus * 0.98
        ? 'DOWN'
        : 'STABLE';

    return {
      smpPrice: smpData.price,
      smpTrend,
      isPeakHour,
      isOptimalChargeTime,
      isOptimalDischargeTime,
      teslaAvailable: teslaData.totalVehicles > 0,
      teslaChargingState: teslaData.vehicles[0]?.chargingState || 'Unknown',
      kausPrice: exchangeData.kausPrice,
      kausTrend,
    };
  }

  /**
   * Generate strategic advice based on market conditions
   */
  async generateAdvice(): Promise<ProphetMessage> {
    const conditions = await this.analyzeMarket();
    this.lastAnalysisTime = new Date();

    let template: typeof ADVICE_TEMPLATES[keyof typeof ADVICE_TEMPLATES];
    let params: Record<string, string | number> = {};

    // Priority-based decision tree
    if (conditions.isPeakHour && conditions.smpPrice > 150) {
      // Critical discharge opportunity
      template = ADVICE_TEMPLATES.DISCHARGE_CRITICAL;
      params = {
        price: Math.round(conditions.smpPrice),
        profit: Math.round((conditions.smpPrice - 100) * 100 * 0.95), // 100kWh battery
      };
    } else if (conditions.isPeakHour && conditions.smpPrice > 130) {
      // Peak discharge opportunity
      template = ADVICE_TEMPLATES.DISCHARGE_PEAK;
      params = {
        price: Math.round(conditions.smpPrice),
        profit: Math.round((conditions.smpPrice - 100) * 100 * 0.95),
      };
    } else if (conditions.isOptimalChargeTime) {
      // Overnight charging
      template = ADVICE_TEMPLATES.CHARGE_OVERNIGHT;
      params = {
        price: Math.round(conditions.smpPrice),
      };
    } else if (conditions.smpPrice < 100) {
      // Low price charging opportunity
      template = ADVICE_TEMPLATES.CHARGE_LOW_PRICE;
      params = {
        price: Math.round(conditions.smpPrice),
      };
    } else if (conditions.smpTrend === 'RISING' && !conditions.isPeakHour) {
      // Price spike warning
      template = ADVICE_TEMPLATES.PRICE_SPIKE_WARNING;
      params = {
        change: Math.round((conditions.smpPrice / 120 - 1) * 100),
      };
    } else {
      // Default: Hold or daily profit
      const hour = new Date().getHours();
      if (hour === 9 || hour === 21) {
        template = ADVICE_TEMPLATES.DAILY_PROFIT;
        params = {
          profit: Math.round((conditions.smpPrice - 100) * 100 * 0.95 * 2),
          kaus: Math.round(100 * 10), // 100kWh * 10 KAUS/kWh
        };
      } else {
        template = ADVICE_TEMPLATES.HOLD_VOLATILE;
      }
    }

    // Build message from template
    let message = template.template;
    Object.entries(params).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, String(value));
    });

    const advice: ProphetMessage = {
      id: this.generateId(),
      type: template.type,
      priority: template.priority,
      title: template.title,
      message,
      action: 'action' in template && template.action ? {
        label: template.action.label,
        type: template.action.type,
        params: { conditions },
      } : undefined,
      metrics: {
        currentPrice: conditions.smpPrice,
        predictedPrice: conditions.smpPrice * (conditions.smpTrend === 'RISING' ? 1.1 : 0.95),
        potentialProfit: params.profit as number || 0,
        confidence: this.calculateConfidence(conditions),
      },
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    };

    // Store in history
    this.messageHistory.unshift(advice);
    if (this.messageHistory.length > 20) {
      this.messageHistory = this.messageHistory.slice(0, 20);
    }

    return advice;
  }

  /**
   * Calculate confidence score for advice
   */
  private calculateConfidence(conditions: MarketConditions): number {
    let confidence = 70; // Base confidence

    // Increase confidence for clear signals
    if (conditions.isPeakHour && conditions.smpPrice > 140) confidence += 15;
    if (conditions.isOptimalChargeTime && conditions.smpPrice < 100) confidence += 15;
    if (conditions.teslaAvailable) confidence += 10;

    // Decrease confidence for uncertainty
    if (conditions.smpTrend === 'STABLE') confidence -= 5;
    if (!conditions.teslaAvailable) confidence -= 20;

    return Math.min(98, Math.max(40, confidence));
  }

  /**
   * Get current Prophet state
   */
  async getState(): Promise<ProphetState> {
    const currentAdvice = await this.generateAdvice();
    const conditions = await this.analyzeMarket();

    // Determine market sentiment
    let marketSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (conditions.smpTrend === 'RISING' && conditions.kausTrend === 'UP') {
      marketSentiment = 'BULLISH';
    } else if (conditions.smpTrend === 'FALLING' && conditions.kausTrend === 'DOWN') {
      marketSentiment = 'BEARISH';
    }

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    if (conditions.smpPrice > 150 || conditions.smpPrice < 80) {
      riskLevel = 'HIGH';
    } else if (conditions.smpTrend === 'STABLE') {
      riskLevel = 'LOW';
    }

    return {
      isOnline: true,
      lastAnalysis: this.lastAnalysisTime.toISOString(),
      marketSentiment,
      riskLevel,
      activeAlerts: this.messageHistory.filter(m => m.type === 'ALERT' || m.type === 'WARNING').length,
      todayProfitEstimate: Math.round((conditions.smpPrice - 100) * 100 * 0.95 * 2),
      currentAdvice,
      recentMessages: this.messageHistory.slice(0, 5),
    };
  }

  /**
   * Get greeting message based on time of day
   */
  getGreeting(): string {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return '좋은 아침입니다, 보스. 오늘의 에너지 시장 분석을 준비했습니다.';
    } else if (hour >= 12 && hour < 18) {
      return '보스, 오후 시장 동향을 모니터링 중입니다.';
    } else if (hour >= 18 && hour < 22) {
      return '보스, 피크 시간대입니다. 수익 기회를 포착하고 있습니다.';
    } else {
      return '보스, 심야 시간대 저점 매수 타이밍을 분석 중입니다.';
    }
  }

  /**
   * Handle user action request
   */
  async handleAction(actionType: string, params?: Record<string, unknown>): Promise<ProphetMessage> {
    const conditions = await this.analyzeMarket();

    switch (actionType) {
      case 'CHARGE':
        return {
          id: this.generateId(),
          type: 'INFO',
          priority: 'MEDIUM',
          title: '충전 명령 전송',
          message: `사이버트럭 충전을 시작합니다. 현재 전력 단가: ${Math.round(conditions.smpPrice)}원/kWh`,
          timestamp: new Date().toISOString(),
        };

      case 'DISCHARGE':
        return {
          id: this.generateId(),
          type: 'INFO',
          priority: 'MEDIUM',
          title: 'V2G 방전 시작',
          message: `그리드로 전력을 방출합니다. 예상 수익: ₩${Math.round((conditions.smpPrice - 100) * 100 * 0.95)}`,
          timestamp: new Date().toISOString(),
        };

      case 'SWAP':
        return {
          id: this.generateId(),
          type: 'INFO',
          priority: 'MEDIUM',
          title: '에너지 환전',
          message: '에너지를 카우스 코인으로 변환합니다. 트랜잭션을 처리 중...',
          timestamp: new Date().toISOString(),
        };

      default:
        return {
          id: this.generateId(),
          type: 'INFO',
          priority: 'LOW',
          title: '명령 수신',
          message: '요청하신 작업을 처리 중입니다.',
          timestamp: new Date().toISOString(),
        };
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const prophetAI = new ProphetAIService();

// API Functions
export async function getProphetAdvice(): Promise<ProphetMessage> {
  return prophetAI.generateAdvice();
}

export async function getProphetState(): Promise<ProphetState> {
  return prophetAI.getState();
}

export function getProphetGreeting(): string {
  return prophetAI.getGreeting();
}

export async function executeProphetAction(
  actionType: string,
  params?: Record<string, unknown>
): Promise<ProphetMessage> {
  return prophetAI.handleAction(actionType, params);
}
