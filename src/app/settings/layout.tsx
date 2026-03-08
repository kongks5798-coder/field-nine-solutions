import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '설정 | Dalkak',
  description: 'API 키, 알림, 개인정보 설정을 관리하세요.',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
