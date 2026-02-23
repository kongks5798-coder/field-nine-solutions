import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 | Dalkak",
  description: "Dalkak 서비스 이용약관 전문입니다.",
  openGraph: {
    title: "이용약관 | Dalkak",
    description: "Dalkak 서비스 이용약관 전문입니다.",
    siteName: "Dalkak",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
