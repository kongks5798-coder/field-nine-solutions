'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/panopticon/auth').then(r => r.json()).then(d => {
      if (d.authenticated) router.replace('/panopticon');
    }).catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) { setError('비밀번호를 입력해주세요'); return; }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/panopticon/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await res.json();
      if (data.success) router.replace('/panopticon');
      else { setError(data.error || '로그인에 실패했습니다'); setPassword(''); }
    } catch { setError('서버 연결에 실패했습니다'); }
    finally { setIsLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#141414', borderRadius: '16px', padding: '40px', border: '1px solid #262626' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#FFF', margin: '0 0 8px 0', textAlign: 'center' }}>PANOPTICON</h1>
        <p style={{ fontSize: '14px', color: '#666', margin: '0 0 32px 0', textAlign: 'center' }}>Field Nine CEO Dashboard</p>
        <form onSubmit={handleSubmit}>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 입력" autoFocus style={{ width: '100%', padding: '14px', backgroundColor: '#1F1F1F', border: error ? '1px solid #EF4444' : '1px solid #333', borderRadius: '8px', color: '#FFF', fontSize: '15px', marginBottom: '16px', boxSizing: 'border-box' }} />
          {error && <p style={{ fontSize: '13px', color: '#EF4444', margin: '0 0 16px 0' }}>{error}</p>}
          <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '14px', borderRadius: '8px', background: '#3B82F6', border: 'none', color: '#FFF', fontSize: '15px', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
            {isLoading ? '인증 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
