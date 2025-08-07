'use client';
import { useState, useEffect } from 'react';
import Script from 'next/script';
import Head from 'next/head';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { GraduationCap, Sparkles, Zap, Target, ArrowRight, Users, TrendingUp, CheckCircle2 } from 'lucide-react';
import PricingSelector from './priceselector';
import MagneticButton from './components/MagneticButton';

export default function Home() {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrolled, setScrolled] = useState(false);

  const { scrollY } = useScroll();
  const gradientY = useTransform(scrollY, [0, 500], [0, -150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.3]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);
  
  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
  const springScale = useSpring(scale, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const features = [
    {
      title: 'AI-Powered Precision',
      description: 'Our advanced algorithms analyze 50+ data points to match you with opportunities that perfectly align with your career goals, skills, and preferences.',
      tier: 'SMART',
      icon: Sparkles,
      badge: '✨',
      metrics: '95% match accuracy',
      color: 'from-purple-400/20 to-pink-400/20'
    },
    {
      title: 'Graduate-First Focus',
      description: 'Exclusively curated opportunities from top companies actively seeking ambitious graduates. No senior roles cluttering your feed.',
      tier: 'TARGETED',
      icon: Target,
      badge: '🎯',
      metrics: '10K+ graduate roles',
      color: 'from-blue-400/20 to-cyan-400/20'
    },
    {
      title: 'Zero Job Board Fatigue',
      description: 'Skip the endless scrolling and application black holes. We bring the most relevant opportunities directly to your inbox, pre-screened and ready.',
      tier: 'EFFICIENT',
      icon: Zap,
      badge: '⚡',
      metrics: '5 hours saved weekly',
      color: 'from-green-400/20 to-emerald-400/20'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Active Graduate Roles', icon: Users },
    { value: '95%', label: 'Match Accuracy', icon: Target },
    { value: '48hrs', label: 'Average Response Time', icon: Zap },
    { value: '€55K', label: 'Average Starting Salary', icon: TrendingUp }
  ];

  const socialProof = [
    { company: 'Goldman Sachs', count: '47 graduates placed' },
    { company: 'McKinsey & Co', count: '32 graduates placed' },
    { company: 'Google', count: '28 graduates placed' },
    { company: 'JP Morgan', count: '41 graduates placed' },
    { company: 'Bain & Company', count: '19 graduates placed' },
    { company: 'Boston Consulting', count: '23 graduates placed' }
  ];

  return (
    <>
      <Head>
        <title>JobPingAI – AI-Powered Career Discovery for Elite Graduates</title>
        <meta name="description" content="Join 10,000+ graduates finding their dream careers with precision AI matching. From Goldman Sachs to Google - your next opportunity is one click away." />
        <meta property="og:title" content="JobPingAI – AI-Powered Career Discovery for Elite Graduates" />
        <meta property="og:description" content="Join 10,000+ graduates finding their dream careers with precision AI matching. From Goldman Sachs to Google - your next opportunity is one click away." />
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
        {/* Enhanced cursor follower with magnetic effect */}
        <motion.div 
          className="fixed w-4 h-4 pointer-events-none z-50 mix-blend-difference rounded-full"
          style={{
            left: mousePosition.x - 8,
            top: mousePosition.y - 8,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="w-full h-full bg-white rounded-full opacity-80" />
        </motion.div>

        {/* Enhanced Navigation with glass morphism */}
        <motion.nav 
          className={`fixed w-full top-0 z-40 transition-all duration-500 ${
            scrolled 
              ? 'py-4 backdrop-blur-xl bg-black/20 border-b border-white/10' 
              : 'py-8 bg-transparent'
          }`}
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.8, 0.25, 1] }}
        >
          <div className="px-6 md:px-12 flex justify-between items-center">
            <motion.div 
              className="flex items-center gap-3 relative cursor-pointer group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative w-8 h-8">
                <GraduationCap className="w-8 h-8 text-white z-10 relative group-hover:rotate-12 transition-transform duration-300" strokeWidth={1.5} />
                <motion.div
                  className="absolute w-full h-full rounded-full bg-white/20 z-0 top-0 left-0"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">JobPingAI</span>
            </motion.div>
            <MagneticButton
              variant="secondary"
              onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
              className="nav-button group"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
            </MagneticButton>
          </div>
        </motion.nav>

        {/* Hero Section with enhanced visual hierarchy */}
        <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative pt-20">
          {/* Enhanced background effects */}
          <motion.div
            style={{ y: gradientY, opacity, scale: springScale }}
            className="absolute inset-0 -z-10"
          >
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-white/[0.02] rounded-full blur-[120px]" />
            <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-purple-500/[0.03] rounded-full blur-[100px]" />
            <div className="absolute bottom-1/3 right-1/3 w-[800px] h-[800px] bg-blue-500/[0.02] rounded-full blur-[100px]" />
          </motion.div>

          {/* Enhanced hero content */}
          <motion.div 
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.25, 0.8, 0.25, 1] }}
            className="max-w-5xl mx-auto"
          >
            {/* Trust badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-8 text-sm"
            >
              <div className="flex -space-x-1">
                {[1,2,3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-black" />
                ))}
              </div>
              <span className="text-white/80">Trusted by 10,000+ graduates</span>
            </motion.div>

            <h1 className="text-[clamp(3rem,8vw,7rem)] font-bold hero-title tracking-tight mb-6 leading-[0.9]">
              Your Next Career Move
              <br />
              <span className="text-gradient">Powered by AI</span>
            </h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-white/70 text-xl md:text-2xl font-light mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Stop scrolling through endless job boards. Our AI analyzes thousands of opportunities daily and delivers only the roles that match your ambitions, skills, and career goals.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <MagneticButton
                onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
                className="cta-primary group px-8 py-4 text-lg font-semibold"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </MagneticButton>
              <div className="flex items-center gap-3 text-white/60 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>7-day free trial • No credit card required</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                  className="text-center group"
                >
                  <div className="glass-card p-4 rounded-2xl group-hover:scale-105 transition-transform duration-300">
                    <div className="flex justify-center mb-2">
                      <IconComponent className="w-5 h-5 text-white/60" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-white/60 text-sm">{stat.label}</div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Enhanced floating elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-1 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-${20 + i * 5}`}
                style={{
                  top: `${20 + i * 10}%`,
                  left: `${10 + i * 12}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  x: [0, 10, 0],
                  opacity: [0.2, 0.6, 0.2],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5,
                }}
              />
            ))}
          </div>
        </section>

        {/* Enhanced Features Grid */}
        <section className="py-32 px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto text-center mb-20"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Why JobPingAI Works
            </h2>
            <p className="text-white/60 text-xl font-light max-w-3xl mx-auto leading-relaxed">
              Three core advantages that make us the #1 choice for ambitious graduates worldwide
            </p>
          </motion.div>

          <div className="space-y-8 max-w-4xl mx-auto">
            {features.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <motion.article 
                  key={item.title} 
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ 
                    duration: 0.6,
                    delay: index * 0.15,
                    ease: [0.25, 0.8, 0.25, 1]
                  }}
                  whileHover={{ 
                    y: -8,
                    scale: 1.02,
                    transition: { duration: 0.3 }
                  }}
                  className="feature-card group p-10 relative overflow-hidden"
                >
                  {/* Enhanced gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl glass-card group-hover:scale-110 transition-transform duration-300">
                          <IconComponent className="w-8 h-8 text-white" strokeWidth={1.5} />
                        </div>
                        <div>
                          <h3 className="text-3xl font-bold text-white mb-2">
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-3">
                            <span className="text-sm uppercase tracking-widest text-white/50 bg-white/5 px-3 py-1 rounded-full border border-white/10 font-semibold">
                              {item.badge} {item.tier}
                            </span>
                            <span className="text-sm text-white/70 font-medium">{item.metrics}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-white/70 text-lg leading-relaxed font-light">
                      {item.description}
                    </p>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-20 px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-6xl mx-auto text-center"
          >
            <h3 className="text-2xl font-semibold text-white mb-12">
              Graduates are getting hired at top companies
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {socialProof.map((item, index) => (
                <motion.div
                  key={item.company}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="glass-card p-6 text-center hover:scale-105 transition-transform duration-300"
                >
                  <div className="text-lg font-semibold text-white mb-1">{item.company}</div>
                  <div className="text-white/60 text-sm">{item.count}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Enhanced Pricing Section */}
        <PricingSelector onSelect={(plan) => console.log('Selected plan:', plan)} />

        {/* Enhanced Signup Section */}
        <section id="signup" className="py-32 px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <div className="signup-panel p-12 relative">
              <div className="text-center mb-10">
                <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                  Ready to Launch
                  <br />
                  <span className="text-gradient">Your Career?</span>
                </h2>
                <p className="text-white/70 text-xl leading-relaxed max-w-2xl mx-auto">
                  Join the smartest graduates who've already discovered their dream roles through AI-powered precision matching.
                </p>
              </div>
              
              {/* Enhanced Loading Skeleton */}
              <AnimatePresence>
                {!iframeLoaded && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-12 z-10"
                  >
                    {/* Form skeleton with better animation */}
                    <div className="space-y-6">
                      <div className="form-skeleton h-10 w-64 rounded-lg mx-auto mb-8" />
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="space-y-3">
                          <div className="form-skeleton h-5 w-32 rounded" />
                          <div className="form-skeleton h-12 w-full rounded-lg" />
                        </div>
                      ))}
                      <div className="form-skeleton h-14 w-full rounded-full mt-10" />
                    </div>
                    <p className="text-center text-white/30 text-sm mt-8 animate-pulse">
                      Personalizing your experience...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Enhanced iframe */}
              <iframe
                src="https://tally.so/r/mJEqx4?alignLeft=1&transparentBackground=1&hideTitle=1"
                className="w-full h-[700px] rounded-2xl border border-white/10 transition-all duration-500"
                loading="lazy"
                onLoad={() => setIframeLoaded(true)}
                style={{ 
                  opacity: iframeLoaded ? 1 : 0,
                  transform: iframeLoaded ? 'scale(1)' : 'scale(0.98)'
                }}
              />
            </div>