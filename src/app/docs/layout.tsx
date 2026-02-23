import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API 문서 — Dalkak",
  description: "Dalkak REST API 엔드포인트 문서",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
