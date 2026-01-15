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
    en: 'K-Universal | The Future of Identity',
    ko: 'K-Universal | 신원 인증의 미래',
    ja: 'K-Universal | アイデンティティの未来',
    zh: 'K-Universal | 身份认证的未来',
  };

  const descriptions: Record<string, string> = {
    en: 'Passport-grade KYC verification meets Ghost Wallet. Built for global citizens with Tesla/Apple-level standards.',
    ko: '여권 기반 KYC 인증과 Ghost Wallet의 만남. Tesla/Apple 수준의 글로벌 시민을 위한 서비스.',
    ja: 'パスポートグレードのKYC認証とGhost Walletの融合。グローバル市民のために構築。',
    zh: '护照级KYC验证与Ghost Wallet的结合。为全球公民打造。',
  };

  return {
    metadataBase: new URL('https://fieldnine.io'),
    title: {
      default: titles[locale] || titles.en,
      template: '%s | K-Universal',
    },
    description: descriptions[locale] || descriptions.en,
    keywords: [
      'passport verification',
      'KYC',
      'e-KYC',
      'Ghost Wallet',
      'crypto wallet',
      'biometric authentication',
      'digital identity',
      'Korea fintech',
      'expat services',
      'global citizens',
    ],
    authors: [{ name: 'K-Universal Team' }],
    creator: 'K-Universal',
    publisher: 'K-Universal',
    openGraph: {
      type: 'website',
      locale: locale === 'ko' ? 'ko_KR' : locale === 'ja' ? 'ja_JP' : locale === 'zh' ? 'zh_CN' : 'en_US',
      url: 'https://fieldnine.io',
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
      siteName: 'K-Universal',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'K-Universal - The Future of Identity',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
      images: ['/og-image.png'],
      creator: '@k_universal',
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
      canonical: `https://fieldnine.io/${locale}`,
      languages: {
        en: 'https://fieldnine.io/en',
        ko: 'https://fieldnine.io/ko',
        ja: 'https://fieldnine.io/ja',
        zh: 'https://fieldnine.io/zh',
      },
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0A0A0F',
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
        <meta name="apple-mobile-web-app-title" content="K-Universal" />
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
          <AnalyticsProvider>{children}</AnalyticsProvider>
          {/* Bottom Navigation - Mobile Only */}
          <BottomNavigation />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
