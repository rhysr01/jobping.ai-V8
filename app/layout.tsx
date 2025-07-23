import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'JobPingAI – Graduate Job Matches Delivered',
  description:
    'Graduate job opportunities delivered directly to your inbox. No job boards. No filters. Just smart, email-based career matching for university graduates.',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'JobPingAI – Graduate Job Matches Delivered',
    description:
      'Get 5–15 job opportunities daily based on your preferences, city, and start date. Clean, email-first job discovery — no dashboard needed.',
    url: 'https://jobping.vercel.app',
    siteName: 'JobPingAI',
    images: [
      {
        url: 'https://jobping.vercel.app/preview.png',
        width: 1200,
        height: 630,
        alt: 'JobPingAI – Preview',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JobPingAI – Graduate Job Matches Delivered',
    description:
      'University graduate jobs delivered to your inbox — smart, email-only career discovery with zero job board noise.',
    images: ['https://jobping.vercel.app/preview.png'],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-black text-white font-sans antialiased selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}
