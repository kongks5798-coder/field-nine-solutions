import type { Metadata, Viewport } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Panopticon | Field Nine',
  description: 'Premium Business Intelligence Dashboard',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F9F9F7',
};

export default function PanopticonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
          backgroundColor: '#F9F9F7',
          color: '#171717',
          margin: 0,
          padding: 0,
        }}
      >
        {children}
      </body>
    </html>
  );
}
