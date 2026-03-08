import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '템플릿 마켓플레이스 | Dalkak',
  description: '수백 가지 AI 앱 템플릿을 즉시 사용하세요. 게임, 쇼핑몰, 대시보드, 포트폴리오 등 다양한 템플릿으로 빠르게 시작.',
  keywords: ['Dalkak 템플릿', 'AI 앱 템플릿', '마켓플레이스', '노코드 템플릿', '웹앱 템플릿'],
  openGraph: {
    title: '템플릿 마켓플레이스 | Dalkak',
    description: '수백 가지 AI 앱 템플릿을 즉시 사용하세요.',
    siteName: 'Dalkak',
    type: 'website',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: '템플릿 마켓플레이스 | Dalkak',
    description: '수백 가지 AI 앱 템플릿을 즉시 사용하세요.',
  },
  robots: { index: true, follow: true },
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
