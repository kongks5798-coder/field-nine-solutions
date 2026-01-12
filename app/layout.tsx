import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import ChatWidget from "@/components/ai/ChatWidget";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import AccessGate from "@/components/auth/AccessGate";

export const metadata: Metadata = {
  title: "Field Nine - 고성능 암호화폐 차익거래 엔진",
  description: "실시간 암호화폐 차익거래 기회 탐지 및 자동 실행 시스템 - Binance & Upbit 김치 프리미엄",
  keywords: "차익거래, 암호화폐, 비트코인, 김치프리미엄, Binance, Upbit, Field Nine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          as="style"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className="font-pretendard antialiased">
        <AccessGate />
        <SessionProvider>
          {children}
          <ChatWidget />
          <ServiceWorkerRegistration />
        </SessionProvider>
      </body>
    </html>
  );
}
