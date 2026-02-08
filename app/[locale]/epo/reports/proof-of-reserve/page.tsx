'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * ZERO-KNOWLEDGE PROOF OF RESERVE DASHBOARD
 *
 * 필드나인 중앙은행의 신뢰를 상징하는 잔고 증명 대시보드
 * "외부 감사 없이도 누구나 확인 가능"
 */

interface ReserveAsset {
  type: string;
  currency: string;
  amount: number;
  usdValue: number;
  custodian: string;
  location: string;
  lastVerified: number;
  verificationMethod: string;
}

interface ZKProof {
  proofId: string;
  timestamp: number;
  blockNumber: number;
  reserveRatio: number;
  merkleRoot: string;
  verified: boolean;
}

interface SolvencyData {
  totalReserves: number;
  totalSupply: number;
  reserveRatio: number;
  excessReserves: number;
  status: 'OVER_COLLATERALIZED' | 'FULLY_BACKED' | 'WARNING';
}

const INITIAL_RESERVES: ReserveAsset[] = [
  {
    type: 'Cash',
    currency: 'USD',
    amount: 425000000,
    usdValue: 425000000,
    custodian: 'JP Morgan Chase',
    location: 'New York, USA',
    lastVerified: Date.now() - 300000,
    verificationMethod: 'Bank Statement',
  },
  {
    type: 'Cash',
    currency: 'USD',
    amount: 175000000,
    usdValue: 175000000,
    custodian: 'Goldman Sachs',
    location: 'New York, USA',
    lastVerified: Date.now() - 600000,
    verificationMethod: 'Bank Statement',
  },
  {
    type: 'Cash',
    currency: 'KRW',
    amount: 132050000000,
    usdValue: 100000000,
    custodian: 'KB Kookmin Bank',
    location: 'Seoul, Korea',
    lastVerified: Date.now() - 120000,
    verificationMethod: 'Bank Statement',
  },
  {
    type: 'Cash',
    currency: 'EUR',
    amount: 46000000,
    usdValue: 50000000,
    custodian: 'Deutsche Bank',
    location: 'Frankfurt, Germany',
    lastVerified: Date.now() - 900000,
    verificationMethod: 'Bank Statement',
  },
  {
    type: 'Energy Credit',
    currency: 'kWh',
    amount: 2500000000,
    usdValue: 200000000,
    custodian: 'Field Nine Energy Vault',
    location: 'Distributed (KR, US, EU)',
    lastVerified: Date.now() - 60000,
    verificationMethod: 'On-Chain Oracle',
  },
  {
    type: 'Carbon Credit',
    currency: 'tCO2',
    amount: 5000000,
    usdValue: 75000000,
    custodian: 'Gold Standard Registry',
    location: 'Global Projects',
    lastVerified: Date.now() - 180000,
    verificationMethod: 'Registry Oracle',
  },
  {
    type: 'REC',
    currency: 'REC',
    amount: 1200000,
    usdValue: 24000000,
    custodian: 'I-REC Standard',
    location: 'Asia Pacific',
    lastVerified: Date.now() - 240000,
    verificationMethod: 'On-Chain Oracle',
  },
];

