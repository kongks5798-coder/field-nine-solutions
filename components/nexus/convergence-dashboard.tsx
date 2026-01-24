/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * THE FINAL CONVERGENCE DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 37: Field Nine OS - Tesla Platinum Edition
 *
 * 에너지는 숫자가 아니라 돈이다. 제국의 위용을 숫자로 증명하라.
 *
 * Features:
 * - Kaus Coin wallet balance (top)
 * - Energy flow visualization (Solar -> Tesla -> Kaus)
 * - Swap engine (Energy <-> Kaus)
 * - Prophet AI advisor (bottom right)
 * - T2E Bridge (Camel's Dream)
 *
 * Aesthetics: Tesla Minimalist
 * - Background: Warm Ivory (#F9F9F7)
 * - Text: Deep Black (#171717)
 *
 * @version 37.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Zap,
  Car,
  Sun,
  Coins,
  ArrowRightLeft,
  BrainCircuit,
  Gamepad2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Battery,
  DollarSign,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS - TESLA PLATINUM EDITION
// ═══════════════════════════════════════════════════════════════════════════════

const WARM_IVORY = '#F9F9F7';
const DEEP_BLACK = '#171717';

const colors = {
  bg: {
    primary: WARM_IVORY,
    card: '#FFFFFF',
    dark: DEEP_BLACK,
    hover: '#F5F5F4',
  },
  text: {
    primary: DEEP_BLACK,
    secondary: 'rgba(23, 23, 23, 0.7)',
    muted: 'rgba(23, 23, 23, 0.4)',
    inverse: '#FFFFFF',
  },
  accent: {
    gold: '#D4AF37',
    green: '#22C55E',
    blue: '#3B82F6',
    purple: '#A855F7',
    red: '#EF4444',
    amber: '#F59E0B',
  },
  border: '#E5E5E5',
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface KausWallet {
  address: string;
  kausBalance: number;
  kausBalanceFormatted: string;
  usdValue: number;
  krwValue: number;
  isLive: boolean;
}

interface EnergyAsset {
  source: string;
  kwhAvailable: number;
  kausEquivalent: number;
  usdValue: number;
}

interface ProphetAdvice {
  type: string;
  priority: string;
  title: string;
  message: string;
  action?: { label: string; type: string };
  metrics?: {
    currentPrice?: number;
    potentialProfit?: number;
    confidence?: number;
  };
}

interface ProphetState {
  isOnline: boolean;
  marketSentiment: string;
  currentAdvice: ProphetAdvice | null;
  todayProfitEstimate: number;
}

interface SwapQuote {
  inputAmount: number;
  outputAmount: number;
  rate: number;
  fee: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WALLET CARD - TOP DISPLAY
// ═══════════════════════════════════════════════════════════════════════════════

function WalletCard({ wallet, assets }: { wallet: KausWallet | null; assets: EnergyAsset[] }) {
  const totalEnergy = assets.reduce((sum, a) => sum + a.kwhAvailable, 0);
  const totalKausFromEnergy = assets.reduce((sum, a) => sum + a.kausEquivalent, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${DEEP_BLACK} 0%, #2d2d2d 100%)`,
        borderRadius: 24,
        padding: 32,
      }}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${colors.accent.gold} 0%, #B8860B 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Coins size={24} color="#FFF" />
            </div>
            <div>
              <h2 style={{ color: colors.text.inverse, fontSize: 14, fontWeight: 600, letterSpacing: '0.05em' }}>
                KAUS COIN WALLET
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'monospace' }}>
                {wallet?.address || '연결 대기 중...'}
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: wallet?.isLive ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)',
            }}
          >
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: wallet?.isLive ? colors.accent.green : colors.accent.amber }}
            />
            <span style={{ color: wallet?.isLive ? colors.accent.green : colors.accent.amber, fontSize: 11, fontWeight: 600 }}>
              {wallet?.isLive ? 'LIVE' : 'SIMULATION'}
            </span>
          </div>
        </div>

        {/* Main Balance */}
        <div className="mb-6">
          <motion.div
            key={wallet?.kausBalance}
            initial={{ opacity: 0.5, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: colors.text.inverse,
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {wallet?.kausBalanceFormatted || '0.00'}{' '}
            <span style={{ fontSize: 24, fontWeight: 500, color: colors.accent.gold }}>KAUS</span>
          </motion.div>
          <div className="flex items-center gap-4 mt-2">
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
              ${wallet?.usdValue?.toFixed(2) || '0.00'} USD
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
              ₩{wallet?.krwValue?.toLocaleString() || '0'} KRW
            </span>
          </div>
        </div>

        {/* Energy Assets */}
        <div
          className="grid grid-cols-3 gap-4 p-4 rounded-xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Battery size={14} color={colors.accent.green} />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase' }}>
                Available Energy
              </span>
            </div>
            <span style={{ color: colors.text.inverse, fontSize: 18, fontWeight: 600 }}>
              {totalEnergy.toFixed(1)} kWh
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Coins size={14} color={colors.accent.gold} />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase' }}>
                Kaus Equivalent
              </span>
            </div>
            <span style={{ color: colors.text.inverse, fontSize: 18, fontWeight: 600 }}>
              {totalKausFromEnergy.toFixed(0)} KAUS
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} color={colors.accent.blue} />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase' }}>
                Energy Value
              </span>
            </div>
            <span style={{ color: colors.text.inverse, fontSize: 18, fontWeight: 600 }}>
              ${(totalKausFromEnergy * 0.1).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENERGY FLOW VISUALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

function EnergyFlowVisualization() {
  const [activeNode, setActiveNode] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNode((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const nodes = [
    { icon: Sun, label: 'SOLAR', color: colors.accent.amber },
    { icon: Car, label: 'TESLA', color: colors.accent.blue },
    { icon: Zap, label: 'GRID', color: colors.accent.green },
    { icon: Coins, label: 'KAUS', color: colors.accent.gold },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 rounded-2xl"
      style={{ backgroundColor: colors.bg.card, border: `1px solid ${colors.border}` }}
    >
      <h3 style={{ color: colors.text.secondary, fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 16 }}>
        ENERGY FLOW
      </h3>

      <div className="flex items-center justify-between">
        {nodes.map((node, idx) => (
          <div key={node.label} className="flex items-center">
            <motion.div
              animate={{
                scale: activeNode === idx ? 1.1 : 1,
                boxShadow: activeNode === idx ? `0 0 20px ${node.color}40` : 'none',
              }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: `${node.color}15`,
                  border: `2px solid ${activeNode === idx ? node.color : 'transparent'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                }}
              >
                <node.icon size={24} color={node.color} />
              </div>
              <span
                style={{
                  marginTop: 8,
                  fontSize: 10,
                  fontWeight: 600,
                  color: activeNode === idx ? node.color : colors.text.muted,
                  letterSpacing: '0.05em',
                }}
              >
                {node.label}
              </span>
            </motion.div>

            {idx < nodes.length - 1 && (
              <motion.div
                className="mx-4"
                animate={{ opacity: activeNode === idx ? 1 : 0.3 }}
              >
                <ChevronRight size={20} color={colors.text.muted} />
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SWAP ENGINE CARD
// ═══════════════════════════════════════════════════════════════════════════════

function SwapEngineCard({
  onSwap,
  isLoading,
}: {
  onSwap: (amount: number, type: 'ENERGY' | 'KAUS') => void;
  isLoading: boolean;
}) {
  const [inputType, setInputType] = useState<'ENERGY' | 'KAUS'>('ENERGY');
  const [amount, setAmount] = useState<string>('10');
  const [quote, setQuote] = useState<SwapQuote | null>(null);

  const rate = inputType === 'ENERGY' ? 10 : 0.1;
  const outputAmount = parseFloat(amount || '0') * rate * 0.995; // 0.5% fee

  const handleSwap = () => {
    const numAmount = parseFloat(amount);
    if (numAmount > 0) {
      onSwap(numAmount, inputType);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl"
      style={{ backgroundColor: colors.bg.card, border: `1px solid ${colors.border}` }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: `${colors.accent.purple}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowRightLeft size={20} color={colors.accent.purple} />
          </div>
          <div>
            <h3 style={{ color: colors.text.primary, fontSize: 16, fontWeight: 600 }}>
              Energy Swap
            </h3>
            <p style={{ color: colors.text.muted, fontSize: 12 }}>
              실시간 에너지-코인 환전
            </p>
          </div>
        </div>
      </div>

      {/* Input Type Toggle */}
      <div
        className="flex p-1 rounded-xl mb-4"
        style={{ backgroundColor: colors.bg.hover }}
      >
        {['ENERGY', 'KAUS'].map((type) => (
          <button
            key={type}
            onClick={() => setInputType(type as 'ENERGY' | 'KAUS')}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: inputType === type ? colors.bg.card : 'transparent',
              color: inputType === type ? colors.text.primary : colors.text.muted,
              boxShadow: inputType === type ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {type === 'ENERGY' ? 'kWh → KAUS' : 'KAUS → kWh'}
          </button>
        ))}
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label style={{ color: colors.text.secondary, fontSize: 12, fontWeight: 500 }}>
          {inputType === 'ENERGY' ? '에너지 (kWh)' : 'Kaus Coin'}
        </label>
        <div
          className="flex items-center mt-2 rounded-xl overflow-hidden"
          style={{ border: `1px solid ${colors.border}` }}
        >
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 px-4 py-3 text-lg font-medium outline-none"
            style={{ backgroundColor: 'transparent', color: colors.text.primary }}
            placeholder="0"
          />
          <span className="px-4 py-3 font-medium" style={{ color: colors.text.muted }}>
            {inputType === 'ENERGY' ? 'kWh' : 'KAUS'}
          </span>
        </div>
      </div>

      {/* Output Preview */}
      <div
        className="p-4 rounded-xl mb-4"
        style={{ backgroundColor: `${colors.accent.gold}10` }}
      >
        <div className="flex items-center justify-between">
          <span style={{ color: colors.text.secondary, fontSize: 12 }}>수령 예상</span>
          <span style={{ color: colors.text.muted, fontSize: 11 }}>수수료 0.5%</span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span style={{ color: colors.accent.gold, fontSize: 24, fontWeight: 700 }}>
            {outputAmount.toFixed(2)}
          </span>
          <span style={{ color: colors.text.muted, fontSize: 14 }}>
            {inputType === 'ENERGY' ? 'KAUS' : 'kWh'}
          </span>
        </div>
      </div>

      {/* Swap Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSwap}
        disabled={isLoading || !amount || parseFloat(amount) <= 0}
        className="w-full py-4 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
        style={{
          background: `linear-gradient(135deg, ${colors.accent.gold} 0%, #B8860B 100%)`,
        }}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin" />
            처리 중...
          </span>
        ) : (
          `Sell Energy for Kaus`
        )}
      </motion.button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROPHET AI WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

function ProphetWidget({ state }: { state: ProphetState | null }) {
  if (!state) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return colors.accent.red;
      case 'HIGH': return colors.accent.amber;
      case 'MEDIUM': return colors.accent.blue;
      default: return colors.text.muted;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'OPPORTUNITY': return TrendingUp;
      case 'ALERT': return AlertCircle;
      case 'WARNING': return AlertCircle;
      default: return Sparkles;
    }
  };

  const advice = state.currentAdvice;
  const Icon = advice ? getTypeIcon(advice.type) : Sparkles;
  const priorityColor = advice ? getPriorityColor(advice.priority) : colors.text.muted;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-6 rounded-2xl"
      style={{
        backgroundColor: colors.bg.card,
        border: `1px solid ${colors.border}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${colors.accent.purple} 0%, #7C3AED 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BrainCircuit size={22} color="#FFF" />
          </motion.div>
          <div>
            <h3 style={{ color: colors.text.primary, fontSize: 14, fontWeight: 700 }}>
              THE PROPHET
            </h3>
            <p style={{ color: colors.text.muted, fontSize: 11 }}>
              AI Trading Advisor
            </p>
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ backgroundColor: `${colors.accent.green}15` }}
        >
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: colors.accent.green }} />
          <span style={{ color: colors.accent.green, fontSize: 10, fontWeight: 600 }}>ONLINE</span>
        </div>
      </div>

      {/* Advice Card */}
      {advice && (
        <motion.div
          key={advice.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl mb-4"
          style={{
            backgroundColor: `${priorityColor}08`,
            border: `1px solid ${priorityColor}20`,
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${priorityColor}15` }}
            >
              <Icon size={16} color={priorityColor} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: priorityColor, fontSize: 12, fontWeight: 600 }}>
                  {advice.title}
                </span>
                {advice.metrics?.confidence && (
                  <span style={{ color: colors.text.muted, fontSize: 10 }}>
                    {advice.metrics.confidence}% 신뢰도
                  </span>
                )}
              </div>
              <p style={{ color: colors.text.secondary, fontSize: 13, lineHeight: 1.5 }}>
                {advice.message}
              </p>
            </div>
          </div>

          {advice.action && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-3 py-2.5 rounded-lg font-medium text-sm"
              style={{
                backgroundColor: priorityColor,
                color: '#FFF',
              }}
            >
              {advice.action.label}
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Today's Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl" style={{ backgroundColor: colors.bg.hover }}>
          <span style={{ color: colors.text.muted, fontSize: 10, textTransform: 'uppercase' }}>
            시장 심리
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            {state.marketSentiment === 'BULLISH' ? (
              <TrendingUp size={14} color={colors.accent.green} />
            ) : state.marketSentiment === 'BEARISH' ? (
              <TrendingDown size={14} color={colors.accent.red} />
            ) : (
              <span style={{ color: colors.accent.amber }}>—</span>
            )}
            <span style={{
              color: state.marketSentiment === 'BULLISH'
                ? colors.accent.green
                : state.marketSentiment === 'BEARISH'
                  ? colors.accent.red
                  : colors.text.muted,
              fontSize: 13,
              fontWeight: 600,
            }}>
              {state.marketSentiment}
            </span>
          </div>
        </div>
        <div className="p-3 rounded-xl" style={{ backgroundColor: colors.bg.hover }}>
          <span style={{ color: colors.text.muted, fontSize: 10, textTransform: 'uppercase' }}>
            예상 수익
          </span>
          <div className="mt-1">
            <span style={{ color: colors.accent.green, fontSize: 13, fontWeight: 600 }}>
              +₩{state.todayProfitEstimate.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BRIDGE CARD (T2E - CAMEL'S DREAM)
// ═══════════════════════════════════════════════════════════════════════════════

function BridgeCard() {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl"
      style={{ backgroundColor: colors.bg.card, border: `1px solid ${colors.border}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: `${colors.accent.amber}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Gamepad2 size={20} color={colors.accent.amber} />
          </div>
          <div>
            <h3 style={{ color: colors.text.primary, fontSize: 14, fontWeight: 600 }}>
              T2E Bridge
            </h3>
            <p style={{ color: colors.text.muted, fontSize: 11 }}>
              낙타의 꿈 연동
            </p>
          </div>
        </div>
        <div
          className="px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: isConnected ? `${colors.accent.green}15` : `${colors.accent.amber}15`,
          }}
        >
          <span style={{
            color: isConnected ? colors.accent.green : colors.accent.amber,
            fontSize: 10,
            fontWeight: 600,
          }}>
            {isConnected ? 'CONNECTED' : 'PENDING'}
          </span>
        </div>
      </div>

      <div
        className="p-4 rounded-xl text-center"
        style={{ backgroundColor: colors.bg.hover }}
      >
        <p style={{ color: colors.text.secondary, fontSize: 13 }}>
          게임 서버 연결 대기 중
        </p>
        <p style={{ color: colors.text.muted, fontSize: 11, marginTop: 4 }}>
          1 KAUS = 100 Mining Power
        </p>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mt-4 py-3 rounded-xl font-medium"
        style={{
          backgroundColor: colors.bg.hover,
          color: colors.text.secondary,
          border: `1px solid ${colors.border}`,
        }}
      >
        게임 서버 연결
      </motion.button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CONVERGENCE DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

export function ConvergenceDashboard() {
  const [wallet, setWallet] = useState<KausWallet | null>(null);
  const [assets, setAssets] = useState<EnergyAsset[]>([]);
  const [prophetState, setProphetState] = useState<ProphetState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwapping, setIsSwapping] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [walletRes, prophetRes] = await Promise.all([
        fetch('/api/energy/swap?type=wallet'),
        fetch('/api/energy/prophet?type=state'),
      ]);

      if (walletRes.ok) {
        const data = await walletRes.json();
        setWallet(data.data?.wallet || null);
        setAssets(data.data?.assets || []);
      }

      if (prophetRes.ok) {
        const data = await prophetRes.json();
        setProphetState(data.data || null);
      }
    } catch (error) {
      console.error('[CONVERGENCE] Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSwap = async (amount: number, inputType: 'ENERGY' | 'KAUS') => {
    setIsSwapping(true);
    try {
      const response = await fetch('/api/energy/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SWAP', inputType, amount }),
      });

      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('[SWAP] Error:', error);
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: WARM_IVORY,
        padding: 24,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: DEEP_BLACK,
              letterSpacing: '-0.02em',
            }}
          >
            FIELD NINE NEXUS
          </h1>
          <p style={{ color: colors.text.muted, fontSize: 13, marginTop: 4 }}>
            Phase 37: The Final Convergence
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchData}
          className="p-3 rounded-xl"
          style={{ backgroundColor: colors.bg.card, border: `1px solid ${colors.border}` }}
        >
          <RefreshCw size={18} color={colors.text.secondary} />
        </motion.button>
      </div>

      {/* Wallet Card - Top */}
      <div className="mb-6">
        <WalletCard wallet={wallet} assets={assets} />
      </div>

      {/* Energy Flow */}
      <div className="mb-6">
        <EnergyFlowVisualization />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Swap Engine */}
        <div className="lg:col-span-1">
          <SwapEngineCard onSwap={handleSwap} isLoading={isSwapping} />
        </div>

        {/* Prophet AI */}
        <div className="lg:col-span-1">
          <ProphetWidget state={prophetState} />
        </div>

        {/* T2E Bridge */}
        <div className="lg:col-span-1">
          <BridgeCard />
        </div>
      </div>

      {/* Footer */}
      <div
        className="mt-8 pt-6 flex items-center justify-between text-xs"
        style={{ borderTop: `1px solid ${colors.border}`, color: colors.text.muted }}
      >
        <span>Field Nine OS v37.0 • Tesla Platinum Edition</span>
        <span>에너지는 숫자가 아니라 돈이다</span>
      </div>
    </div>
  );
}

export default ConvergenceDashboard;
