/**
 * K-Universal Root Layout
 * This is a pass-through layout - the actual layout is in [locale]/layout.tsx
 */

import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
