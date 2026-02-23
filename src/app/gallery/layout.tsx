import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '갤러리 | Dalkak',
  description: 'Dalkak 사용자들이 만든 웹앱을 구경하세요.',
  openGraph: {
    title: '갤러리 | Dalkak',
    description: 'Dalkak 사용자들이 만든 웹앱을 구경하세요.',
    siteName: 'Dalkak',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
