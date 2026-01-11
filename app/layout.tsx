import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import ChatWidget from "@/components/ai/ChatWidget";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "Field Nine - 구독형 마케팅 분석 SaaS",
  description: "모든 광고 플랫폼의 데이터를 통합 분석하는 엔터프라이즈급 SaaS 솔루션",
  keywords: "마케팅 분석, SaaS, 구독, 통합 대시보드, Field Nine",
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
        <SessionProvider>
          {children}
          <ChatWidget />
          <ServiceWorkerRegistration />
        </SessionProvider>
      </body>
    </html>
  );
}
