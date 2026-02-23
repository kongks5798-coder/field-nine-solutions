import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '가격 안내',
  description: '프로 ₩39,000/월, 팀 ₩99,000/월. GPT-4o·Claude·Gemini·Grok AI 모델 무제한 사용.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
