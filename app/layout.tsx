import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Sora } from 'next/font/google';

const sora = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'JobPingAI - AI-powered roles for graduates',
  description: 'AI-curated job opportunities delivered daily to ambitious graduates.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sora.className} antialiased`}>
      <body className="bg-[#0A0A0A] text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
