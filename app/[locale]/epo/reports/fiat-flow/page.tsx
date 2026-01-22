'use client';

import { useState, useEffect } from 'react';

/**
 * FIAT-TO-ENERGY PAYMENT FLOW REPORT
 *
 * 실제 현금이 정산되는 결제 플로우 시연
 */

interface PaymentStep {
  id: number;
  name: string;
  description: string;
  duration: number; // ms
  status: 'pending' | 'processing' | 'completed' | 'failed';
  details?: string;
  data?: Record<string, string | number>;
}

interface SimulatedTransaction {
  id: string;
  userId: string;
  type: 'fiat_to_nxusd' | 'nxusd_to_energy' | 'cash_out';
  inputCurrency: string;
  inputAmount: number;
  outputCurrency: string;
  outputAmount: number;
  exchangeRate: number;
  fees: number;
  provider: string;
  status: string;
  steps: PaymentStep[];
  startTime: number;
  endTime?: number;
}

const INITIAL_STEPS: PaymentStep[] = [
  {
    id: 1,
    name: 'KYC/AML Verification',
    description: '사용자 신원 확인 및 자금세탁 방지 검증',
    duration: 200,
    status: 'pending',
  },
  {
    id: 2,
    name: 'FIAT Deposit Initiation',
    description: '결제 게이트웨이를 통한 법정화폐 입금 시작',
    duration: 300,
    status: 'pending',
  },
  {
    id: 3,
    name: 'Bank Confirmation',
    description: '은행/PG사 입금 확인 대기',
    duration: 500,
    status: 'pending',
  },
  {
    id: 4,
    name: 'Exchange Rate Lock',
    description: '실시간 환율 고정 및 수수료 계산',
    duration: 100,
    status: 'pending',
  },
  {
    id: 5,
    name: 'NXUSD Minting',
    description: '담보 기반 NXUSD 토큰 발행',
    duration: 200,
    status: 'pending',
  },
  {
    id: 6,
    name: 'Reserve Update',
    description: '중앙은행 준비금 장부 업데이트',
    duration: 150,
    status: 'pending',
  },
  {
    id: 7,
    name: 'ZK Proof Generation',
    description: '준비금 증명을 위한 ZK Proof 생성',
    duration: 250,
    status: 'pending',
  },
  {
    id: 8,
    name: 'Wallet Credit',
    description: '사용자 지갑에 NXUSD 입금 완료',
    duration: 100,
    status: 'pending',
  },
];

const ENERGY_PURCHASE_STEPS: PaymentStep[] = [
  {
    id: 1,
    name: 'Energy Market Query',
    description: '글로벌 에너지 마켓에서 최적가 조회',
    duration: 150,
    status: 'pending',
  },
  {
    id: 2,
    name: 'Compliance Check',
    description: '규제 준수 여부 사전 검증',
    duration: 100,
    status: 'pending',
  },
  {
    id: 3,
    name: 'NXUSD Debit',
    description: '사용자 지갑에서 NXUSD 차감',
    duration: 80,
    status: 'pending',
  },
  {
    id: 4,
    name: 'Energy Credit Allocation',
    description: '에너지 크레딧 발급 및 할당',
    duration: 200,
    status: 'pending',
  },
  {
    id: 5,
    name: 'Compliance Proof',
    description: '규제 당국용 Compliance Proof 생성',
    duration: 180,
    status: 'pending',
  },
  {
    id: 6,
    name: 'Sovereign Receipt',
    description: 'Sovereign Receipt 발급',
    duration: 100,
    status: 'pending',
  },
];

const CASH_OUT_STEPS: PaymentStep[] = [
  {
    id: 1,
    name: 'Withdrawal Request',
    description: '현금 출금 요청 접수',
    duration: 100,
    status: 'pending',
  },
  {
    id: 2,
    name: 'Balance Verification',
    description: 'NXUSD 잔액 확인',
    duration: 80,
    status: 'pending',
  },
  {
    id: 3,
    name: 'Exchange Rate Lock',
    description: '출금 환율 고정',
    duration: 100,
    status: 'pending',
  },
  {
    id: 4,
    name: 'NXUSD Burn',
    description: 'NXUSD 토큰 소각',
    duration: 150,
    status: 'pending',
  },
  {
    id: 5,
    name: 'Reserve Release',
    description: '준비금에서 현금 해제',
    duration: 120,
    status: 'pending',
  },
  {
    id: 6,
    name: 'Provider Selection',
    description: '최적 결제 제공자 선택',
    duration: 80,
    status: 'pending',
  },
  {
    id: 7,
    name: 'Bank Transfer',
    description: '은행 계좌로 송금 실행',
    duration: 500,
    status: 'pending',
  },
  {
    id: 8,
    name: 'Confirmation',
    description: '송금 완료 확인',
    duration: 100,
    status: 'pending',
  },
];

