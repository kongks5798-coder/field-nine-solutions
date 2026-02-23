import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 캔버스 — Dalkak',
  description: 'AI로 이미지를 생성하세요.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
