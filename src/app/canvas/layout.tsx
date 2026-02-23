import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Canvas — Dalkak',
  description: 'AI 기반 시각적 앱 디자인 도구',
  openGraph: {
    title: 'Canvas — Dalkak',
    description: 'AI 기반 시각적 앱 디자인 도구',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
