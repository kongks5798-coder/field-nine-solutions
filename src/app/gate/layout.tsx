import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "게이트 — Dalkak",
  description: "보안 접근 관리",
  openGraph: {
    title: "게이트 — Dalkak",
    description: "보안 접근 관리",
    type: "website",
  },
};

export default function GateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
