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
    transition: { duration: 0.6 }
  };

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

      <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden" style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>
        {/* Animated Grid Background */}
        <div className="fixed inset-0 -z-20 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'grid-move 20s linear infinite'
          }} />
        </div>

        {/* Floating Orbs */}
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ 
              x: [0, 100, 0], 
              y: [0, -50, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]"
          />
          <motion.div
            animate={{ 
              x: [0, -80, 0], 
              y: [0, 60, 0],
              scale: [1, 0.9, 1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-[120px]"
          />
        </div>

        {/* Noise texture overlay */}
        <div className="fixed inset-0 opacity-[0.02] pointer-events-none z-0">
          <svg width="100%" height="100%">
            <defs>
              <filter id="noise">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} />
              </filter>
            </defs>
            <rect width="100%" height="100%" filter="url(#noise)" />
          </svg>
        </div>

        {/* Single subtle glow behind hero */}
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-[200px] pointer-events-none" />

        {/* Navigation */}
        <motion.nav 
          {...fadeUpAnimation}
          className="relative z-10 px-8 py-8"
        >
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <span className="text-lg font-light tracking-tight">JobPing</span>
            
            <button
              onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-2 text-sm font-light border border-white/20 rounded-full hover:bg-white hover:text-black transition-all duration-300"
            >
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
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative inline-block"
            >
              <motion.button
                onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
                className="relative px-10 py-4 bg-white text-black rounded-full font-semibold overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-white/20"
                whileHover={{ y: -2 }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Free Trial
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white to-gray-100"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
              
              {/* Magnetic glow */}
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
            </motion.div>

            {/* Subtle social proof */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-12 text-sm text-white/40 font-light"
            >
              2,847 jobs added weekly
            </motion.p>
          </motion.div>
        </section>

        {/* How It Works */}
        <section className="py-24 px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-6xl mx-auto"
          >
            <h2 className="text-3xl font-light text-center mb-16 text-white/90">
              How JobPing Works
            </h2>

            <div className="grid md:grid-cols-3 gap-12 md:gap-16">
              {[
                {
                  number: '01',
                  title: 'Share your goals',
                  description: 'Describe your dream job in 30 seconds.'
                },
                {
                  number: '02',
                  title: 'AI curates daily',
                  description: 'Our algorithm finds your perfect matches.'
                },
                {
                  number: '03',
                  title: 'Apply with ease',
                  description: 'One click to apply. Skip the search.'
                }
              ].map((step, i) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: [0.33, 1, 0.68, 1] }}
                  className="text-center md:text-left"
                >
                  <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center mb-4 mx-auto md:mx-0">
                    <span className="text-sm font-light text-white/60">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-normal mb-2 text-white/90">{step.title}</h3>
                  <p className="text-white/60 font-light">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Sign-Up Form */}
        <section id="signup" className="py-24 px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-light text-center mb-4 text-white/90">
              Ready to start?
            </h2>
            <p className="text-center text-white/60 mb-12 font-light">
              Join thousands finding their perfect role
            </p>

            <div className="relative bg-[#0f0f0f] backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-12">
              <AnimatePresence>
                {!iframeLoaded && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-3xl"
                  >
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-75" />
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-150" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <iframe
                src="https://tally.so/r/mJEqx4?alignLeft=1&transparentBackground=1&hideTitle=1"
                width="100%"
                height="500"
                frameBorder="0"
                title="JobPing Signup"
                className="w-full"
                onLoad={() => setIframeLoaded(true)}
              />
              
              <p className="text-center text-sm text-white/40 mt-6 font-light">
                Form not loading?{' '}
                <a
                  href="https://tally.so/r/mJEqx4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 ml-1 underline"
                >
                  Open in new tab →
                </a>
              </p>
            </div>
          </motion.div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl font-light text-center mb-4 text-white/90">
              Simple, transparent pricing
            </h2>
            <p className="text-center text-white/60 mb-12 font-light">
              For everyone.
            </p>

            {/* Toggle */}
            <div className="flex justify-center mb-16">
              <div className="relative bg-white/5 p-1 rounded-full inline-flex">
                <button
                  onClick={() => setActiveTab('free')}
                  className={`px-6 py-2 rounded-full text-sm font-light transition-all ${
                    activeTab === 'free' ? 'text-black' : 'text-white/40'
                  }`}
                  style={{ position: 'relative', zIndex: 10 }}
                >
                  Free
                </button>
                <button
                  onClick={() => setActiveTab('premium')}
                  className={`px-6 py-2 rounded-full text-sm font-light transition-all ${
                    activeTab === 'premium' ? 'text-black' : 'text-white/40'
                  }`}
                  style={{ position: 'relative', zIndex: 10 }}
                >
                  Premium
                </button>
                <motion.div
                  className="absolute top-1 bottom-1 bg-white rounded-full"
                  animate={{
                    x: activeTab === 'free' ? 4 : '100%',
                    width: activeTab === 'free' ? 56 : 72,
                  }}
                  transition={{ type: "tween", duration: 0.3 }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'free' ? (
                <motion.div
                  key="free"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-sm mx-auto"
                >
                  <div className="text-center p-8 rounded-2xl border border-white/10">
                    <h3 className="text-2xl font-light mb-2 text-white/90">Free Forever</h3>
                    <div className="text-5xl font-light my-6">€0</div>
                    <ul className="space-y-3 mb-8 text-white/70 font-light">
                      <li>5 job matches daily</li>
                      <li>Email delivery</li>
                      <li>Basic preferences</li>
                    </ul>
                    <button
                      onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
                      className="w-full py-3 border border-white/20 rounded-full hover:bg-white/5 transition-all font-light"
                    >
                      Start Free
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="premium"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto"
                >
                  {[
                    { name: 'Monthly', price: '€15', period: 'per month' },
                    { name: 'Quarterly', price: '€30', period: '3 months', highlight: true }
                  ].map((plan) => (
                    <div 
                      key={plan.name}
                      className={`text-center p-8 rounded-2xl border ${
                        plan.highlight ? 'border-white/30' : 'border-white/10'
                      }`}
                    >
                      {plan.highlight && (
                        <span className="text-xs text-white/60 font-light">Save 33%</span>
                      )}
                      <h3 className="text-xl font-light mb-2 text-white/90 mt-2">{plan.name}</h3>
                      <div className="text-4xl font-light my-4">{plan.price}</div>
                      <div className="text-sm text-white/60 mb-6 font-light">{plan.period}</div>
                      <ul className="space-y-2 mb-8 text-sm text-white/70 font-light">
                        <li>15 job matches daily</li>
                        <li>Priority AI matching</li>
                        <li>Advanced filters</li>
                      </ul>
                      <button
                        onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
                        className={`w-full py-3 rounded-full transition-all font-light ${
                          plan.highlight 
                            ? 'bg-white text-black hover:bg-white/90' 
                            : 'border border-white/20 hover:bg-white/5'
                        }`}
                      >
                        Get Premium
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-8 border-t border-white/5">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-sm text-white/40 font-light mb-4">
              © 2025 JobPing. All rights reserved.
            </p>
            <div className="flex justify-center gap-6 text-sm">
              <a href="/terms" className="text-white/40 hover:text-white/60 transition-colors font-light">
                Terms
              </a>
              <a href="/privacy" className="text-white/40 hover:text-white/60 transition-colors font-light">
                Privacy
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
