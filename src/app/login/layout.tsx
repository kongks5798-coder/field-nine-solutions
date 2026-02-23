import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인 | Dalkak',
  description: 'Dalkak 계정에 로그인하세요.',
  openGraph: {
    title: '로그인 | Dalkak',
    description: 'Dalkak 계정에 로그인하세요.',
    siteName: 'Dalkak',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
