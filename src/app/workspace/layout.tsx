import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '워크스페이스',
  description: 'AI와 함께 코딩하세요. 실시간 미리보기와 자동 테스트.',
};

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
