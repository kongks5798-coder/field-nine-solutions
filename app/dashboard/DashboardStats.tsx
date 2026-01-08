"use client";

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Package, RefreshCw, DollarSign, TrendingUp, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import { logger } from '@/src/utils/logger';
import type { DashboardStatsData } from '@/src/types';

export default function DashboardStats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // 최근 7일 데이터 조회
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch(
        `/api/dashboard/stats?start_date=${startDate}&end_date=${endDate}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        // API가 DashboardStatsData 타입을 정확히 반환함 (변환 불필요)
        setStats(result.data as DashboardStatsData);
        logger.info('[DashboardStats] 통계 로드 성공');
      } else {
        throw new Error(result.error || 'Failed to load stats');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      logger.error('[DashboardStats] 통계 로드 실패:', error as Error);
      setError(error.message || '통계를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A5D3F]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">오류 발생</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={loadStats}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-12 text-center">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">데이터 없음</h3>
        <p className="text-gray-500 mb-4">아직 주문 데이터가 없습니다. 주문을 동기화하면 통계가 표시됩니다.</p>
        <a
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A5D3F] text-white rounded-lg hover:bg-[#1A5D3F]/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          주문 동기화하기
        </a>
      </div>
    );
  }

  // 데이터가 비어있는 경우 (주문이 0개)
  const hasNoData = stats.orders.total === 0 && stats.daily_stats.every(d => d.orders_count === 0);

  return (
    <div className="space-y-6">
      {/* 재고 부족 알림 카드 */}
      {stats.low_stock_products && stats.low_stock_products.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-red-900 mb-2">
                🚨 재고 부족 임박
              </h3>
              <p className="text-sm sm:text-base text-red-700 mb-3">
                다음 상품들의 재고가 10개 미만입니다. 즉시 보충이 필요합니다.
              </p>
              <div className="space-y-2">
                {stats.low_stock_products.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-[#171717]">{product.name}</p>
                      <p className="text-xs text-gray-600">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">
                        {product.stock_quantity}개
                      </p>
                      <p className="text-xs text-gray-500">재고</p>
                    </div>
                  </div>
                ))}
                {stats.low_stock_products.length > 5 && (
                  <p className="text-sm text-red-600 font-medium text-center pt-2">
                    + {stats.low_stock_products.length - 5}개 더...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 데이터 없음 상태 */}
      {hasNoData && (
        <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">데이터 없음</h3>
          <p className="text-gray-500 mb-4">아직 주문 데이터가 없습니다. 주문을 동기화하면 통계가 표시됩니다.</p>
          <a
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A5D3F] text-white rounded-lg hover:bg-[#1A5D3F]/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            주문 동기화하기
          </a>
        </div>
      )}

      {/* 통계 카드 그리드 */}
      {!hasNoData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* 오늘 주문 건수 */}
            <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#1A5D3F]/10 flex items-center justify-center">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-[#1A5D3F]" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#171717] mb-1">
                {stats.today.orders_count}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">오늘 주문 건수</p>
            </div>

            {/* 배송 준비 중 */}
            <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#171717] mb-1">
                {stats.today.preparing}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">배송 준비 중</p>
            </div>

            {/* 취소/반품 */}
            <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-red-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 rotate-180" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#171717] mb-1">
                {stats.today.cancelled}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">취소/반품</p>
            </div>

            {/* 예상 정산금 */}
            <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-50 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#171717] mb-1">
                {formatCurrency(stats.expected_settlement)}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">예상 정산금</p>
            </div>
          </div>

          {/* 차트 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* 최근 7일 매출 추이 */}
            <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-[#171717] mb-4">최근 7일 매출 추이</h3>
              {stats.daily_stats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.daily_stats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                        return value.toString();
                      }}
                    />
                    <Tooltip
                      formatter={(value: number | undefined) => formatCurrency(value || 0)}
                      labelFormatter={(label) => {
                        const date = new Date(label);
                        return date.toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                        });
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#1A5D3F"
                      strokeWidth={2}
                      name="매출"
                      dot={{ fill: '#1A5D3F', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="순이익"
                      dot={{ fill: '#10B981', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  <p>데이터가 없습니다</p>
                </div>
              )}
            </div>

            {/* 주문 상태별 분포 */}
            <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-[#171717] mb-4">주문 상태별 분포</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: '결제완료', value: stats.orders.by_status.PAID || 0 },
                  { name: '준비중', value: stats.orders.by_status.PREPARING || 0 },
                  { name: '배송중', value: stats.orders.by_status.SHIPPED || 0 },
                  { name: '배송완료', value: stats.orders.by_status.DELIVERED || 0 },
                  { name: '취소', value: stats.orders.by_status.CANCELLED || 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1A5D3F" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 수익 요약 */}
          <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-[#171717] mb-4">수익 요약</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">총 매출</p>
                <p className="text-xl font-bold text-[#171717]">
                  {formatCurrency(stats.revenue.total_amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">총 원가</p>
                <p className="text-xl font-bold text-[#171717]">
                  {formatCurrency(stats.revenue.total_cost || 0)}
                </p>
              </div>
              {stats.revenue.platform_fee !== undefined && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">플랫폼 수수료</p>
                  <p className="text-xl font-bold text-[#171717]">
                    {formatCurrency(stats.revenue.platform_fee)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 mb-1">순이익</p>
                <p className="text-xl font-bold text-[#10B981]">
                  {formatCurrency(stats.revenue.net_profit)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">수익률</p>
                <p className="text-xl font-bold text-[#1A5D3F]">
                  {stats.revenue.profit_rate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
