'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * K-AUS 5-YEAR VALUE APPRECIATION SIMULATION
 *
 * 소각 모델에 따른 가치 상승 시뮬레이션
 */

interface YearlyProjection {
  year: number;
  circulatingSupply: number;
  burnedSupply: number;
  stakingSupply: number;
  poeEmission: number;
  netSupplyChange: number;
  scarcityIndex: number;
  projectedPrice: number;
  marketCap: number;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  annualBurnRate: number;
  adoptionGrowth: number;
  stakingRatio: number;
  color: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'conservative',
    name: 'Conservative',
    description: '보수적 시나리오: 낮은 채택률, 기본 소각율',
    annualBurnRate: 0.02,
    adoptionGrowth: 0.15,
    stakingRatio: 0.25,
    color: '#6b7280',
  },
  {
    id: 'base',
    name: 'Base Case',
    description: '기본 시나리오: 중간 채택률, 예상 소각율',
    annualBurnRate: 0.035,
    adoptionGrowth: 0.30,
    stakingRatio: 0.35,
    color: '#3b82f6',
  },
  {
    id: 'optimistic',
    name: 'Optimistic',
    description: '낙관적 시나리오: 높은 채택률, 증가된 소각율',
    annualBurnRate: 0.05,
    adoptionGrowth: 0.50,
    stakingRatio: 0.45,
    color: '#22c55e',
  },
  {
    id: 'bull',
    name: 'Bull Case',
    description: '강세 시나리오: 폭발적 채택, 최대 소각율',
    annualBurnRate: 0.08,
    adoptionGrowth: 0.80,
    stakingRatio: 0.55,
    color: '#f59e0b',
  },
];

const INITIAL_STATE = {
  circulatingSupply: 12000000,
  burnedSupply: 48000,
  stakingSupply: 3500000,
  price: 0.10,
  maxSupply: 120000000,
};

const HALVING_SCHEDULE = [
  { year: 0, blockReward: 50 },
  { year: 4, blockReward: 25 },
  { year: 8, blockReward: 12.5 },
];

