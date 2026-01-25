/**
 * K-Universal Locale Layout
 * i18n 지원 레이아웃
 */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { locales, type Locale, localeNames } from '@/i18n/config';
import { AnalyticsProvider } from '../providers';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { BottomNavigation } from '@/components/ui/bottom-navigation';
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register';
import { AuthProvider } from '@/components/auth/auth-provider';
import { Toaster } from 'sonner';
import { JarvisConcierge } from '@/components/nexus/jarvis-concierge';
import { PWAInstallPrompt } from '@/components/nexus/pwa-install-prompt';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

// Generate static params for all locales
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Generate metadata based on locale
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    en: 'Field Nine | AI-Powered Energy Trading & Tesla V2G Platform',
    ko: 'Field Nine | AI 에너지 거래 & 테슬라 V2G 플랫폼',
    ja: 'Field Nine | AI エネルギー取引 & Tesla V2G プラットフォーム',
    zh: 'Field Nine | AI能源交易与特斯拉V2G平台',
  };

  const descriptions: Record<string, string> = {
    en: 'Revolutionary AI-powered energy trading platform. Tesla V2G integration, 50MW Yeongdong solar farm, Prophet AI trading advisor. Earn KAUS Coin rewards. Join the $10M energy empire.',
    ko: '혁신적인 AI 기반 에너지 거래 플랫폼. 테슬라 V2G 연동, 영동 50MW 태양광 발전소, Prophet AI 트레이딩 어드바이저. KAUS 코인 리워드 적립. 1,000만 달러 에너지 제국에 참여하세요.',
    ja: '革新的なAI搭載エネルギー取引プラットフォーム。Tesla V2G統合、50MW永東ソーラーファーム、Prophet AIトレーディングアドバイザー。KAUS Coinリワード獲得。',
    zh: '革命性AI驱动能源交易平台。特斯拉V2G集成，永东50MW太阳能农场，Prophet AI交易顾问。赚取KAUS Coin奖励。加入千万美元能源帝国。',
  };

  return {
    metadataBase: new URL('https://m.fieldnine.io'),
    title: {
      default: titles[locale] || titles.en,
      template: '%s | Field Nine Energy',
    },
    description: descriptions[locale] || descriptions.en,
    keywords: [
      'energy trading platform',
      'Tesla V2G',
      'vehicle to grid',
      'solar energy trading',
      'AI energy trading',
      'KAUS Coin',
      'Prophet AI',
      'renewable energy investment',
      'SMP trading Korea',
      'Yeongdong solar farm',
      'electric vehicle charging',
      'Korea energy market',
      'V2G arbitrage',
      'energy cryptocurrency',
      'smart grid trading',
    ],
    authors: [{ name: 'Field Nine Solutions' }],
    creator: 'Field Nine',
    publisher: 'Field Nine Energy',
    openGraph: {
      type: 'website',
      locale: locale === 'ko' ? 'ko_KR' : locale === 'ja' ? 'ja_JP' : locale === 'zh' ? 'zh_CN' : 'en_US',
      url: 'https://m.fieldnine.io',
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
      siteName: 'Field Nine Energy',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Field Nine - AI-Powered Energy Trading Platform',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
      images: ['/og-image.png'],
      creator: '@fieldnine_io',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: `https://m.fieldnine.io/${locale}`,
      languages: {
        en: 'https://m.fieldnine.io/en',
        ko: 'https://m.fieldnine.io/ko',
        ja: 'https://m.fieldnine.io/ja',
        zh: 'https://m.fieldnine.io/zh',
      },
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#171717',
  viewportFit: 'cover', // PWA full screen support
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate that the incoming locale is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the current locale
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        {/* PWA - iOS Safari specific meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Field Nine" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-167.png" />

        {/* Splash screens for iOS */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1125x2436.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1242x2688.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-828x1792.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)"
        />

        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <Script
              id="gtag-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          {/* Language Switcher - Fixed position (hidden on mobile when bottom nav is shown) */}
          <div className="fixed top-4 right-4 z-50 md:block hidden">
            <LanguageSwitcher />
          </div>
          {/* Mobile Language Switcher - Top left */}
          <div className="fixed top-4 left-4 z-50 md:hidden block">
            <LanguageSwitcher />
          </div>
          <AnalyticsProvider>
            <AuthProvider>{children}</AuthProvider>
          </AnalyticsProvider>
          {/* Toast notifications */}
          <Toaster position="top-center" richColors closeButton />
          {/* Service Worker Registration */}
          <ServiceWorkerRegister />
          {/* Bottom Navigation - Mobile Only */}
          <BottomNavigation />
          {/* Jarvis AI Concierge - Global */}
          <JarvisConcierge />
          {/* PWA Install Prompt - Mobile */}
          <PWAInstallPrompt />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
