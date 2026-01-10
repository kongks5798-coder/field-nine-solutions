import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Logo from "./components/Logo";
import { ErrorBoundary } from "./components/ErrorBoundary";
import EnvDebugger from "./components/EnvDebugger";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Field Nine - 비즈니스의 미래를 함께",
  description: "Field Nine과 함께 비즈니스의 미래를 만들어가세요",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Field Nine",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

// Next.js 15: viewport와 themeColor는 별도 export로 분리
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1A5D3F" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0F0F" },
  ],
};

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F9F9F7]/95 backdrop-blur-md border-b border-[#E5E5E0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <Logo size="md" animated={true} />
              <span className="text-xl font-bold text-[#171717] group-hover:text-[#1A5D3F] transition-colors">
                Field Nine
              </span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/intro" className="text-[#6B6B6B] hover:text-[#171717] transition-colors text-sm font-medium">
              서비스 소개
            </Link>
            <Link href="/pricing" className="text-[#6B6B6B] hover:text-[#171717] transition-colors text-sm font-medium">
              요금 안내
            </Link>
            <Link href="/cases" className="text-[#6B6B6B] hover:text-[#171717] transition-colors text-sm font-medium">
              고객 사례
            </Link>
            <Link href="/contact" className="text-[#6B6B6B] hover:text-[#171717] transition-colors text-sm font-medium">
              문의하기
            </Link>
            <Link 
              href="/login" 
              className="px-5 py-2 border border-[#171717] text-[#171717] font-semibold text-sm hover:bg-[#171717] hover:text-[#F9F9F7] transition-all rounded-md"
            >
              로그인
            </Link>
          </div>
          <div className="md:hidden">
            <button className="text-[#6B6B6B] hover:text-[#171717] transition-colors" aria-label="메뉴 열기">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-[#F9F9F7] border-t border-[#E5E5E0] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold text-[#171717] mb-4">
              Field <span className="text-[#1A5D3F]">Nine</span>
            </h3>
            <p className="text-[#6B6B6B] text-sm">
              비즈니스의 미래를 함께 만들어갑니다.
            </p>
          </div>
          <div>
            <h4 className="text-[#171717] font-semibold mb-4">법적 고지</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-[#6B6B6B] hover:text-[#1A5D3F] text-sm transition-colors">
                  이용약관
                </a>
              </li>
              <li>
                <a href="#" className="text-[#6B6B6B] hover:text-[#1A5D3F] text-sm transition-colors">
                  개인정보처리방침
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-[#171717] font-semibold mb-4">연락처</h4>
            <p className="text-[#6B6B6B] text-sm">contact@fieldnine.com</p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-[#E5E5E0]">
          <p className="text-[#6B6B6B] text-sm text-center">
            © 2024 Field Nine. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1A5D3F" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F9F9F7] text-[#171717]`}
      >
        <SessionProvider>
          <EnvDebugger />
          <ErrorBoundary>
            <Navbar />
            <main className="pt-16">
              {children}
            </main>
            <Footer />
            <Analytics /> {/* Vercel Analytics */}
          </ErrorBoundary>
        </SessionProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                      console.log('SW registered: ', registration);
                    })
                    .catch((registrationError) => {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
