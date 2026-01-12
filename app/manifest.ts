/**
 * K-Universal Web App Manifest
 * PWA support for mobile installation
 */

import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'K-Universal',
    short_name: 'K-Universal',
    description: 'Passport-grade KYC verification meets Ghost Wallet. Built for global citizens.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F9F9F7',
    theme_color: '#0066FF',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['finance', 'business', 'utilities'],
    lang: 'en',
    dir: 'ltr',
  };
}
