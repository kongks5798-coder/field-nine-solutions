'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';

interface MonthlyData {
  month: string;
  grossSales: number;
  netSales: number;
  orders: number;
}

interface MonthlyChartProps {
  data: MonthlyData[];
  title?: string;
}

const formatCurrency = (n: number) => {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${(n / 10000).toFixed(0)}만`;
  return n.toLocaleString('ko-KR');
};

const formatMonth = (month: string) => {
  const [year, m] = month.split('-');
  return `${m}월`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1A1A1A',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '12px',
      }}>
        <p style={{ color: '#FAFAFA', fontWeight: 600, marginBottom: '8px' }}>{label}</p>
        <p style={{ color: '#22C55E', fontSize: '13px', margin: '4px 0' }}>
          총매출: {formatCurrency(payload[0]?.value || 0)}
        </p>
        <p style={{ color: '#3B82F6', fontSize: '13px', margin: '4px 0' }}>
          순매출: {formatCurrency(payload[1]?.value || 0)}
        </p>
      </div>
    );
  }
  return null;
};

export default function MonthlyChart({ data, title = '월별 매출 추이' }: MonthlyChartProps) {
  // 데이터를 최신순에서 오래된순으로 정렬 (차트 표시용)
  const chartData = [...data]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(item => ({
      ...item,
      displayMonth: formatMonth(item.month),
    }));

  // 성장률 계산
  const getGrowthRate = () => {
    if (chartData.length < 2) return null;
    const current = chartData[chartData.length - 1].grossSales;
    const previous = chartData[chartData.length - 2].grossSales;
    if (previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  const growthRate = getGrowthRate();

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '20px',
        padding: '24px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            padding: '10px',
            borderRadius: '12px',
            background: 'rgba(34,197,94,0.15)',
          }}>
            <Calendar style={{ width: '20px', height: '20px', color: '#22C55E' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
              {title}
            </h3>
            <p style={{ fontSize: '12px', color: '#525252', marginTop: '2px' }}>
              최근 {data.length}개월
            </p>
          </div>
        </div>
        {growthRate !== null && (
          <div style={{
            padding: '6px 12px',
            borderRadius: '20px',
            background: growthRate >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${growthRate >= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <TrendingUp style={{
              width: '14px',
              height: '14px',
              color: growthRate >= 0 ? '#22C55E' : '#EF4444',
              transform: growthRate < 0 ? 'rotate(180deg)' : 'none',
            }} />
            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              color: growthRate >= 0 ? '#22C55E' : '#EF4444'
            }}>
              {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div style={{ height: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="displayMonth"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#737373', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#737373', fontSize: 11 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="grossSales"
                fill="#22C55E"
                radius={[4, 4, 0, 0]}
                name="총매출"
              />
              <Bar
                dataKey="netSales"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
                name="순매출"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#525252',
          fontSize: '14px',
        }}>
          데이터가 없습니다
        </div>
      )}

      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        marginTop: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#22C55E' }} />
          <span style={{ fontSize: '12px', color: '#737373' }}>총매출</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#3B82F6' }} />
          <span style={{ fontSize: '12px', color: '#737373' }}>순매출</span>
        </div>
      </div>
    </div>
  );
}
