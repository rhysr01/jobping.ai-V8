'use client';
import { useState, useEffect } from 'react';
import Script from 'next/script';
import Head from 'next/head';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { GraduationCap, Sparkles, Zap, Target } from 'lucide-react';
import PricingSelector from './priceselector';
import MagneticButton from './components/MagneticButton';

export default function Home() {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const { scrollY } = useScroll();
  const gradientY = useTransform(scrollY, [0, 500], [0, -150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      title: 'AI-Powered Matching',
      description: 'Advanced algorithms analyze your profile and preferences to find perfect job matches daily.',
      tier: 'SMART',
      icon: Sparkles,
      badge: '✨'
    },
    {
      title: 'Graduate-Focused',
      description: 'Curated opportunities specifically for ambitious graduates entering the job market.',
      tier: 'TARGETED',
      icon: Target,
      badge: '🎯'
    },
    {
      title: 'Zero Job Boards',
      description: 'Skip the endless scrolling. We bring the best opportunities directly to your inbox.',
      tier: 'EFFICIENT',
      icon: Zap,
      badge: '⚡'
    }
  ];

  return (
    <>
      <Head>
        <title>JobPingAI – Smart Job Discovery for Graduates</title>
        <meta name="description" content="AI-powered job matching built for ambitious graduates. Get personalized opportunities straight to your inbox." />
        <meta property="og:title" content="JobPingAI – Smart Job Discovery for Graduates" />
        <meta property="og:description" content="AI-powered job matching built for ambitious graduates. Get personalized opportunities straight to your inbox." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og-image.png" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Script
        src="https://tally.so/widgets/embed.js"
        strategy="lazyOnload"
        onLoad={() => {
          if (typeof window !== 'undefined') {
            const tallyWindow = window as Window & { 
              Tally?: { loadEmbeds: () => void } 
            };
            tallyWindow.Tally?.loadEmbeds();
          }
        }}
      />

      <div className="min-h-screen overflow-x-hidden relative">
        {/* Cursor follower */}
        <div 
          className="fixed w-6 h-6 pointer-events-none z-50 mix-blend-difference"
          style={{
            left: mousePosition.x - 12,
            top: mousePosition.y - 12,
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%)',
            borderRadius: '50%',
            transition: 'all 0.1s ease-out'
          }}
        />

        {/* Navigation */}
        <nav className="w-full py-8 px-6 md:px-12 flex justify-between items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 relative"
          >
            <div className="relative w-7 h-7">
              <GraduationCap className="w-7 h-7 text-white z-10 relative" strokeWidth={1.5} />
              <span className="absolute w-full h-full rounded-full bg-white opacity-40 animate-ping-slow z-0 top-0 left-0" />
            </div>
            <span className="premium-text text-xl font-semibold tracking-tight">JobPingAI</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <MagneticButton
              variant="secondary"
              onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
              className="nav-button"
            >
              Get Started
            </MagneticButton>
          </motion.div>
        </nav>
        {/* Hero Section */}
        <section className="min-h-[90vh] flex flex-col items-center justify-center text-center px-6 relative">
          {/* Parallax gradient background */}
          <motion.div
            style={{ y: gradientY, opacity }}
            className="absolute inset-0 -z-10"
          >
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.03] rounded-full blur-[100px]" />
          </motion.div>
          {/* Logo + Heading */}
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="relative w-10 h-10">
              <GraduationCap className="w-10 h-10 text-white z-10 relative animate-float" strokeWidth={1.5} />
              <span className="absolute w-full h-full rounded-full bg-white opacity-30 animate-ping-slow z-0 top-0 left-0" />
            </div>
            <h1 className="text-[clamp(2.5rem,7vw,5rem)] font-bold hero-title tracking-tight">
              JobPingAI
            </h1>
          </motion.div>

          {/* Catchphrase */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-accent text-xl md:text-2xl font-light mb-12 max-w-2xl italic leading-relaxed"
          >
            AI-powered job discovery, built for ambitious graduates who deserve better than endless scrolling.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <MagneticButton
              onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
              className="cta-button animate-gradient premium-glow"
            >
              Start Free Trial
            </MagneticButton>
          </motion.div>

          {/* Floating elements */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/4 left-1/4 w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60"
            />
            <motion.div
              animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-50"
            />
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 3, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-gradient-to-r from-pink-400 to-red-400 rounded-full opacity-40"
            />
            <motion.div
              animate={{ y: [0, 25, -15, 0], x: [0, 10, -5, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 3 }}
              className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full opacity-30"
            />
            <motion.div
              animate={{ y: [0, -30, 20, 0], x: [0, -15, 8, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 4 }}
              className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-25"
            />
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-32 px-6 bg-[#0A0A0A] relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Why Choose JobPingAI?
            </h2>
            <p className="text-gray-300 text-lg font-light">
              Built for students by students. Powered by AI. Delivered with simplicity.
            </p>
          </motion.div>

          <div className="space-y-6 max-w-3xl mx-auto">
            {features.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <motion.article 
                  key={item.title} 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ 
                    duration: 0.5,
                    delay: index * 0.1,
                    ease: [0.21, 0.47, 0.32, 0.98]
                  }}
                  whileHover={{ 
                    y: -5,
                    transition: { duration: 0.2 }
                  }}
                  className="group relative rounded-3xl border border-gray-700/50 bg-gradient-to-br from-gray-800/30 via-gray-900/20 to-transparent backdrop-blur-md p-8 text-left transition-all duration-300 hover:border-gray-600/60 hover:bg-gradient-to-br hover:from-gray-700/40 hover:via-gray-800/30 hover:to-gray-900/10 hover:shadow-xl hover:shadow-gray-900/20"
                >
                  <h3 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gray-700/40 border border-gray-600/50">
                      <IconComponent className="w-7 h-7 text-gray-200" strokeWidth={1.5} />
                    </div>
                    {item.title}
                  </h3>
                  <p className="text-gray-300 text-base leading-relaxed mb-4 font-light">
                    {item.description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400 bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700/50 font-semibold">
                    <span>{item.badge}</span>
                    {item.tier}
                  </span>
                </motion.article>
              );
            })}
          </div>
        </section>
        {/* Pricing Selector */}
        <section className="py-16 px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-3xl md:text-4xl font-bold hero-title mb-8"
            >
              Choose Your Plan
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-slate-300 text-lg md:text-xl font-light mb-12 leading-relaxed"
            >
              Select the plan that best fits your needs and budget.
            </motion.p>
            <PricingSelector onSelect={(plan) => console.log('Selected plan:', plan)} />
          </div>
        </section>

        {/* Signup Section */}
        <section id="signup" className="py-40 px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative bg-gradient-to-br from-gray-800/40 via-gray-900/30 to-transparent backdrop-blur-xl border-2 border-gray-600/50 rounded-3xl p-12 shadow-2xl shadow-gray-900/30">
              <h2 className="text-5xl font-black text-white mb-6 text-center">
                Ready to Get Started?
              </h2>
              <p className="text-gray-200 text-xl text-center mb-10 font-light leading-relaxed">
                Join thousands of ambitious graduates finding their dream jobs with AI-powered precision.
              </p>
              
              {/* Loading Skeleton - Shows while iframe loads */}
              <AnimatePresence>
                {!iframeLoaded && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-12 z-10"
                  >
                    {/* Form Title Skeleton */}
                    <div className="form-skeleton h-8 w-48 rounded-lg mb-6" />
                    
                    {/* Form Fields Skeleton */}
                    <div className="space-y-4">
                      <div>
                        <div className="form-skeleton h-4 w-20 rounded mb-2" />
                        <div className="form-skeleton h-12 w-full rounded-lg" />
                      </div>
                      <div>
                        <div className="form-skeleton h-4 w-24 rounded mb-2" />
                        <div className="form-skeleton h-12 w-full rounded-lg" />
                      </div>
                      <div>
                        <div className="form-skeleton h-4 w-32 rounded mb-2" />
                        <div className="form-skeleton h-12 w-full rounded-lg" />
                      </div>
                      <div>
                        <div className="form-skeleton h-4 w-28 rounded mb-2" />
                        <div className="form-skeleton h-12 w-full rounded-lg" />
                      </div>
                      <div>
                        <div className="form-skeleton h-4 w-36 rounded mb-2" />
                        <div className="form-skeleton h-12 w-full rounded-lg" />
                      </div>
                    </div>
                    
                    {/* Submit Button Skeleton */}
                    <div className="form-skeleton h-12 w-full rounded-full mt-8" />
                    
                    {/* Loading text */}
                    <p className="text-center text-white/40 text-sm mt-6">
                      Preparing your signup form...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actual iframe */}
              <iframe
                src="https://tally.so/r/mJEqx4?alignLeft=1&transparentBackground=1&hideTitle=1"
                className="w-full h-[600px] rounded-2xl border border-gray-700/50 transition-opacity duration-300"
                loading="lazy"
                onLoad={() => setIframeLoaded(true)}
                style={{ opacity: iframeLoaded ? 1 : 0 }}
              />
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-20 px-8 border-t-2 border-gray-700/50 text-center text-gray-300 text-base font-medium relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            © 2025 JobPingAI. All rights reserved. · 
            <a href="/terms" className="hover:text-white transition-colors ml-1 font-semibold">Terms</a> · 
            <a href="/privacy" className="hover:text-white transition-colors ml-1 font-semibold">Privacy</a>
          </motion.div>
        </footer>
      </div>
    </>
  );
}
