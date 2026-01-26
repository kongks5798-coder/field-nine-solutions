'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 56: SOVEREIGN BONUS WIDGET
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Shows expected Sovereign tier bonus on VRD product pages.
 * Seamless ecosystem link: Fashion → Energy Investment
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════════
// SOVEREIGN TIER CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const SOVEREIGN_TIERS = {
  BRONZE: { threshold: 0, bonus: 1.0, color: '#CD7F32', icon: '🥉' },
  SILVER: { threshold: 10000, bonus: 1.25, color: '#C0C0C0', icon: '🥈' },
  GOLD: { threshold: 50000, bonus: 1.5, color: '#FFD700', icon: '🥇' },
  PLATINUM: { threshold: 100000, bonus: 2.0, color: '#E5E4E2', icon: '💎' },
  DIAMOND: { threshold: 500000, bonus: 3.0, color: '#B9F2FF', icon: '👑' },
} as const;

type TierName = keyof typeof SOVEREIGN_TIERS;

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function calculateTier(totalSpent: number): TierName {
  if (totalSpent >= SOVEREIGN_TIERS.DIAMOND.threshold) return 'DIAMOND';
  if (totalSpent >= SOVEREIGN_TIERS.PLATINUM.threshold) return 'PLATINUM';
  if (totalSpent >= SOVEREIGN_TIERS.GOLD.threshold) return 'GOLD';
  if (totalSpent >= SOVEREIGN_TIERS.SILVER.threshold) return 'SILVER';
  return 'BRONZE';
}

function calculateNextTier(currentTier: TierName): { tier: TierName; threshold: number } | null {
  const tiers: TierName[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
  const currentIndex = tiers.indexOf(currentTier);
  if (currentIndex >= tiers.length - 1) return null;
  const nextTier = tiers[currentIndex + 1];
  return { tier: nextTier, threshold: SOVEREIGN_TIERS[nextTier].threshold };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOVEREIGN BONUS WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

interface SovereignBonusWidgetProps {
  productPrice: number;
  currency?: 'KRW' | 'USD';
  userTotalSpent?: number;
  className?: string;
}

export function SovereignBonusWidget({
  productPrice,
  currency = 'KRW',
  userTotalSpent = 0,
  className = '',
}: SovereignBonusWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const currentTier = calculateTier(userTotalSpent);
  const tierConfig = SOVEREIGN_TIERS[currentTier];
  const nextTier = calculateNextTier(currentTier);

  // Calculate KAUS bonus (2% base + tier multiplier)
  const baseKausRate = 0.02; // 2% of purchase
  const kausPrice = currency === 'KRW' ? 124 : 0.09; // KAUS price
  const baseKausAmount = Math.floor((productPrice * baseKausRate) / kausPrice);
  const bonusKausAmount = Math.floor(baseKausAmount * (tierConfig.bonus - 1));
  const totalKausAmount = baseKausAmount + bonusKausAmount;

  // Progress to next tier
  const newTotalSpent = userTotalSpent + productPrice;
  const newTier = calculateTier(newTotalSpent);
  const tierUpgrade = newTier !== currentTier;

  const progressToNext = nextTier
    ? Math.min(100, ((newTotalSpent / nextTier.threshold) * 100))
    : 100;

  return (
    <div className={`bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl ${className}`}>
      {/* Collapsed View */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{tierConfig.icon}</span>
          <div className="text-left">
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              구매 시 예상 Sovereign 보너스
            </div>
            <div className="text-xs text-neutral-500">
              {currentTier} Member × {tierConfig.bonus}x
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            +{totalKausAmount.toLocaleString()} KAUS
          </div>
          <div className="text-xs text-neutral-500">
            ≈ ₩{(totalKausAmount * 124).toLocaleString()}
          </div>
        </div>
      </button>

      {/* Expanded View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-emerald-500/20 pt-4">
              {/* Bonus Breakdown */}
              <div className="bg-white/50 dark:bg-black/30 rounded-lg p-3">
                <div className="text-xs text-neutral-500 mb-2">보너스 상세</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>기본 적립 (2%)</span>
                    <span className="font-medium">+{baseKausAmount.toLocaleString()} KAUS</span>
                  </div>
                  {bonusKausAmount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>{currentTier} 보너스 (+{((tierConfig.bonus - 1) * 100).toFixed(0)}%)</span>
                      <span className="font-medium">+{bonusKausAmount.toLocaleString()} KAUS</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-neutral-200 dark:border-neutral-700">
                    <span>총 적립</span>
                    <span className="text-emerald-600">+{totalKausAmount.toLocaleString()} KAUS</span>
                  </div>
                </div>
              </div>

              {/* Tier Progress */}
              {nextTier && (
                <div className="bg-white/50 dark:bg-black/30 rounded-lg p-3">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-neutral-500">다음 등급까지</span>
                    <span className="font-medium">
                      {SOVEREIGN_TIERS[nextTier.tier].icon} {nextTier.tier}
                    </span>
                  </div>
                  <div className="relative h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressToNext}%` }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                    />
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    ₩{newTotalSpent.toLocaleString()} / ₩{nextTier.threshold.toLocaleString()}
                  </div>

                  {tierUpgrade && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-3 p-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-lg text-center"
                    >
                      <span className="text-amber-600 dark:text-amber-400 text-sm font-bold">
                        🎉 이 구매로 {newTier} 등급 달성!
                      </span>
                    </motion.div>
                  )}
                </div>
              )}

              {/* CTA */}
              <Link
                href="/nexus/staking"
                className="block w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-lg text-center text-sm hover:opacity-90 transition-opacity"
              >
                KAUS 스테이킹으로 연 13.5% 수익 받기 →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI BADGE (for product cards)
// ═══════════════════════════════════════════════════════════════════════════════

interface SovereignBonusBadgeProps {
  productPrice: number;
  currency?: 'KRW' | 'USD';
}

export function SovereignBonusBadge({ productPrice, currency = 'KRW' }: SovereignBonusBadgeProps) {
  const kausPrice = currency === 'KRW' ? 124 : 0.09;
  const estimatedKaus = Math.floor((productPrice * 0.02) / kausPrice);

  if (estimatedKaus < 1) return null;

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
      <span className="text-xs">⚡</span>
      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
        +{estimatedKaus} KAUS
      </span>
    </div>
  );
}

export default SovereignBonusWidget;
