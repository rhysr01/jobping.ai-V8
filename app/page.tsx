'use client';
import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import Head from 'next/head';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { GraduationCap, Sparkles, Zap, Target, ArrowRight, Users, CheckCircle2 } from 'lucide-react';
import PricingSelector from './priceselector';
import MagneticButton from './components/MagneticButton';

export default function Home() {
  // State
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<'hero'|'stats'|'features'|'social'|'pricing'|'signup'>('hero');

  // Refs for scrollspy
  const heroRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const socialRef = useRef<HTMLElement>(null);
  const pricingRef = useRef<HTMLElement>(null);
  const signupRef = useRef<HTMLElement>(null);

  // Scroll transforms
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 1000], [0, -200]);

  useEffect(() => {
    // Mouse and scroll listeners
    const handleMouseMove = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY });
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    // Scrollspy
    const sections = [
      { id: 'hero', ref: heroRef },
      { id: 'stats', ref: statsRef },
      { id: 'features', ref: featuresRef },
      { id: 'social', ref: socialRef },
      { id: 'pricing', ref: pricingRef },
      { id: 'signup', ref: signupRef },
    ];
    const onScrollSpy = () => {
      const pos = window.scrollY + window.innerHeight / 3;
      for (const sec of sections) {
        const el = sec.ref.current;
        if (el && el.offsetTop <= pos) {
          setActiveSection(sec.id as 'hero'|'stats'|'features'|'social'|'pricing'|'signup');
        }
      }
    };
    window.addEventListener('scroll', onScrollSpy);
    onScrollSpy();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', onScrollSpy);
    };
  }, []);

  const features = [
    { title: 'AI-Powered Precision', description: 'Our advanced algorithms analyze 50+ data points to match you with opportunities that perfectly align with your career goals, skills, and preferences.', icon: Sparkles, badge: '✨', tier: 'SMART', metrics: '95% match accuracy', color: 'from-purple-400/20 to-pink-400/20' },
    { title: 'Graduate-First Focus', description: 'Exclusively curated opportunities from top companies actively seeking ambitious graduates. No senior roles cluttering your feed.', icon: Target, badge: '🎯', tier: 'TARGETED', metrics: '10K+ graduate roles', color: 'from-blue-400/20 to-cyan-400/20' },
    { title: 'Zero Job Board Fatigue', description: 'Skip the endless scrolling and application black holes. We bring the most relevant opportunities directly to your inbox, pre-screened and ready.', icon: Zap, badge: '⚡', tier: 'EFFICIENT', metrics: '5 hours saved weekly', color: 'from-green-400/20 to-emerald-400/20' },
  ];

  const stats = [
    { value: '10,000+', label: 'Active Graduate Roles', icon: Users },
    { value: '95%', label: 'Match Accuracy', icon: Target },
    { value: '48hrs', label: 'Average Response Time', icon: CheckCircle2 },
  ];

  const socialProof = ['Goldman Sachs','McKinsey & Co','Google','JP Morgan','Bain & Company','Boston Consulting'];

  return (
    <>
      <Head>
        <title>JobPingAI – AI-Powered Career Discovery</title>
      </Head>

      <Script
        src="https://tally.so/widgets/embed.js"
        strategy="lazyOnload"
        onLoad={() => {
          if (typeof window !== 'undefined' && (window as unknown as { Tally?: { loadEmbeds?: () => void } }).Tally) {
            (window as unknown as { Tally?: { loadEmbeds?: () => void } }).Tally?.loadEmbeds?.();
          }
        }}
      />

      <div className="min-h-screen relative text-white">

        {/* Cursor Follower */}
        <motion.div
          className="fixed w-4 h-4 pointer-events-none z-50 mix-blend-difference rounded-full"
          style={{ left: mousePosition.x - 8, top: mousePosition.y - 8 }}
          animate={{ scale: [1,1.2,1], opacity: [0.6,1,0.6] }}
          transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}
        >
          <div className="w-full h-full bg-white rounded-full opacity-80" />
        </motion.div>

        {/* Navigation */}
        <motion.nav
          className={`sticky top-0 z-50 px-6 md:px-12 backdrop-blur-xl bg-black/20 border-b border-gray-700 shadow-md flex justify-between items-center transition-all ${
            scrolled ? 'py-4' : 'py-6'
          }`}
          initial={{ y:-100 }} animate={{ y:0 }} transition={{ duration:0.8 }}
          role="navigation"
        >
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8"/>
            <span className="text-2xl font-bold">JobPingAI</span>
          </div>
          <div className="space-x-6">
            {['hero','stats','features','social','pricing','signup'].map(id => (
              <a
                key={id}
                href={`#${id}`}
                className={`uppercase text-sm font-medium hover:text-white/90 transition-colors ${
                  activeSection===id ? 'text-white' : 'text-white/60'
                }`}
              >
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </a>
            ))}
          </div>
          <MagneticButton
            variant="secondary"
            onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior:'smooth' })}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-2xl transition-shadow focus-visible:outline-white focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Get Started <ArrowRight className="w-4 h-4 ml-2" />
          </MagneticButton>
        </motion.nav>

        {/* Hero Section */}
        <section id="hero" ref={heroRef} className="relative py-32 px-6 text-center overflow-hidden" role="region" aria-labelledby="hero-heading">
          {/* Animated Gradient Background */}
          <motion.div className="absolute inset-0 bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-500 opacity-30" style={{ y: parallaxY }} animate={{ }} transition={{ }} />

          <motion.div
            className="relative max-w-4xl mx-auto"
            initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }} transition={{ duration:1.2 }}
          >
            <h1 id="hero-heading" className="text-[clamp(4rem,10vw,8rem)] font-extrabold mb-4 text-gradient">JOB PING AI</h1>
            {/* Subheadline */}
            <h2 className="text-2xl font-light text-white/80 mb-8">
              Precision AI job matches for top graduates, in seconds.
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
              Stop scrolling endless boards. Let AI deliver roles tailored to your skills and goals.
            </p>
            <MagneticButton className="px-12 py-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-xl hover:shadow-2xl transition-shadow focus-visible:outline-white focus-visible:outline-2 focus-visible:outline-offset-2">
              Start Free Trial
            </MagneticButton>
          </motion.div>
        </section>

        <div className="mx-auto my-16 w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" aria-hidden="true"/>

        {/* Stats Section */}
        <section id="stats" ref={statsRef} className="py-32 bg-gray-950 px-6" role="region" aria-labelledby="stats-heading">
          <motion.h2 id="stats-heading" className="sr-only">Key Statistics</motion.h2>
          <motion.div
            className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-12 text-center"
            initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }} transition={{ duration:1 }}
          >
            {stats.map((s,i) => {
              const Icon = s.icon;
              return (
                <motion.div key={i} className="bg-gray-800 rounded-2xl p-8 shadow-lg" whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 200 }}>
                  <div className="mb-4 inline-flex items-center justify-center bg-gray-700/30 rounded-full p-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold mb-1">{s.value}</div>
                  <div className="text-white/60">{s.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        <div className="mx-auto my-16 w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" aria-hidden="true"/>

        {/* Features Section */}
        <section id="features" ref={featuresRef} className="py-32 px-6" role="region" aria-labelledby="features-heading">
          <motion.h2 id="features-heading" className="max-w-5xl mx-auto text-center text-4xl md:text-6xl font-bold mb-6" initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.8 }}>
            Why JobPingAI Works
          </motion.h2>
          <motion.p className="max-w-5xl mx-auto text-center text-white/60 text-xl mb-16" initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.8, delay:0.1 }}>
            Core advantages that make us #1 for graduates.
          </motion.p>
          <div className="space-y-12 max-w-4xl mx-auto">
            {features.map((f,i) => {
              const Icon = f.icon;
              return (
                <motion.article
                  key={i}
                  className="relative p-10 bg-gray-950 rounded-2xl overflow-hidden"
                  initial={{ opacity:0, y:40 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:i*0.15 }}
                  role="group"
                >
                  <div className="absolute inset-0 bg-gray-950 opacity-50" />
                  <div className="relative flex items-start gap-6 mb-4">
                    <motion.div className="p-4 bg-gray-800/30 rounded-full" animate={{ y: [0, -10, 0] }} transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}>
                      <Icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold">{f.title}</h3>
                  </div>
                  <p className="text-white/70 leading-relaxed">{f.description}</p>
                  <div className="mt-6 inline-flex items-center gap-3 text-sm uppercase font-semibold bg-gray-800/30 px-4 py-2 rounded-full">
                    {f.badge} {f.tier}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

        <div className="mx-auto my-16 w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" aria-hidden="true"/>

        {/* Social Proof Section */}
        <section id="social" ref={socialRef} className="py-32 bg-gray-950 px-6" role="region" aria-labelledby="social-heading">
          <motion.h3 id="social-heading" className="max-w-5xl mx-auto text-center text-2xl font-semibold mb-10" initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.8 }}>
            Graduates hired at top companies
          </motion.h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {socialProof.map((c,i) => (
              <div key={i} className="flex justify-center">
                <div className="bg-gray-800/30 p-6 rounded-full font-medium hover:bg-gray-700/50 hover:scale-105 transition-all duration-300 cursor-pointer">
                  {c}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mx-auto my-16 w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" aria-hidden="true"/>

        {/* Pricing Section */}
        <section id="pricing" ref={pricingRef} className="py-32 px-6" role="region" aria-labelledby="pricing-heading">
          <motion.h2 id="pricing-heading" className="sr-only">Pricing Plans</motion.h2>
          <PricingSelector onSelect={plan => console.log(plan)} />
        </section>

        <div className="mx-auto my-16 w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" aria-hidden="true"/>

        {/* Signup Section */}
        <section id="signup" ref={signupRef} className="py-32 px-6 bg-gray-950 text-center" role="region" aria-labelledby="signup-heading">
          <motion.h2 id="signup-heading" className="text-5xl font-bold mb-6" initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.8 }}>
            Ready to Launch<br/>
            <span className="text-gradient">Your Career?</span>
          </motion.h2>
          <motion.p className="text-white/70 mb-8" initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.8, delay:0.1 }}>
            Join graduates who&apos;ve discovered their dream roles via AI matching.
          </motion.p>
          <MagneticButton className="px-10 py-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-xl hover:shadow-2xl transition-shadow focus-visible:outline-white focus-visible:outline-2 focus-visible:outline-offset-2">
            Get Started
          </MagneticButton>

          <AnimatePresence>
            {!iframeLoaded && (
              <motion.div initial={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.4 }} className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                <span className="text-white/60">Loading form...</span>
              </motion.div>
            )}
          </AnimatePresence>

          <iframe
            src="https://tally.so/r/mJEqx4?alignLeft=1&transparentBackground=1&hideTitle=1"
            className="w-full h-[700px] rounded-2xl border border-gray-700 mt-8"
            loading="lazy"
            onLoad={() => setIframeLoaded(true)}
            title="Signup Form"
          />
        </section>

      </div>

      {/* Global Gradient Text Animation */}
      <style jsx global>{`
        .text-gradient {
          background: linear-gradient(45deg, #a855f7, #ec4899, #f97316);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </>
  );
}
