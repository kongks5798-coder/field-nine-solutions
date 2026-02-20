"use client";
import { useState } from 'react';

const FILES = [
  { key: 'chat-log', label: '대화 로그(chat-log.jsonl)' },
  { key: 'admin-alert-log', label: '관리자 알림 로그(admin-alert-log.jsonl)' },
  { key: 'quality-settings-history', label: '설정 변경 이력(quality-settings-history.jsonl)' },
  { key: 'quality-settings', label: '설정값(quality-settings.json)' },
];

export default function QualityBackupPage() {
  const [downloading, setDownloading] = useState('');

  const handleDownload = async (key: string) => {
    setDownloading(key);
    const res = await fetch(`/api/quality-backup?file=${key}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = key + (key === 'quality-settings' ? '.json' : '.jsonl');
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }
    setDownloading('');
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24 }}>
      <h2>품질/알림 데이터 백업·다운로드</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {FILES.map(f => (
          <li key={f.key} style={{ margin: '18px 0' }}>
            <button onClick={() => handleDownload(f.key)} disabled={!!downloading} style={{ padding: '8px 20px', fontWeight: 700 }}>
              {downloading === f.key ? '다운로드 중...' : f.label + ' 다운로드'}
            </button>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 32, color: '#888', fontSize: 14 }}>
        모든 품질/알림 데이터는 json/jsonl 파일로 백업·외부 분석이 가능합니다.
      </div>
    </div>
  );
}
