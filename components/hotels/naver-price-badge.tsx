/**
 * Naver Price Badge
 * Shows "네이버 최저가 동일" badge
 */

'use client';

import { motion } from 'framer-motion';
import { Check, RefreshCw } from 'lucide-react';

interface NaverPriceBadgeProps {
  isMatched: boolean;
  provider?: string;
  variant?: 'default' | 'compact' | 'inline';
  showAnimation?: boolean;
}

export default function NaverPriceBadge({
  isMatched,
  provider,
  variant = 'default',
  showAnimation = true,
}: NaverPriceBadgeProps) {
  if (!isMatched) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[#171717]/60">
        <Check className="w-3 h-3 text-green-600" />
        네이버 동일
      </span>
    );
  }

  if (variant === 'inline') {
    return (
      <span className="text-xs text-[#171717]/50">
        네이버 실시간 최저가와 100% 동일합니다
      </span>
    );
  }

  return (
    <motion.div
      initial={showAnimation ? { opacity: 0, y: 5 } : false}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-2 bg-[#F9F9F7] rounded-lg"
    >
      {/* Naver Logo (simplified N) */}
      <div className="w-5 h-5 bg-[#03C75A] rounded flex items-center justify-center">
        <span className="text-white text-xs font-bold">N</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[#171717]">
          네이버 최저가와 100% 동일
        </p>
        {provider && (
          <p className="text-[10px] text-[#171717]/40 truncate">
            via {provider}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 text-[#03C75A]">
        <RefreshCw className="w-3 h-3" />
        <span className="text-[10px] font-medium">실시간</span>
      </div>
    </motion.div>
  );
}

/**
 * Large Naver Price Badge for checkout
 */
export function NaverPriceBadgeLarge({
  price,
  isMatched,
}: {
  price: string;
  isMatched: boolean;
}) {
  return (
    <div className="p-4 bg-[#F9F9F7] rounded-xl border border-[#171717]/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#03C75A] rounded flex items-center justify-center">
            <span className="text-white text-sm font-bold">N</span>
          </div>
          <span className="text-sm font-medium text-[#171717]">
            네이버 최저가
          </span>
        </div>
        {isMatched && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <Check className="w-3.5 h-3.5" />
            가격 동일 확인
          </span>
        )}
      </div>

      <p className="text-2xl font-bold text-[#171717] mb-2">{price}</p>

      <p className="text-xs text-[#171717]/50">
        네이버 실시간 최저가와 100% 동일한 가격입니다.
        <br />
        차액 발생 시 전액 보상해 드립니다.
      </p>
    </div>
  );
}

/**
 * Mini badge for hotel list
 */
export function NaverPriceBadgeMini() {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#03C75A]/10 rounded text-[10px] font-medium text-[#03C75A]">
      <div className="w-3 h-3 bg-[#03C75A] rounded-sm flex items-center justify-center">
        <span className="text-white text-[8px] font-bold">N</span>
      </div>
      동일
    </div>
  );
}
