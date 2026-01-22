'use client';

/**
 * MINING REVENUE REPORT
 *
 * Phase 18 Deliverable 2:
 * 개인용 미니 노드 가동 시 예상되는 Mining Revenue 리포트
 *
 * 당신의 기기가 잠든 사이 에너지를 지능으로 바꿉니다
 */

import React, { useState, useEffect } from 'react';

// ============================================
// TYPES
// ============================================

type DeviceType = 'LAPTOP' | 'DESKTOP' | 'SMARTPHONE' | 'TABLET' | 'ROUTER';
type PerformanceTier = 'ECO' | 'BALANCED' | 'PERFORMANCE' | 'MAXIMUM';
type NetworkTier = 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

interface MiningEstimate {
  hourlyKaus: number;
  dailyKaus: number;
  weeklyKaus: number;
  monthlyKaus: number;
  yearlyKaus: number;
  hourlyUSD: number;
  dailyUSD: number;
  weeklyUSD: number;
  monthlyUSD: number;
  yearlyUSD: number;
  powerCostUSD: number;
  netProfitUSD: number;
  roi: number;
}

interface DeviceConfig {
  name: string;
  icon: string;
  baseHashpower: number;
  powerConsumption: number; // watts
  description: string;
}

// ============================================
// CONSTANTS
// ============================================

const KAUS_PRICE_USD = 2.47;
const ELECTRICITY_COST_KWH = 0.12; // USD per kWh

const DEVICE_CONFIG: Record<DeviceType, DeviceConfig> = {
  LAPTOP: {
    name: 'Laptop',
    icon: '💻',
    baseHashpower: 100,
    powerConsumption: 45,
    description: '휴대용 컴퓨팅 파워',
  },
  DESKTOP: {
    name: 'Desktop PC',
    icon: '🖥️',
    baseHashpower: 250,
    powerConsumption: 120,
    description: '고성능 컴퓨팅 파워',
  },
  SMARTPHONE: {
    name: 'Smartphone',
    icon: '📱',
    baseHashpower: 30,
    powerConsumption: 5,
    description: '항상 연결된 노드',
  },
  TABLET: {
    name: 'Tablet',
    icon: '📲',
    baseHashpower: 50,
    powerConsumption: 10,
    description: '휴대용 중간 노드',
  },
  ROUTER: {
    name: 'Smart Router',
    icon: '📡',
    baseHashpower: 20,
    powerConsumption: 8,
    description: '24시간 항시 가동',
  },
};

const PERFORMANCE_MULTIPLIER: Record<PerformanceTier, { multiplier: number; powerMultiplier: number; name: string }> = {
  ECO: { multiplier: 0.5, powerMultiplier: 0.4, name: '에코 모드' },
  BALANCED: { multiplier: 1.0, powerMultiplier: 1.0, name: '균형 모드' },
  PERFORMANCE: { multiplier: 1.5, powerMultiplier: 1.8, name: '성능 모드' },
  MAXIMUM: { multiplier: 2.0, powerMultiplier: 2.5, name: '최대 성능' },
};

const NETWORK_TIER_CONFIG: Record<NetworkTier, { bonus: number; requiredHours: number; name: string; color: string }> = {
  NONE: { bonus: 0, requiredHours: 0, name: '신규', color: 'text-gray-400' },
  BRONZE: { bonus: 0.05, requiredHours: 100, name: '브론즈', color: 'text-amber-600' },
  SILVER: { bonus: 0.10, requiredHours: 500, name: '실버', color: 'text-gray-300' },
  GOLD: { bonus: 0.15, requiredHours: 2000, name: '골드', color: 'text-yellow-400' },
  PLATINUM: { bonus: 0.20, requiredHours: 10000, name: '플래티넘', color: 'text-cyan-400' },
};

const BASE_REWARD_RATE = 0.0001; // K-AUS per hashpower per hour
const SLEEP_MODE_BONUS = 1.25;

// ============================================
// CALCULATION FUNCTIONS
// ============================================

