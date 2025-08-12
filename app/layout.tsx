import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  metadataBase: new URL('https://jobping.ai'),
  title: 'JobPingAI - AI-powered job matching for students',
        description: 'AI-curated job opportunities delivered every 48 hours to ambitious students and graduates. Stop scrolling job boards, start landing interviews.',
  keywords: ['jobs', 'students', 'graduates', 'AI', 'career', 'recruitment', 'internships', 'job matching'],
  authors: [{ name: 'JobPingAI Team' }],
  creator: 'JobPingAI',
  publisher: 'JobPingAI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'JobPingAI - AI-powered job matching for students',
    description: 'AI-curated job opportunities delivered every 48 hours to ambitious students and graduates. Stop scrolling job boards, start landing interviews.',
    url: 'https://www.jobping.ai',
    siteName: 'JobPingAI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'JobPingAI - Smart Job Discovery Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JobPingAI - AI-powered job matching for students',
    description: 'AI-curated job opportunities delivered every 48 hours to ambitious students and graduates.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#0B0B0F" />
        <meta name="color-scheme" content="dark" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="bg-[#0B0B0F] text-white overflow-x-hidden font-inter selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}