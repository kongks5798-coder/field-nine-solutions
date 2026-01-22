'use client';

/**
 * ADVANCED SOVEREIGN WALLET - PAB EDITION
 *
 * Phase 19 Deliverable 2:
 * AI 비서의 실시간 보고가 포함된 Advanced Sovereign Wallet 레이아웃
 *
 * "이제 필드나인은 도구를 넘어 '동반자'가 된다"
 */

import React, { useState, useEffect, useCallback } from 'react';

// ============================================
// TYPES
// ============================================

type RiskProfile = 'CONSERVATIVE' | 'GROWTH' | 'MAX_ALPHA';
type ActivityType = 'MARKET_SCAN' | 'OPPORTUNITY_DETECTED' | 'TRADE_EXECUTED' | 'REBALANCE_SUGGESTED' | 'DIVIDEND_RECEIVED' | 'CARD_SETTLEMENT' | 'RISK_ALERT' | 'PERFORMANCE_UPDATE' | 'SLEEP_HARVEST' | 'ENERGY_SWAP';

interface Activity {
  id: string;
  timestamp: Date;
  type: ActivityType;
  title: string;
  description: string;
  impact: {
    kausChange?: number;
    percentageReturn?: number;
  };
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  read: boolean;
}

interface Briefing {
  headline: string;
  summary: string;
  keyMetrics: { label: string; value: string; change?: number; trend?: 'up' | 'down' | 'stable' }[];
  recommendations: string[];
  marketOutlook: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
}

interface PABStatus {
  isActive: boolean;
  currentTask: string;
  lastScan: Date;
  nextScheduledAction: Date;
  totalActionsToday: number;
  profitToday: number;
  alertsCount: number;
}

interface HarvestSession {
  deviceId: string;
  deviceType: string;
  status: string;
  earnings: { totalKaus: number };
}

// ============================================
// MOCK DATA
// ============================================

const KAUS_PRICE = 2.47;

const mockStatus: PABStatus = {
  isActive: true,
  currentTask: '시장 모니터링 중',
  lastScan: new Date(Date.now() - 5 * 60000),
  nextScheduledAction: new Date(Date.now() + 5 * 60000),
  totalActionsToday: 7,
  profitToday: 192.4,
  alertsCount: 2,
};

const mockBriefing: Briefing = {
  headline: '호주 에너지 시장 강세 지속',
  summary: '지난 24시간 동안 호주 동부 그리드의 에너지 가격이 12% 상승했습니다. PAB는 이 기회를 포착하여 3건의 에너지 스왑을 실행, 총 +2.8%의 추가 수익을 창출했습니다.',
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
};

const mockActivities: Activity[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 30 * 60000),
    type: 'ENERGY_SWAP',
    title: '에너지 스왑 실행',
    description: '호주 에너지 가격 상승을 포착하여 500 K-AUS를 스왑해 +2.5% 수익을 냈습니다',
    impact: { kausChange: 12.5, percentageReturn: 2.5 },
    priority: 'HIGH',
    read: false,
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 60 * 60000),
    type: 'MARKET_SCAN',
    title: '시장 스캔 완료',
    description: '글로벌 에너지 시장 및 컴퓨트 수요 분석 완료',
    impact: {},
    priority: 'LOW',
    read: true,
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 3 * 3600000),
    type: 'SLEEP_HARVEST',
    title: '슬립 하베스트 완료',
    description: '야간 유휴 자원 수확: 8.7 K-AUS (+25% 보너스)',
    impact: { kausChange: 8.7 },
    priority: 'MEDIUM',
    read: true,
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 6 * 3600000),
    type: 'DIVIDEND_RECEIVED',
    title: '배당금 수령',
    description: 'Sydney Energy Node #7에서 125.5 K-AUS 배당금 입금',
    impact: { kausChange: 125.5 },
    priority: 'MEDIUM',
    read: true,
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 8 * 3600000),
    type: 'TRADE_EXECUTED',
    title: '거래 실행 완료',
    description: 'Liquid K-AUS에서 Compute Lending으로 2,000 K-AUS 전환',
    impact: { kausChange: 45, percentageReturn: 2.25 },
    priority: 'HIGH',
    read: true,
  },
];

