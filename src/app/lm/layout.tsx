import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LM Hub | Dalkak',
  description: 'GPT-4o, Claude, Gemini, Grok — 다양한 AI 모델을 비교하고 테스트하세요.',
  openGraph: {
    title: 'LM Hub | Dalkak',
    description: 'GPT-4o, Claude, Gemini, Grok — 다양한 AI 모델을 비교하고 테스트하세요.',
    siteName: 'Dalkak',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
