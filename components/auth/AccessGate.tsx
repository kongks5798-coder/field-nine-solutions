'use client';

import { useState, useEffect } from 'react';

export default function AccessGate() {
  const [code, setCode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(false);

  // 접근 코드 (환경변수 또는 기본값)
  const ACCESS_CODE = process.env.NEXT_PUBLIC_ACCESS_CODE || '042500';

  // 로컬 스토리지에서 인증 상태 확인
  useEffect(() => {
    const authStatus = localStorage.getItem('fieldnine_access');
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  const checkAccess = () => {
    if (code === ACCESS_CODE) {
      localStorage.setItem('fieldnine_access', 'authenticated');
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setTimeout(() => {
        setCode('');
        setError(false);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      checkAccess();
    }
  };

  // 인증된 경우 아무것도 렌더링하지 않음
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-[#F9F9F7] flex flex-col items-center justify-center z-50">
      <h1 className="text-xs tracking-[0.5em] font-light mb-12 opacity-40">
        FIELD NINE ACCESS
      </h1>
      <input
        type="password"
        id="access-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="ENTER CODE"
        className={`bg-transparent border-b text-center text-4xl font-light tracking-widest outline-none pb-4 w-64 transition-all ${
          error
            ? 'border-red-500 text-red-500'
            : 'border-black/10 focus:border-black'
        }`}
        autoFocus
      />
      {error && (
        <p className="mt-4 text-xs text-red-500 tracking-widest">ACCESS DENIED</p>
      )}
      <button
        onClick={checkAccess}
        className="mt-12 text-xs font-bold tracking-widest hover:opacity-50 transition-opacity"
      >
        PROCEED
      </button>
    </div>
  );
}
