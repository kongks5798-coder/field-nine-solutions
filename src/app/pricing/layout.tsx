import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '요금제 | Dalkak',
  description: '무료로 시작하고 Pro 플랜으로 업그레이드하세요. 14일 무료 체험, 언제든 취소 가능. AI 웹앱 빌더 Dalkak 요금 안내.',
  keywords: ['Dalkak 요금제', 'AI 웹앱 빌더 가격', '노코드 무료', 'AI 개발 플랜'],
  openGraph: {
    title: '요금제 | Dalkak',
    description: '무료로 시작하고 Pro 플랜으로 업그레이드하세요. 14일 무료 체험.',
    siteName: 'Dalkak',
    type: 'website',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: '요금제 | Dalkak',
    description: '무료로 시작하고 Pro 플랜으로 업그레이드하세요.',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Dalkak AI IDE",
  "description": "AI 기반 웹 앱 생성 플랫폼",
  "offers": [
    { "@type": "Offer", "name": "Starter", "price": "0", "priceCurrency": "KRW" },
    { "@type": "Offer", "name": "Pro", "price": "39000", "priceCurrency": "KRW" },
    { "@type": "Offer", "name": "Team", "price": "89000", "priceCurrency": "KRW" }
  ]
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
