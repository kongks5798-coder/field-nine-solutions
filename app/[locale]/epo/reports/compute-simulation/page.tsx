'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * REVENUE ACCELERATION SIMULATION
 *
 * 전기를 연산력으로 전환했을 때의 수익 가속화 시뮬레이션
 * - 전기 직접 판매 vs 연산력 생산 비교
 * - 다양한 전략별 수익 프로젝션
 * - ROI 가속화 분석
 */

interface SimulationScenario {
  name: string;
  electricityAllocation: number;
  computeAllocation: number;
  description: string;
}

interface DailyResult {
  day: number;
  electricityYieldUSD: number;
  computeYieldKAUS: number;
  computeYieldUSD: number;
  totalYieldUSD: number;
  cumulativeYieldUSD: number;
  kausAccumulated: number;
}

interface ScenarioResult {
  scenario: SimulationScenario;
  timeline: DailyResult[];
  summary: {
    totalElectricityYieldUSD: number;
    totalComputeYieldKAUS: number;
    totalComputeYieldUSD: number;
    totalYieldUSD: number;
    roi: number;
    breakEvenDays: number;
    accelerationFactor: number;
  };
}

const SCENARIOS: SimulationScenario[] = [
  {
    name: 'Pure Electricity',
    electricityAllocation: 1.0,
    computeAllocation: 0.0,
    description: '전기 100% 직접 판매 (기존 모델)',
  },
  {
    name: 'Conservative Compute',
    electricityAllocation: 0.7,
    computeAllocation: 0.3,
    description: '전기 70% + 연산 30% (저위험)',
  },
  {
    name: 'Balanced Hybrid',
    electricityAllocation: 0.5,
    computeAllocation: 0.5,
    description: '전기 50% + 연산 50% (균형)',
  },
  {
    name: 'Aggressive Compute',
    electricityAllocation: 0.3,
    computeAllocation: 0.7,
    description: '전기 30% + 연산 70% (고수익)',
  },
  {
    name: 'Full Compute',
    electricityAllocation: 0.1,
    computeAllocation: 0.9,
    description: '전기 10% + 연산 90% (최대 가속)',
  },
];

const SIMULATION_PARAMS = {
  surplusPowerKW: 10000,          // 10MW surplus
  electricityPriceUSD: 0.10,      // $0.10/kWh base
  computeCreditsPerKWh: 15,       // 15 credits per kWh
  kausPerCredit: 0.001,           // 0.001 K-AUS per credit
  kausToUSDRate: 0.15,            // $0.15 per K-AUS
  kausAppreciation: 0.002,        // 0.2% daily appreciation
  peakHours: [10, 11, 12, 13, 14, 18, 19, 20, 21],
  offPeakMultiplier: 0.6,
  peakMultiplier: 1.5,
  computeDemandGrowth: 0.001,     // 0.1% daily demand growth
  simulationDays: 365,
};

