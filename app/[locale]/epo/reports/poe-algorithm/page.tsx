'use client';

import { useState, useEffect } from 'react';

/**
 * DYNAMIC POE ALGORITHM REPORT
 *
 * 에너지 생산량 대비 K-AUS 발행량 조절 알고리즘
 */

interface PoEParams {
  baseRewardPerKwh: number;
  currentDifficulty: number;
  effectiveRewardPerKwh: number;
  blockTime: number;
  nextAdjustmentBlocks: number;
}

interface SourceMultiplier {
  source: string;
  multiplier: number;
  icon: string;
  description: string;
}

interface SimulationResult {
  day: number;
  kwhProduced: number;
  kausEarned: number;
  cumulativeKaus: number;
  difficulty: number;
}

const SOURCE_MULTIPLIERS: SourceMultiplier[] = [
  { source: 'solar', multiplier: 1.2, icon: '☀️', description: '태양광 - 20% 보너스' },
  { source: 'wind', multiplier: 1.15, icon: '💨', description: '풍력 - 15% 보너스' },
  { source: 'hydro', multiplier: 1.1, icon: '💧', description: '수력 - 10% 보너스' },
  { source: 'geothermal', multiplier: 1.1, icon: '🌋', description: '지열 - 10% 보너스' },
  { source: 'biomass', multiplier: 1.0, icon: '🌿', description: '바이오매스 - 기본' },
  { source: 'nuclear', multiplier: 0.8, icon: '⚛️', description: '원자력 - 20% 감소' },
  { source: 'natural_gas', multiplier: 0.5, icon: '🔥', description: '천연가스 - 50% 감소' },
  { source: 'coal', multiplier: 0.0, icon: '�ite', description: '석탄 - 보상 없음' },
];

const REGION_MULTIPLIERS = [
  { region: 'EU', multiplier: 1.1, flag: '🇪🇺', description: 'EU 친환경 정책 보너스' },
  { region: 'AU', multiplier: 1.05, flag: '🇦🇺', description: '호주' },
  { region: 'KR', multiplier: 1.0, flag: '🇰🇷', description: '한국 (기준)' },
  { region: 'US', multiplier: 1.0, flag: '🇺🇸', description: '미국' },
  { region: 'JP', multiplier: 0.95, flag: '🇯🇵', description: '일본' },
  { region: 'SG', multiplier: 0.9, flag: '🇸🇬', description: '싱가포르' },
  { region: 'AE', multiplier: 0.85, flag: '🇦🇪', description: 'UAE' },
];