export default function FiatFlowReport() {
  const [activeFlow, setActiveFlow] = useState<'deposit' | 'purchase' | 'cashout'>('deposit');
  const [steps, setSteps] = useState<PaymentStep[]>(INITIAL_STEPS);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [transaction, setTransaction] = useState<SimulatedTransaction | null>(null);

  const resetSteps = (flow: 'deposit' | 'purchase' | 'cashout') => {
    switch (flow) {
      case 'deposit':
        setSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'pending' as const })));
        break;
      case 'purchase':
        setSteps(ENERGY_PURCHASE_STEPS.map(s => ({ ...s, status: 'pending' as const })));
        break;
      case 'cashout':
        setSteps(CASH_OUT_STEPS.map(s => ({ ...s, status: 'pending' as const })));
        break;
    }
    setCurrentStep(0);
    setTransaction(null);
  };

  const runSimulation = async () => {
    setIsRunning(true);
    const startTime = Date.now();

    // Create transaction
    const tx: SimulatedTransaction = {
      id: `TX-${Date.now().toString(36).toUpperCase()}`,
      userId: 'USER-001',
      type: activeFlow === 'deposit' ? 'fiat_to_nxusd' : activeFlow === 'purchase' ? 'nxusd_to_energy' : 'cash_out',
      inputCurrency: activeFlow === 'deposit' ? 'KRW' : 'NXUSD',
      inputAmount: activeFlow === 'deposit' ? 10000000 : 7575,
      outputCurrency: activeFlow === 'deposit' ? 'NXUSD' : activeFlow === 'purchase' ? 'kWh' : 'KRW',
      outputAmount: activeFlow === 'deposit' ? 7575.76 : activeFlow === 'purchase' ? 94696.97 : 10000000,
      exchangeRate: activeFlow === 'deposit' ? 1320.50 : activeFlow === 'purchase' ? 0.08 : 1320.50,
      fees: activeFlow === 'deposit' ? 3.78 : activeFlow === 'purchase' ? 0.76 : 7.57,
      provider: activeFlow === 'deposit' ? 'Toss Payments' : activeFlow === 'purchase' ? 'EPO Network' : 'KB Kookmin Bank',
      status: 'processing',
      steps: [],
      startTime,
    };
    setTransaction(tx);

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);

      // Mark as processing
      setSteps(prev => prev.map((s, idx) =>
        idx === i ? { ...s, status: 'processing' as const } : s
      ));

      // Wait for step duration
      await new Promise(resolve => setTimeout(resolve, steps[i].duration + Math.random() * 200));

      // Mark as completed with details
      setSteps(prev => prev.map((s, idx) =>
        idx === i ? {
          ...s,
          status: 'completed' as const,
          details: `완료 (${(steps[i].duration + Math.random() * 200).toFixed(0)}ms)`,
        } : s
      ));
    }

    tx.status = 'completed';
    tx.endTime = Date.now();
    setTransaction({ ...tx });
    setIsRunning(false);
  };

  useEffect(() => {
    resetSteps(activeFlow);
  }, [activeFlow]);

  const totalDuration = steps.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="border-b border-gray-800 pb-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <span className="text-3xl">💸</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">FIAT-TO-ENERGY PAYMENT FLOW</h1>
              <p className="text-gray-400">실제 현금 정산 결제 플로우 시연</p>
            </div>
          </div>
        </div>

        {/* Flow Selection */}
        <div className="flex gap-4 mb-8">
          {[
            { id: 'deposit', label: '💵 FIAT → NXUSD', desc: '법정화폐 입금' },
            { id: 'purchase', label: '⚡ NXUSD → Energy', desc: '에너지 구매' },
            { id: 'cashout', label: '🏦 NXUSD → FIAT', desc: '현금 출금' },
          ].map(flow => (
            <button
              key={flow.id}
              onClick={() => setActiveFlow(flow.id as typeof activeFlow)}
              disabled={isRunning}
              className={`flex-1 p-4 rounded-xl transition-all ${
                activeFlow === flow.id
                  ? 'bg-green-600 border-2 border-green-400'
                  : 'bg-gray-800 border-2 border-gray-700 hover:border-gray-600'
              } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-xl font-bold">{flow.label}</div>
              <div className="text-sm text-gray-300 mt-1">{flow.desc}</div>
            </button>
          ))}
        </div>

        {/* Transaction Preview */}
        <div className="bg-gray-900 rounded-xl p-6 mb-8">
          <h3 className="font-bold mb-4">Transaction Preview</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-black/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Input</div>
              <div className="text-xl font-bold">
                {activeFlow === 'deposit' ? '₩10,000,000 KRW' : activeFlow === 'purchase' ? '7,575.76 NXUSD' : '7,575.76 NXUSD'}
              </div>
            </div>
            <div className="bg-black/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Exchange Rate</div>
              <div className="text-xl font-bold">
                {activeFlow === 'deposit' ? '₩1,320.50/NXUSD' : activeFlow === 'purchase' ? '$0.08/kWh' : '₩1,320.50/NXUSD'}
              </div>
            </div>
            <div className="bg-black/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Fees</div>
              <div className="text-xl font-bold text-yellow-400">
                {activeFlow === 'deposit' ? '0.05%' : activeFlow === 'purchase' ? '0.01%' : '0.1%'}
              </div>
            </div>
            <div className="bg-green-900/50 rounded-lg p-4 border border-green-700">
              <div className="text-sm text-green-400">Output</div>
              <div className="text-xl font-bold text-green-400">
                {activeFlow === 'deposit' ? '7,575.76 NXUSD' : activeFlow === 'purchase' ? '94,696.97 kWh' : '₩10,000,000 KRW'}
              </div>
            </div>
          </div>
        </div>

        {/* Run Button */}
        <button
          onClick={runSimulation}
          disabled={isRunning}
          className={`w-full py-4 rounded-xl font-bold text-lg mb-8 transition-all ${
            isRunning
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500'
          }`}
        >
          {isRunning ? '🔄 Processing...' : '▶️ Run Payment Flow Simulation'}
        </button>

        {/* Steps Visualization */}
        <div className="bg-gray-900 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Payment Steps</h3>
            <div className="text-sm text-gray-400">
              예상 소요 시간: ~{(totalDuration / 1000).toFixed(1)}초
            </div>
          </div>

          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  step.status === 'completed' ? 'bg-green-900/30 border-green-700' :
                  step.status === 'processing' ? 'bg-yellow-900/30 border-yellow-700 animate-pulse' :
                  step.status === 'failed' ? 'bg-red-900/30 border-red-700' :
                  'bg-gray-800/50 border-gray-700'
                }`}
              >
                {/* Step Number */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step.status === 'completed' ? 'bg-green-500' :
                  step.status === 'processing' ? 'bg-yellow-500' :
                  step.status === 'failed' ? 'bg-red-500' :
                  'bg-gray-600'
                }`}>
                  {step.status === 'completed' ? '✓' : step.status === 'processing' ? '◎' : step.id}
                </div>

                {/* Step Info */}
                <div className="flex-1">
                  <div className="font-bold">{step.name}</div>
                  <div className="text-sm text-gray-400">{step.description}</div>
                </div>

                {/* Duration */}
                <div className="text-right">
                  <div className="font-mono text-sm">
                    {step.status === 'completed' ? step.details : `~${step.duration}ms`}
                  </div>
                  <div className={`text-xs ${
                    step.status === 'completed' ? 'text-green-400' :
                    step.status === 'processing' ? 'text-yellow-400' : 'text-gray-500'
                  }`}>
                    {step.status.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${((currentStep + (isRunning ? 0.5 : steps[currentStep]?.status === 'completed' ? 1 : 0)) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Transaction Result */}
        {transaction && transaction.status === 'completed' && (
          <div className="bg-green-900/30 border border-green-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">✅</span>
              <h3 className="text-xl font-bold text-green-400">Transaction Complete</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-400">Transaction ID</div>
                <div className="font-mono">{transaction.id}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Processing Time</div>
                <div className="font-mono">{((transaction.endTime || 0) - transaction.startTime)}ms</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Total Fees</div>
                <div className="font-mono text-yellow-400">${transaction.fees.toFixed(4)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Provider</div>
                <div className="font-mono">{transaction.provider}</div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-black/30 rounded-lg">
              <div className="text-center text-lg">
                <span className="text-gray-400">
                  {transaction.inputAmount.toLocaleString()} {transaction.inputCurrency}
                </span>
                <span className="mx-4">→</span>
                <span className="text-green-400 font-bold">
                  {transaction.outputAmount.toLocaleString()} {transaction.outputCurrency}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>Field Nine FIAT-to-Energy Payment Flow Report</p>
          <p>NEXUS-X Protocol v15.0 • Central Bank Edition</p>
        </div>
      </div>
    </div>
  );
}
