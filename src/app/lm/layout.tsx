import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LM 허브 — FieldNine',
  description: '다양한 AI 모델을 비교하고 테스트하세요.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
