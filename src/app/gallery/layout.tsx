import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '갤러리 — Dalkak',
  description: '커뮤니티가 만든 앱을 탐색하고 포크하세요.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
