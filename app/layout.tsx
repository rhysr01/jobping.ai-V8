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
  openGraph: {
    title: 'JobPingAI - AI-powered roles for graduates',
    description: 'AI-curated job opportunities delivered daily to ambitious graduates.',
    url: 'https://www.jobping.ai', // Replace with your actual domain
    siteName: 'JobPingAI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'JobPingAI Open Graph Banner',
      },
    ],
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
  },
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
export {}; // Force module context for Vercel