function calculateMiningEstimate(
  deviceType: DeviceType,
  performanceTier: PerformanceTier,
  hoursPerDay: number,
  sleepModePercentage: number,
  networkTier: NetworkTier
): MiningEstimate {
  const device = DEVICE_CONFIG[deviceType];
  const perf = PERFORMANCE_MULTIPLIER[performanceTier];
  const network = NETWORK_TIER_CONFIG[networkTier];

  // Calculate effective hashpower
  const baseHashpower = device.baseHashpower * perf.multiplier;

  // Calculate hours with and without sleep bonus
  const sleepHours = hoursPerDay * sleepModePercentage;
  const normalHours = hoursPerDay * (1 - sleepModePercentage);

  // Calculate K-AUS earned
  const normalReward = normalHours * baseHashpower * BASE_REWARD_RATE;
  const sleepReward = sleepHours * baseHashpower * BASE_REWARD_RATE * SLEEP_MODE_BONUS;
  const baseReward = normalReward + sleepReward;

  // Apply network tier bonus
  const hourlyKaus = (baseReward / hoursPerDay) * (1 + network.bonus);
  const dailyKaus = baseReward * (1 + network.bonus);
  const weeklyKaus = dailyKaus * 7;
  const monthlyKaus = dailyKaus * 30;
  const yearlyKaus = dailyKaus * 365;

  // Convert to USD
  const hourlyUSD = hourlyKaus * KAUS_PRICE_USD;
  const dailyUSD = dailyKaus * KAUS_PRICE_USD;
  const weeklyUSD = weeklyKaus * KAUS_PRICE_USD;
  const monthlyUSD = monthlyKaus * KAUS_PRICE_USD;
  const yearlyUSD = yearlyKaus * KAUS_PRICE_USD;

  // Calculate power cost
  const powerWatts = device.powerConsumption * perf.powerMultiplier;
  const dailyKwh = (powerWatts * hoursPerDay) / 1000;
  const powerCostUSD = dailyKwh * ELECTRICITY_COST_KWH * 30; // Monthly

  // Net profit and ROI
  const netProfitUSD = monthlyUSD - powerCostUSD;
  const roi = powerCostUSD > 0 ? ((monthlyUSD / powerCostUSD) - 1) * 100 : 0;

  return {
    hourlyKaus,
    dailyKaus,
    weeklyKaus,
    monthlyKaus,
    yearlyKaus,
    hourlyUSD,
    dailyUSD,
    weeklyUSD,
    monthlyUSD,
    yearlyUSD,
    powerCostUSD,
    netProfitUSD,
    roi,
  };
}

// ============================================
// COMPONENTS
// ============================================

function DeviceSelector({
  selected,
  onSelect,
}: {
  selected: DeviceType;
  onSelect: (device: DeviceType) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {(Object.entries(DEVICE_CONFIG) as [DeviceType, DeviceConfig][]).map(([type, config]) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={`p-4 rounded-xl border-2 transition-all ${
            selected === type
              ? 'border-cyan-500 bg-cyan-500/10'
              : 'border-white/10 bg-white/5 hover:border-white/30'
          }`}
        >
          <div className="text-3xl mb-2">{config.icon}</div>
          <div className="text-sm font-medium">{config.name}</div>
          <div className="text-xs text-gray-400">{config.baseHashpower}H</div>
        </button>
      ))}
    </div>
  );
}

function PerformanceSlider({
  tier,
  onChange,
}: {
  tier: PerformanceTier;
  onChange: (tier: PerformanceTier) => void;
}) {
  const tiers: PerformanceTier[] = ['ECO', 'BALANCED', 'PERFORMANCE', 'MAXIMUM'];
  const index = tiers.indexOf(tier);

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-gray-400">
        <span>에코</span>
        <span>균형</span>
        <span>성능</span>
        <span>최대</span>
      </div>
      <input
        type="range"
        min="0"
        max="3"
        value={index}
        onChange={(e) => onChange(tiers[parseInt(e.target.value)])}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
      />
      <div className="text-center">
        <span className="text-cyan-400 font-bold">{PERFORMANCE_MULTIPLIER[tier].name}</span>
        <span className="text-gray-400 ml-2">({PERFORMANCE_MULTIPLIER[tier].multiplier}x 성능)</span>
      </div>
    </div>
  );
}

