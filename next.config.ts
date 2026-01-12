import type { NextConfig } from "next";

/**
 * Next.js Configuration - 프로덕션 최적화 설정
 * 
 * 비즈니스 목적:
 * - 성능 최적화 (번들 크기, 로딩 속도)
 * - 보안 강화
 * - 배포 최적화
 */
const nextConfig: NextConfig = {
  // 프로덕션 빌드 최적화
  output: 'standalone', // Docker 배포 최적화
  
  // 이미지 최적화
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  // 실험적 기능
  experimental: {
    // 서버 컴포넌트 최적화
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // 보안 헤더
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ];
  },

  // 환경 변수 검증
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    PYTHON_BACKEND_URL: process.env.PYTHON_BACKEND_URL || 'http://localhost:8000',
  },
};

export default nextConfig;
