'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, DollarSign, TrendingUp, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Deal {
  id: string;
  item: string;
  brand: string;
  foundPrice: number;
  marketPrice: number;
  margin: number;
  location: string;
  seller: string;
  condition: string;
  estimatedDelivery: string;
}

interface DealApprovalModalProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (dealId: string) => void;
  onReject: (dealId: string) => void;
}

export default function DealApprovalModal({
  deal,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: DealApprovalModalProps) {
  if (!deal) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const profit = deal.marketPrice - deal.foundPrice;

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
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
              <CardContent className="p-6 lg:p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[#1A1A1A] mb-1">거래 승인</h2>
                    <p className="text-sm text-gray-500">거래 세부 정보를 확인하고 승인하세요</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Deal Info */}
                <div className="space-y-6">
                  {/* Item Info */}
                  <div className="p-6 bg-[#F9F9F9] rounded-xl border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#1A1A1A] mb-1">{deal.item}</h3>
                        <p className="text-sm text-gray-500">{deal.brand}</p>
                      </div>
                      <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold">
                        +{deal.margin.toFixed(1)}% 수익률
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{deal.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{deal.estimatedDelivery}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-[#1A1A1A] mb-3">가격 분석</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">소싱 가격</span>
                        <span className="font-bold text-[#1A1A1A]">{formatCurrency(deal.foundPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">예상 시장가</span>
                        <span className="font-bold text-[#1A1A1A]">{formatCurrency(deal.marketPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-700">예상 순수익</span>
                        </div>
                        <span className="text-2xl font-bold text-green-600">{formatCurrency(profit)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">판매자</p>
                      <p className="font-medium text-[#1A1A1A]">{deal.seller}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">상태</p>
                      <p className="font-medium text-[#1A1A1A]">{deal.condition}</p>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-semibold mb-1">주의사항</p>
                      <p>거래 승인 전 모든 정보를 확인하세요. 승인 후 취소가 어려울 수 있습니다.</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                  <Button
                    onClick={() => onReject(deal.id)}
                    variant="outline"
                    className="flex-1 rounded-xl"
                  >
                    거절
                  </Button>
                  <Button
                    onClick={() => onApprove(deal.id)}
                    className="flex-1 bg-[#1A1A1A] text-white rounded-xl hover:bg-black"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    거래 승인
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
