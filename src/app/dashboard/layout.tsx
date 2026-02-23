import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '대시보드',
  description: '내 프로젝트와 AI 앱을 관리하세요.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
