'use client';
import { useState, useEffect } from 'react';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Sparkles, Zap, Target } from 'lucide-react';

export default function Home() {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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
      icon: Sparkles
    },
    {
      title: 'Graduate-Focused',
      description: 'Curated opportunities specifically for ambitious graduates entering the job market.',
      tier: 'TARGETED',
      icon: Target
    },
    {
      title: 'Zero Job Boards',
      description: 'Skip the endless scrolling. We bring the best opportunities directly to your inbox.',
      tier: 'EFFICIENT',
      icon: Zap
    }
  ];

  return (
    <>
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

        {/* Animated Grid Background */}
        <div className="fixed inset-0 -z-20 opacity-[0.04]">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(102, 126, 234, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(102, 126, 234, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            animation: 'grid-move 25s linear infinite'
          }} />
        </div>

        {/* Enhanced Floating Orbs */}
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ 
              x: [0, 120, -50, 0], 
              y: [0, -80, 40, 0],
              scale: [1, 1.2, 0.8, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] animate-breathe"
            style={{
              background: 'radial-gradient(circle, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.15) 40%, rgba(240, 147, 251, 0.1) 70%, transparent 100%)'
            }}
          />
          <motion.div
            animate={{ 
              x: [0, -100, 80, 0], 
              y: [0, 80, -60, 0],
              scale: [1, 0.8, 1.3, 1],
              rotate: [0, -180, -360]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[140px] animate-breathe"
            style={{
              background: 'radial-gradient(circle, rgba(240, 147, 251, 0.2) 0%, rgba(245, 87, 108, 0.15) 40%, rgba(79, 172, 254, 0.1) 70%, transparent 100%)'
            }}
          />
          <motion.div
            animate={{ 
              x: [0, 60, -40, 0], 
              y: [0, -40, 60, 0],
              scale: [1, 1.1, 0.9, 1]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full blur-[100px] animate-breathe"
            style={{
              background: 'radial-gradient(circle, rgba(79, 172, 254, 0.15) 0%, rgba(102, 126, 234, 0.1) 50%, transparent 100%)'
            }}
          />
        </div>

        {/* Enhanced Noise texture overlay */}
        <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='6' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay'
        }} />

        {/* Navigation */}
        <nav className="w-full py-8 px-6 md:px-12 flex justify-between items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <GraduationCap className="w-7 h-7 text-gradient animate-pulse-glow" strokeWidth={1.5} />
            <span className="premium-text text-xl font-semibold tracking-tight">JobPingAI</span>
          </motion.div>
          <motion.button 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
            className="nav-button magnetic-button"
          >
            Get Started
          </motion.button>
        </nav>

        {/* Hero Section */}
        <section className="min-h-[90vh] flex flex-col items-center justify-center text-center px-6 relative">
          {/* Logo + Heading */}
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex items-center gap-4 mb-8"
          >
            <GraduationCap className="w-10 h-10 text-gradient animate-pulse-glow animate-float" strokeWidth={1.5} />
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
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
            className="cta-button magnetic-button animate-gradient premium-glow"
          >
            Start Free Trial
          </motion.button>

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
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-32 px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-6xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 hero-title">
              Why Choose JobPingAI?
            </h2>
            <div className="grid md:grid-cols-3 gap-10">
              {features.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.div 
                    key={item.title} 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.15 }}
                    className="feature-card p-8 group"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <IconComponent className="w-6 h-6 text-gradient" strokeWidth={1.5} />
                      <h3 className="premium-text text-xl font-semibold tracking-tight">{item.title}</h3>
                    </div>
                    <p className="text-slate-300 font-light text-base leading-relaxed mb-6">{item.description}</p>
                    <span className="text-sm text-accent font-semibold uppercase tracking-wider">{item.tier}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* Sign-Up Panel */}
        <section id="signup" className="py-40 px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-bold hero-title mb-8"
            >
              Join JobPingAI
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-slate-300 text-lg md:text-xl font-light mb-12 leading-relaxed"
            >
              Trusted by thousands of graduates. No job boards. Just smart matches delivered daily.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="signup-panel p-10"
            >
              <AnimatePresence>
                {!iframeLoaded && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-3xl"
                  >
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse" />
                      <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse delay-75" />
                      <div className="w-3 h-3 bg-gradient-to-r from-pink-400 to-red-400 rounded-full animate-pulse delay-150" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <iframe
                src="https://tally.so/r/mJEqx4?alignLeft=1&transparentBackground=1&hideTitle=1"
                className="w-full h-[600px] rounded-2xl"
                loading="lazy"
                onLoad={() => setIframeLoaded(true)}
              />
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 px-8 border-t border-white/10 text-center text-slate-400 text-sm font-light relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            © 2025 JobPingAI. All rights reserved. · 
            <a href="/terms" className="hover:text-accent transition-colors ml-1">Terms</a> · 
            <a href="/privacy" className="hover:text-accent transition-colors ml-1">Privacy</a>
          </motion.div>
        </footer>
      </div>
    </>
  );
}
