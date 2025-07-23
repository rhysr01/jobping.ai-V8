import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'JobPingAI – Graduate Jobs Delivered',
  description:
    'University graduate jobs delivered to your inbox daily. No job boards. No dashboards. Just personalised email matches for students and grads.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="JobPingAI – Graduate Jobs Delivered" />
        <meta
          property="og:description"
          content="University graduate jobs delivered daily. No job boards. Just personalised internship matches by email."
        />
        <meta property="og:image" content="https://jobpingai.vercel.app/preview.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </head>
      <body className="bg-black text-white font-sans">
        {children}
      </body>
    </html>
  );
}
