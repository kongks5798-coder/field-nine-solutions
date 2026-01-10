'use client';

import { createClient } from '@/src/utils/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SidebarLayout from '@/components/layout/SidebarLayout';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, DollarSign, Package, Users, Calendar, BarChart3, PieChart as PieChartIcon, Loader2 } from 'lucide-react';
import Toast from '@/app/components/Toast';
import { logger } from '@/src/utils/logger';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  product_amount?: number;
  net_profit?: number;
}

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkSessionAndLoadData();
  }, [timeRange]);

  const checkSessionAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?redirect=/dashboard/analytics');
        return;
      }
      await loadAnalytics();
    } catch (error) {
      logger.error("세션 확인 오류", error as Error);
      router.push('/login?redirect=/dashboard/analytics');
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (timeRange !== 'all') {
        query = query.gte('created_at', startDate);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setOrders(data || []);
      logger.info("분석 데이터 로드 완료", { count: data?.length || 0, timeRange });
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error("분석 데이터 로드 실패", err as Error);
      setToast({ message: "분석 데이터를 불러오는데 실패했습니다.", type: "error" });
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

  // 통계 계산
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalProfit = orders.reduce((sum, order) => sum + (order.net_profit || 0), 0);
  
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 일별 매출 데이터 (차트용)
  const dailyRevenue = orders.reduce((acc, order) => {
    const date = new Date(order.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    acc[date] = (acc[date] || 0) + (order.total_amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const dailyRevenueChart = Object.entries(dailyRevenue)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .slice(-14) // 최근 14일
    .map(([date, revenue]) => ({ date, revenue }));

  // 주문 상태별 데이터 (파이 차트용)
  const statusChartData = Object.entries(statusCounts).map(([status, count]) => {
    const statusLabels: Record<string, string> = {
      pending: '대기 중',
      confirmed: '확인됨',
      preparing: '준비 중',
      ready_to_ship: '배송 준비',
      shipping: '배송 중',
      delivered: '배송 완료',
      cancelled: '취소됨',
      refunded: '환불됨',
    };
    return {
      name: statusLabels[status] || status,
      value: count,
    };
  });

  const COLORS = ['#1A5D3F', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280'];

  if (loading) {
    return (
      <SidebarLayout userName="로딩 중..." userEmail="">
        <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#1A5D3F] mx-auto mb-4" />
            <p className="text-[#6B6B6B]">분석 데이터를 불러오는 중...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout userName="분석 및 통계" userEmail="">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#171717] mb-2">분석 및 통계</h1>
            <p className="text-[#6B6B6B]">비즈니스 인사이트를 확인하세요</p>
          </div>
          <div className="flex gap-2">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-[#1A5D3F] text-white'
                    : 'bg-white border border-[#E5E5E0] text-[#171717] hover:bg-gray-50'
                }`}
              >
                {range === '7d' ? '7일' : range === '30d' ? '30일' : range === '90d' ? '90일' : '전체'}
              </button>
            ))}
          </div>
        </div>

        {/* 주요 지표 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[#171717] mb-1">{formatCurrency(totalRevenue)}</h3>
            <p className="text-sm text-gray-600">총 매출</p>
          </div>

          <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[#171717] mb-1">{totalOrders}</h3>
            <p className="text-sm text-gray-600">총 주문 수</p>
          </div>

          <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[#171717] mb-1">{formatCurrency(averageOrderValue)}</h3>
            <p className="text-sm text-gray-600">평균 주문 금액</p>
          </div>

          <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[#171717] mb-1">{formatCurrency(totalProfit)}</h3>
            <p className="text-sm text-gray-600">총 순이익</p>
          </div>
        </div>

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 일별 매출 추이 */}
          <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#171717] mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              일별 매출 추이 (최근 14일)
            </h3>
            {dailyRevenueChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyRevenueChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                  <XAxis dataKey="date" stroke="#6B6B6B" />
                  <YAxis stroke="#6B6B6B" tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number | undefined) => value ? formatCurrency(value) : ''}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E5E0', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#1A5D3F" 
                    strokeWidth={2}
                    name="매출"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                데이터가 없습니다
              </div>
            )}
          </div>

          {/* 주문 상태별 분포 */}
          <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#171717] mb-4 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              주문 상태별 분포
            </h3>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                데이터가 없습니다
              </div>
            )}
          </div>
        </div>

        {/* 주간 매출 바 차트 */}
        <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#171717] mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            주간 매출 비교
          </h3>
          {dailyRevenueChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyRevenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                <XAxis dataKey="date" stroke="#6B6B6B" />
                <YAxis stroke="#6B6B6B" tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number | undefined) => value ? formatCurrency(value) : ''}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E5E0', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#1A5D3F" name="매출" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              데이터가 없습니다
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
