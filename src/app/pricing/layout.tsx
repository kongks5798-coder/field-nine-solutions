import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '요금제 | Dalkak',
  description: '무료로 시작하고, Pro 플랜으로 업그레이드하세요. AI 웹앱 빌더 Dalkak 요금 안내.',
  openGraph: {
    title: '요금제 | Dalkak',
    description: '무료로 시작하고, Pro 플랜으로 업그레이드하세요. AI 웹앱 빌더 Dalkak 요금 안내.',
    siteName: 'Dalkak',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
