import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workspace — Dalkak AI IDE',
  description:
    'AI 기반 실시간 웹 개발 환경. GPT-4o, Claude, Gemini로 코드를 생성하고 즉시 미리보기하세요.',
  openGraph: {
    title: 'Workspace — Dalkak AI IDE',
    description:
      'AI 기반 실시간 웹 개발 환경. GPT-4o, Claude, Gemini로 코드를 생성하고 즉시 미리보기하세요.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Workspace — Dalkak AI IDE',
    description:
      'AI 기반 실시간 웹 개발 환경. GPT-4o, Claude, Gemini로 코드를 생성하고 즉시 미리보기하세요.',
  },
  robots: { index: true, follow: true },
};

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
