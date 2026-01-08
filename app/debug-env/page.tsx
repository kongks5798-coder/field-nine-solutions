'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

/**
 * 환경 변수 진단 페이지
 * Vercel 환경 변수 설정이 제대로 되었는지 검증
 * 
 * 접속: /debug-env
 */
export default function DebugEnvPage() {
  const [envVars, setEnvVars] = useState<Record<string, { value: string; status: 'ok' | 'missing' | 'partial' }>>({});

  useEffect(() => {
    // NEXT_PUBLIC_ 접두사가 있는 환경 변수만 클라이언트에서 접근 가능
    const vars: Record<string, { value: string; status: 'ok' | 'missing' | 'partial' }> = {};

    // 필수 환경 변수 확인
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_PYTHON_SERVER_URL',
    ];

    requiredVars.forEach((key) => {
      const value = process.env[key];
      if (!value) {
        vars[key] = { value: 'NOT SET', status: 'missing' };
      } else if (value.length < 5) {
        vars[key] = { value: value, status: 'partial' };
      } else {
        // 보안: 앞 5자리만 표시, 나머지는 마스킹
        const maskedValue = key.includes('KEY') || key.includes('SECRET')
          ? `${value.substring(0, 5)}${'*'.repeat(Math.min(value.length - 5, 20))}`
          : value;
        vars[key] = { value: maskedValue, status: 'ok' };
      }
    });

    // 서버 전용 변수는 클라이언트에서 접근 불가 (undefined)
    const serverOnlyVars = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'ENCRYPTION_KEY',
    ];

    serverOnlyVars.forEach((key) => {
      const value = process.env[key];
      vars[key] = {
        value: value ? '✅ Set (server-side only)' : '❌ Not set (server-side only)',
        status: value ? 'ok' : 'missing',
      };
    });

    setEnvVars(vars);
  }, []);

  const getStatusIcon = (status: 'ok' | 'missing' | 'partial') => {
    switch (status) {
      case 'ok':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'missing':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'partial':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusText = (status: 'ok' | 'missing' | 'partial') => {
    switch (status) {
      case 'ok':
        return '정상';
      case 'missing':
        return '누락됨';
      case 'partial':
        return '부분 설정';
    }
  };

  const missingCount = Object.values(envVars).filter(v => v.status === 'missing').length;
  const allOk = missingCount === 0;

  return (
    <div className="min-h-screen bg-[#F9F9F7] p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-[#171717] mb-2">
            🔍 환경 변수 진단
          </h1>
          <p className="text-gray-600">
            Vercel 환경 변수 설정 상태를 확인합니다.
          </p>
        </div>

        {/* 전체 상태 */}
        <div className={`bg-white rounded-lg border-2 shadow-sm p-6 mb-6 ${
          allOk ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
        }`}>
          <div className="flex items-center gap-3">
            {allOk ? (
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
            <div>
              <h2 className="text-xl font-bold text-[#171717]">
                {allOk ? '✅ 모든 환경 변수가 정상입니다' : `❌ ${missingCount}개 환경 변수가 누락되었습니다`}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {allOk 
                  ? 'Vercel 환경 변수 설정이 완료되었습니다.'
                  : 'Vercel 대시보드에서 누락된 환경 변수를 추가해주세요.'}
              </p>
            </div>
          </div>
        </div>

        {/* 환경 변수 목록 */}
        <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#171717] mb-4">
            환경 변수 목록
          </h2>
          <div className="space-y-4">
            {Object.entries(envVars).map(([key, { value, status }]) => (
              <div
                key={key}
                className={`p-4 rounded-lg border ${
                  status === 'ok'
                    ? 'bg-green-50 border-green-200'
                    : status === 'missing'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(status)}
                      <code className="font-mono text-sm font-semibold text-[#171717]">
                        {key}
                      </code>
                      <span className={`text-xs px-2 py-1 rounded ${
                        status === 'ok'
                          ? 'bg-green-100 text-green-700'
                          : status === 'missing'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {getStatusText(status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 font-mono break-all">
                      {value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📝 안내</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>클라이언트에서 접근 가능한 환경 변수는 <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_</code> 접두사가 있는 것만입니다.</li>
            <li>서버 전용 변수(<code className="bg-blue-100 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code>, <code className="bg-blue-100 px-1 rounded">ENCRYPTION_KEY</code>)는 클라이언트에서 확인할 수 없습니다.</li>
            <li>누락된 환경 변수는 Vercel 대시보드 &gt; Settings &gt; Environment Variables에서 추가하세요.</li>
            <li>보안을 위해 Key 값은 앞 5자리만 표시됩니다.</li>
          </ul>
        </div>

        {/* 링크 */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-[#1A5D3F] hover:underline font-medium"
          >
            ← 홈으로 가기
          </a>
        </div>
      </div>
    </div>
  );
}