export default function KausSimulationReport() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[1]);
  const [projections, setProjections] = useState<YearlyProjection[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const runSimulation = (scenario: Scenario) => {
    setIsSimulating(true);

    const results: YearlyProjection[] = [];
    let circulating = INITIAL_STATE.circulatingSupply;
    let burned = INITIAL_STATE.burnedSupply;
    let staking = INITIAL_STATE.stakingSupply;
    let price = INITIAL_STATE.price;

    for (let year = 0; year <= 5; year++) {
      // Calculate PoE emission based on halving
      const halvingEpoch = HALVING_SCHEDULE.find(h => year >= h.year);
      const blockReward = halvingEpoch?.blockReward || 50;
      const blocksPerYear = (365.25 * 24 * 60 * 60) / 10; // 10-second blocks
      const annualEmission = blockReward * blocksPerYear * 0.1; // 10% actually distributed

      // Calculate burns
      const annualBurn = circulating * scenario.annualBurnRate;

      // Calculate net supply change
      const netChange = annualEmission - annualBurn;

      // Update circulating
      circulating = Math.max(0, circulating + netChange);
      burned += annualBurn;

      // Update staking
      staking = circulating * scenario.stakingRatio;

      // Calculate scarcity index
      const scarcityIndex = (INITIAL_STATE.maxSupply - circulating - burned) / INITIAL_STATE.maxSupply * 100;

      // Calculate price based on scarcity + adoption
      const scarcityMultiplier = 1 + (scarcityIndex / 100);
      const adoptionMultiplier = Math.pow(1 + scenario.adoptionGrowth, year);
      price = INITIAL_STATE.price * scarcityMultiplier * adoptionMultiplier;

      results.push({
        year,
        circulatingSupply: Math.round(circulating),
        burnedSupply: Math.round(burned),
        stakingSupply: Math.round(staking),
        poeEmission: Math.round(annualEmission),
        netSupplyChange: Math.round(netChange),
        scarcityIndex,
        projectedPrice: price,
        marketCap: price * circulating,
      });
    }

    setProjections(results);
    setTimeout(() => setIsSimulating(false), 500);
  };

  useEffect(() => {
    runSimulation(selectedScenario);
  }, [selectedScenario]);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || projections.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const padding = 50;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Draw for all scenarios
    SCENARIOS.forEach(scenario => {
      // Recalculate for each scenario
      const scenarioData: number[] = [];
      let circulating = INITIAL_STATE.circulatingSupply;
      let burned = INITIAL_STATE.burnedSupply;
      let price = INITIAL_STATE.price;

      for (let year = 0; year <= 5; year++) {
        const halvingEpoch = HALVING_SCHEDULE.find(h => year >= h.year);
        const blockReward = halvingEpoch?.blockReward || 50;
        const blocksPerYear = (365.25 * 24 * 60 * 60) / 10;
        const annualEmission = blockReward * blocksPerYear * 0.1;
        const annualBurn = circulating * scenario.annualBurnRate;
        circulating = Math.max(0, circulating + annualEmission - annualBurn);
        burned += annualBurn;

        const scarcityIndex = (INITIAL_STATE.maxSupply - circulating - burned) / INITIAL_STATE.maxSupply * 100;
        const scarcityMultiplier = 1 + (scarcityIndex / 100);
        const adoptionMultiplier = Math.pow(1 + scenario.adoptionGrowth, year);
        price = INITIAL_STATE.price * scarcityMultiplier * adoptionMultiplier;

        scenarioData.push(price);
      }

      const maxPrice = Math.max(...SCENARIOS.map(s => {
        let c = INITIAL_STATE.circulatingSupply;
        let b = INITIAL_STATE.burnedSupply;
        let p = INITIAL_STATE.price;
        for (let y = 0; y <= 5; y++) {
          const halvingEpoch = HALVING_SCHEDULE.find(h => y >= h.year);
          const blockReward = halvingEpoch?.blockReward || 50;
          const blocksPerYear = (365.25 * 24 * 60 * 60) / 10;
          const annualEmission = blockReward * blocksPerYear * 0.1;
          const annualBurn = c * s.annualBurnRate;
          c = Math.max(0, c + annualEmission - annualBurn);
          b += annualBurn;
          const scarcityIndex = (INITIAL_STATE.maxSupply - c - b) / INITIAL_STATE.maxSupply * 100;
          p = INITIAL_STATE.price * (1 + scarcityIndex / 100) * Math.pow(1 + s.adoptionGrowth, y);
        }
        return p;
      })) * 1.1;

      const scaleX = (year: number) => padding + (year / 5) * (width - padding * 2);
      const scaleY = (price: number) => height - padding - (price / maxPrice) * (height - padding * 2);

      // Draw line
      ctx.beginPath();
      ctx.strokeStyle = scenario.color;
      ctx.lineWidth = scenario.id === selectedScenario.id ? 4 : 2;

      scenarioData.forEach((price, i) => {
        const x = scaleX(i);
        const y = scaleY(price);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.stroke();

      // Glow for selected
      if (scenario.id === selectedScenario.id) {
        ctx.shadowColor = scenario.color;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });

    // Draw axes
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = '#666666';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    const maxPrice = Math.max(...projections.map(p => p.projectedPrice)) * 1.1;
    for (let i = 0; i <= 4; i++) {
      const price = (maxPrice / 4) * i;
      const y = height - padding - (price / maxPrice) * (height - padding * 2);
      ctx.fillText(`$${price.toFixed(2)}`, padding - 10, y + 4);
    }

    // X-axis labels
    ctx.textAlign = 'center';
    for (let year = 0; year <= 5; year++) {
      const x = padding + (year / 5) * (width - padding * 2);
      ctx.fillText(`Year ${year}`, x, height - padding + 20);
    }
  }, [projections, selectedScenario]);

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const year5Data = projections[projections.length - 1];
  const roi = year5Data ? ((year5Data.projectedPrice - INITIAL_STATE.price) / INITIAL_STATE.price) * 100 : 0;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="border-b border-gray-800 pb-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <span className="text-3xl">📈</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">K-AUS 5-YEAR VALUE SIMULATION</h1>
              <p className="text-gray-400">소각 모델에 따른 가치 상승 시뮬레이션</p>
            </div>
          </div>
        </div>

        {/* Scenario Selection */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {SCENARIOS.map(scenario => (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedScenario.id === scenario.id
                  ? 'border-amber-500 bg-amber-900/30'
                  : 'border-gray-700 bg-gray-900 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: scenario.color }} />
                <span className="font-bold">{scenario.name}</span>
              </div>
              <div className="text-xs text-gray-400">{scenario.description}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Burn Rate:</span>
                  <span className="ml-1 text-amber-400">{(scenario.annualBurnRate * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-gray-500">Adoption:</span>
                  <span className="ml-1 text-green-400">{(scenario.adoptionGrowth * 100).toFixed(0)}%</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-8">
          <h3 className="font-bold mb-4">Price Projection (All Scenarios)</h3>
          <canvas ref={canvasRef} className="w-full h-80" />
          <div className="flex justify-center gap-6 mt-4">
            {SCENARIOS.map(s => (
              <div key={s.id} className="flex items-center gap-2 text-sm">
                <div className="w-4 h-1 rounded" style={{ backgroundColor: s.color }} />
                <span className="text-gray-400">{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Year-by-Year Breakdown */}
        {projections.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-6 mb-8">
            <h3 className="font-bold mb-4">Year-by-Year Projection ({selectedScenario.name})</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm">
                    <th className="pb-3">Year</th>
                    <th className="pb-3 text-right">Circulating</th>
                    <th className="pb-3 text-right">Burned</th>
                    <th className="pb-3 text-right">Staking</th>
                    <th className="pb-3 text-right">Scarcity</th>
                    <th className="pb-3 text-right">Price</th>
                    <th className="pb-3 text-right">Market Cap</th>
                  </tr>
                </thead>
                <tbody>
                  {projections.map((p, idx) => (
                    <tr key={idx} className="border-t border-gray-800">
                      <td className="py-3 font-bold">Year {p.year}</td>
                      <td className="py-3 text-right">{formatNumber(p.circulatingSupply)}</td>
                      <td className="py-3 text-right text-orange-400">{formatNumber(p.burnedSupply)}</td>
                      <td className="py-3 text-right text-purple-400">{formatNumber(p.stakingSupply)}</td>
                      <td className="py-3 text-right">{p.scarcityIndex.toFixed(2)}%</td>
                      <td className="py-3 text-right font-bold text-green-400">${p.projectedPrice.toFixed(4)}</td>
                      <td className="py-3 text-right">${formatNumber(p.marketCap)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary */}
        {year5Data && (
          <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-700 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-amber-400 mb-6">📊 5-Year Summary ({selectedScenario.name})</h3>

            <div className="grid grid-cols-4 gap-6">
              <div className="bg-black/40 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-400">Starting Price</div>
                <div className="text-2xl font-bold">${INITIAL_STATE.price.toFixed(2)}</div>
              </div>
              <div className="bg-green-900/50 rounded-xl p-4 text-center border border-green-700">
                <div className="text-sm text-green-400">Year 5 Price</div>
                <div className="text-2xl font-bold text-green-400">${year5Data.projectedPrice.toFixed(4)}</div>
              </div>
              <div className="bg-black/40 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-400">Total Burned</div>
                <div className="text-2xl font-bold text-orange-400">{formatNumber(year5Data.burnedSupply)}</div>
              </div>
              <div className="bg-black/40 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-400">5-Year ROI</div>
                <div className={`text-2xl font-bold ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  +{roi.toFixed(0)}%
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-black/30 rounded-xl">
              <p className="text-gray-300">
                <strong className="text-amber-400">{selectedScenario.name}</strong> 시나리오에서
                K-AUS는 5년간 <strong className="text-orange-400">{formatNumber(year5Data.burnedSupply)} K-AUS</strong>가 소각되어
                희소성이 증가하고, 채택률 성장과 함께 가격이
                <strong className="text-green-400"> ${INITIAL_STATE.price} → ${year5Data.projectedPrice.toFixed(4)}</strong>로
                <strong className="text-green-400"> +{roi.toFixed(0)}%</strong> 상승할 것으로 예상됩니다.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>K-AUS 5-Year Value Simulation Report</p>
          <p>NEXUS-X Protocol v16.0 • Kaus Sovereign Pivot</p>
          <p className="mt-2 text-xs">
            ※ 본 시뮬레이션은 가정된 변수에 기반한 예측이며, 실제 결과와 다를 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
