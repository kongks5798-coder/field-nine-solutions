import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 | Dalkak",
  description: "Dalkak(딸깍) 서비스 이용약관 — FieldNine Inc.",
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
