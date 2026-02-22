
"use client";

import { useMemo, useEffect, useState } from 'react';
import UserFeedbackWidget from '../../components/UserFeedbackWidget';

function AlertBanner({ suggestion }: { suggestion: string }) {
  if (!suggestion) return null;
  return (
    <div style={{ background: '#fff3e0', color: '#e65100', border: '1px solid #ffe0b2', borderRadius: 8, padding: 16, marginBottom: 20, fontWeight: 600 }}>
      <span role="img" aria-label="alert">⚠️</span> {suggestion}
      <div style={{ marginTop: 40 }}>
        <h3>실사용자 피드백</h3>
        <UserFeedbackWidget />
      </div>
    </div>
  );
}

function getScoreColor(score: number) {
  if (score >= 90) return '#4caf50';
  if (score >= 70) return '#2196f3';
  if (score >= 50) return '#ff9800';
  return '#f44336';
}

const FEEDBACK_OPTIONS = [
  '정확한 답변입니다!',
  '부분적으로 일치합니다.',
  '응답이 있으나 기대와 다릅니다.',
  '응답 품질이 낮습니다.',
  '응답이 없습니다.'
];

type EvalLog = { timestamp: string; text: string; user: string; score: number; feedback: string };

export default function ChatQualityReport() {
  const [alert, setAlert] = useState('');
  const [logs, setLogs] = useState<EvalLog[]>([]);
  const [evaluated, setEvaluated] = useState<EvalLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoreFilter, setScoreFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [feedbackFilter, setFeedbackFilter] = useState('all');
  const [sortKey, setSortKey] = useState('timestamp');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');

  useEffect(() => {
    fetch('/api/get-chat-logs')
      .then(res => res.json())
      .then(data => setLogs((data.logs || []) as EvalLog[]));
    fetch('/api/ai-quality-alert')
      .then(res => res.json())
      .then(data => setAlert(data.suggestion || ''));
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
    ).then(r => setEvaluated(r as EvalLog[])).finally(() => setLoading(false));
  }, [logs]);

  const users = useMemo(() => Array.from(new Set(evaluated.map(l => l.user))), [evaluated]);
  const filtered = useMemo(() => {
    return evaluated.filter(l => {
      if (scoreFilter !== 'all') {
        if (scoreFilter === 'high' && l.score < 80) return false;
        if (scoreFilter === 'mid' && (l.score < 50 || l.score >= 80)) return false;
        if (scoreFilter === 'low' && l.score >= 50) return false;
      }
      if (userFilter !== 'all' && l.user !== userFilter) return false;
      if (feedbackFilter !== 'all' && l.feedback !== feedbackFilter) return false;
      return true;
    });
  }, [evaluated, scoreFilter, userFilter, feedbackFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortKey === 'timestamp') {
        const t1 = a.timestamp || '', t2 = b.timestamp || '';
        return sortDir === 'asc' ? t1.localeCompare(t2) : t2.localeCompare(t1);
      }
      if (sortKey === 'score') {
        return sortDir === 'asc' ? a.score - b.score : b.score - a.score;
      }
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const avgScore = useMemo(() => {
    if (!filtered.length) return 0;
    return Math.round(filtered.reduce((sum, l) => sum + (l.score || 0), 0) / filtered.length);
  }, [filtered]);
  const lowQualityCount = useMemo(() => filtered.filter(l => l.score < 50).length, [filtered]);

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <AlertBanner suggestion={alert} />
      <h2>AI 대화 로그 기반 품질 리포트</h2>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span>점수 필터:
          <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value)} style={{ marginLeft: 4 }}>
            <option value="all">전체</option>
            <option value="high">80점 이상</option>
            <option value="mid">50~79점</option>
            <option value="low">50점 미만</option>
          </select>
        </span>
        <span>유저:
          <select value={userFilter} onChange={e => setUserFilter(e.target.value)} style={{ marginLeft: 4 }}>
            <option value="all">전체</option>
            {users.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </span>
        <span>피드백:
          <select value={feedbackFilter} onChange={e => setFeedbackFilter(e.target.value)} style={{ marginLeft: 4 }}>
            <option value="all">전체</option>
            {FEEDBACK_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </span>
        <span>정렬:
          <select value={sortKey} onChange={e => setSortKey(e.target.value)} style={{ marginLeft: 4 }}>
            <option value="timestamp">시간순</option>
            <option value="score">점수순</option>
          </select>
          <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} style={{ marginLeft: 4 }}>
            {sortDir === 'asc' ? '▲' : '▼'}
          </button>
        </span>
        <span style={{ marginLeft: 'auto', fontWeight: 700 }}>
          평균점수: <span style={{ color: getScoreColor(avgScore) }}>{avgScore}</span> /
          저품질(50점 미만): <span style={{ color: '#f44336' }}>{lowQualityCount}</span>건
        </span>
      </div>
      {loading && <div>로딩 중...</div>}
      {!loading && sorted.length === 0 && <div>로그가 없습니다.</div>}
      {!loading && sorted.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
          <thead>
            <tr style={{ background: '#f7f7fa' }}>
              <th>시간</th>
              <th>유저</th>
              <th>메시지</th>
              <th>점수</th>
              <th>피드백</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((log, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td>{(log.timestamp ?? '').slice(0, 19).replace('T', ' ')}</td>
                <td>{log.user}</td>
                <td>{log.text}</td>
                <td style={{ color: getScoreColor(log.score), fontWeight: 700 }}>{log.score}</td>
                <td>{log.feedback}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
