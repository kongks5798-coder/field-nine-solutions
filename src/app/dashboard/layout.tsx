import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '대시보드 | Dalkak',
  description: '프로젝트 현황, AI 사용량, 팀 활동을 한눈에 확인하세요.',
  openGraph: {
    title: '대시보드 | Dalkak',
    description: '프로젝트 현황, AI 사용량, 팀 활동을 한눈에 확인하세요.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '대시보드 | Dalkak',
    description: '프로젝트 현황, AI 사용량, 팀 활동을 한눈에 확인하세요.',
  },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
