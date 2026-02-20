"use client";
import { useEffect, useState, useMemo } from 'react';

export default function UserFeedbackReport() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user-feedback')
      .then(res => res.json())
      .then(data => setLogs(data.logs || []))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    if (!logs.length) return { avg: 0, count: 0, low: 0, high: 0 };
    const count = logs.length;
    const avg = Math.round(logs.reduce((sum, l) => sum + (l.score || 0), 0) / count * 10) / 10;
    const low = logs.filter(l => l.score <= 2).length;
    const high = logs.filter(l => l.score >= 4).length;
    return { avg, count, low, high };
  }, [logs]);

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24 }}>
      <h2>실사용자 피드백 통계/리포트</h2>
      {loading && <div>로딩 중...</div>}
      {!loading && (
        <>
          <div style={{ marginBottom: 24, fontWeight: 700 }}>
            전체 피드백: {stats.count}건 / 평균 만족도: <span style={{ color: stats.avg >= 4 ? '#4caf50' : stats.avg >= 3 ? '#ff9800' : '#f44336' }}>{stats.avg}</span>점
            <br />높은 만족(4~5점): <span style={{ color: '#4caf50' }}>{stats.high}</span>건 / 낮은 만족(1~2점): <span style={{ color: '#f44336' }}>{stats.low}</span>건
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <thead>
              <tr style={{ background: '#f7f7fa' }}>
                <th>시간</th>
                <th>만족도</th>
                <th>피드백</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice().reverse().map((log, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td>{log.timestamp?.slice(0, 19).replace('T', ' ')}</td>
                  <td style={{ color: log.score >= 4 ? '#4caf50' : log.score >= 3 ? '#ff9800' : '#f44336', fontWeight: 700 }}>{log.score}</td>
                  <td style={{ whiteSpace: 'pre-line' }}>{log.feedback}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 32, background: '#fffde7', color: '#e65100', border: '1px solid #ffe0b2', borderRadius: 8, padding: 16, fontWeight: 600 }}>
            {stats.low > 0
              ? `최근 ${stats.low}건의 낮은 만족(1~2점) 피드백이 감지되었습니다. 주요 불만/개선 의견을 확인하고 AI 품질/UX 개선을 권장합니다.`
              : '전체적으로 높은 만족도가 유지되고 있습니다.'}
          </div>
        </>
      )}
    </div>
  );
}
