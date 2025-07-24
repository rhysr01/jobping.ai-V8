'use client';
import { useState } from 'react';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('free');

  // Minimal fade animation preset
  const fadeUpAnimation = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.33, 1, 0.68, 1] }
  };

  return (
    <>
      <Script
        src="https://tally.so/widgets/embed.js"
        strategy="lazyOnload"
        onLoad={() => {
          if (typeof window !== 'undefined' && (window as Window & { Tally?: { loadEmbeds: () => void } }).Tally) {
            (window as Window & { Tally?: { loadEmbeds: () => void } }).Tally.loadEmbeds();
          }
        }}
      />

      <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden" style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>
        {/* Navigation */}
        <motion.nav 
          {...fadeUpAnimation}
          className="relative z-10 px-8 py-8"
        >
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <span className="text-lg font-light tracking-tight">JobPing</span>
            <button className="px-6 py-2 text-sm font-light border border-white/20 rounded-full hover:bg-white hover:text-black transition-all duration-300">
              Get Started
            </button>
          </div>
        </motion.nav>

        {/* Hero Section */}
        <section className="relative min-h-[80vh] flex items-center justify-center px-8 -mt-20">
          <motion.div 
            {...fadeUpAnimation}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-[clamp(2rem,7vw,5rem)] font-light leading-[0.9] tracking-[-0.03em] mb-10">
              Your next job{' '}
              <span className="bg-gradient-to-r from-blue-400/80 to-purple-400/80 bg-clip-text text-transparent">
                finds you.
              </span>
            </h1>
            <p className="text-lg text-white/70 max-w-md mx-auto mb-12 font-light">
              AI-curated roles. Delivered daily. No job boards.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3 bg-white text-black rounded-full hover:bg-white/90 transition-all duration-300 font-normal"
            >
              Start Free Trial
            </motion.button>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-8 border-t border-white/5">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-sm text-white/40 font-light mb-4">
              © 2025 JobPing. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
