import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '프로필 | Dalkak',
  description: '내 프로필과 공개 앱을 관리하세요.',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