function HoursSlider({
  hours,
  onChange,
}: {
  hours: number;
  onChange: (hours: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-gray-400">
        <span>1시간</span>
        <span>12시간</span>
        <span>24시간</span>
      </div>
      <input
        type="range"
        min="1"
        max="24"
        value={hours}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
      />
      <div className="text-center">
        <span className="text-emerald-400 font-bold text-2xl">{hours}</span>
        <span className="text-gray-400 ml-2">시간/일</span>
      </div>
    </div>
  );
}

function SleepModeSlider({
  percentage,
  onChange,
}: {
  percentage: number;
  onChange: (pct: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-gray-400">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={percentage * 100}
        onChange={(e) => onChange(parseInt(e.target.value) / 100)}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
      />
      <div className="text-center">
        <span className="text-purple-400 font-bold">{Math.round(percentage * 100)}%</span>
        <span className="text-gray-400 ml-2">슬립 모드 (25% 보너스)</span>
      </div>
    </div>
  );
}

function NetworkTierSelector({
  tier,
  onSelect,
}: {
  tier: NetworkTier;
  onSelect: (tier: NetworkTier) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.entries(NETWORK_TIER_CONFIG) as [NetworkTier, typeof NETWORK_TIER_CONFIG[NetworkTier]][]).map(
        ([t, config]) => (
          <button
            key={t}
            onClick={() => onSelect(t)}
            className={`px-3 py-2 rounded-lg text-sm transition-all ${
              tier === t
                ? 'bg-white/20 border border-white/30'
                : 'bg-white/5 border border-transparent hover:border-white/20'
            }`}
          >
            <span className={config.color}>{config.name}</span>
            {config.bonus > 0 && (
              <span className="text-green-400 ml-1">+{config.bonus * 100}%</span>
            )}
          </button>
        )
      )}
    </div>
  );
}

