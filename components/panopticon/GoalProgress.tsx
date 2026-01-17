'use client';

import { Target, TrendingUp, AlertCircle } from 'lucide-react';

interface GoalProgressProps {
  target: number;        // 목표 매출
  current: number;       // 현재 매출
  month: string;         // 월 (YYYY-MM)
  daysRemaining: number; // 남은 일수
}

const formatCurrency = (n: number) => {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${(n / 10000).toFixed(0)}만`;
  return n.toLocaleString('ko-KR');
};

export default function GoalProgress({ target, current, month, daysRemaining }: GoalProgressProps) {
  const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const remaining = target - current;
  const dailyNeeded = daysRemaining > 0 ? remaining / daysRemaining : 0;

  // 목표 달성 예측
  const daysPassed = new Date().getDate();
  const avgDaily = daysPassed > 0 ? current / daysPassed : 0;
  const projectedTotal = avgDaily * (daysPassed + daysRemaining);
  const onTrack = projectedTotal >= target;

  // 상태 색상
  const getStatusColor = () => {
    if (progress >= 100) return '#22C55E'; // 달성
    if (progress >= 80) return '#3B82F6';  // 순조
    if (progress >= 50) return '#F59E0B';  // 주의
    return '#EF4444';                       // 위험
  };

  const statusColor = getStatusColor();

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            padding: '10px',
            borderRadius: '12px',
            background: `${statusColor}20`,
          }}>
            <Target style={{ width: '20px', height: '20px', color: statusColor }} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
              {month.replace('-', '년 ')}월 목표
            </h3>
            <p style={{ fontSize: '12px', color: '#525252', marginTop: '2px' }}>
              D-{daysRemaining}
            </p>
          </div>
        </div>
        <div style={{
          padding: '6px 12px',
          borderRadius: '20px',
          background: onTrack ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${onTrack ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
          <span style={{ fontSize: '12px', fontWeight: 500, color: onTrack ? '#22C55E' : '#EF4444' }}>
            {onTrack ? '순조로움' : '주의 필요'}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: '#737373' }}>진행률</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: statusColor }}>
            {progress.toFixed(1)}%
          </span>
        </div>
        <div style={{
          height: '10px',
          borderRadius: '5px',
          background: 'rgba(255,255,255,0.05)',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            borderRadius: '5px',
            background: `linear-gradient(90deg, ${statusColor} 0%, ${statusColor}CC 100%)`,
            transition: 'width 1s ease',
            boxShadow: `0 0 10px ${statusColor}50`,
          }} />
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {/* 현재 매출 */}
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.15)',
        }}>
          <p style={{ fontSize: '12px', color: '#737373', marginBottom: '4px' }}>현재 매출</p>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#3B82F6', margin: 0 }}>
            {formatCurrency(current)}
          </p>
        </div>

        {/* 목표 매출 */}
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(139,92,246,0.08)',
          border: '1px solid rgba(139,92,246,0.15)',
        }}>
          <p style={{ fontSize: '12px', color: '#737373', marginBottom: '4px' }}>목표 매출</p>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#8B5CF6', margin: 0 }}>
            {formatCurrency(target)}
          </p>
        </div>

        {/* 남은 금액 */}
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: remaining > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)',
          border: `1px solid ${remaining > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)'}`,
        }}>
          <p style={{ fontSize: '12px', color: '#737373', marginBottom: '4px' }}>
            {remaining > 0 ? '남은 금액' : '초과 달성'}
          </p>
          <p style={{
            fontSize: '20px',
            fontWeight: 700,
            color: remaining > 0 ? '#F59E0B' : '#22C55E',
            margin: 0
          }}>
            {formatCurrency(Math.abs(remaining))}
          </p>
        </div>

        {/* 일평균 필요 */}
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <p style={{ fontSize: '12px', color: '#737373', marginBottom: '4px' }}>일평균 필요</p>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#FAFAFA', margin: 0 }}>
            {remaining > 0 ? formatCurrency(dailyNeeded) : '-'}
          </p>
        </div>
      </div>

      {/* 예측 알림 */}
      {!onTrack && remaining > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <AlertCircle style={{ width: '16px', height: '16px', color: '#EF4444', flexShrink: 0 }} />
          <p style={{ fontSize: '13px', color: '#FCA5A5', margin: 0 }}>
            현재 추세로는 목표의 {((projectedTotal / target) * 100).toFixed(0)}%만 달성 예상
          </p>
        </div>
      )}

      {progress >= 100 && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <TrendingUp style={{ width: '16px', height: '16px', color: '#22C55E', flexShrink: 0 }} />
          <p style={{ fontSize: '13px', color: '#86EFAC', margin: 0 }}>
            월 목표 달성 완료!
          </p>
        </div>
      )}
    </div>
  );
}
