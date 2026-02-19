import { useState } from 'react';

export default function UserFeedbackWidget({ onSubmit }: { onSubmit?: (data: any) => void }) {
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(5);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await fetch('/api/user-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback, score, timestamp: new Date().toISOString() })
    });
    setSent(true);
    setFeedback('');
    setScore(5);
    if (onSubmit) onSubmit({ feedback, score });
  };

  if (sent) return <div style={{ color: '#4caf50', margin: 12 }}>피드백이 제출되었습니다. 감사합니다!</div>;

  return (
    <form onSubmit={handleSubmit} style={{ margin: '24px 0', padding: 16, background: '#f7f7fa', borderRadius: 8 }}>
      <div style={{ marginBottom: 8 }}>
        <label>서비스 만족도(1~5):
          <select value={score} onChange={e => setScore(Number(e.target.value))} style={{ marginLeft: 8 }}>
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>의견/피드백:<br />
          <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={2} style={{ width: '100%' }} />
        </label>
      </div>
      <button type="submit" style={{ padding: '6px 18px', fontWeight: 700 }}>피드백 제출</button>
    </form>
  );
}
