import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '팀 — Dalkak',
  description: 'AI 팀 커뮤니케이션',
  openGraph: {
    title: '팀 — Dalkak',
    description: 'AI 팀 커뮤니케이션',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
