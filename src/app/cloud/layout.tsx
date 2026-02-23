import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '클라우드 — Dalkak',
  description: '파일을 안전하게 저장하고 관리하세요.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
