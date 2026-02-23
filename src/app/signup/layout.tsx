import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '회원가입',
  description: '무료로 시작하세요. AI가 즉시 웹 앱을 만들어줍니다.',
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
