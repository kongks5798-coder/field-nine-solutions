import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ErrorReporter } from "@/components/ErrorReporter";
import { AuthSessionProvider } from "@/components/providers/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorReporter />
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
