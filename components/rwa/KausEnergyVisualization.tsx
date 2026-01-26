/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 55: KAUS ↔ ENERGY VISUALIZATION
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 영동 50MW 태양광 발전소 데이터 기반
 * 유저의 KAUS 자산 → 실물 에너지 환산 시각화
 *
 * 변환 비율: 1 kWh = 10 KAUS ($0.10/KAUS)
 */

'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const YEONGDONG_SPECS = {
  capacityMW: 50,
  capacityKW: 50000,
  panelCount: 125000,
  areaM2: 330578,
  areaPyung: 100000,
  dailyOutputKWh: 212500, // Average daily output
  monthlyOutputKWh: 6375000, // ~6.3 GWh
  yearlyOutputKWh: 76500000, // ~76.5 GWh
};

// 1 kWh = 10 KAUS (에너지 토큰화 비율)
const KAUS_PER_KWH = 10;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface KausEnergyProps {
  kausBalance: number;
  showYeongdongShare?: boolean;
  compact?: boolean;
}

interface EnergyEquivalent {
  kWh: number;
  mWh: number;
  percentOfDaily: number;
  percentOfMonthly: number;
  householdsDays: number; // Average Korean household = 10.5 kWh/day
  co2SavedKg: number; // 0.5 kg CO2 per kWh
  treesEquivalent: number; // 1 tree absorbs ~21 kg CO2/year
  solarPanelsOwned: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function calculateEnergyEquivalent(kausBalance: number): EnergyEquivalent {
  const kWh = kausBalance / KAUS_PER_KWH;
  const mWh = kWh / 1000;

  // 영동 발전소 대비 비율
  const percentOfDaily = (kWh / YEONGDONG_SPECS.dailyOutputKWh) * 100;
  const percentOfMonthly = (kWh / YEONGDONG_SPECS.monthlyOutputKWh) * 100;

  // 한국 평균 가구 일일 전력 사용량: 10.5 kWh
  const householdsDays = kWh / 10.5;

  // 탄소 절감량 (kWh당 0.5kg CO2)
  const co2SavedKg = kWh * 0.5;

  // 나무 환산 (연간 21kg CO2 흡수)
  const treesEquivalent = co2SavedKg / (21 / 365);

  // 소유 패널 환산 (패널당 일일 1.7kWh 생산)
  const solarPanelsOwned = kWh / 1.7;

  return {
    kWh: Math.round(kWh * 100) / 100,
    mWh: Math.round(mWh * 1000) / 1000,
    percentOfDaily: Math.round(percentOfDaily * 1000) / 1000,
    percentOfMonthly: Math.round(percentOfMonthly * 10000) / 10000,
    householdsDays: Math.round(householdsDays * 10) / 10,
    co2SavedKg: Math.round(co2SavedKg * 10) / 10,
    treesEquivalent: Math.round(treesEquivalent),
    solarPanelsOwned: Math.round(solarPanelsOwned * 10) / 10,
  };
}

function formatNumber(num: number, decimals = 2): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(decimals)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(decimals)}K`;
  return num.toFixed(decimals);
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function StatCard({
  label,
  value,
  unit,
  icon,
  highlight = false
}: {
  label: string;
  value: string | number;
  unit: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        p-4 rounded-xl border transition-all duration-200
        ${highlight
          ? 'bg-[#171717] text-[#F9F9F7] border-transparent'
          : 'bg-[#F9F9F7] text-[#171717] border-[#17171710] hover:border-[#17171730]'
        }
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs uppercase tracking-wider ${highlight ? 'text-[#F9F9F7]/60' : 'text-[#171717]/50'}`}>
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums">{value}</span>
        <span className={`text-sm ${highlight ? 'text-[#F9F9F7]/70' : 'text-[#171717]/60'}`}>{unit}</span>
      </div>
    </motion.div>
  );
}

