import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '대시보드 — FieldNine',
  description: '내 프로젝트와 AI 사용량을 한눈에 확인하세요.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
