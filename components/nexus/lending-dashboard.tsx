'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 55: LENDING & BORROWING DASHBOARD COMPONENTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * - Market overview
 * - Supply & Borrow interfaces
 * - Position management
 * - Health factor visualization
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LendingEngine,
  type LendingMarket,
  type UserSupply,
  type UserBorrow,
  type UserLendingPosition,
  type LendingStats,
  type AssetType,
} from '@/lib/lending/lending-engine';

// ═══════════════════════════════════════════════════════════════════════════════
// MARKET ROW
// ═══════════════════════════════════════════════════════════════════════════════

interface MarketRowProps {
  market: LendingMarket;
  onSupply?: (market: LendingMarket) => void;
  onBorrow?: (market: LendingMarket) => void;
}

export function MarketRow({ market, onSupply, onBorrow }: MarketRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 hover:border-neutral-700 transition-all"
    >
      {/* Asset Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neutral-800 rounded-xl flex items-center justify-center text-xl">
            {market.icon}
          </div>
          <div>
            <h3 className="font-bold text-white">{market.nameKo}</h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-400">{market.asset}</span>
              <span className={market.priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {market.priceChange24h >= 0 ? '+' : ''}{market.priceChange24h}%
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-neutral-400">가격</p>
          <p className="font-bold text-white">₩{market.priceKRW.toLocaleString()}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-neutral-800 rounded-xl p-3">
          <p className="text-xs text-neutral-400 mb-1">예치 APY</p>
          <p className="text-lg font-bold text-emerald-400">{market.supplyApy}%</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-3">
          <p className="text-xs text-neutral-400 mb-1">대출 APY</p>
          <p className="text-lg font-bold text-violet-400">{market.borrowApy}%</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-3">
          <p className="text-xs text-neutral-400 mb-1">총 예치</p>
          <p className="text-sm font-bold text-white">
            {(market.totalSupply / 1000000).toFixed(2)}M
          </p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-3">
          <p className="text-xs text-neutral-400 mb-1">이용률</p>
          <p className="text-sm font-bold text-white">{market.utilizationRate}%</p>
        </div>
      </div>

      {/* Utilization Bar */}
      <div className="mb-4">
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${market.utilizationRate}%` }}
            className={`h-full ${
              market.utilizationRate > 80
                ? 'bg-red-500'
                : market.utilizationRate > 60
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            }`}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onSupply?.(market)}
          disabled={!market.canSupply}
          className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${
            market.canSupply
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
          }`}
        >
          예치하기
        </button>
        <button
          onClick={() => onBorrow?.(market)}
          disabled={!market.canBorrow}
          className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${
            market.canBorrow
              ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
          }`}
        >
          대출하기
        </button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKETS LIST
// ═══════════════════════════════════════════════════════════════════════════════

interface MarketsListProps {
  onSupply?: (market: LendingMarket) => void;
  onBorrow?: (market: LendingMarket) => void;
}

export function MarketsList({ onSupply, onBorrow }: MarketsListProps) {
  const [markets, setMarkets] = useState<LendingMarket[]>([]);
  const [sortBy, setSortBy] = useState<'tvl' | 'supplyApy' | 'borrowApy'>('tvl');

  useEffect(() => {
    let allMarkets = LendingEngine.getMarkets();
    if (sortBy === 'supplyApy') {
      allMarkets = allMarkets.sort((a, b) => b.supplyApy - a.supplyApy);
    } else if (sortBy === 'borrowApy') {
      allMarkets = allMarkets.sort((a, b) => a.borrowApy - b.borrowApy);
    }
    setMarkets(allMarkets);
  }, [sortBy]);

  return (
    <div className="space-y-4">
      {/* Sort Options */}
      <div className="flex justify-end gap-2">
        <span className="text-sm text-neutral-400 py-2">정렬:</span>
        {[
          { id: 'tvl', label: 'TVL' },
          { id: 'supplyApy', label: '예치 APY' },
          { id: 'borrowApy', label: '대출 APY' },
        ].map((option) => (
          <button
            key={option.id}
            onClick={() => setSortBy(option.id as 'tvl' | 'supplyApy' | 'borrowApy')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              sortBy === option.id
                ? 'bg-violet-500 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Market Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {markets.map((market) => (
          <MarketRow
            key={market.id}
            market={market}
            onSupply={onSupply}
            onBorrow={onBorrow}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH FACTOR GAUGE
// ═══════════════════════════════════════════════════════════════════════════════

interface HealthFactorGaugeProps {
  healthFactor: number;
  size?: 'sm' | 'md' | 'lg';
}

export function HealthFactorGauge({ healthFactor, size = 'md' }: HealthFactorGaugeProps) {
  const color = LendingEngine.getHealthFactorColor(healthFactor);
  const displayValue = LendingEngine.formatHealthFactor(healthFactor);

  const sizeConfig = {
    sm: { width: 80, height: 80, strokeWidth: 6, fontSize: 'text-lg' },
    md: { width: 120, height: 120, strokeWidth: 8, fontSize: 'text-2xl' },
    lg: { width: 160, height: 160, strokeWidth: 10, fontSize: 'text-3xl' },
  };

  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(healthFactor / 3, 1); // Max out at 3
  const offset = circumference - progress * circumference;

  const colorClass = {
    emerald: 'stroke-emerald-500',
    green: 'stroke-green-500',
    yellow: 'stroke-yellow-500',
    orange: 'stroke-orange-500',
    red: 'stroke-red-500',
  }[color];

  return (
    <div className="relative" style={{ width: config.width, height: config.height }}>
      <svg
        className="transform -rotate-90"
        width={config.width}
        height={config.height}
      >
        {/* Background Circle */}
        <circle
          cx={config.width / 2}
          cy={config.height / 2}
          r={radius}
          fill="none"
          stroke="#262626"
          strokeWidth={config.strokeWidth}
        />
        {/* Progress Circle */}
        <motion.circle
          cx={config.width / 2}
          cy={config.height / 2}
          r={radius}
          fill="none"
          className={colorClass}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold text-white ${config.fontSize}`}>{displayValue}</span>
        <span className="text-xs text-neutral-400">Health</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// POSITION OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════

