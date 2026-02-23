import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보 처리방침 | Dalkak",
  description: "Dalkak(딸깍) 개인정보 처리방침 — FieldNine Inc.",
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
