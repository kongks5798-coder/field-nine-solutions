import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Collab — Dalkak",
  description: "실시간 협업 편집기",
  openGraph: {
    title: "Collab — Dalkak",
    description: "실시간 협업 편집기",
    type: "website",
  },
};

export default function CollabLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
