import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ErrorReporter } from "@/components/ErrorReporter";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { Analytics } from "@vercel/analytics/react";
import DdalkkakEffect from "@/components/DdalkkakEffect";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#f97316",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://fieldnine.io"),
  title: {
    default: "FieldNine — AI로 앱을 만들어드립니다",
    template: "%s | FieldNine",
  },
  description: "아이디어를 입력하면 AI가 즉시 완성된 웹 앱을 만들어줍니다. 코딩 없이 30초 안에 결과물 생성.",
  keywords: ["AI 앱 빌더", "노코드", "Next.js", "AI 개발", "웹앱 생성기", "FieldNine"],
  authors: [{ name: "FieldNine Inc.", url: "https://fieldnine.io" }],
  creator: "FieldNine Inc.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FieldNine",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://fieldnine.io",
    siteName: "FieldNine",
    title: "FieldNine — AI로 앱을 만들어드립니다",
    description: "아이디어를 입력하면 AI가 즉시 완성된 웹 앱을 만들어줍니다.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FieldNine — AI 앱 빌더",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FieldNine — AI로 앱을 만들어드립니다",
    description: "아이디어를 입력하면 AI가 즉시 완성된 웹 앱을 만들어줍니다.",
    images: ["/og-image.png"],
    creator: "@fieldnine_io",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "FieldNine",
  "applicationCategory": "DeveloperApplication",
  "description": "AI로 웹 앱을 30초 만에 만드세요. GPT-4o, Claude, Gemini, Grok 4가지 AI 모델을 활용한 코드 생성 플랫폼.",
  "url": "https://fieldnine.io",
  "offers": [
    { "@type": "Offer", "price": "39000", "priceCurrency": "KRW", "name": "프로", "billingDuration": "P1M" },
    { "@type": "Offer", "price": "99000", "priceCurrency": "KRW", "name": "팀", "billingDuration": "P1M" },
  ],
  "operatingSystem": "Web",
  "inLanguage": "ko",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" style={{ background: "#fff" }}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {/* 구버전 Service Worker 강제 제거 후 최신 sw.js 등록 */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(regs) {
              return Promise.all(regs.map(function(r) { return r.unregister(); }));
            }).then(function() {
              navigator.serviceWorker.register('/sw.js');
            });
          }
        `}} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ background: "#fff" }}
        suppressHydrationWarning
      >
        <ErrorReporter />
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
        <DdalkkakEffect />
        <Analytics />
      </body>
    </html>
  );
}
