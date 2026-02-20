"use client";
import { useEffect, useState } from 'react';

export default function AdminAlertLogDashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin-alert-log')
      .then(res => res.json())
      .then(data => setLogs(data.logs || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
      <h2>관리자 알림 이력/로그 대시보드</h2>
      {loading && <div>로딩 중...</div>}
      {!loading && logs.length === 0 && <div>알림 이력이 없습니다.</div>}
      {!loading && logs.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
          <thead>
            <tr style={{ background: '#f7f7fa' }}>
              <th>시간</th>
              <th>유형</th>
              <th>메시지</th>
            </tr>
          </thead>
          <tbody>
            {logs.slice().reverse().map((log, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td>{log.timestamp?.slice(0, 19).replace('T', ' ')}</td>
                <td>{log.type}</td>
                <td style={{ whiteSpace: 'pre-line' }}>{log.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
