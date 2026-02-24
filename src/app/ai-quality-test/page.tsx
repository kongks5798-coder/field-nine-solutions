"use client";
import { useState } from 'react';

interface QualityEvalResult {
  score: number;
  feedback: string;
  prompt: string;
  response: string;
  expected: string;
  metrics: Record<string, number>;
}

export default function AIQualityTest() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [expected, setExpected] = useState('');
  const [result, setResult] = useState<QualityEvalResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    const res = await fetch('/api/ai-quality-eval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, response, expected })
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 12 }}>
      <h2>AI 품질 테스트 / Quality Test</h2>
      <div style={{ marginBottom: 12 }}>
        <label>프롬프트 / Prompt<br />
          <input value={prompt} onChange={e => setPrompt(e.target.value)} style={{ width: '100%' }} />
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>AI 응답 / AI Response<br />
          <input value={response} onChange={e => setResponse(e.target.value)} style={{ width: '100%' }} />
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>기대값(선택) / Expected (optional)<br />
          <input value={expected} onChange={e => setExpected(e.target.value)} style={{ width: '100%' }} />
        </label>
      </div>
      <button onClick={handleTest} disabled={loading} style={{ width: '100%', padding: 8, fontWeight: 700 }}>
        {loading ? '평가 중...' : 'AI 품질 평가하기'}
      </button>
      {result && (
        <div style={{ marginTop: 24, background: '#f7f7fa', padding: 16, borderRadius: 8 }}>
          <b>점수 / Score:</b> {result.score}<br />
          <b>피드백 / Feedback:</b> {result.feedback}<br />
          <b>프롬프트:</b> {result.prompt}<br />
          <b>응답:</b> {result.response}<br />
          {result.expected && <><b>기대값:</b> {result.expected}<br /></>}
        </div>
      )}
    </div>
  );
}
