import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "회원가입 | Dalkak",
  description: "무료로 Dalkak에 가입하고 AI 웹앱을 만들어보세요.",
  openGraph: {
    title: "회원가입 | Dalkak",
    description: "무료로 Dalkak에 가입하고 AI 웹앱을 만들어보세요.",
    siteName: "Dalkak",
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
