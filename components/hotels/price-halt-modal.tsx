/**
 * Price Halt Modal
 * Safety Protocol - Shows when price deficit is detected
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Clock, RefreshCw, Phone } from 'lucide-react';

interface PriceHaltModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotelName?: string;
  onRetry?: () => void;
}

export default function PriceHaltModal({
  isOpen,
  onClose,
  hotelName,
  onRetry,
}: PriceHaltModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-6 bg-[#FEF3C7]">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/50 flex items-center justify-center hover:bg-white transition-colors"
              >
                <X className="w-4 h-4 text-[#171717]" />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-[#F59E0B] flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#171717]">
                    가격 확인 중
                  </h3>
                  <p className="text-sm text-[#171717]/60">
                    Safety Protocol
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {hotelName && (
                <p className="text-sm text-[#171717]/60 mb-4">
                  <span className="font-medium text-[#171717]">{hotelName}</span>
                </p>
              )}

              <div className="p-4 bg-[#F9F9F7] rounded-xl mb-6">
                <p className="text-[#171717] font-medium mb-2">
                  본사 확인 중인 특가 상품입니다.
                </p>
                <p className="text-sm text-[#171717]/60">
                  현재 네이버 최저가가 일시적으로 저희 원가보다 낮게 책정되어
                  가격 검증 중입니다. 잠시 후 다시 시도해 주세요.
                </p>
              </div>

              {/* Info Items */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-[#171717]/70">
                  <Clock className="w-4 h-4 text-[#171717]/40" />
                  <span>평균 10분 내 가격 업데이트</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#171717]/70">
                  <RefreshCw className="w-4 h-4 text-[#171717]/40" />
                  <span>실시간 네이버 가격 모니터링 중</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#171717]/70">
                  <Phone className="w-4 h-4 text-[#171717]/40" />
                  <span>문의: 1588-0000</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 border border-[#171717]/10 rounded-xl text-[#171717] font-medium hover:bg-[#F9F9F7] transition-colors"
                >
                  다른 호텔 보기
                </button>
                {onRetry && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={onRetry}
                    className="flex-1 py-3 bg-[#171717] rounded-xl text-white font-medium hover:bg-[#171717]/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    다시 확인
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Inline price halt notice for hotel card
 */
export function PriceHaltNotice({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-[#FEF3C7] rounded-lg">
      <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
      <p className="text-xs text-[#171717]/70">{message}</p>
    </div>
  );
}
