/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 78: NEXUS EMPIRE PWA MANIFEST
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Field Nine Energy Empire - Commercial-Grade PWA
 * Full native app experience with home screen installation
 */

import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Field Nine Empire - AI Energy Trading',
    short_name: 'Field Nine',
    description: 'AI-Powered Energy Trading Platform. 영동 50MW 태양광 + 테슬라 V2G + KAUS 토큰. 실제 에너지 자산 기반 수익.',
    start_url: '/ko/nexus',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'fullscreen'],
    background_color: '#0A0A0A',
    theme_color: '#171717',
    orientation: 'portrait',
    id: 'com.fieldnine.nexus',
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
        src: '/screenshots/nexus-energy.png',
        sizes: '1080x1920',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'NEXUS Energy Dashboard',
      },
      {
        src: '/screenshots/nexus-exchange.png',
        sizes: '1080x1920',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'KAUS Exchange',
      },
    ],
    shortcuts: [
      {
        name: 'Energy Dashboard',
        short_name: 'Energy',
        description: '실시간 에너지 대시보드',
        url: '/ko/nexus/energy',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'KAUS Exchange',
        short_name: 'Exchange',
        description: 'KAUS 토큰 거래',
        url: '/ko/nexus/exchange',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Portfolio',
        short_name: 'Portfolio',
        description: '내 자산 현황',
        url: '/ko/nexus/portfolio',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Profile',
        short_name: 'Profile',
        description: '프로필 & 설정',
        url: '/ko/nexus/profile',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
    categories: ['finance', 'business', 'productivity', 'utilities'],
    lang: 'ko',
    dir: 'ltr',
    prefer_related_applications: false,
    related_applications: [],
  };
}
