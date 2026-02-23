import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flow — Dalkak",
  description: "워크플로우 자동화 엔진",
  openGraph: {
    title: "Flow — Dalkak",
    description: "워크플로우 자동화 엔진",
    type: "website",
  },
};

export default function FlowLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
