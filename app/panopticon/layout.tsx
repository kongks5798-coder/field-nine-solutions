import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PANOPTICON - Field Nine CEO Dashboard',
  description: 'Field Nine Solutions Executive Dashboard',
};

export default function PanopticonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
