"use client";
import { useEffect, useState } from 'react';

export default function QualitySettingsHistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/quality-settings-history')
      .then(res => res.json())
      .then(data => setLogs(data.logs || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
      <h2>품질/알림 설정 변경 이력</h2>
      {loading && <div>로딩 중...</div>}
      {!loading && logs.length === 0 && <div>변경 이력이 없습니다.</div>}
      {!loading && logs.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
          <thead>
            <tr style={{ background: '#f7f7fa' }}>
              <th>시간</th>
              <th>유저</th>
              <th>이전값</th>
              <th>변경값</th>
            </tr>
          </thead>
          <tbody>
            {logs.slice().reverse().map((log, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td>{log.timestamp?.slice(0, 19).replace('T', ' ')}</td>
                <td>{log.user}</td>
                <td style={{ whiteSpace: 'pre-line' }}>{JSON.stringify(log.prev, null, 1)}</td>
                <td style={{ whiteSpace: 'pre-line' }}>{JSON.stringify(log.next, null, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