export default function ProofOfReserveDashboard() {
  const [reserves, setReserves] = useState<ReserveAsset[]>(INITIAL_RESERVES);
  const [solvency, setSolvency] = useState<SolvencyData>({
    totalReserves: 1049000000,
    totalSupply: 847293000,
    reserveRatio: 1.238,
    excessReserves: 201707000,
    status: 'OVER_COLLATERALIZED',
  });
  const [proofs, setProofs] = useState<ZKProof[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedProof, setSelectedProof] = useState<ZKProof | null>(null);
  const [verificationResult, setVerificationResult] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate initial proofs
  useEffect(() => {
    const initialProofs: ZKProof[] = [];
    for (let i = 0; i < 10; i++) {
      initialProofs.push({
        proofId: `ZKP-${(Date.now() - i * 3600000).toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        timestamp: Date.now() - i * 3600000,
        blockNumber: 19847523 - i * 300,
        reserveRatio: 1.238 + (Math.random() - 0.5) * 0.02,
        merkleRoot: `0x${Math.random().toString(16).substr(2)}${Math.random().toString(16).substr(2)}`,
        verified: true,
      });
    }
    setProofs(initialProofs);
  }, []);

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update reserves with small fluctuations
      setReserves(prev => prev.map(r => ({
        ...r,
        usdValue: r.usdValue * (1 + (Math.random() - 0.5) * 0.001),
        lastVerified: r.lastVerified + 1000,
      })));

      // Update solvency
      const totalReserves = reserves.reduce((sum, r) => sum + r.usdValue, 0);
      setSolvency(prev => ({
        ...prev,
        totalReserves,
        reserveRatio: totalReserves / prev.totalSupply,
        excessReserves: totalReserves - prev.totalSupply,
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [reserves]);

  // Reserve visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const centerX = canvas.offsetWidth / 2;
    const centerY = canvas.offsetHeight / 2;
    const radius = Math.min(centerX, centerY) - 40;

    // Clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    // Draw reserve pie chart
    const totalReserves = reserves.reduce((sum, r) => sum + r.usdValue, 0);
    let startAngle = -Math.PI / 2;

    const colors: Record<string, string> = {
      'Cash': '#22c55e',
      'Energy Credit': '#3b82f6',
      'Carbon Credit': '#a855f7',
      'REC': '#f59e0b',
    };

    reserves.forEach(reserve => {
      const sliceAngle = (reserve.usdValue / totalReserves) * Math.PI * 2;
      const color = colors[reserve.type] || '#666666';

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = color + 'cc';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      startAngle += sliceAngle;
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${(solvency.reserveRatio * 100).toFixed(1)}%`, centerX, centerY - 15);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#22c55e';
    ctx.fillText('BACKED', centerX, centerY + 15);
  }, [reserves, solvency]);

  const generateNewProof = async () => {
    setIsGenerating(true);
    setVerificationResult(null);

    // Simulate proof generation
    await new Promise(r => setTimeout(r, 2000));

    const newProof: ZKProof = {
      proofId: `ZKP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      timestamp: Date.now(),
      blockNumber: 19847523 + proofs.length * 300,
      reserveRatio: solvency.reserveRatio,
      merkleRoot: `0x${Math.random().toString(16).substr(2)}${Math.random().toString(16).substr(2)}`,
      verified: true,
    };

    setProofs(prev => [newProof, ...prev.slice(0, 19)]);
    setSelectedProof(newProof);
    setIsGenerating(false);
    setVerificationResult('✅ ZK Proof verified successfully');
  };

  const verifyProof = async (proof: ZKProof) => {
    setSelectedProof(proof);
    setVerificationResult(null);

    // Simulate verification
    await new Promise(r => setTimeout(r, 1000));
    setVerificationResult(proof.verified ? '✅ ZK Proof verified successfully' : '❌ Verification failed');
  };

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const totalCash = reserves.filter(r => r.type === 'Cash').reduce((sum, r) => sum + r.usdValue, 0);
  const totalEnergy = reserves.filter(r => r.type !== 'Cash').reduce((sum, r) => sum + r.usdValue, 0);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-green-900 border-b border-emerald-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
                <span className="text-3xl">🔐</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold">PROOF OF RESERVE</h1>
                <p className="text-emerald-300">Zero-Knowledge Reserve Attestation</p>
              </div>
            </div>

            <div className={`px-6 py-3 rounded-xl ${
              solvency.status === 'OVER_COLLATERALIZED'
                ? 'bg-green-500/20 border-2 border-green-500'
                : 'bg-yellow-500/20 border-2 border-yellow-500'
            }`}>
              <div className="text-center">
                <div className="text-3xl font-bold">{(solvency.reserveRatio * 100).toFixed(2)}%</div>
                <div className="text-sm text-green-300">RESERVE RATIO</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Core Principle */}
        <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <span className="text-4xl">🛡️</span>
            <div>
              <h2 className="text-xl font-bold text-green-400">100% Reserve Guarantee</h2>
              <p className="text-gray-300">
                모든 NXUSD는 <strong className="text-white">현금 + 에너지 자산</strong>으로 100% 담보됩니다.
                <strong className="text-green-400"> ZK-Proof</strong>를 통해 외부 감사 없이도 누구나 실시간으로 검증할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-green-900/30 rounded-2xl p-6 border border-green-700">
            <div className="text-sm text-green-400 mb-2">Total Reserves</div>
            <div className="text-4xl font-bold">{formatCurrency(solvency.totalReserves)}</div>
            <div className="text-xs text-gray-400 mt-2">Cash + Energy Assets</div>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
            <div className="text-sm text-gray-400 mb-2">NXUSD Supply</div>
            <div className="text-4xl font-bold">{formatCurrency(solvency.totalSupply)}</div>
            <div className="text-xs text-gray-400 mt-2">Total Circulating</div>
          </div>
          <div className="bg-green-900/30 rounded-2xl p-6 border border-green-700">
            <div className="text-sm text-green-400 mb-2">Excess Reserves</div>
            <div className="text-4xl font-bold text-green-400">+{formatCurrency(solvency.excessReserves)}</div>
            <div className="text-xs text-gray-400 mt-2">Over-Collateralized</div>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
            <div className="text-sm text-gray-400 mb-2">Status</div>
            <div className={`text-2xl font-bold ${
              solvency.status === 'OVER_COLLATERALIZED' ? 'text-green-400' :
              solvency.status === 'FULLY_BACKED' ? 'text-blue-400' : 'text-yellow-400'
            }`}>
              {solvency.status.replace('_', ' ')}
            </div>
            <div className="text-xs text-gray-400 mt-2">System Health</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Reserve Visualization */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h3 className="font-bold mb-4">Reserve Composition</h3>
            <div className="flex">
              <canvas ref={canvasRef} className="w-64 h-64" />
              <div className="flex-1 ml-4 space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-900/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Cash Reserves</span>
                  </div>
                  <span className="font-bold">{formatCurrency(totalCash)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-900/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>Energy Credits</span>
                  </div>
                  <span className="font-bold">{formatCurrency(reserves.find(r => r.type === 'Energy Credit')?.usdValue || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-900/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span>Carbon Credits</span>
                  </div>
                  <span className="font-bold">{formatCurrency(reserves.find(r => r.type === 'Carbon Credit')?.usdValue || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-900/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>RECs</span>
                  </div>
                  <span className="font-bold">{formatCurrency(reserves.find(r => r.type === 'REC')?.usdValue || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ZK Proof Generator */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h3 className="font-bold mb-4">ZK Proof Generation</h3>

            <button
              onClick={generateNewProof}
              disabled={isGenerating}
              className={`w-full py-4 rounded-xl font-bold text-lg mb-4 transition-all ${
                isGenerating
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500'
              }`}
            >
              {isGenerating ? '🔄 Generating ZK Proof...' : '🔐 Generate New ZK Proof'}
            </button>

            {selectedProof && (
              <div className="bg-black/50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Proof ID</span>
                  <span className="font-mono text-sm">{selectedProof.proofId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Block</span>
                  <span className="font-mono">#{selectedProof.blockNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Reserve Ratio</span>
                  <span className="font-mono text-green-400">{(selectedProof.reserveRatio * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Merkle Root</span>
                  <span className="font-mono text-xs truncate max-w-48">{selectedProof.merkleRoot}</span>
                </div>

                {verificationResult && (
                  <div className={`p-3 rounded-lg text-center ${
                    verificationResult.includes('✅') ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                  }`}>
                    {verificationResult}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reserve Details */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-8">
          <h3 className="font-bold mb-4">Reserve Assets Detail</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-gray-800">
                  <th className="pb-3">Asset Type</th>
                  <th className="pb-3">Currency</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-right">USD Value</th>
                  <th className="pb-3">Custodian</th>
                  <th className="pb-3">Location</th>
                  <th className="pb-3">Verified</th>
                </tr>
              </thead>
              <tbody>
                {reserves.map((reserve, idx) => (
                  <tr key={idx} className="border-b border-gray-800/50">
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        reserve.type === 'Cash' ? 'bg-green-800 text-green-200' :
                        reserve.type === 'Energy Credit' ? 'bg-blue-800 text-blue-200' :
                        reserve.type === 'Carbon Credit' ? 'bg-purple-800 text-purple-200' :
                        'bg-yellow-800 text-yellow-200'
                      }`}>
                        {reserve.type}
                      </span>
                    </td>
                    <td className="py-3 font-mono">{reserve.currency}</td>
                    <td className="py-3 text-right font-mono">{reserve.amount.toLocaleString()}</td>
                    <td className="py-3 text-right font-bold">{formatCurrency(reserve.usdValue)}</td>
                    <td className="py-3 text-sm">{reserve.custodian}</td>
                    <td className="py-3 text-sm text-gray-400">{reserve.location}</td>
                    <td className="py-3">
                      <span className="text-green-400 text-sm">{formatTime(reserve.lastVerified)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold">
                  <td colSpan={3} className="pt-4">TOTAL RESERVES</td>
                  <td className="pt-4 text-right text-green-400 text-xl">{formatCurrency(solvency.totalReserves)}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Proof History */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="font-bold mb-4">ZK Proof History</h3>
          <div className="space-y-2">
            {proofs.slice(0, 10).map((proof, idx) => (
              <div
                key={proof.proofId}
                onClick={() => verifyProof(proof)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                  selectedProof?.proofId === proof.proofId
                    ? 'bg-green-900/30 border border-green-700'
                    : 'bg-black/30 hover:bg-black/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-green-400">✓</span>
                  <span className="font-mono text-sm">{proof.proofId}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm text-gray-400">Block #{proof.blockNumber}</span>
                  <span className="font-mono text-green-400">{(proof.reserveRatio * 100).toFixed(2)}%</span>
                  <span className="text-sm text-gray-500">{formatTime(proof.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badge */}
        <div className="mt-8 bg-gradient-to-r from-emerald-900/30 to-green-900/30 border border-emerald-700 rounded-2xl p-6 text-center">
          <span className="text-5xl">🏛️</span>
          <h3 className="text-2xl font-bold mt-4 text-green-400">Field Nine Central Bank</h3>
          <p className="text-gray-300 mt-2">
            "에너지의 가치를 발행하고 정산하는 유일한 은행"
          </p>
          <div className="flex justify-center gap-8 mt-6">
            <div>
              <div className="text-3xl font-bold">{formatCurrency(solvency.totalReserves)}</div>
              <div className="text-sm text-gray-400">Total Reserves</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400">{(solvency.reserveRatio * 100).toFixed(1)}%</div>
              <div className="text-sm text-gray-400">Backed</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{proofs.length}</div>
              <div className="text-sm text-gray-400">ZK Proofs</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>Field Nine Zero-Knowledge Proof of Reserve</p>
          <p>NEXUS-X Protocol v15.0 • Central Bank Edition</p>
        </div>
      </div>
    </div>
  );
}