function YeongdongShareBar({ percentOfDaily }: { percentOfDaily: number }) {
  const displayPercent = Math.min(percentOfDaily, 100);

  return (
    <div className="p-4 bg-gradient-to-r from-[#22C55E]/5 to-[#F9F9F7] rounded-xl border border-[#22C55E]/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">☀️</span>
          <span className="text-sm font-medium text-[#171717]">영동 50MW 발전소 일일 생산량 대비</span>
        </div>
        <span className="text-lg font-bold text-[#22C55E]">
          {percentOfDaily < 0.01 ? '<0.01' : percentOfDaily.toFixed(3)}%
        </span>
      </div>

      <div className="relative h-3 bg-[#171717]/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${displayPercent}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#22C55E] to-[#86EFAC] rounded-full"
        />

        {/* Grid Lines */}
        {[25, 50, 75].map((mark) => (
          <div
            key={mark}
            className="absolute top-0 bottom-0 w-px bg-[#171717]/10"
            style={{ left: `${mark}%` }}
          />
        ))}
      </div>

      <div className="flex justify-between mt-2 text-xs text-[#171717]/50">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>

      {/* Yeongdong Info */}
      <div className="mt-4 pt-4 border-t border-[#17171710] grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-bold text-[#171717]">{YEONGDONG_SPECS.capacityMW}</div>
          <div className="text-xs text-[#171717]/50">MW 용량</div>
        </div>
        <div>
          <div className="text-lg font-bold text-[#171717]">{formatNumber(YEONGDONG_SPECS.panelCount, 0)}</div>
          <div className="text-xs text-[#171717]/50">태양광 패널</div>
        </div>
        <div>
          <div className="text-lg font-bold text-[#171717]">{formatNumber(YEONGDONG_SPECS.areaPyung, 0)}</div>
          <div className="text-xs text-[#171717]/50">평 (부지)</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function KausEnergyVisualization({
  kausBalance,
  showYeongdongShare = true,
  compact = false
}: KausEnergyProps) {
  const equivalent = useMemo(() => calculateEnergyEquivalent(kausBalance), [kausBalance]);

  if (compact) {
    return (
      <div className="flex items-center gap-4 p-3 bg-[#F9F9F7] rounded-lg border border-[#17171710]">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span className="font-bold text-[#171717]">{formatNumber(equivalent.kWh, 1)} kWh</span>
        </div>
        <div className="w-px h-4 bg-[#171717]/10" />
        <div className="flex items-center gap-2">
          <span className="text-lg">🏠</span>
          <span className="text-sm text-[#171717]/70">{equivalent.householdsDays.toFixed(1)}일분</span>
        </div>
        <div className="w-px h-4 bg-[#171717]/10" />
        <div className="flex items-center gap-2">
          <span className="text-lg">🌳</span>
          <span className="text-sm text-[#171717]/70">{equivalent.treesEquivalent}그루</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#171717]">KAUS → 실물 에너지 환산</h3>
          <p className="text-sm text-[#171717]/60">영동 태양광 발전소 기준</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#22C55E]/10 rounded-full">
          <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <span className="text-xs font-medium text-[#22C55E]">LIVE DATA</span>
        </div>
      </div>

      {/* KAUS Balance */}
      <div className="p-6 bg-gradient-to-br from-[#171717] to-[#2a2a2a] rounded-2xl text-[#F9F9F7]">
        <div className="text-sm text-[#F9F9F7]/50 uppercase tracking-wider mb-2">보유 KAUS</div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold tabular-nums">{formatNumber(kausBalance, 2)}</span>
          <span className="text-lg text-[#F9F9F7]/70">KAUS</span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-[#F9F9F7]/60">
          <span>≈</span>
          <span className="font-mono">{formatNumber(equivalent.kWh, 2)} kWh</span>
          <span className="text-[#F9F9F7]/30">|</span>
          <span className="font-mono">${formatNumber(kausBalance * 0.10, 2)}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon="⚡"
          label="에너지 환산"
          value={formatNumber(equivalent.kWh, 1)}
          unit="kWh"
          highlight
        />
        <StatCard
          icon="🏠"
          label="가구 전력 공급"
          value={equivalent.householdsDays.toFixed(1)}
          unit="일분"
        />
        <StatCard
          icon="🌱"
          label="CO₂ 절감"
          value={formatNumber(equivalent.co2SavedKg, 1)}
          unit="kg"
        />
        <StatCard
          icon="🌳"
          label="나무 환산"
          value={equivalent.treesEquivalent}
          unit="그루"
        />
      </div>

      {/* Solar Panels Owned */}
      <div className="p-4 bg-gradient-to-r from-[#FBBF24]/5 to-[#F9F9F7] rounded-xl border border-[#FBBF24]/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">☀️</span>
            <div>
              <div className="font-medium text-[#171717]">태양광 패널 소유량</div>
              <div className="text-xs text-[#171717]/50">영동 발전소 {formatNumber(YEONGDONG_SPECS.panelCount, 0)}개 중</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#171717]">{equivalent.solarPanelsOwned.toFixed(1)}</div>
            <div className="text-xs text-[#171717]/50">패널</div>
          </div>
        </div>
      </div>

      {/* Yeongdong Share */}
      {showYeongdongShare && (
        <YeongdongShareBar percentOfDaily={equivalent.percentOfDaily} />
      )}

      {/* Conversion Info */}
      <div className="p-4 bg-[#F9F9F7] rounded-xl border border-[#17171710]">
        <div className="flex items-center gap-2 text-sm text-[#171717]/70">
          <span className="text-base">ℹ️</span>
          <span>변환 비율: <strong>1 kWh = 10 KAUS</strong> ($0.10/KAUS)</span>
        </div>
      </div>
    </div>
  );
}

export default KausEnergyVisualization;
