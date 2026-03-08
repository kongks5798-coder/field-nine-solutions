import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 팀 채팅 | Dalkak',
  description: '다양한 AI 어시스턴트와 팀을 구성하고 협업하세요. GPT-4o, Claude, Gemini 등 멀티 AI 팀 커뮤니케이션.',
  keywords: ['AI 팀', 'AI 채팅', '팀 협업', 'Claude', 'GPT-4o', 'Dalkak'],
  openGraph: {
    title: 'AI 팀 채팅 | Dalkak',
    description: '다양한 AI 어시스턴트와 팀을 구성하고 협업하세요.',
    type: 'website',
    locale: 'ko_KR',
    siteName: 'Dalkak',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI 팀 채팅 | Dalkak',
    description: '다양한 AI 어시스턴트와 팀을 구성하고 협업하세요.',
  },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
