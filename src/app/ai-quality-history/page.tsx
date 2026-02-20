"use client";
import { useEffect, useState, useMemo } from 'react';

export default function AIQualityHistoryDashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [evaluated, setEvaluated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

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

  // 날짜별 집계
  const dailyStats = useMemo(() => {
    const stats: Record<string, { count: number; avg: number; low: number }> = {};
    evaluated.forEach(l => {
      const day = (l.timestamp || '').slice(0, 10);
      if (!stats[day]) stats[day] = { count: 0, avg: 0, low: 0 };
      stats[day].count++;
      stats[day].avg += l.score || 0;
      if ((l.score || 0) < 50) stats[day].low++;
    });
    Object.keys(stats).forEach(day => {
      stats[day].avg = stats[day].count ? Math.round(stats[day].avg / stats[day].count) : 0;
    });
    return stats;
  }, [evaluated]);

  // 개선 이력(수동 입력 예시)
  useEffect(() => {
    setHistory([
      { date: '2026-02-10', action: '프롬프트 개선', note: 'Korean/English 혼합 안내 추가' },
      { date: '2026-02-14', action: '엔진 업그레이드', note: 'GPT-4 Turbo 적용' },
      { date: '2026-02-17', action: '실데이터 튜닝', note: '실제 사용자 질문 반영' },
    ]);
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <h2>AI 품질 이력 대시보드</h2>
      <h3>일별 품질 통계</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
        <thead>
          <tr style={{ background: '#f7f7fa' }}>
            <th>날짜</th>
            <th>대화수</th>
            <th>평균점수</th>
            <th>저품질(50점 미만)</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(dailyStats).map(([day, stat]) => (
            <tr key={day} style={{ borderBottom: '1px solid #eee' }}>
              <td>{day}</td>
              <td>{stat.count}</td>
              <td style={{ color: stat.avg >= 80 ? '#4caf50' : stat.avg >= 50 ? '#ff9800' : '#f44336', fontWeight: 700 }}>{stat.avg}</td>
              <td style={{ color: stat.low > 0 ? '#f44336' : '#888' }}>{stat.low}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>AI 개선 이력</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f7f7fa' }}>
            <th>날짜</th>
            <th>개선 액션</th>
            <th>비고</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td>{h.date}</td>
              <td>{h.action}</td>
              <td>{h.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
