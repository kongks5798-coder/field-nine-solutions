'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/panopticon/auth');
        const data = await res.json();
        if (data.authenticated) router.replace('/panopticon');
      } catch (e) {
        console.error('Session check error:', e);
      } finally {
        setIsCheckingSession(false);
      }
    };
    checkSession();
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

  if (isCheckingSession) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: '40px', height: '40px', color: '#3B82F6', animation: 'spin 1s linear infinite' }} />
        <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', background: 'radial-gradient(ellipse at top, #0A0A0A 0%, #000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: '420px', background: 'linear-gradient(135deg, rgba(20,20,20,0.9) 0%, rgba(10,10,10,0.95) 100%)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '48px 40px', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '80px', height: '80px', margin: '0 auto 24px', borderRadius: '20px', background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 60px rgba(59,130,246,0.4)' }}>
            <Eye style={{ width: '40px', height: '40px', color: '#FFF' }} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#FAFAFA', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>PANOPTICON</h1>
          <p style={{ fontSize: '14px', color: '#525252', margin: 0 }}>Field Nine CEO Dashboard</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#737373', marginBottom: '10px' }}>비밀번호</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock style={{ position: 'absolute', left: '16px', width: '18px', height: '18px', color: '#525252' }} />
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 입력" autoFocus style={{ width: '100%', padding: '16px 48px', backgroundColor: 'rgba(255,255,255,0.03)', border: error ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#FAFAFA', fontSize: '15px', outline: 'none' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '16px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                {showPassword ? <EyeOff style={{ width: '18px', height: '18px', color: '#525252' }} /> : <Eye style={{ width: '18px', height: '18px', color: '#525252' }} />}
              </button>
            </div>
          </div>
          {error && <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', marginBottom: '24px' }}><p style={{ fontSize: '13px', color: '#EF4444', margin: 0 }}>{error}</p></div>}
          <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '16px', borderRadius: '12px', background: isLoading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', border: 'none', color: '#FFF', fontSize: '15px', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {isLoading ? (<><Loader2 style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />인증 중...</>) : '로그인'}
          </button>
        </form>
        <p style={{ fontSize: '12px', color: '#404040', textAlign: 'center', marginTop: '32px' }}>이 페이지는 권한이 있는 사용자만 접근할 수 있습니다</p>
      </div>
      <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
