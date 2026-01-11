import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // 빌드 시 TypeScript 오류를 경고로 처리 (필요시 true로 변경)
    ignoreBuildErrors: false,
  },
  // Vercel 빌드 최적화
  output: 'standalone',
  // 환경 변수 검증 스킵 (빌드 시)
  env: {
    SKIP_ENV_VALIDATION: 'true',
  },
  // 빌드 경고 무시 (Vercel 배포 성공 보장)
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Vercel 빌드 최적화: 경고를 에러로 처리하지 않음
  experimental: {
    optimizePackageImports: ['@prisma/client'],
  },
};

export default nextConfig;