const mockPortfolio = {
  totalKaus: 125000,
  stakedKaus: 75000,
  liquidKaus: 35000,
  energyNodeShares: 15,
  computeCredits: 5000,
  cardBalance: 15000,
  riskProfile: 'GROWTH' as RiskProfile,
};

const mockHarvestSessions: HarvestSession[] = [
  { deviceId: 'DEV-001', deviceType: 'DESKTOP', status: 'ACTIVE', earnings: { totalKaus: 2.855 } },
  { deviceId: 'DEV-003', deviceType: 'SMARTPHONE', status: 'ACTIVE', earnings: { totalKaus: 0.42 } },
];

// ============================================
// COMPONENTS
// ============================================

function PABStatusBadge({ status }: { status: PABStatus }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${status.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
      <span className="text-sm text-gray-300">{status.currentTask}</span>
    </div>
  );
}

function AIBriefingCard({ briefing }: { briefing: Briefing }) {
  const outlookColors = {
    BULLISH: 'text-green-400',
    NEUTRAL: 'text-yellow-400',
    BEARISH: 'text-red-400',
  };

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-white/10">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs text-cyan-400 mb-1">AI 브리핑</div>
          <h3 className="text-xl font-bold">{briefing.headline}</h3>
        </div>
        <div className={`text-sm font-medium ${outlookColors[briefing.marketOutlook]}`}>
          {briefing.marketOutlook === 'BULLISH' ? '📈 강세' : briefing.marketOutlook === 'BEARISH' ? '📉 약세' : '➡️ 중립'}
        </div>
      </div>

      <p className="text-sm text-gray-300 mb-4">{briefing.summary}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {briefing.keyMetrics.map((metric, i) => (
          <div key={i} className="p-3 rounded-xl bg-white/5">
            <div className="text-xs text-gray-400">{metric.label}</div>
            <div className="font-bold">{metric.value}</div>
            {metric.change !== undefined && (
              <div className={`text-xs ${metric.trend === 'up' ? 'text-green-400' : metric.trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
                {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'} {metric.change}%
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="text-xs text-gray-400 mb-1">AI 추천</div>
        {briefing.recommendations.map((rec, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span className="text-cyan-400">•</span>
            <span className="text-gray-300">{rec}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveActivityLog({ activities }: { activities: Activity[] }) {
  const typeIcons: Record<ActivityType, string> = {
    MARKET_SCAN: '🔍',
    OPPORTUNITY_DETECTED: '💡',
    TRADE_EXECUTED: '✅',
    REBALANCE_SUGGESTED: '⚖️',
    DIVIDEND_RECEIVED: '💰',
    CARD_SETTLEMENT: '💳',
    RISK_ALERT: '⚠️',
    PERFORMANCE_UPDATE: '📊',
    SLEEP_HARVEST: '🌙',
    ENERGY_SWAP: '⚡',
  };

  const priorityColors = {
    LOW: 'border-gray-500/30',
    MEDIUM: 'border-blue-500/30',
    HIGH: 'border-green-500/30',
    CRITICAL: 'border-red-500/30',
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;

    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-cyan-400">📡 실시간 활동 로그</h3>
        <span className="text-xs text-gray-400">자동 갱신</span>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className={`p-4 rounded-xl bg-white/5 border-l-4 ${priorityColors[activity.priority]} ${!activity.read ? 'ring-1 ring-cyan-500/30' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{typeIcons[activity.type]}</span>
                <div>
                  <div className="font-medium">{activity.title}</div>
                  <div className="text-sm text-gray-400">{activity.description}</div>
                  {activity.impact.kausChange !== undefined && (
                    <div className={`text-sm mt-1 ${activity.impact.kausChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {activity.impact.kausChange >= 0 ? '+' : ''}{activity.impact.kausChange.toFixed(2)} K-AUS
                      {activity.impact.percentageReturn !== undefined && (
                        <span className="text-gray-400 ml-2">
                          ({activity.impact.percentageReturn >= 0 ? '+' : ''}{activity.impact.percentageReturn}%)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500">{formatTime(activity.timestamp)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PortfolioOverview({ portfolio }: { portfolio: typeof mockPortfolio }) {
  const totalValueUSD = portfolio.totalKaus * KAUS_PRICE;

  const allocation = [
    { name: 'Staked', value: portfolio.stakedKaus, color: 'bg-purple-500' },
    { name: 'Liquid', value: portfolio.liquidKaus, color: 'bg-cyan-500' },
    { name: 'Card', value: portfolio.cardBalance, color: 'bg-green-500' },
    { name: 'Compute', value: portfolio.computeCredits, color: 'bg-orange-500' },
  ];

  const total = allocation.reduce((sum, a) => sum + a.value, 0);

  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
      <h3 className="text-lg font-bold mb-4">💼 포트폴리오 개요</h3>

      <div className="text-center mb-6">
        <div className="text-sm text-gray-400 mb-1">총 자산 가치</div>
        <div className="text-4xl font-black text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text">
          ${totalValueUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
        <div className="text-lg text-gray-300 mt-1">
          {portfolio.totalKaus.toLocaleString()} K-AUS
        </div>
      </div>

      <div className="h-3 rounded-full overflow-hidden flex mb-4">
        {allocation.map((a, i) => (
          <div
            key={i}
            className={`${a.color} transition-all`}
            style={{ width: `${(a.value / total) * 100}%` }}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {allocation.map((a, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${a.color}`} />
            <span className="text-gray-400">{a.name}</span>
            <span className="ml-auto font-medium">{((a.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
        <span className="text-sm text-gray-400">리스크 프로필</span>
        <span className={`text-sm font-bold ${
          portfolio.riskProfile === 'CONSERVATIVE' ? 'text-blue-400' :
          portfolio.riskProfile === 'GROWTH' ? 'text-green-400' : 'text-orange-400'
        }`}>
          {portfolio.riskProfile === 'CONSERVATIVE' ? '🛡️ 보수적' :
           portfolio.riskProfile === 'GROWTH' ? '📈 성장' : '🚀 공격적'}
        </span>
      </div>
    </div>
  );
}

function BackgroundHarvestWidget({ sessions }: { sessions: HarvestSession[] }) {
  const deviceIcons: Record<string, string> = {
    DESKTOP: '🖥️',
    LAPTOP: '💻',
    SMARTPHONE: '📱',
    TABLET: '📲',
    ROUTER: '📡',
    NAS: '💾',
  };

  const totalEarning = sessions.reduce((sum, s) => sum + s.earnings.totalKaus, 0);

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-emerald-400">🌙 백그라운드 하베스트</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-400">{sessions.length}개 활성</span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {sessions.map((session) => (
          <div key={session.deviceId} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{deviceIcons[session.deviceType]}</span>
              <div>
                <div className="text-sm font-medium">{session.deviceId}</div>
                <div className="text-xs text-gray-400">{session.deviceType}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-green-400">+{session.earnings.totalKaus.toFixed(3)} K-AUS</div>
              <div className="text-xs text-gray-400">수확 중</div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-white/10 text-center">
        <div className="text-sm text-gray-400">현재 세션 수익</div>
        <div className="text-2xl font-bold text-emerald-400">
          +{totalEarning.toFixed(3)} K-AUS
        </div>
        <div className="text-xs text-gray-500">
          ≈ ${(totalEarning * KAUS_PRICE).toFixed(2)} USD
        </div>
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { icon: '⚡', label: '에너지 스왑', desc: '최적 가격에 스왑' },
    { icon: '📊', label: '리밸런싱', desc: 'AI 추천 실행' },
    { icon: '💳', label: '카드 충전', desc: '자동 최적화' },
    { icon: '🌙', label: '슬립 모드', desc: '야간 하베스트' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((action, i) => (
        <button
          key={i}
          className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all text-left"
        >
          <span className="text-2xl">{action.icon}</span>
          <div className="font-medium mt-2">{action.label}</div>
          <div className="text-xs text-gray-400">{action.desc}</div>
        </button>
      ))}
    </div>
  );
}

function TodaysSummary({ status }: { status: PABStatus }) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
      <h3 className="text-lg font-bold mb-4">📅 오늘의 요약</h3>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-cyan-400">{status.totalActionsToday}</div>
          <div className="text-xs text-gray-400">실행된 액션</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-green-400">+{status.profitToday.toFixed(1)}</div>
          <div className="text-xs text-gray-400">K-AUS 수익</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-yellow-400">{status.alertsCount}</div>
          <div className="text-xs text-gray-400">알림</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">마지막 스캔</span>
          <span>{new Date(status.lastScan).toLocaleTimeString('ko-KR')}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-400">다음 예정 액션</span>
          <span>{new Date(status.nextScheduledAction).toLocaleTimeString('ko-KR')}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function AdvancedSovereignWalletPage() {
  const [status] = useState<PABStatus>(mockStatus);
  const [briefing] = useState<Briefing>(mockBriefing);
  const [activities] = useState<Activity[]>(mockActivities);
  const [portfolio] = useState(mockPortfolio);
  const [harvestSessions] = useState<HarvestSession[]>(mockHarvestSessions);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-xl">
                  🤖
                </div>
                <div>
                  <h1 className="text-xl font-bold">Personal AI Banker</h1>
                  <PABStatusBadge status={status} />
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono">{currentTime.toLocaleTimeString('ko-KR')}</div>
              <div className="text-xs text-gray-400">{currentTime.toLocaleDateString('ko-KR', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* AI Briefing */}
        <section>
          <AIBriefingCard briefing={briefing} />
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-bold mb-4">⚡ 빠른 액션</h2>
          <QuickActions />
        </section>

        {/* Main Grid */}
        <section className="grid md:grid-cols-3 gap-6">
          {/* Left: Portfolio & Summary */}
          <div className="space-y-6">
            <PortfolioOverview portfolio={portfolio} />
            <TodaysSummary status={status} />
          </div>

          {/* Center: Activity Log */}
          <div className="md:col-span-1">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 h-full">
              <LiveActivityLog activities={activities} />
            </div>
          </div>

          {/* Right: Harvest Widget */}
          <div>
            <BackgroundHarvestWidget sessions={harvestSessions} />
          </div>
        </section>

        {/* Performance Banner */}
        <section className="p-6 rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">이번 달 성과</h3>
              <p className="text-sm text-gray-400">PAB가 자동으로 운용 중</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-green-400">+3.2%</div>
              <div className="text-sm text-gray-400">+387 K-AUS</div>
            </div>
          </div>
          <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
              style={{ width: '68%' }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>목표 대비 68%</span>
            <span>목표: +5% / 월</span>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="text-center py-8">
          <div className="inline-block p-8 rounded-3xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-white/10">
            <div className="text-4xl mb-4">🤝</div>
            <h2 className="text-2xl font-bold mb-2">당신의 AI 동반자</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              PAB는 24시간 시장을 모니터링하고, 최적의 타이밍에 거래를 실행하며,
              당신의 자산이 쉬지 않고 일하게 합니다.
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold hover:opacity-90 transition">
                🎯 전략 설정
              </button>
              <button className="px-6 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20 transition">
                📊 상세 리포트
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
          <p>Field Nine Solutions • Personal AI Banker • Phase 19</p>
          <p className="mt-1">이제 필드나인은 도구를 넘어 '동반자'가 된다</p>
        </div>
      </footer>
    </div>
  );
}
