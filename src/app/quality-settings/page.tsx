"use client";
import { useEffect, useState, useRef } from 'react';

const DEFAULTS = {
  notifyThreshold: 50,
  alertInterval: 10, // minutes
};

export default function QualitySettingsPage() {
  const [notifyThreshold, setNotifyThreshold] = useState(DEFAULTS.notifyThreshold);
  const [alertInterval, setAlertInterval] = useState(DEFAULTS.alertInterval);
  const [saved, setSaved] = useState(false);

  const prevSettings = useRef({ notifyThreshold: DEFAULTS.notifyThreshold, alertInterval: DEFAULTS.alertInterval });
  useEffect(() => {
    fetch('/api/quality-settings')
      .then(res => res.json())
      .then(data => {
        if (data.notifyThreshold) setNotifyThreshold(data.notifyThreshold);
        if (data.alertInterval) setAlertInterval(data.alertInterval);
        prevSettings.current = { notifyThreshold: data.notifyThreshold || DEFAULTS.notifyThreshold, alertInterval: data.alertInterval || DEFAULTS.alertInterval };
      });
  }, []);

  const handleSave = async () => {
    const prev = { ...prevSettings.current };
    const next = { notifyThreshold, alertInterval };
    await fetch('/api/quality-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
    await fetch('/api/quality-settings-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prev, next, user: 'admin', timestamp: new Date().toISOString() }),
    });
    prevSettings.current = { ...next };
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 24 }}>
      <h2>AI 품질/알림 기준 실시간 설정</h2>
      <div style={{ marginBottom: 20 }}>
        <label>저품질 알림 기준 점수(미만):<br />
          <input type="number" min={0} max={100} value={notifyThreshold} onChange={e => setNotifyThreshold(Number(e.target.value))} style={{ width: 80, marginRight: 8 }} />점
        </label>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label>알림 중복 방지(분):<br />
          <input type="number" min={1} max={120} value={alertInterval} onChange={e => setAlertInterval(Number(e.target.value))} style={{ width: 80, marginRight: 8 }} />분
        </label>
      </div>
      <button onClick={handleSave} style={{ padding: '8px 24px', fontWeight: 700 }}>설정 저장</button>
      {saved && <span style={{ color: '#4caf50', marginLeft: 16 }}>저장됨!</span>}
    </div>
  );
}
