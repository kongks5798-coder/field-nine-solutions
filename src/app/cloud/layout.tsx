import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '클라우드 — Dalkak',
  description: '클라우드 파일 매니저',
  openGraph: {
    title: '클라우드 — Dalkak',
    description: '클라우드 파일 매니저',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
