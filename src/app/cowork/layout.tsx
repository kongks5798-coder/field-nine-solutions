import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CoWork — Dalkak",
  description: "팀 문서 협업 에디터",
  openGraph: {
    title: "CoWork — Dalkak",
    description: "팀 문서 협업 에디터",
    type: "website",
  },
};

export default function CoWorkLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
