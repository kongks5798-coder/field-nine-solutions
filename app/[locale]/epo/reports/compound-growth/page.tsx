'use client';

/**
 * COMPOUND GROWTH SIMULATION REPORT
 *
 * Phase 19 Deliverable 1:
 * AI 뱅커 가동 시 예상되는 유저 자산 복리 증식 시뮬레이션
 *
 * "복리의 마법, AI가 실현합니다"
 */

import React, { useState, useEffect, useMemo } from 'react';

// ============================================
// TYPES
// ============================================

type RiskProfile = 'CONSERVATIVE' | 'GROWTH' | 'MAX_ALPHA';

interface YearlyData {
  year: number;
  startValue: number;
  endValue: number;
  energySwapReturn: number;
  computeLendingReturn: number;
  stakingReturn: number;
  harvestReturn: number;
  totalReturn: number;
  cumulativeReturn: number;
}

interface SimulationParams {
  initialAmount: number;
  riskProfile: RiskProfile;
  years: number;
  monthlyContribution: number;
  harvestHoursPerDay: number;
}

interface StrategyAllocation {
  energySwap: number;
  computeLending: number;
  staking: number;
  liquidityPool: number;
  cardReserve: number;
}

// ============================================
// CONSTANTS
// ============================================

const KAUS_PRICE = 2.47;

const STRATEGY_ALLOCATIONS: Record<RiskProfile, StrategyAllocation> = {
  CONSERVATIVE: {
    energySwap: 0.15,
    computeLending: 0.10,
    staking: 0.50,
    liquidityPool: 0.05,
    cardReserve: 0.20,
  },
  GROWTH: {
    energySwap: 0.25,
    computeLending: 0.25,
    staking: 0.30,
    liquidityPool: 0.10,
    cardReserve: 0.10,
  },
  MAX_ALPHA: {
    energySwap: 0.35,
    computeLending: 0.35,
    staking: 0.15,
    liquidityPool: 0.10,
    cardReserve: 0.05,
  },
};

const BASE_YIELDS: Record<string, number> = {
  energySwap: 0.18,
  computeLending: 0.22,
  staking: 0.12,
  liquidityPool: 0.25,
  cardReserve: 0.03,
};

const HARVEST_DAILY_RATE = 0.00015; // K-AUS per 1000 K-AUS staked per hour

const PROFILE_NAMES: Record<RiskProfile, { name: string; icon: string; color: string }> = {
  CONSERVATIVE: { name: '보수적', icon: '🛡️', color: 'text-blue-400' },
  GROWTH: { name: '성장', icon: '📈', color: 'text-green-400' },
  MAX_ALPHA: { name: '공격적', icon: '🚀', color: 'text-orange-400' },
};

// ============================================
// SIMULATION FUNCTIONS
// ============================================

function runSimulation(params: SimulationParams): YearlyData[] {
  const { initialAmount, riskProfile, years, monthlyContribution, harvestHoursPerDay } = params;
  const allocation = STRATEGY_ALLOCATIONS[riskProfile];
  const results: YearlyData[] = [];

  let currentValue = initialAmount;

  for (let year = 0; year <= years; year++) {
    const startValue = currentValue;

    if (year === 0) {
      results.push({
        year,
        startValue,
        endValue: startValue,
        energySwapReturn: 0,
        computeLendingReturn: 0,
        stakingReturn: 0,
        harvestReturn: 0,
        totalReturn: 0,
        cumulativeReturn: 0,
      });
      continue;
    }

    // Calculate returns for each allocation
    const energySwapReturn = currentValue * allocation.energySwap * BASE_YIELDS.energySwap * (0.8 + Math.random() * 0.4);
    const computeLendingReturn = currentValue * allocation.computeLending * BASE_YIELDS.computeLending * (0.8 + Math.random() * 0.4);
    const stakingReturn = currentValue * allocation.staking * BASE_YIELDS.staking * (0.9 + Math.random() * 0.2);
    const lpReturn = currentValue * allocation.liquidityPool * BASE_YIELDS.liquidityPool * (0.6 + Math.random() * 0.8);

    // Background harvest return
    const harvestReturn = (currentValue / 1000) * HARVEST_DAILY_RATE * harvestHoursPerDay * 365;

    // Monthly contributions
    const yearlyContribution = monthlyContribution * 12;

    const totalReturn = energySwapReturn + computeLendingReturn + stakingReturn + lpReturn + harvestReturn;
    currentValue = currentValue + totalReturn + yearlyContribution;

    results.push({
      year,
      startValue,
      endValue: currentValue,
      energySwapReturn,
      computeLendingReturn,
      stakingReturn,
      harvestReturn,
      totalReturn,
      cumulativeReturn: currentValue - initialAmount - yearlyContribution * year,
    });
  }

  return results;
}

