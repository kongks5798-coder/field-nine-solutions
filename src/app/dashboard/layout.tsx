import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — Dalkak',
  description:
    '내 프로젝트와 AI 앱을 관리하세요. 생성된 앱의 배포, 분석, 협업 기능을 한 곳에서 확인합니다.',
  openGraph: {
    title: 'Dashboard — Dalkak',
    description:
      '내 프로젝트와 AI 앱을 관리하세요. 생성된 앱의 배포, 분석, 협업 기능을 한 곳에서 확인합니다.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dashboard — Dalkak',
    description:
      '내 프로젝트와 AI 앱을 관리하세요. 생성된 앱의 배포, 분석, 협업 기능을 한 곳에서 확인합니다.',
  },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
