'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 55: VIBE-ID COUPON CARD
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Tesla-Style Personal Discount Coupon Display
 * Background: #F9F9F7 | Text: #171717
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VIBE_METADATA, VibeArchetype } from '@/lib/vibe/types';

// ============================================
// Types
// ============================================

interface VibeCoupon {
  id: string;
  code: string;
  vibeType: VibeArchetype;
  discountValue: number;
  discountType: 'percentage' | 'fixed' | 'free_item';
  maxDiscount?: number;
  minPurchase: number;
  expiresAt: string;
  personalMessageKo: string;
  isActive: boolean;
}

interface VibeCouponCardProps {
  coupon: VibeCoupon;
  onApply?: (code: string) => void;
  onCopy?: (code: string) => void;
  compact?: boolean;
}

interface CouponListProps {
  coupons: VibeCoupon[];
  onApply?: (code: string) => void;
  emptyMessage?: string;
}

// ============================================
// Constants
// ============================================

const COLORS = {
  background: '#F9F9F7',
  card: '#FFFFFF',
  text: '#171717',
  muted: '#8E8E93',
  accent: '#1a1a1a',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  border: '#E5E5E7',
};

// ============================================
// Vibe Coupon Card
// ============================================

export const VibeCouponCard = memo(function VibeCouponCard({
  coupon,
  onApply,
  onCopy,
  compact = false,
}: VibeCouponCardProps) {
  const [copied, setCopied] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const metadata = VIBE_METADATA[coupon.vibeType];
  const daysRemaining = Math.ceil(
    (new Date(coupon.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isExpiringSoon = daysRemaining <= 2;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      onCopy?.(coupon.code);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [coupon.code, onCopy]);

  const handleApply = useCallback(() => {
    onApply?.(coupon.code);
  }, [coupon.code, onApply]);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-between rounded-lg p-3"
        style={{
          backgroundColor: COLORS.card,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{metadata.emoji}</span>
          <div>
            <p className="text-sm font-medium" style={{ color: COLORS.text }}>
              {coupon.discountValue}% 할인
            </p>
            <p className="text-xs" style={{ color: COLORS.muted }}>
              {metadata.nameKo}
            </p>
          </div>
        </div>
        <button
          onClick={handleApply}
          className="rounded-full px-3 py-1 text-xs font-medium"
          style={{
            backgroundColor: COLORS.accent,
            color: COLORS.background,
          }}
        >
          적용
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative perspective-1000"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <AnimatePresence mode="wait">
        {!isFlipped ? (
          <motion.div
            key="front"
            initial={{ rotateY: 180 }}
            animate={{ rotateY: 0 }}
            exit={{ rotateY: -180 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: COLORS.card,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            {/* Top Banner */}
            <div
              className="px-5 py-3"
              style={{
                background: `linear-gradient(135deg, ${metadata.primaryColor}, ${metadata.secondaryColor})`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{metadata.emoji}</span>
                  <span className="text-sm font-medium text-white">
                    {metadata.nameKo}
                  </span>
                </div>
                {isExpiringSoon && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: COLORS.danger, color: 'white' }}
                  >
                    D-{daysRemaining}
                  </span>
                )}
              </div>
            </div>

            {/* Discount Display */}
            <div className="px-5 py-6 text-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <span
                  className="text-5xl font-bold tracking-tight"
                  style={{ color: COLORS.accent }}
                >
                  {coupon.discountValue}
                  <span className="text-2xl">%</span>
                </span>
              </motion.div>
              <p className="mt-2 text-sm" style={{ color: COLORS.muted }}>
                {coupon.discountType === 'percentage' ? '할인' :
                 coupon.discountType === 'fixed' ? `₩${coupon.discountValue.toLocaleString()} 할인` :
                 '무료 상품'}
              </p>

              {coupon.maxDiscount && (
                <p className="mt-1 text-xs" style={{ color: COLORS.muted }}>
                  최대 ₩{coupon.maxDiscount.toLocaleString()}
                </p>
              )}
            </div>

            {/* Divider with circles */}
            <div className="relative flex items-center px-2">
              <div
                className="absolute -left-3 h-6 w-6 rounded-full"
                style={{ backgroundColor: COLORS.background }}
              />
              <div
                className="flex-1 border-t border-dashed"
                style={{ borderColor: COLORS.border }}
              />
              <div
                className="absolute -right-3 h-6 w-6 rounded-full"
                style={{ backgroundColor: COLORS.background }}
              />
            </div>

            {/* Coupon Code */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs" style={{ color: COLORS.muted }}>
                    쿠폰 코드
                  </p>
                  <p className="mt-1 font-mono text-sm font-medium" style={{ color: COLORS.text }}>
                    {coupon.code}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy();
                  }}
                  className="rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: copied ? COLORS.success : COLORS.accent,
                    color: 'white',
                  }}
                >
                  {copied ? '복사됨' : '복사'}
                </button>
              </div>

              {/* Conditions */}
              <div className="mt-3 flex items-center gap-4 text-xs" style={{ color: COLORS.muted }}>
                <span>최소 ₩{coupon.minPurchase.toLocaleString()}</span>
                <span>|</span>
                <span>
                  {new Date(coupon.expiresAt).toLocaleDateString('ko-KR')} 까지
                </span>
              </div>
            </div>

            {/* Apply Button */}
            {onApply && (
              <div className="px-5 pb-5">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApply();
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-lg py-3 text-sm font-medium"
                  style={{
                    backgroundColor: COLORS.accent,
                    color: COLORS.background,
                  }}
                >
                  지금 사용하기
                </motion.button>
              </div>
            )}

            {/* Flip hint */}
            <p
              className="pb-3 text-center text-xs"
              style={{ color: COLORS.muted }}
            >
              탭하여 뒤집기
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="back"
            initial={{ rotateY: -180 }}
            animate={{ rotateY: 0 }}
            exit={{ rotateY: 180 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl p-5"
            style={{
              backgroundColor: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              minHeight: 300,
            }}
          >
            {/* Personal Message */}
            <div className="mb-4">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: COLORS.muted }}>
                Personal Message
              </p>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: COLORS.text }}>
                {coupon.personalMessageKo}
              </p>
            </div>

            {/* Vibe Details */}
            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: COLORS.muted }}>
                Your Vibe
              </p>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-3xl">{metadata.emoji}</span>
                <div>
                  <p className="font-medium" style={{ color: COLORS.text }}>
                    {metadata.nameKo}
                  </p>
                  <p className="text-xs" style={{ color: COLORS.muted }}>
                    {metadata.descriptionKo}
                  </p>
                </div>
              </div>
            </div>

            {/* Keywords */}
            <div className="mt-4 flex flex-wrap gap-2">
              {metadata.keywordsKo.map((keyword, i) => (
                <span
                  key={i}
                  className="rounded-full px-3 py-1 text-xs"
                  style={{
                    backgroundColor: `${metadata.primaryColor}20`,
                    color: metadata.primaryColor,
                  }}
                >
                  {keyword}
                </span>
              ))}
            </div>

            {/* Back to front hint */}
            <p
              className="mt-6 text-center text-xs"
              style={{ color: COLORS.muted }}
            >
              탭하여 앞면 보기
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ============================================
// Coupon List
// ============================================

export const VibeCouponList = memo(function VibeCouponList({
  coupons,
  onApply,
  emptyMessage = '사용 가능한 쿠폰이 없습니다',
}: CouponListProps) {
  if (coupons.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl p-8 text-center"
        style={{
          backgroundColor: COLORS.card,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <p className="text-4xl">🎟️</p>
        <p className="mt-3 text-sm" style={{ color: COLORS.muted }}>
          {emptyMessage}
        </p>
        <p className="mt-1 text-xs" style={{ color: COLORS.muted }}>
          VIBE-ID 분석을 완료하면 개인화된 할인 쿠폰을 받을 수 있습니다
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {coupons.map((coupon, index) => (
        <motion.div
          key={coupon.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <VibeCouponCard coupon={coupon} onApply={onApply} />
        </motion.div>
      ))}
    </div>
  );
});

// ============================================
// Coupon Badge (For header/cart)
// ============================================

export const VibeCouponBadge = memo(function VibeCouponBadge({
  count,
  onClick,
}: {
  count: number;
  onClick?: () => void;
}) {
  if (count === 0) return null;

  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="relative flex items-center gap-1.5 rounded-full px-3 py-1.5"
      style={{
        backgroundColor: COLORS.accent,
        color: COLORS.background,
      }}
    >
      <span className="text-sm">🎟️</span>
      <span className="text-xs font-medium">{count}</span>
      <motion.span
        className="absolute -right-1 -top-1 h-2 w-2 rounded-full"
        style={{ backgroundColor: COLORS.success }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </motion.button>
  );
});

// ============================================
// Mini Coupon (For checkout)
// ============================================

export const MiniVibeCoupon = memo(function MiniVibeCoupon({
  coupon,
  isSelected,
  onSelect,
}: {
  coupon: VibeCoupon;
  isSelected: boolean;
  onSelect: (coupon: VibeCoupon) => void;
}) {
  const metadata = VIBE_METADATA[coupon.vibeType];

  return (
    <motion.button
      onClick={() => onSelect(coupon)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors"
      style={{
        backgroundColor: isSelected ? `${COLORS.accent}10` : COLORS.card,
        border: `2px solid ${isSelected ? COLORS.accent : COLORS.border}`,
      }}
    >
      <span className="text-2xl">{metadata.emoji}</span>
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: COLORS.text }}>
          {coupon.discountValue}% 할인
        </p>
        <p className="text-xs" style={{ color: COLORS.muted }}>
          {metadata.nameKo} 쿠폰
        </p>
      </div>
      {isSelected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-lg"
        >
          ✓
        </motion.span>
      )}
    </motion.button>
  );
});

export default VibeCouponCard;