interface PositionOverviewProps {
  position?: UserLendingPosition;
}

export function PositionOverview({ position }: PositionOverviewProps) {
  const [userPosition, setUserPosition] = useState<UserLendingPosition | null>(null);

  useEffect(() => {
    if (position) {
      setUserPosition(position);
    } else {
      setUserPosition(LendingEngine.getUserPosition('0xuser'));
    }
  }, [position]);

  if (!userPosition) return null;

  const statusInfo = LendingEngine.getStatusLabel(userPosition.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-violet-900/50 to-purple-900/50 rounded-2xl border border-violet-500/30 p-5"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">내 포지션</h2>
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium
            bg-${statusInfo.color}-500/20 text-${statusInfo.color}-400`}>
            {statusInfo.labelKo}
          </div>
        </div>
        <HealthFactorGauge healthFactor={userPosition.healthFactor} size="sm" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-neutral-400 mb-1">총 예치</p>
          <p className="text-xl font-bold text-white">
            ₩{(userPosition.totalSupplyValueKRW / 10000).toFixed(0)}만
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-400 mb-1">총 대출</p>
          <p className="text-xl font-bold text-violet-400">
            ₩{(userPosition.totalBorrowValueKRW / 10000).toFixed(0)}만
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-400 mb-1">대출 한도</p>
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-white">{userPosition.borrowLimitUsed.toFixed(1)}%</p>
            <span className="text-xs text-neutral-500">사용됨</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-neutral-400 mb-1">순 APY</p>
          <p className={`text-xl font-bold ${userPosition.netApy >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {userPosition.netApy >= 0 ? '+' : ''}{userPosition.netApy.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Borrow Limit Bar */}
      <div className="mt-4 pt-4 border-t border-violet-500/20">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-neutral-400">대출 한도 사용률</span>
          <span className="text-white">{userPosition.borrowLimitUsed.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${userPosition.borrowLimitUsed}%` }}
            className={`h-full ${
              userPosition.borrowLimitUsed > 80
                ? 'bg-red-500'
                : userPosition.borrowLimitUsed > 60
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            }`}
          />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-neutral-500">안전</span>
          <span className="text-neutral-500">위험</span>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER SUPPLIES WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

interface UserSuppliesWidgetProps {
  onWithdraw?: (supply: UserSupply) => void;
  onToggleCollateral?: (supply: UserSupply) => void;
}

export function UserSuppliesWidget({ onWithdraw, onToggleCollateral }: UserSuppliesWidgetProps) {
  const [supplies, setSupplies] = useState<UserSupply[]>([]);

  useEffect(() => {
    const position = LendingEngine.getUserPosition('0xuser');
    setSupplies(position.supplies);
  }, []);

  if (supplies.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center"
      >
        <span className="text-4xl mb-4 block">💰</span>
        <p className="text-neutral-400">예치된 자산이 없습니다</p>
        <p className="text-neutral-500 text-sm mt-1">마켓에서 자산을 예치하세요</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden"
    >
      <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
        <h3 className="font-bold text-white">내 예치 자산</h3>
        <span className="text-emerald-400 text-sm font-medium">
          +₩{supplies.reduce((sum, s) => sum + s.earnedInterest * LendingEngine.ASSET_PRICES[s.asset], 0).toFixed(0)} 수익
        </span>
      </div>

      <div className="divide-y divide-neutral-800">
        {supplies.map((supply) => (
          <div key={supply.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{supply.assetIcon}</span>
                <div>
                  <p className="font-medium text-white">{supply.assetName}</p>
                  <p className="text-sm text-neutral-400">
                    {supply.amount.toLocaleString()} {supply.asset}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-emerald-400 font-bold">{supply.apy}% APY</p>
                <p className="text-xs text-neutral-400">
                  ₩{supply.valueKRW.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Collateral Toggle */}
            <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-xl mb-3">
              <span className="text-sm text-neutral-400">담보로 사용</span>
              <button
                onClick={() => onToggleCollateral?.(supply)}
                className={`w-12 h-6 rounded-full transition-all relative ${
                  supply.isCollateral ? 'bg-emerald-500' : 'bg-neutral-600'
                }`}
              >
                <motion.div
                  animate={{ x: supply.isCollateral ? 24 : 2 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full"
                />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => onWithdraw?.(supply)}
                className="flex-1 py-2 bg-neutral-800 text-neutral-300 rounded-xl
                  font-medium text-sm hover:bg-neutral-700 transition-all"
              >
                출금
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER BORROWS WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

interface UserBorrowsWidgetProps {
  onRepay?: (borrow: UserBorrow) => void;
}

export function UserBorrowsWidget({ onRepay }: UserBorrowsWidgetProps) {
  const [borrows, setBorrows] = useState<UserBorrow[]>([]);

  useEffect(() => {
    const position = LendingEngine.getUserPosition('0xuser');
    setBorrows(position.borrows);
  }, []);

  if (borrows.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center"
      >
        <span className="text-4xl mb-4 block">📝</span>
        <p className="text-neutral-400">대출 내역이 없습니다</p>
        <p className="text-neutral-500 text-sm mt-1">담보를 예치하고 대출을 받으세요</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden"
    >
      <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
        <h3 className="font-bold text-white">내 대출</h3>
        <span className="text-red-400 text-sm font-medium">
          -₩{borrows.reduce((sum, b) => sum + b.accruedInterest * LendingEngine.ASSET_PRICES[b.asset], 0).toFixed(0)} 이자
        </span>
      </div>

      <div className="divide-y divide-neutral-800">
        {borrows.map((borrow) => (
          <div key={borrow.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{borrow.assetIcon}</span>
                <div>
                  <p className="font-medium text-white">{borrow.assetName}</p>
                  <p className="text-sm text-neutral-400">
                    {borrow.amount.toLocaleString()} {borrow.asset}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-violet-400 font-bold">{borrow.apy}% APY</p>
                <p className="text-xs text-neutral-400">
                  ₩{borrow.valueKRW.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Accrued Interest */}
            <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-xl mb-3">
              <span className="text-sm text-red-400">누적 이자</span>
              <span className="text-red-400 font-medium">
                {borrow.accruedInterest.toFixed(2)} {borrow.asset}
              </span>
            </div>

            {/* Actions */}
            <button
              onClick={() => onRepay?.(borrow)}
              className="w-full py-2 bg-violet-500/20 text-violet-400 rounded-xl
                font-medium text-sm hover:bg-violet-500/30 transition-all"
            >
              상환하기
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LENDING STATS WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

export function LendingStatsWidget() {
  const [stats, setStats] = useState<LendingStats | null>(null);

  useEffect(() => {
    setStats(LendingEngine.getLendingStats());
  }, []);

  if (!stats) return null;

  const statItems = [
    { label: '총 예치', value: `₩${(stats.totalSupplyValueKRW / 100000000).toFixed(1)}억`, icon: '💰', color: 'emerald' },
    { label: '총 대출', value: `₩${(stats.totalBorrowValueKRW / 100000000).toFixed(1)}억`, icon: '📝', color: 'violet' },
    { label: '평균 예치 APY', value: `${stats.averageSupplyApy}%`, icon: '📈', color: 'blue' },
    { label: '평균 대출 APY', value: `${stats.averageBorrowApy}%`, icon: '📉', color: 'amber' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-3"
    >
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="bg-neutral-900 rounded-xl p-4 border border-neutral-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{item.icon}</span>
            <span className="text-xs text-neutral-400">{item.label}</span>
          </div>
          <p className="text-xl font-bold text-white">{item.value}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPPLY/BORROW MODAL
// ═══════════════════════════════════════════════════════════════════════════════

interface LendingModalProps {
  market: LendingMarket;
  mode: 'supply' | 'borrow';
  onSubmit?: (amount: number) => void;
  onClose?: () => void;
}

export function LendingModal({ market, mode, onSubmit, onClose }: LendingModalProps) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numAmount = Number(amount) || 0;
  const valueKRW = numAmount * market.priceKRW;
  const apy = mode === 'supply' ? market.supplyApy : market.borrowApy;

  const handleSubmit = async () => {
    if (numAmount <= 0) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    onSubmit?.(numAmount);
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden"
      >
        {/* Header */}
        <div className={`p-6 border-b border-neutral-800 ${
          mode === 'supply' ? 'bg-emerald-500/10' : 'bg-violet-500/10'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{market.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {mode === 'supply' ? '예치하기' : '대출하기'}
                </h2>
                <p className="text-sm text-neutral-400">{market.nameKo}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
            >
              <span className="text-neutral-400">✕</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Amount Input */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-400">금액</span>
              <span className="text-neutral-400">잔액: 50,000 {market.asset}</span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-4 pr-24 bg-neutral-800 rounded-xl border border-neutral-700
                  text-white text-xl font-bold focus:outline-none focus:border-violet-500"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  onClick={() => setAmount('50000')}
                  className="px-2 py-1 bg-neutral-700 rounded text-xs text-neutral-300 hover:bg-neutral-600"
                >
                  MAX
                </button>
                <span className="text-neutral-400">{market.asset}</span>
              </div>
            </div>
            <p className="text-sm text-neutral-500 mt-2">
              ≈ ₩{valueKRW.toLocaleString()}
            </p>
          </div>

          {/* Transaction Info */}
          <div className="bg-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">
                {mode === 'supply' ? '예치 APY' : '대출 APY'}
              </span>
              <span className={mode === 'supply' ? 'text-emerald-400' : 'text-violet-400'}>
                {apy}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">담보 비율 (LTV)</span>
              <span className="text-white">{(market.collateralFactor * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">청산 임계값</span>
              <span className="text-white">{(market.liquidationThreshold * 100).toFixed(0)}%</span>
            </div>
          </div>

          {/* Warning for Borrow */}
          {mode === 'borrow' && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-xl">
              <span className="text-amber-400">⚠️</span>
              <span className="text-xs text-amber-400">
                담보 가치가 하락하면 청산될 수 있습니다
              </span>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={numAmount <= 0 || isSubmitting}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              numAmount > 0 && !isSubmitting
                ? mode === 'supply'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90'
                  : 'bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:opacity-90'
                : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="inline-block"
              >
                ⏳
              </motion.span>
            ) : mode === 'supply' ? (
              '예치 확인'
            ) : (
              '대출 확인'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RISK METER
// ═══════════════════════════════════════════════════════════════════════════════

interface RiskMeterProps {
  utilizationRate: number;
  label?: string;
}

export function RiskMeter({ utilizationRate, label }: RiskMeterProps) {
  const getColor = (rate: number) => {
    if (rate < 50) return 'emerald';
    if (rate < 70) return 'yellow';
    if (rate < 85) return 'orange';
    return 'red';
  };

  const color = getColor(utilizationRate);

  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-neutral-400">{label || '이용률'}</span>
        <span className={`text-lg font-bold text-${color}-400`}>{utilizationRate}%</span>
      </div>

      <div className="relative h-4 bg-neutral-800 rounded-full overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 flex">
          <div className="w-1/2 bg-gradient-to-r from-emerald-500/50 to-yellow-500/50" />
          <div className="w-1/4 bg-gradient-to-r from-yellow-500/50 to-orange-500/50" />
          <div className="w-1/4 bg-gradient-to-r from-orange-500/50 to-red-500/50" />
        </div>

        {/* Indicator */}
        <motion.div
          initial={{ left: '0%' }}
          animate={{ left: `${utilizationRate}%` }}
          className="absolute top-0 h-full w-1 bg-white shadow-lg"
          style={{ transform: 'translateX(-50%)' }}
        />
      </div>

      <div className="flex justify-between text-xs text-neutral-500 mt-2">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
}
