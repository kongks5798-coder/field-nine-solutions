import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lab | Dalkak',
  description: 'Dalkak의 실험적 기능과 혁신 기술을 만나보세요.',
  openGraph: {
    title: 'Lab | Dalkak',
    description: 'Dalkak의 실험적 기능과 혁신 기술을 만나보세요.',
    siteName: 'Dalkak',
  },
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
