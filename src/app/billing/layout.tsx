import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "결제",
  description: "Dalkak 구독 및 결제 관리",
};

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
