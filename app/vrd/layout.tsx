import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'VRD 26SS | Versatility · Restraint · Design',
    template: '%s | VRD 26SS',
  },
  description: 'VRD 26SS Collection - Premium athletic wear designed for the modern athlete. Versatility, Restraint, Design.',
  keywords: ['VRD', 'athletic wear', 'sportswear', 'premium fashion', 'K-fashion', '26SS', 'Field Nine'],
  authors: [{ name: 'Field Nine' }],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    alternateLocale: 'en_US',
    siteName: 'VRD',
    title: 'VRD 26SS Collection',
    description: 'Premium athletic wear. Versatility · Restraint · Design',
    images: [
      {
        url: '/og/vrd-26ss.jpg',
        width: 1200,
        height: 630,
        alt: 'VRD 26SS Collection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VRD 26SS Collection',
    description: 'Premium athletic wear. Versatility · Restraint · Design',
    images: ['/og/vrd-26ss.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#171717',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function VRDLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F9F9F7] antialiased">
      {children}
    </div>
  );
}
