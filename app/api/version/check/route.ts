import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Tesla-style OTA Version Check API
 * 클라이언트가 새 버전을 확인할 수 있도록 버전 정보 제공
 */
export async function GET() {
  try {
    // package.json에서 버전 가져오기
    const packageJson = require('@/package.json');
    const currentVersion = packageJson.version || '0.1.0';

    // 빌드 타임스탬프 (환경 변수 또는 빌드 시 생성)
    const buildTimestamp = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || Date.now().toString();

    // 실제 프로덕션에서는 데이터베이스나 외부 API에서 최신 버전 확인
    // 여기서는 간단하게 현재 버전 반환
    const latestVersion = currentVersion;
    const isUpdateAvailable = false; // 실제로는 버전 비교 로직 필요

    return NextResponse.json({
      current: currentVersion,
      latest: latestVersion,
      available: isUpdateAvailable,
      buildTimestamp,
      changelog: isUpdateAvailable
        ? '성능 개선 및 버그 수정이 포함된 새 버전입니다.'
        : undefined,
      forceUpdate: false, // 필수 업데이트 여부
    });
  } catch (error: any) {
    console.error('[Version Check] 에러:', error);
    return NextResponse.json(
      {
        current: '0.1.0',
        latest: '0.1.0',
        available: false,
        error: 'Version check failed',
      },
      { status: 500 }
    );
  }
}