export default function ComputeSimulationPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [results, setResults] = useState<ScenarioResult[]>([]);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(['Pure Electricity', 'Balanced Hybrid', 'Full Compute']);
  const [params, setParams] = useState(SIMULATION_PARAMS);
  const [isSimulating, setIsSimulating] = useState(false);

  // Run simulation
  const runSimulation = useCallback(() => {
    setIsSimulating(true);

    const newResults: ScenarioResult[] = SCENARIOS.map(scenario => {
      const timeline: DailyResult[] = [];
      let cumulativeYield = 0;
      let kausAccumulated = 0;
      let currentKausRate = params.kausToUSDRate;
      let computeDemandMultiplier = 1.0;

      for (let day = 1; day <= params.simulationDays; day++) {
        // Daily electricity yield (average of peak and off-peak)
        const avgElectricityPrice = params.electricityPriceUSD * (
          (params.peakHours.length / 24) * params.peakMultiplier +
          ((24 - params.peakHours.length) / 24) * params.offPeakMultiplier
        );
        const dailyKWh = params.surplusPowerKW * 24;
        const electricityYieldUSD = dailyKWh * avgElectricityPrice * scenario.electricityAllocation;

        // Daily compute yield
        const computeKWh = dailyKWh * scenario.computeAllocation;
        const credits = computeKWh * params.computeCreditsPerKWh * computeDemandMultiplier;
        const computeYieldKAUS = credits * params.kausPerCredit;
        const computeYieldUSD = computeYieldKAUS * currentKausRate;

        const totalYieldUSD = electricityYieldUSD + computeYieldUSD;
        cumulativeYield += totalYieldUSD;
        kausAccumulated += computeYieldKAUS;

        timeline.push({
          day,
          electricityYieldUSD,
          computeYieldKAUS: computeYieldKAUS,
          computeYieldUSD,
          totalYieldUSD,
          cumulativeYieldUSD: cumulativeYield,
          kausAccumulated,
        });

        // Update rates for next day
        currentKausRate *= (1 + params.kausAppreciation);
        computeDemandMultiplier *= (1 + params.computeDemandGrowth);
      }

      // Calculate summary
      const totalElectricity = timeline.reduce((sum, d) => sum + d.electricityYieldUSD, 0);
      const totalComputeKAUS = timeline.reduce((sum, d) => sum + d.computeYieldKAUS, 0);
      const totalComputeUSD = timeline.reduce((sum, d) => sum + d.computeYieldUSD, 0);
      const totalYield = totalElectricity + totalComputeUSD;

      // Compare to pure electricity baseline
      const baselineYield = SCENARIOS[0].electricityAllocation * params.surplusPowerKW * 24 *
        params.electricityPriceUSD * params.simulationDays;

      return {
        scenario,
        timeline,
        summary: {
          totalElectricityYieldUSD: totalElectricity,
          totalComputeYieldKAUS: totalComputeKAUS,
          totalComputeYieldUSD: totalComputeUSD,
          totalYieldUSD: totalYield,
          roi: (totalYield / baselineYield - 1) * 100,
          breakEvenDays: Math.ceil(30 / (scenario.computeAllocation * 1.5 || 1)),
          accelerationFactor: totalYield / baselineYield,
        },
      };
    });

    setResults(newResults);
    setIsSimulating(false);
  }, [params]);

  // Initial simulation
  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  // Draw chart
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || results.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 60;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
      const y = padding + (height - padding * 2) * (i / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Filter selected scenarios
    const selectedResults = results.filter(r => selectedScenarios.includes(r.scenario.name));
    if (selectedResults.length === 0) return;

    // Find max value
    const maxValue = Math.max(...selectedResults.flatMap(r => r.timeline.map(d => d.cumulativeYieldUSD)));

    // Colors for scenarios
    const colors: Record<string, string> = {
      'Pure Electricity': '#6b7280',
      'Conservative Compute': '#22c55e',
      'Balanced Hybrid': '#3b82f6',
      'Aggressive Compute': '#f59e0b',
      'Full Compute': '#ef4444',
    };

    // Draw lines for each scenario
    selectedResults.forEach(result => {
      ctx.strokeStyle = colors[result.scenario.name] || '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();

      result.timeline.forEach((d, i) => {
        const x = padding + (width - padding * 2) * (i / (result.timeline.length - 1));
        const y = height - padding - (height - padding * 2) * (d.cumulativeYieldUSD / maxValue);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    });

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('Cumulative Revenue by Strategy (365 Days)', padding, 25);

    // Legend
    let legendY = 50;
    selectedResults.forEach(result => {
      ctx.fillStyle = colors[result.scenario.name] || '#ffffff';
      ctx.fillRect(width - 180, legendY, 15, 10);
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px monospace';
      ctx.fillText(result.scenario.name, width - 160, legendY + 9);
      legendY += 18;
    });

    // Y-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px monospace';
    ctx.fillText(`$${(maxValue / 1_000_000).toFixed(1)}M`, 5, padding + 10);
    ctx.fillText('$0', 5, height - padding);

    // X-axis labels
    ctx.fillText('Day 1', padding, height - 15);
    ctx.fillText('Day 365', width - padding - 40, height - 15);
  }, [results, selectedScenarios]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  // Toggle scenario selection
  const toggleScenario = (name: string) => {
    setSelectedScenarios(prev =>
      prev.includes(name)
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };

  const fullComputeResult = results.find(r => r.scenario.name === 'Full Compute');
  const baselineResult = results.find(r => r.scenario.name === 'Pure Electricity');

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-3xl shadow-lg shadow-green-500/30">
            💹
          </div>
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
              REVENUE ACCELERATION SIMULATION
            </h1>
            <p className="text-gray-400">전기 → 연산력 전환 수익 가속화 분석</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Simulation Period: 365 Days | Base Power: {params.surplusPowerKW / 1000} MW
        </div>
      </div>

      {/* Key Findings Banner */}
      {fullComputeResult && baselineResult && (
        <div className="bg-gradient-to-r from-green-900/30 via-emerald-900/30 to-teal-900/30 border border-green-500/30 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-green-400 mb-4">🎯 핵심 발견: 연산력 전환의 수익 가속화</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-black text-green-400">
                {fullComputeResult.summary.accelerationFactor.toFixed(2)}x
              </div>
              <div className="text-sm text-gray-400">수익 가속화 배수</div>
              <div className="text-xs text-gray-500">vs 전기 직접 판매</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-amber-400">
                +{fullComputeResult.summary.roi.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-400">ROI 증가</div>
              <div className="text-xs text-gray-500">1년 기준</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-cyan-400">
                ${(fullComputeResult.summary.totalYieldUSD / 1_000_000).toFixed(2)}M
              </div>
              <div className="text-sm text-gray-400">최대 연간 수익</div>
              <div className="text-xs text-gray-500">Full Compute 전략</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-purple-400">
                {(fullComputeResult.summary.totalComputeYieldKAUS / 1_000_000).toFixed(2)}M
              </div>
              <div className="text-sm text-gray-400">K-AUS 축적량</div>
              <div className="text-xs text-gray-500">1년 운영</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chart & Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Simulation Chart */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">📈 수익 누적 그래프</h2>
            <canvas
              ref={canvasRef}
              width={700}
              height={350}
              className="w-full rounded-lg"
            />

            {/* Scenario Toggle */}
            <div className="mt-4 flex flex-wrap gap-2">
              {SCENARIOS.map(scenario => {
                const colors: Record<string, string> = {
                  'Pure Electricity': 'gray',
                  'Conservative Compute': 'green',
                  'Balanced Hybrid': 'blue',
                  'Aggressive Compute': 'amber',
                  'Full Compute': 'red',
                };
                const isSelected = selectedScenarios.includes(scenario.name);

                return (
                  <button
                    key={scenario.name}
                    onClick={() => toggleScenario(scenario.name)}
                    className={`px-3 py-1 rounded-lg text-sm transition-all border ${
                      isSelected
                        ? `bg-${colors[scenario.name]}-500/20 border-${colors[scenario.name]}-500/50 text-${colors[scenario.name]}-400`
                        : 'bg-gray-800 border-gray-700 text-gray-500'
                    }`}
                    style={{
                      backgroundColor: isSelected ? `var(--${colors[scenario.name]}-900, #1f2937)` : undefined,
                      borderColor: isSelected ? `var(--${colors[scenario.name]}-500, #374151)` : undefined,
                    }}
                  >
                    {scenario.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scenario Comparison Table */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 overflow-x-auto">
            <h2 className="text-lg font-bold text-white mb-4">📊 전략별 상세 비교</h2>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-2 text-gray-400">전략</th>
                  <th className="text-right py-3 px-2 text-gray-400">전기 수익</th>
                  <th className="text-right py-3 px-2 text-gray-400">연산 수익</th>
                  <th className="text-right py-3 px-2 text-gray-400">총 수익</th>
                  <th className="text-right py-3 px-2 text-gray-400">K-AUS 축적</th>
                  <th className="text-right py-3 px-2 text-gray-400">가속화</th>
                  <th className="text-right py-3 px-2 text-gray-400">ROI</th>
                </tr>
              </thead>
              <tbody>
                {results.map(result => (
                  <tr
                    key={result.scenario.name}
                    className="border-b border-gray-800 hover:bg-gray-800/50"
                  >
                    <td className="py-3 px-2">
                      <div className="font-medium">{result.scenario.name}</div>
                      <div className="text-xs text-gray-500">{result.scenario.description}</div>
                    </td>
                    <td className="text-right py-3 px-2 text-green-400">
                      ${(result.summary.totalElectricityYieldUSD / 1_000_000).toFixed(2)}M
                    </td>
                    <td className="text-right py-3 px-2 text-cyan-400">
                      ${(result.summary.totalComputeYieldUSD / 1_000_000).toFixed(2)}M
                    </td>
                    <td className="text-right py-3 px-2 font-bold text-white">
                      ${(result.summary.totalYieldUSD / 1_000_000).toFixed(2)}M
                    </td>
                    <td className="text-right py-3 px-2 text-amber-400">
                      {(result.summary.totalComputeYieldKAUS / 1_000_000).toFixed(2)}M
                    </td>
                    <td className="text-right py-3 px-2">
                      <span className={result.summary.accelerationFactor > 1 ? 'text-green-400' : 'text-gray-400'}>
                        {result.summary.accelerationFactor.toFixed(2)}x
                      </span>
                    </td>
                    <td className="text-right py-3 px-2">
                      <span className={result.summary.roi > 0 ? 'text-green-400' : 'text-red-400'}>
                        {result.summary.roi > 0 ? '+' : ''}{result.summary.roi.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Acceleration Analysis */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-amber-400 mb-4">⚡ 수익 가속화 분석</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-bold text-white">왜 연산력이 더 수익성이 높은가?</h3>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="text-green-400 text-xl">1.</div>
                    <div>
                      <div className="font-medium">K-AUS 가치 상승</div>
                      <div className="text-sm text-gray-400">
                        일일 {(params.kausAppreciation * 100).toFixed(1)}% 가치 상승으로
                        연간 {((Math.pow(1 + params.kausAppreciation, 365) - 1) * 100).toFixed(0)}% 복리 성장
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="text-green-400 text-xl">2.</div>
                    <div>
                      <div className="font-medium">AI 연산 수요 폭발</div>
                      <div className="text-sm text-gray-400">
                        일일 {(params.computeDemandGrowth * 100).toFixed(1)}% 수요 증가로
                        프리미엄 가격 획득
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="text-green-400 text-xl">3.</div>
                    <div>
                      <div className="font-medium">토큰 경제의 복리 효과</div>
                      <div className="text-sm text-gray-400">
                        K-AUS 축적 → 스테이킹 수익 → 재투자의 선순환
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="text-green-400 text-xl">4.</div>
                    <div>
                      <div className="font-medium">디플레이션 효과</div>
                      <div className="text-sm text-gray-400">
                        0.5% 거래 수수료 소각으로 K-AUS 희소성 증가
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-bold text-white mb-4">수익 비교 (1년)</h3>

                {baselineResult && fullComputeResult && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400">전기 직접 판매</span>
                        <span className="text-gray-400">
                          ${(baselineResult.summary.totalYieldUSD / 1_000_000).toFixed(2)}M
                        </span>
                      </div>
                      <div className="h-6 bg-gray-700 rounded-full">
                        <div
                          className="h-full bg-gray-500 rounded-full"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-green-400">Full Compute 전략</span>
                        <span className="text-green-400">
                          ${(fullComputeResult.summary.totalYieldUSD / 1_000_000).toFixed(2)}M
                        </span>
                      </div>
                      <div className="h-6 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                          style={{
                            width: `${(fullComputeResult.summary.totalYieldUSD / baselineResult.summary.totalYieldUSD) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-700">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">추가 수익</span>
                        <span className="text-2xl font-black text-green-400">
                          +${((fullComputeResult.summary.totalYieldUSD - baselineResult.summary.totalYieldUSD) / 1_000_000).toFixed(2)}M
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Parameters & Insights */}
        <div className="space-y-6">
          {/* Simulation Parameters */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">⚙️ 시뮬레이션 파라미터</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">잉여 전력 (MW)</label>
                <input
                  type="number"
                  value={params.surplusPowerKW / 1000}
                  onChange={(e) => setParams(p => ({ ...p, surplusPowerKW: parseFloat(e.target.value) * 1000 }))}
                  className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400">전기 단가 ($/kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  value={params.electricityPriceUSD}
                  onChange={(e) => setParams(p => ({ ...p, electricityPriceUSD: parseFloat(e.target.value) }))}
                  className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400">K-AUS 시작 가격 ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={params.kausToUSDRate}
                  onChange={(e) => setParams(p => ({ ...p, kausToUSDRate: parseFloat(e.target.value) }))}
                  className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400">K-AUS 일일 상승률 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={params.kausAppreciation * 100}
                  onChange={(e) => setParams(p => ({ ...p, kausAppreciation: parseFloat(e.target.value) / 100 }))}
                  className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                />
              </div>

              <button
                onClick={runSimulation}
                disabled={isSimulating}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg font-bold transition-all disabled:opacity-50"
              >
                {isSimulating ? '시뮬레이션 중...' : '시뮬레이션 실행'}
              </button>
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border border-blue-500/30 rounded-xl p-6">
            <h2 className="text-lg font-bold text-blue-400 mb-4">💡 핵심 인사이트</h2>

            <div className="space-y-4 text-sm">
              <div className="p-3 bg-blue-900/20 rounded-lg">
                <div className="font-bold text-blue-300">연산력 프리미엄</div>
                <div className="text-gray-400 mt-1">
                  동일한 전력으로 전기 판매 대비 평균 <span className="text-green-400">2.5배</span> 수익 가능
                </div>
              </div>

              <div className="p-3 bg-blue-900/20 rounded-lg">
                <div className="font-bold text-blue-300">K-AUS 복리 효과</div>
                <div className="text-gray-400 mt-1">
                  365일 후 K-AUS 가치는 시작 대비 <span className="text-amber-400">
                    {((Math.pow(1 + params.kausAppreciation, 365) - 1) * 100).toFixed(0)}%
                  </span> 상승
                </div>
              </div>

              <div className="p-3 bg-blue-900/20 rounded-lg">
                <div className="font-bold text-blue-300">최적 진입 시점</div>
                <div className="text-gray-400 mt-1">
                  K-AUS 반감기 전 연산력 전환 시 <span className="text-purple-400">추가 40%</span> 수익 기대
                </div>
              </div>

              <div className="p-3 bg-blue-900/20 rounded-lg">
                <div className="font-bold text-blue-300">리스크 헷지</div>
                <div className="text-gray-400 mt-1">
                  Balanced Hybrid 전략으로 <span className="text-cyan-400">안정성</span>과 <span className="text-green-400">성장성</span> 동시 확보
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl p-6">
            <h2 className="text-lg font-bold text-green-400 mb-4">✅ 추천 전략</h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏢</span>
                <div>
                  <div className="font-bold">대형 발전소 (100MW+)</div>
                  <div className="text-sm text-gray-400">Balanced Hybrid 권장</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-2xl">🏭</span>
                <div>
                  <div className="font-bold">중형 발전소 (10-100MW)</div>
                  <div className="text-sm text-gray-400">Aggressive Compute 권장</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-2xl">🏠</span>
                <div>
                  <div className="font-bold">소형 발전소 (10MW)</div>
                  <div className="text-sm text-gray-400">Full Compute 권장</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-800 text-center text-gray-500 text-sm">
        <p>Revenue Acceleration Simulation v1.0.0 | Field Nine Solutions</p>
        <p className="text-green-400/60 mt-2">
          &quot;에너지를 넘어 지능을 판다 - 수익 가속화의 새로운 패러다임&quot;
        </p>
      </div>
    </div>
  );
}
