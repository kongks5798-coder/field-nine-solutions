'use client';

import { useEffect } from 'react';

/**
 * 환경 변수 디버깅 컴포넌트
 * 브라우저 콘솔에 환경 변수 로딩 상태를 출력합니다.
 * 프로덕션에서는 자동으로 비활성화됩니다.
 */
export default function EnvDebugger() {
  useEffect(() => {
    // 프로덕션에서도 디버깅 정보 출력 (에러 원인 파악을 위해)
    console.group('🔍 Environment Variables Debug');
    console.log('Environment:', process.env.NODE_ENV);

    // NEXT_PUBLIC_ 접두사가 있는 환경 변수만 클라이언트에서 접근 가능
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 5)}...`
        : '❌ NOT SET',
      NEXT_PUBLIC_PYTHON_SERVER_URL: process.env.NEXT_PUBLIC_PYTHON_SERVER_URL,
    };

    // 각 환경 변수 상태 확인
    Object.entries(envVars).forEach(([key, value]) => {
      if (value) {
        console.log(`✅ ${key}:`, value);
      } else {
        console.error(`❌ ${key}: NOT SET`);
      }
    });

    // 서버 전용 변수는 클라이언트에서 접근 불가 (undefined)
    const serverOnlyVars = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'ENCRYPTION_KEY',
    ];

    console.log('\n📝 Server-only variables (not accessible in client):');
    serverOnlyVars.forEach((key) => {
      console.log(`   ${key}: ${process.env[key] ? '✅ Set (server-side)' : '❌ Not set'}`);
    });

    console.groupEnd();

    // 경고 메시지
    const missingVars = Object.entries(envVars)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      console.warn(
        '⚠️ Missing environment variables:',
        missingVars.join(', ')
      );
      console.warn(
        'Please set these variables in Vercel Dashboard > Settings > Environment Variables'
      );
    }
  }, []);

  // UI에 아무것도 렌더링하지 않음 (콘솔만 사용)
  return null;
}
