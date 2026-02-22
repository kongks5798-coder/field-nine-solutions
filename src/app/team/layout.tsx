import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '팀 AI — FieldNine',
  description: 'AI 팀원들과 함께 작업하세요.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