export default function PoEAlgorithmReport() {
  const [params, setParams] = useState<PoEParams>({
    baseRewardPerKwh: 0.00001,
    currentDifficulty: 1.0,
    effectiveRewardPerKwh: 0.00001,
    blockTime: 10,
    nextAdjustmentBlocks: 2016,
  });

  const [simulationConfig, setSimulationConfig] = useState({
    dailyKwh: 10000,
    source: 'solar',
    region: 'KR',
    days: 365,
  });

  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = () => {
    setIsSimulating(true);

    const results: SimulationResult[] = [];
    let cumulativeKaus = 0;
    let difficulty = params.currentDifficulty;

    const sourceMultiplier = SOURCE_MULTIPLIERS.find(s => s.source === simulationConfig.source)?.multiplier || 1.0;
    const regionMultiplier = REGION_MULTIPLIERS.find(r => r.region === simulationConfig.region)?.multiplier || 1.0;

    for (let day = 1; day <= simulationConfig.days; day++) {
      // Calculate daily reward
      const baseReward = simulationConfig.dailyKwh * params.baseRewardPerKwh;
      const difficultyAdjustment = 1 / difficulty;
      const dailyKaus = baseReward * sourceMultiplier * regionMultiplier * difficultyAdjustment;

      cumulativeKaus += dailyKaus;

      results.push({
        day,
        kwhProduced: simulationConfig.dailyKwh,
        kausEarned: dailyKaus,
        cumulativeKaus,
        difficulty,
      });

      // Adjust difficulty monthly (simulated)
      if (day % 30 === 0) {
        difficulty *= 1.05; // 5% monthly difficulty increase
      }
    }

    setSimulationResults(results);
    setTimeout(() => setIsSimulating(false), 500);
  };

  useEffect(() => {
    runSimulation();
  }, [simulationConfig]);

  const formatNumber = (num: number, decimals = 4) => {
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(decimals);
  };

  const finalResult = simulationResults[simulationResults.length - 1];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="border-b border-gray-800 pb-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <span className="text-3xl">⚡</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">DYNAMIC POE ALGORITHM</h1>
              <p className="text-gray-400">에너지 생산량 대비 K-AUS 발행량 조절 알고리즘</p>
            </div>
          </div>
        </div>

        {/* Algorithm Overview */}
        <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-700 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-blue-400 mb-4">🧮 PoE Reward Formula</h2>
          <div className="bg-black/50 rounded-xl p-6 font-mono text-lg text-center">
            <span className="text-green-400">K-AUS Reward</span> =
            <span className="text-white"> (kWh × Base Rate)</span> ×
            <span className="text-yellow-400"> Source Multiplier</span> ×
            <span className="text-purple-400"> Region Multiplier</span> ×
            <span className="text-cyan-400"> (1 / Difficulty)</span>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-black/30 rounded-lg p-3 text-center">
              <div className="text-sm text-gray-400">Base Rate</div>
              <div className="font-mono">{params.baseRewardPerKwh} K-AUS/kWh</div>
            </div>
            <div className="bg-black/30 rounded-lg p-3 text-center">
              <div className="text-sm text-gray-400">Current Difficulty</div>
              <div className="font-mono">{params.currentDifficulty.toFixed(4)}</div>
            </div>
            <div className="bg-black/30 rounded-lg p-3 text-center">
              <div className="text-sm text-gray-400">Effective Rate</div>
              <div className="font-mono text-green-400">{params.effectiveRewardPerKwh.toFixed(8)}</div>
            </div>
            <div className="bg-black/30 rounded-lg p-3 text-center">
              <div className="text-sm text-gray-400">Block Time</div>
              <div className="font-mono">{params.blockTime}s</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Source Multipliers */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h3 className="font-bold mb-4">🌱 Energy Source Multipliers</h3>
            <div className="space-y-2">
              {SOURCE_MULTIPLIERS.map(s => (
                <div
                  key={s.source}
                  onClick={() => setSimulationConfig(prev => ({ ...prev, source: s.source }))}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                    simulationConfig.source === s.source
                      ? 'bg-blue-900/50 border border-blue-600'
                      : 'bg-black/30 hover:bg-black/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{s.icon}</span>
                    <span className="capitalize">{s.source.replace('_', ' ')}</span>
                  </div>
                  <div className={`font-mono ${
                    s.multiplier > 1 ? 'text-green-400' :
                    s.multiplier < 1 ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {s.multiplier > 1 ? '+' : ''}{((s.multiplier - 1) * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Region Multipliers */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h3 className="font-bold mb-4">🌍 Region Multipliers</h3>
            <div className="space-y-2">
              {REGION_MULTIPLIERS.map(r => (
                <div
                  key={r.region}
                  onClick={() => setSimulationConfig(prev => ({ ...prev, region: r.region }))}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                    simulationConfig.region === r.region
                      ? 'bg-purple-900/50 border border-purple-600'
                      : 'bg-black/30 hover:bg-black/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{r.flag}</span>
                    <span>{r.description}</span>
                  </div>
                  <div className={`font-mono ${
                    r.multiplier > 1 ? 'text-green-400' :
                    r.multiplier < 1 ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {r.multiplier > 1 ? '+' : ''}{((r.multiplier - 1) * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Simulation Config */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-8">
          <h3 className="font-bold mb-4">🔬 PoE Mining Simulation</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-gray-400">Daily kWh Production</label>
              <input
                type="number"
                value={simulationConfig.dailyKwh}
                onChange={e => setSimulationConfig(prev => ({ ...prev, dailyKwh: parseInt(e.target.value) || 0 }))}
                className="w-full mt-1 px-3 py-2 bg-black border border-gray-700 rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Energy Source</label>
              <div className="mt-1 px-3 py-2 bg-blue-900/30 border border-blue-700 rounded-lg">
                {SOURCE_MULTIPLIERS.find(s => s.source === simulationConfig.source)?.icon}{' '}
                {simulationConfig.source.replace('_', ' ')}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Region</label>
              <div className="mt-1 px-3 py-2 bg-purple-900/30 border border-purple-700 rounded-lg">
                {REGION_MULTIPLIERS.find(r => r.region === simulationConfig.region)?.flag}{' '}
                {simulationConfig.region}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Simulation Period</label>
              <select
                value={simulationConfig.days}
                onChange={e => setSimulationConfig(prev => ({ ...prev, days: parseInt(e.target.value) }))}
                className="w-full mt-1 px-3 py-2 bg-black border border-gray-700 rounded-lg"
              >
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
                <option value={365}>1 year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Simulation Results */}
        {simulationResults.length > 0 && (
          <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold text-green-400 mb-6">📊 Simulation Results</h3>

            <div className="grid grid-cols-5 gap-4 mb-6">
              <div className="bg-black/40 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-400">Total kWh</div>
                <div className="text-2xl font-bold">{formatNumber(simulationConfig.dailyKwh * simulationConfig.days)}</div>
              </div>
              <div className="bg-black/40 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-400">Source Bonus</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {((SOURCE_MULTIPLIERS.find(s => s.source === simulationConfig.source)?.multiplier || 1) * 100 - 100).toFixed(0)}%
                </div>
              </div>
              <div className="bg-black/40 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-400">Region Bonus</div>
                <div className="text-2xl font-bold text-purple-400">
                  {((REGION_MULTIPLIERS.find(r => r.region === simulationConfig.region)?.multiplier || 1) * 100 - 100).toFixed(0)}%
                </div>
              </div>
              <div className="bg-green-900/50 rounded-xl p-4 text-center border border-green-700">
                <div className="text-sm text-green-400">Total K-AUS Earned</div>
                <div className="text-2xl font-bold text-green-400">{formatNumber(finalResult?.cumulativeKaus || 0)}</div>
              </div>
              <div className="bg-black/40 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-400">Final Difficulty</div>
                <div className="text-2xl font-bold">{finalResult?.difficulty.toFixed(4) || '—'}</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left pb-2">Period</th>
                    <th className="text-right pb-2">kWh</th>
                    <th className="text-right pb-2">K-AUS Earned</th>
                    <th className="text-right pb-2">Cumulative</th>
                    <th className="text-right pb-2">Difficulty</th>
                  </tr>
                </thead>
                <tbody>
                  {[30, 90, 180, 365].filter(d => d <= simulationConfig.days).map(day => {
                    const result = simulationResults[day - 1];
                    if (!result) return null;
                    return (
                      <tr key={day} className="border-b border-gray-800">
                        <td className="py-2">Day {day}</td>
                        <td className="text-right">{formatNumber(simulationConfig.dailyKwh * day)}</td>
                        <td className="text-right text-green-400">{result.kausEarned.toFixed(6)}</td>
                        <td className="text-right font-bold">{formatNumber(result.cumulativeKaus)}</td>
                        <td className="text-right">{result.difficulty.toFixed(4)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Difficulty Adjustment */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="font-bold mb-4">⚙️ Difficulty Adjustment Mechanism</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-cyan-400 mb-2">Bitcoin-style Adjustment</h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• 2016 블록마다 난이도 조정 (약 2주)</li>
                <li>• 목표 블록 시간: 10초</li>
                <li>• 최대 4배 조정 제한</li>
                <li>• 네트워크 해시레이트(검증된 kWh) 기반</li>
              </ul>
            </div>
            <div>
              <h4 className="text-cyan-400 mb-2">Purpose</h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• 채굴자 수 증가 → 난이도 상승 → 보상 감소</li>
                <li>• 에너지 생산량 증가에 따른 인플레이션 방지</li>
                <li>• K-AUS 발행량의 예측 가능한 통제</li>
                <li>• 친환경 에너지원에 대한 인센티브 유지</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>K-AUS Dynamic PoE Algorithm Report</p>
          <p>NEXUS-X Protocol v16.0 • Proof-of-Energy</p>
        </div>
      </div>
    </div>
  );
}
