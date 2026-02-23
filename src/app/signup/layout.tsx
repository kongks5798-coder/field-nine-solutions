import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "회원가입",
  description:
    "Dalkak에 가입하고 AI로 웹 앱을 만들어보세요. 무료로 시작할 수 있습니다.",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
