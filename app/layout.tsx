import type { Metadata } from 'next';
import '../styles/tokens.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'NeuroHome',
  description: 'Functional neurology, delivered at home.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
