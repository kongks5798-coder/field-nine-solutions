import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '갤러리',
  description: 'Dalkak으로 만든 AI 앱 쇼케이스. 아이디어를 직접 체험해보세요.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
