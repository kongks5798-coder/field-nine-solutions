// Next.js 16에서 Link+style 정적 프리렌더링 RSC 직렬화 버그 우회
export const dynamic = "force-dynamic";

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { ErrorReporter } from "@/components/ErrorReporter";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PostHogProvider } from "@/components/PostHogProvider";
import DdalkkakEffect from "@/components/DdalkkakEffect";
import CookieConsent from "@/components/CookieConsent";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";

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
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://fieldnine.io"),
  title: {
    default: "Dalkak — AI로 웹앱을 딸깍 만드세요",
    template: "%s",
  },
  description: "코딩 없이 AI가 웹앱을 만들어드립니다. GPT-4o, Claude, Gemini 지원.",
  keywords: ["AI 앱 빌더", "노코드", "Next.js", "AI 개발", "웹앱 생성기", "Dalkak", "딸깍"],
  authors: [{ name: "Dalkak Inc.", url: "https://fieldnine.io" }],
  creator: "Dalkak Inc.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dalkak",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://fieldnine.io",
    siteName: "Dalkak",
    title: "Dalkak — AI로 웹앱을 딸깍 만드세요",
    description: "코딩 없이 AI가 웹앱을 만들어드립니다. GPT-4o, Claude, Gemini 지원.",
    images: [
      {
        url: "https://fieldnine.io/api/og",
        width: 1200,
        height: 630,
        alt: "Dalkak — AI 앱 빌더",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dalkak — AI로 웹앱을 딸깍 만드세요",
    description: "코딩 없이 AI가 웹앱을 만들어드립니다. GPT-4o, Claude, Gemini 지원.",
    images: ["https://fieldnine.io/api/og"],
    creator: "@dalkak_io",
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
  "name": "Dalkak",
  "applicationCategory": "DeveloperApplication",
  "description": "AI로 웹 앱을 30초 만에 만드세요. GPT-4o, Claude, Gemini, Grok 4가지 AI 모델을 활용한 코드 생성 플랫폼.",
  "url": "https://fieldnine.io",
  "offers": [
    // NOTE: 가격 변경 시 src/lib/plans.ts의 PLAN_PRICES와 동기화 필요
    { "@type": "Offer", "price": "39000", "priceCurrency": "KRW", "name": "프로", "billingDuration": "P1M" },
    { "@type": "Offer", "price": "99000", "priceCurrency": "KRW", "name": "팀", "billingDuration": "P1M" },
  ],
  "operatingSystem": "Web",
  "inLanguage": "ko",
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://fieldnine.io" },
    { "@type": "ListItem", "position": 2, "name": "요금제", "item": "https://fieldnine.io/pricing" },
    { "@type": "ListItem", "position": 3, "name": "갤러리", "item": "https://fieldnine.io/gallery" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" style={{ background: "#fff" }}>
      <head>
        {/* SAFE: trusted static JSON-LD from hardcoded jsonLd constant — no user input */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
        {/* DNS prefetch for external services */}
        <link rel="dns-prefetch" href="https://api.openai.com" />
        <link rel="dns-prefetch" href="https://api.anthropic.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ background: "#fff" }}
        suppressHydrationWarning
      >
        {/* 스킵 네비게이션 — CSS :focus 방식으로 이벤트 핸들러 불필요 */}
        <a href="#main-content" className="skip-nav">
          본문 바로가기
        </a>
        <ErrorReporter />
        <PostHogProvider>
          <AuthSessionProvider>
            <div id="main-content" role="main" tabIndex={-1} style={{ outline: 'none' }}>
              {children}
            </div>
          </AuthSessionProvider>
        </PostHogProvider>
        <DdalkkakEffect />
        <CookieConsent />
        <Analytics />
        <SpeedInsights />
        <WebVitalsReporter />
        {/* 구버전 Service Worker 강제 제거 후 최신 sw.js 등록 — afterInteractive로 렌더 차단 없음 */}
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(regs) {
              return Promise.all(regs.map(function(r) { return r.unregister(); }));
            }).then(function() {
              navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
            });
          }
        `}</Script>
      </body>
    </html>
  );
}
