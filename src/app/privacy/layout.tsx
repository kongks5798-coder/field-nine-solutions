import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 | Dalkak",
  description: "Dalkak의 개인정보 수집·이용·보호에 관한 정책입니다.",
  openGraph: {
    title: "개인정보처리방침 | Dalkak",
    description: "Dalkak의 개인정보 수집·이용·보호에 관한 정책입니다.",
    siteName: "Dalkak",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