function RevenueCard({
  label,
  kaus,
  usd,
  highlight = false,
}: {
  label: string;
  kaus: number;
  usd: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-xl ${
        highlight
          ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30'
          : 'bg-white/5 border border-white/10'
      }`}
    >
      <div className="text-xs text-gray-400 mb-2">{label}</div>
      <div className={`text-xl font-bold ${highlight ? 'text-cyan-400' : 'text-white'}`}>
        {kaus.toFixed(4)} K-AUS
      </div>
      <div className="text-sm text-green-400">${usd.toFixed(2)} USD</div>
    </div>
  );
}

function ProfitabilityChart({ estimate }: { estimate: MiningEstimate }) {
  const maxValue = Math.max(estimate.monthlyUSD, estimate.powerCostUSD);
  const revenueWidth = (estimate.monthlyUSD / maxValue) * 100;
  const costWidth = (estimate.powerCostUSD / maxValue) * 100;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>월 수익</span>
          <span className="text-green-400">${estimate.monthlyUSD.toFixed(2)}</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${revenueWidth}%` }}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>전기 비용</span>
          <span className="text-red-400">${estimate.powerCostUSD.toFixed(2)}</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-orange-400 transition-all duration-500"
            style={{ width: `${costWidth}%` }}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-white/10">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">순이익</span>
          <span
            className={`text-2xl font-bold ${
              estimate.netProfitUSD >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            ${estimate.netProfitUSD.toFixed(2)}/월
          </span>
        </div>
        <div className="text-sm text-gray-400 mt-1">
          ROI: <span className="text-cyan-400">{estimate.roi.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}

function MultiDeviceScenario() {
  const scenarios = [
    {
      name: '🏠 홈 셋업',
      devices: [
        { type: 'DESKTOP' as DeviceType, hours: 8, sleep: 0.75 },
        { type: 'SMARTPHONE' as DeviceType, hours: 24, sleep: 0.5 },
      ],
      tier: 'SILVER' as NetworkTier,
    },
    {
      name: '💼 프로 셋업',
      devices: [
        { type: 'DESKTOP' as DeviceType, hours: 12, sleep: 0.5 },
        { type: 'LAPTOP' as DeviceType, hours: 8, sleep: 0.25 },
        { type: 'SMARTPHONE' as DeviceType, hours: 24, sleep: 0.5 },
        { type: 'ROUTER' as DeviceType, hours: 24, sleep: 0 },
      ],
      tier: 'GOLD' as NetworkTier,
    },
    {
      name: '🚀 맥시멀리스트',
      devices: [
        { type: 'DESKTOP' as DeviceType, hours: 20, sleep: 0.4 },
        { type: 'DESKTOP' as DeviceType, hours: 20, sleep: 0.4 },
        { type: 'LAPTOP' as DeviceType, hours: 12, sleep: 0.5 },
        { type: 'SMARTPHONE' as DeviceType, hours: 24, sleep: 0.5 },
        { type: 'TABLET' as DeviceType, hours: 16, sleep: 0.6 },
        { type: 'ROUTER' as DeviceType, hours: 24, sleep: 0 },
      ],
      tier: 'PLATINUM' as NetworkTier,
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-cyan-400">📊 멀티 디바이스 시나리오</h3>
      <div className="grid md:grid-cols-3 gap-4">
        {scenarios.map((scenario) => {
          let totalMonthlyKaus = 0;
          let totalPowerCost = 0;

          scenario.devices.forEach((d) => {
            const est = calculateMiningEstimate(
              d.type,
              'BALANCED',
              d.hours,
              d.sleep,
              scenario.tier
            );
            totalMonthlyKaus += est.monthlyKaus;
            totalPowerCost += est.powerCostUSD;
          });

          const totalMonthlyUSD = totalMonthlyKaus * KAUS_PRICE_USD;
          const netProfit = totalMonthlyUSD - totalPowerCost;

          return (
            <div
              key={scenario.name}
              className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10"
            >
              <div className="text-lg font-bold mb-2">{scenario.name}</div>
              <div className="text-xs text-gray-400 mb-3">
                {scenario.devices.length}개 디바이스 • {scenario.tier} 티어
              </div>
              <div className="space-y-1 text-sm mb-3">
                {scenario.devices.map((d, i) => (
                  <div key={i} className="flex justify-between text-gray-300">
                    <span>{DEVICE_CONFIG[d.type].icon} {DEVICE_CONFIG[d.type].name}</span>
                    <span className="text-gray-500">{d.hours}h/일</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-white/10">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400">월 수익</span>
                  <span className="text-green-400">{totalMonthlyKaus.toFixed(2)} K-AUS</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400">전기 비용</span>
                  <span className="text-red-400">-${totalPowerCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-2">
                  <span>순이익</span>
                  <span className={netProfit >= 0 ? 'text-cyan-400' : 'text-red-400'}>
                    ${netProfit.toFixed(2)}/월
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NetworkTierProgress() {
  const tiers = Object.entries(NETWORK_TIER_CONFIG) as [NetworkTier, typeof NETWORK_TIER_CONFIG[NetworkTier]][];
  const currentHours = 847; // Simulated user hours

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-cyan-400">🏆 네트워크 기여 티어</h3>
      <div className="relative">
        {tiers.map(([tier, config], index) => {
          const isActive = currentHours >= config.requiredHours;
          const nextTier = tiers[index + 1];
          const progress = nextTier
            ? Math.min(100, ((currentHours - config.requiredHours) / (nextTier[1].requiredHours - config.requiredHours)) * 100)
            : 100;

          return (
            <div key={tier} className="relative mb-4 last:mb-0">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                    ${isActive ? 'bg-white/20' : 'bg-white/5'} ${config.color}`}
                >
                  {isActive ? '✓' : config.requiredHours}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-bold ${config.color}`}>{config.name}</span>
                    <span className="text-green-400 text-sm">
                      {config.bonus > 0 ? `+${config.bonus * 100}% 보너스` : '기본'}
                    </span>
                  </div>
                  {isActive && nextTier && (
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {config.requiredHours > 0 ? `${config.requiredHours}시간 필요` : '시작 단계'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-center text-sm text-gray-400 mt-4">
        현재 누적: <span className="text-cyan-400 font-bold">{currentHours.toLocaleString()}</span>시간
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function MiningRevenuePage() {
  const [deviceType, setDeviceType] = useState<DeviceType>('LAPTOP');
  const [performanceTier, setPerformanceTier] = useState<PerformanceTier>('BALANCED');
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [sleepPercentage, setSleepPercentage] = useState(0.5);
  const [networkTier, setNetworkTier] = useState<NetworkTier>('BRONZE');

  const [estimate, setEstimate] = useState<MiningEstimate | null>(null);

  useEffect(() => {
    const est = calculateMiningEstimate(
      deviceType,
      performanceTier,
      hoursPerDay,
      sleepPercentage,
      networkTier
    );
    setEstimate(est);
  }, [deviceType, performanceTier, hoursPerDay, sleepPercentage, networkTier]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Mining Revenue Report
              </h1>
              <p className="text-sm text-gray-400">
                당신의 기기가 잠든 사이 에너지를 지능으로 바꿉니다
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">K-AUS 시세</div>
              <div className="text-xl font-bold text-green-400">${KAUS_PRICE_USD}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Calculator Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white">⚙️ 마이닝 수익 계산기</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Controls */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                <div>
                  <label className="text-sm text-gray-400 mb-3 block">디바이스 선택</label>
                  <DeviceSelector selected={deviceType} onSelect={setDeviceType} />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-3 block">성능 모드</label>
                  <PerformanceSlider tier={performanceTier} onChange={setPerformanceTier} />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-3 block">일일 가동 시간</label>
                  <HoursSlider hours={hoursPerDay} onChange={setHoursPerDay} />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-3 block">슬립 모드 비율</label>
                  <SleepModeSlider percentage={sleepPercentage} onChange={setSleepPercentage} />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-3 block">네트워크 티어</label>
                  <NetworkTierSelector tier={networkTier} onSelect={setNetworkTier} />
                </div>
              </div>
            </div>

            {/* Right: Results */}
            <div className="space-y-6">
              {estimate && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <RevenueCard label="시간당" kaus={estimate.hourlyKaus} usd={estimate.hourlyUSD} />
                    <RevenueCard label="일간" kaus={estimate.dailyKaus} usd={estimate.dailyUSD} />
                    <RevenueCard label="주간" kaus={estimate.weeklyKaus} usd={estimate.weeklyUSD} />
                    <RevenueCard
                      label="월간"
                      kaus={estimate.monthlyKaus}
                      usd={estimate.monthlyUSD}
                      highlight
                    />
                  </div>

                  <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/10">
                    <h3 className="text-lg font-bold mb-4">📈 연간 예상 수익</h3>
                    <div className="text-center">
                      <div className="text-4xl font-black text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text">
                        {estimate.yearlyKaus.toFixed(2)} K-AUS
                      </div>
                      <div className="text-2xl text-green-400 mt-2">
                        ≈ ${estimate.yearlyUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-lg font-bold mb-4">💰 수익성 분석</h3>
                    <ProfitabilityChart estimate={estimate} />
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Multi-device Scenarios */}
        <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <MultiDeviceScenario />
        </section>

        {/* Network Tier Progress */}
        <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <NetworkTierProgress />
        </section>

        {/* Info Cards */}
        <section className="grid md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <div className="text-3xl mb-3">🌙</div>
            <h3 className="font-bold text-lg mb-2">슬립 모드 보너스</h3>
            <p className="text-sm text-gray-400">
              밤새 마이닝 시 25% 추가 보상을 받습니다. 당신이 자는 동안 기기가 일합니다.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
            <div className="text-3xl mb-3">🌐</div>
            <h3 className="font-bold text-lg mb-2">네트워크 기여</h3>
            <p className="text-sm text-gray-400">
              누적 기여 시간에 따라 티어가 상승하며, 플래티넘 달성 시 20% 영구 보너스를 받습니다.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-bold text-lg mb-2">에코 효율</h3>
            <p className="text-sm text-gray-400">
              에코 모드는 전력 소비를 60% 절감하면서도 50%의 수익을 유지합니다. 환경과 지갑 모두 지키세요.
            </p>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="text-center py-8">
          <div className="inline-block p-8 rounded-3xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-white/10">
            <h2 className="text-2xl font-bold mb-2">지금 바로 시작하세요</h2>
            <p className="text-gray-400 mb-4">
              Mini Node 앱을 설치하고 유휴 컴퓨팅 파워로 K-AUS를 채굴하세요
            </p>
            <div className="flex justify-center gap-4">
              <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold hover:opacity-90 transition">
                📱 앱 다운로드
              </button>
              <button className="px-6 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20 transition">
                📖 자세히 알아보기
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
          <p>Field Nine Solutions • Sovereign Life Integration • Phase 18</p>
          <p className="mt-1">당신의 기기가 잠든 사이 에너지를 지능으로 바꿉니다</p>
        </div>
      </footer>
    </div>
  );
}
