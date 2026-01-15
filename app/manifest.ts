/**
 * K-Universal Web App Manifest
 * PWA support for mobile installation
 * Fullscreen app experience with no browser chrome
 */

import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'K-Universal Super App',
    short_name: 'K-Universal',
    description: '환전, 결제, 택시, 배달 - 한국 여행의 모든 것. Exchange, Pay, Taxi, Delivery - Everything for Korea Travel.',
    start_url: '/ko',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'fullscreen'],
    background_color: '#0A0A0F',
    theme_color: '#0A0A0F',
    orientation: 'portrait',
    id: 'com.fieldnine.kuniversal',
    icons: [
      {
        src: '/icon-72.png',
        sizes: '72x72',
        type: 'image/png',
      },
      {
        src: '/icon-96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/icon-128.png',
        sizes: '128x128',
        type: 'image/png',
      },
      {
        src: '/icon-144.png',
        sizes: '144x144',
        type: 'image/png',
      },
      {
        src: '/icon-152.png',
        sizes: '152x152',
        type: 'image/png',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/home.png',
        sizes: '1080x1920',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'K-Universal Home Screen',
      },
      {
        src: '/screenshots/wallet.png',
        sizes: '1080x1920',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Ghost Wallet',
      },
    ],
    shortcuts: [
      {
        name: 'QR 결제',
        short_name: 'QR Pay',
        description: 'QR 코드로 결제하기',
        url: '/ko/wallet',
        icons: [{ src: '/icons/qr-96.png', sizes: '96x96' }],
      },
      {
        name: '택시 호출',
        short_name: 'Taxi',
        description: '택시 부르기',
        url: '/ko/dashboard/taxi',
        icons: [{ src: '/icons/taxi-96.png', sizes: '96x96' }],
      },
      {
        name: '배달 주문',
        short_name: 'Food',
        description: '음식 배달 주문',
        url: '/ko/dashboard/food',
        icons: [{ src: '/icons/food-96.png', sizes: '96x96' }],
      },
    ],
    categories: ['finance', 'lifestyle', 'travel', 'utilities'],
    lang: 'ko',
    dir: 'ltr',
    prefer_related_applications: false,
    related_applications: [],
  };
}