// ============================================
// COMPONENTS
// ============================================

function ParamsPanel({
  params,
  onChange,
}: {
  params: SimulationParams;
  onChange: (params: SimulationParams) => void;
}) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
      <h3 className="text-lg font-bold text-cyan-400">⚙️ 시뮬레이션 파라미터</h3>

      {/* Initial Amount */}
      <div>
        <label className="text-sm text-gray-400 block mb-2">초기 투자금 (K-AUS)</label>
        <input
          type="number"
          value={params.initialAmount}
          onChange={(e) => onChange({ ...params, initialAmount: parseInt(e.target.value) || 0 })}
          className="w-full p-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-500 outline-none"
        />
        <div className="text-xs text-gray-500 mt-1">
          ≈ ${(params.initialAmount * KAUS_PRICE).toLocaleString()} USD
        </div>
      </div>

      {/* Risk Profile */}
      <div>
        <label className="text-sm text-gray-400 block mb-2">투자 전략</label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(PROFILE_NAMES) as RiskProfile[]).map((profile) => (
            <button
              key={profile}
              onClick={() => onChange({ ...params, riskProfile: profile })}
              className={`p-3 rounded-xl border transition-all ${
                params.riskProfile === profile
                  ? 'bg-white/20 border-cyan-500'
                  : 'bg-white/5 border-white/10 hover:border-white/30'
              }`}
            >
              <div className="text-2xl">{PROFILE_NAMES[profile].icon}</div>
              <div className={`text-sm font-medium ${PROFILE_NAMES[profile].color}`}>
                {PROFILE_NAMES[profile].name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Years */}
      <div>
        <label className="text-sm text-gray-400 block mb-2">투자 기간: {params.years}년</label>
        <input
          type="range"
          min="1"
          max="20"
          value={params.years}
          onChange={(e) => onChange({ ...params, years: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1년</span>
          <span>10년</span>
          <span>20년</span>
        </div>
      </div>

      {/* Monthly Contribution */}
      <div>
        <label className="text-sm text-gray-400 block mb-2">월 적립금 (K-AUS)</label>
        <input
          type="number"
          value={params.monthlyContribution}
          onChange={(e) => onChange({ ...params, monthlyContribution: parseInt(e.target.value) || 0 })}
          className="w-full p-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-500 outline-none"
        />
      </div>

      {/* Harvest Hours */}
      <div>
        <label className="text-sm text-gray-400 block mb-2">일일 하베스트 시간: {params.harvestHoursPerDay}시간</label>
        <input
          type="range"
          min="0"
          max="24"
          value={params.harvestHoursPerDay}
          onChange={(e) => onChange({ ...params, harvestHoursPerDay: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </div>
    </div>
  );
}

function ResultsSummary({ data, params }: { data: YearlyData[]; params: SimulationParams }) {
  const finalData = data[data.length - 1];
  const totalInvested = params.initialAmount + params.monthlyContribution * 12 * params.years;
  const totalReturn = finalData.endValue - totalInvested;
  const returnRate = (totalReturn / totalInvested) * 100;
  const avgAnnualReturn = returnRate / params.years;

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-white/10">
      <h3 className="text-lg font-bold mb-6">📊 시뮬레이션 결과</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-white/5">
          <div className="text-sm text-gray-400">최종 자산</div>
          <div className="text-2xl font-black text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text">
            {finalData.endValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} K-AUS
          </div>
          <div className="text-sm text-gray-400">
            ≈ ${(finalData.endValue * KAUS_PRICE).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/5">
          <div className="text-sm text-gray-400">총 투자금</div>
          <div className="text-2xl font-bold text-white">
            {totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })} K-AUS
          </div>
          <div className="text-sm text-gray-400">
            ≈ ${(totalInvested * KAUS_PRICE).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/5">
          <div className="text-sm text-gray-400">총 수익</div>
          <div className="text-2xl font-bold text-green-400">
            +{totalReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })} K-AUS
          </div>
          <div className="text-sm text-green-400/70">
            +${(totalReturn * KAUS_PRICE).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/5">
          <div className="text-sm text-gray-400">수익률</div>
          <div className="text-2xl font-bold text-green-400">
            +{returnRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-400">
            연평균 +{avgAnnualReturn.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🎯</div>
          <div>
            <div className="font-bold text-green-400">복리의 힘</div>
            <div className="text-sm text-gray-300">
              {params.years}년 후 당신의 초기 투자금 {params.initialAmount.toLocaleString()} K-AUS는
              <span className="text-green-400 font-bold"> {(finalData.endValue / params.initialAmount).toFixed(1)}배</span>가 됩니다
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GrowthChart({ data }: { data: YearlyData[] }) {
  const maxValue = Math.max(...data.map((d) => d.endValue));

  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
      <h3 className="text-lg font-bold mb-4">📈 자산 성장 그래프</h3>

      <div className="relative h-64">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-gray-400 pr-2">
          <span>{(maxValue / 1000).toFixed(0)}K</span>
          <span>{(maxValue / 2000).toFixed(0)}K</span>
          <span>0</span>
        </div>

        {/* Chart area */}
        <div className="ml-16 h-full flex items-end gap-1">
          {data.map((d, i) => {
            const height = (d.endValue / maxValue) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center group">
                <div className="w-full relative">
                  <div
                    className="w-full bg-gradient-to-t from-cyan-500 to-purple-500 rounded-t transition-all hover:opacity-80"
                    style={{ height: `${height * 2.4}px` }}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity z-10">
                    {d.endValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} K-AUS
                  </div>
                </div>
                <span className="text-xs text-gray-500 mt-2">{d.year}년</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BreakdownTable({ data }: { data: YearlyData[] }) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 overflow-x-auto">
      <h3 className="text-lg font-bold mb-4">📋 연도별 상세 내역</h3>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 border-b border-white/10">
            <th className="py-2 text-left">년도</th>
            <th className="py-2 text-right">시작</th>
            <th className="py-2 text-right">에너지</th>
            <th className="py-2 text-right">컴퓨트</th>
            <th className="py-2 text-right">스테이킹</th>
            <th className="py-2 text-right">하베스트</th>
            <th className="py-2 text-right">총 수익</th>
            <th className="py-2 text-right">최종</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(1).map((d) => (
            <tr key={d.year} className="border-b border-white/5 hover:bg-white/5">
              <td className="py-3 font-medium">{d.year}년차</td>
              <td className="py-3 text-right text-gray-400">{(d.startValue / 1000).toFixed(1)}K</td>
              <td className="py-3 text-right text-yellow-400">+{(d.energySwapReturn / 1000).toFixed(1)}K</td>
              <td className="py-3 text-right text-orange-400">+{(d.computeLendingReturn / 1000).toFixed(1)}K</td>
              <td className="py-3 text-right text-purple-400">+{(d.stakingReturn / 1000).toFixed(1)}K</td>
              <td className="py-3 text-right text-emerald-400">+{(d.harvestReturn / 1000).toFixed(1)}K</td>
              <td className="py-3 text-right text-green-400 font-medium">+{(d.totalReturn / 1000).toFixed(1)}K</td>
              <td className="py-3 text-right font-bold">{(d.endValue / 1000).toFixed(1)}K</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AllocationVisualization({ profile }: { profile: RiskProfile }) {
  const allocation = STRATEGY_ALLOCATIONS[profile];
  const items = [
    { name: '에너지 스왑', value: allocation.energySwap, color: 'bg-yellow-500', yield: BASE_YIELDS.energySwap },
    { name: '컴퓨트 렌딩', value: allocation.computeLending, color: 'bg-orange-500', yield: BASE_YIELDS.computeLending },
    { name: '스테이킹', value: allocation.staking, color: 'bg-purple-500', yield: BASE_YIELDS.staking },
    { name: '유동성 풀', value: allocation.liquidityPool, color: 'bg-pink-500', yield: BASE_YIELDS.liquidityPool },
    { name: '카드 예비금', value: allocation.cardReserve, color: 'bg-gray-500', yield: BASE_YIELDS.cardReserve },
  ];

  const weightedYield = items.reduce((sum, item) => sum + item.value * item.yield, 0);

  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">🎯 {PROFILE_NAMES[profile].name} 전략 배분</h3>
        <div className="text-sm text-gray-400">
          예상 연수익률: <span className="text-green-400 font-bold">{(weightedYield * 100).toFixed(1)}%</span>
        </div>
      </div>

      <div className="h-4 rounded-full overflow-hidden flex mb-4">
        {items.map((item, i) => (
          <div
            key={i}
            className={`${item.color} transition-all`}
            style={{ width: `${item.value * 100}%` }}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {items.map((item, i) => (
          <div key={i} className="p-3 rounded-xl bg-white/5">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-3 h-3 rounded-full ${item.color}`} />
              <span className="text-xs text-gray-400">{item.name}</span>
            </div>
            <div className="font-bold">{(item.value * 100).toFixed(0)}%</div>
            <div className="text-xs text-green-400">+{(item.yield * 100).toFixed(0)}% APY</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonWidget({ params }: { params: SimulationParams }) {
  const profiles: RiskProfile[] = ['CONSERVATIVE', 'GROWTH', 'MAX_ALPHA'];
  const comparisons = profiles.map((profile) => {
    const data = runSimulation({ ...params, riskProfile: profile });
    return {
      profile,
      finalValue: data[data.length - 1].endValue,
    };
  });

  const maxValue = Math.max(...comparisons.map((c) => c.finalValue));

  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
      <h3 className="text-lg font-bold mb-4">⚖️ 전략 비교</h3>

      <div className="space-y-4">
        {comparisons.map((c) => (
          <div key={c.profile}>
            <div className="flex justify-between text-sm mb-1">
              <span className={PROFILE_NAMES[c.profile].color}>
                {PROFILE_NAMES[c.profile].icon} {PROFILE_NAMES[c.profile].name}
              </span>
              <span className="font-bold">{(c.finalValue / 1000).toFixed(0)}K K-AUS</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  c.profile === 'CONSERVATIVE' ? 'bg-blue-500' :
                  c.profile === 'GROWTH' ? 'bg-green-500' : 'bg-orange-500'
                } transition-all`}
                style={{ width: `${(c.finalValue / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 text-center text-sm text-gray-400">
        동일 조건에서 {params.years}년 후 최종 자산 비교
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function CompoundGrowthSimulationPage() {
  const [params, setParams] = useState<SimulationParams>({
    initialAmount: 100000,
    riskProfile: 'GROWTH',
    years: 10,
    monthlyContribution: 1000,
    harvestHoursPerDay: 8,
  });

  const simulationData = useMemo(() => runSimulation(params), [params]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Compound Growth Simulation
              </h1>
              <p className="text-sm text-gray-400">AI 뱅커와 함께하는 복리 자산 성장 시뮬레이션</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">K-AUS 시세</div>
              <div className="text-xl font-bold text-green-400">${KAUS_PRICE}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Params and Summary Grid */}
        <section className="grid md:grid-cols-2 gap-6">
          <ParamsPanel params={params} onChange={setParams} />
          <ResultsSummary data={simulationData} params={params} />
        </section>

        {/* Allocation */}
        <section>
          <AllocationVisualization profile={params.riskProfile} />
        </section>

        {/* Growth Chart */}
        <section>
          <GrowthChart data={simulationData} />
        </section>

        {/* Strategy Comparison */}
        <section>
          <ComparisonWidget params={params} />
        </section>

        {/* Detailed Table */}
        <section>
          <BreakdownTable data={simulationData} />
        </section>

        {/* Insights */}
        <section className="grid md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
            <div className="text-3xl mb-3">💡</div>
            <h3 className="font-bold text-lg mb-2">복리의 마법</h3>
            <p className="text-sm text-gray-400">
              아인슈타인이 "세계 8번째 불가사의"라 부른 복리 효과. PAB가 24시간 자동으로 복리를 실현합니다.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-bold text-lg mb-2">AI 자동 운용</h3>
            <p className="text-sm text-gray-400">
              시장 상황에 따라 최적의 자산 배분을 자동 실행. 감정 없는 논리적 의사결정으로 수익을 극대화합니다.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
            <div className="text-3xl mb-3">🌙</div>
            <h3 className="font-bold text-lg mb-2">잠자는 동안에도</h3>
            <p className="text-sm text-gray-400">
              Background Harvest로 유휴 자원을 수익화. 당신이 자는 동안에도 자산은 성장합니다.
            </p>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="text-sm text-yellow-200/80">
              <strong>면책 조항:</strong> 이 시뮬레이션은 과거 데이터와 예상 수익률을 기반으로 한 추정치이며, 실제 수익을 보장하지 않습니다.
              암호화폐 및 디지털 자산 투자에는 원금 손실 위험이 있습니다. 투자 결정은 본인의 판단과 책임하에 이루어져야 합니다.
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="text-center py-8">
          <div className="inline-block p-8 rounded-3xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-white/10">
            <h2 className="text-2xl font-bold mb-2">복리 성장을 시작하세요</h2>
            <p className="text-gray-400 mb-4">
              PAB와 함께라면 당신의 자산이 24시간 쉬지 않고 일합니다
            </p>
            <div className="flex justify-center gap-4">
              <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold hover:opacity-90 transition">
                🚀 PAB 시작하기
              </button>
              <button className="px-6 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20 transition">
                📊 대시보드로 이동
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
          <p>Field Nine Solutions • Personal AI Banker • Phase 19</p>
          <p className="mt-1">복리의 마법, AI가 실현합니다</p>
        </div>
      </footer>
    </div>
  );
}
