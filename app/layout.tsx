import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
 title: 'JobPing - AI-curated roles. Delivered daily.',
 description: 'Skip the job boards. Get personalized opportunities in your inbox.',
 keywords: ['graduate jobs', 'job matching', 'AI recruitment', 'internships', 'career'],
 authors: [{ name: 'JobPing' }],
 robots: {
   index: true,
   follow: true,
 },
 icons: { 
   icon: '/favicon.ico',
 },
 viewport: {
   width: 'device-width',
   initialScale: 1,
   maximumScale: 1,
 },
 themeColor: '#0A0A0A',
};

export default function RootLayout({ children }: { children: ReactNode }) {
 return (
   <html lang="en" className="antialiased">
     <head>
       <link rel="preconnect" href="https://fonts.googleapis.com" />
       <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
       <link 
         href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap" 
         rel="stylesheet" 
       />
       <link rel="dns-prefetch" href="https://tally.so" />
     </head>
     <body 
       className="bg-[#0A0A0A] text-white overflow-x-hidden"
       style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
     >
       {children}
     </body>
   </html>
 );
}
