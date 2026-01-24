import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FILLUMINATE 26SS 2nd Drop - Design Command Center',
  description: 'FILLUMINATE 26SS 2nd Drop Collection Design Dashboard - 디자인 지휘 본부',
};

export default function FilluminateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
