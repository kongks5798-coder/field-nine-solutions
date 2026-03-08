import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "청구 & 사용량 | Dalkak",
  description: "플랜 관리, AI 사용량, 결제 내역을 한 곳에서 확인하세요.",
};

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
