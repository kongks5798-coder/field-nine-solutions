// Supabase Auth 기반 관리자 로그인 샘플
import React, { useState } from 'react';
import { supabase } from '@/utils/supabase/client';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else setSuccess('로그인 성공!');
  };

  return (
    <div style={{ padding: 40, maxWidth: 400, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>관리자 로그인</h1>
      <form onSubmit={handleLogin}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="이메일" required style={{ width: '100%', marginBottom: 16, padding: 12, fontSize: 16 }} />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="비밀번호" required style={{ width: '100%', marginBottom: 16, padding: 12, fontSize: 16 }} />
        <button type="submit" style={{ width: '100%', padding: 12, fontSize: 18, fontWeight: 700, background: '#23243a', color: '#fff', border: 'none', borderRadius: 8 }}>로그인</button>
      </form>
      {error && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginTop: 16 }}>{success}</div>}
    </div>
  );
}
