"use client";
import { useEffect, useState, useMemo } from 'react';

function getColor(score: number) {
  if (score >= 80) return '#4caf50';
  if (score >= 50) return '#ff9800';
  return '#f44336';
}

export default function AIQualityTrendGraph() {
  const [logs, setLogs] = useState<any[]>([]);
  const [evaluated, setEvaluated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/get-chat-logs')
      .then(res => res.json())
      .then(data => setLogs(data.logs || []));
  }, []);

  useEffect(() => {
    if (!logs.length) return;
    setLoading(true);
    Promise.all(
      logs.map(async (log) => {
        const res = await fetch('/api/ai-quality-eval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: '', response: log.text })
        });
        const data = await res.json();
        return { ...log, ...data };
      })
    ).then(setEvaluated).finally(() => setLoading(false));
  }, [logs]);

  // 날짜별 평균점수
  const daily = useMemo(() => {
    const stats: Record<string, { sum: number; count: number }> = {};
    evaluated.forEach(l => {
      const day = (l.timestamp || '').slice(0, 10);
      if (!stats[day]) stats[day] = { sum: 0, count: 0 };
      stats[day].sum += l.score || 0;
      stats[day].count++;
    });
    return Object.entries(stats).map(([day, { sum, count }]) => ({ day, avg: count ? Math.round(sum / count) : 0 }));
  }, [evaluated]);

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <h2>AI 품질 추이 시각화 (그래프)</h2>
      {loading && <div>로딩 중...</div>}
      {!loading && daily.length > 0 && (
        <svg width={Math.max(600, daily.length * 40)} height={300} style={{ background: '#fafafa', borderRadius: 12, border: '1px solid #eee' }}>
          {/* Y축 */}
          <line x1={40} y1={20} x2={40} y2={260} stroke="#bbb" strokeWidth={1} />
          {/* X축 */}
          <line x1={40} y1={260} x2={40 + daily.length * 40} y2={260} stroke="#bbb" strokeWidth={1} />
          {/* Y축 라벨 */}
          {[100, 80, 60, 40, 20, 0].map((y, i) => (
            <g key={i}>
              <text x={5} y={260 - y * 2.2} fontSize={12} fill="#888">{y}</text>
              <line x1={38} y1={260 - y * 2.2} x2={42} y2={260 - y * 2.2} stroke="#bbb" />
            </g>
          ))}
          {/* 데이터 점/선 */}
          {daily.map((d, i) => (
            <g key={d.day}>
              {i > 0 && (
                <line
                  x1={40 + (i - 1) * 40}
                  y1={260 - daily[i - 1].avg * 2.2}
                  x2={40 + i * 40}
                  y2={260 - d.avg * 2.2}
                  stroke="#2196f3"
                  strokeWidth={2}
                />
              )}
              <circle
                cx={40 + i * 40}
                cy={260 - d.avg * 2.2}
                r={8}
                fill={getColor(d.avg)}
                stroke="#1976d2"
                strokeWidth={2}
              />
              <text x={40 + i * 40 - 18} y={280} fontSize={12} fill="#888">{d.day.slice(5)}</text>
              <text x={40 + i * 40 - 8} y={260 - d.avg * 2.2 - 12} fontSize={13} fill={getColor(d.avg)} fontWeight={700}>{d.avg}</text>
            </g>
          ))}
        </svg>
      )}
      {!loading && daily.length === 0 && <div>데이터가 없습니다.</div>}
    </div>
  );
}
