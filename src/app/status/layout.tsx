import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '서비스 상태 | Dalkak',
  description: 'Dalkak 서비스의 실시간 운영 상태를 확인하세요.',
  openGraph: {
    title: '서비스 상태 | Dalkak',
    description: 'Dalkak 서비스의 실시간 운영 상태를 확인하세요.',
    siteName: 'Dalkak',
  },
};

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
