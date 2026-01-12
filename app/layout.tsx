import type { Metadata } from "next";
import "./globals.css";
import PerformanceMonitor from "@/components/monitoring/PerformanceMonitor";
import { ErrorBoundary } from "@/components/monitoring/ErrorBoundary";

/**
 * Root Layout - TrendStream 전역 설정
 * 
 * 비즈니스 목적: 모든 페이지에 일관된 디자인 시스템 적용
 * - Tesla Style 디자인 시스템 엄격 준수 (#F9F9F7 배경, #171717 텍스트)
 * - Inter/Pretendard 폰트로 브랜드 정체성 확립
 * - SEO 최적화 메타데이터로 검색 노출 극대화
 * - 성능 메트릭 수집 초기화
 */
export const metadata: Metadata = {
  title: "TrendStream - Next Week's Bestsellers, Today",
  description: "AI가 인스타그램과 틱톡을 실시간 분석하여, 당장 다음 주에 팔릴 옷을 예측해 드립니다.",
  keywords: "패션 트렌드, AI 분석, 인스타그램 분석, 틱톡 트렌드, 패션 예측, 동대문, 1인 셀러",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Inter 폰트 (영문) - 명세서 요구사항 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Pretendard 폰트 (한글) - 명세서 요구사항 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          as="style"
        />
      </head>
      <body className="antialiased">
        <ErrorBoundary>
          <PerformanceMonitor />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
