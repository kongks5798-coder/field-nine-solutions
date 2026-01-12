import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://fieldnine.io'),
  title: {
    default: 'K-Universal | The Future of Identity',
    template: '%s | K-Universal',
  },
  description: 'Passport-grade KYC verification meets Ghost Wallet. Built for global citizens with Tesla/Apple-level standards.',
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
    locale: 'en_US',
    url: 'https://fieldnine.io',
    title: 'K-Universal | The Future of Identity',
    description: 'Passport-grade KYC verification meets Ghost Wallet. Built for global citizens.',
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
    title: 'K-Universal | The Future of Identity',
    description: 'Passport-grade KYC verification meets Ghost Wallet. Built for global citizens.',
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
  verification: {
    google: 'your-google-verification-code',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F9F9F7',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
