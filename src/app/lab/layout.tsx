import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개발실 — Dalkak',
  description: 'AI 모델 실험실',
  openGraph: {
    title: '개발실 — Dalkak',
    description: 'AI 모델 실험실',
    type: 'website',
  },
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
