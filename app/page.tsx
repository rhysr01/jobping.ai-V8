'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';
import Head from 'next/head';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { GraduationCap, Sparkles, Zap, Target, ArrowRight, Users, CheckCircle2, Star, Loader2, ChevronDown, ChevronUp, Menu, X, Accessibility } from 'lucide-react';
import PricingSelector from './priceselector';
import MagneticButton from './components/MagneticButton';

export default function Home() {
  // State
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<'hero'|'stats'|'features'|'social'|'pricing'|'signup'>('hero');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);
  
  // Phase 3: Advanced Features
  const [userContext, setUserContext] = useState<'student'|'graduate'|'career-switcher'>('student');
  const [highContrast, setHighContrast] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Refs for scrollspy and intersection observer
  const heroRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const socialRef = useRef<HTMLElement>(null);
  const pricingRef = useRef<HTMLElement>(null);
  const signupRef = useRef<HTMLElement>(null);

  // Scroll transforms
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 1000], [0, -200]);

  // Analytics tracking
  const trackEvent = useCallback((event: string, properties?: Record<string, unknown>) => {
    if (typeof window !== 'undefined') {
      // Google Analytics
      if ((window as unknown as { gtag?: (command: string, event: string, properties?: Record<string, unknown>) => void }).gtag) {
        (window as unknown as { gtag?: (command: string, event: string, properties?: Record<string, unknown>) => void }).gtag?.('event', event, properties);
      }
      // Custom tracking
      console.log('Track:', event, properties);
    }
  }, []);

  // Smart Content Personalization
  useEffect(() => {
    // Detect user context from URL params, localStorage, or user agent
    const urlParams = new URLSearchParams(window.location.search);
    const context = urlParams.get('context') as 'student'|'graduate'|'career-switcher';
    const savedContext = localStorage.getItem('userContext') as 'student'|'graduate'|'career-switcher';
    
    if (context) {
      setUserContext(context);
      localStorage.setItem('userContext', context);
    } else if (savedContext) {
      setUserContext(savedContext);
    }
    
    // Track page view
    trackEvent('page_view', { page: 'landing', user_context: userContext });
  }, [userContext, trackEvent]);

  // Personalized messaging
  const heroMessages = {
    student: {
      title: "Get ahead of the competition",
      subtitle: "AI-powered job matches for ambitious students",
      description: "Start building your career while you study. Get matched with internships and graduate roles that fit your timeline."
    },
    graduate: {
      title: "Land your first role with precision",
      subtitle: "AI recommendations for recent graduates",
      description: "Skip the job board chaos. Get matched with entry-level roles that match your degree and career goals."
    },
    'career-switcher': {
      title: "Transition smoothly with targeted opportunities",
      subtitle: "AI matching for career changers",
      description: "Make your career pivot with confidence. Find roles that value your transferable skills and support your transition."
    }
  };

  // Touch gestures for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // Navigate to next section
      const sections = ['hero', 'stats', 'features', 'social', 'pricing', 'signup'];
      const currentIndex = sections.indexOf(activeSection);
      const nextSection = sections[Math.min(currentIndex + 1, sections.length - 1)];
      document.getElementById(nextSection)?.scrollIntoView({ behavior: 'smooth' });
    } else if (isRightSwipe) {
      // Navigate to previous section
      const sections = ['hero', 'stats', 'features', 'social', 'pricing', 'signup'];
      const currentIndex = sections.indexOf(activeSection);
      const prevSection = sections[Math.max(currentIndex - 1, 0)];
      document.getElementById(prevSection)?.scrollIntoView({ behavior: 'smooth' });
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

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

    // Intersection Observer for animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    );

    // Observe all sections
    sections.forEach(({ ref }) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', onScrollSpy);
      observer.disconnect();
    };
  }, []);

  const features = [
    { 
      title: 'AI-Powered Precision', 
      description: 'Our advanced algorithms analyze 50+ data points to match you with opportunities that perfectly align with your career goals, skills, and preferences.',
      detailedDescription: 'We use machine learning to analyze your resume, skills, location preferences, salary expectations, and career goals. Our AI then scans thousands of job postings daily, scoring each one based on 50+ factors including company culture, growth opportunities, and your specific requirements.',
      icon: Sparkles, 
      badge: '✨', 
      tier: 'SMART', 
      metrics: '95% match accuracy', 
      color: 'from-purple-400/20 to-pink-400/20' 
    },
    { 
      title: 'Graduate-First Focus', 
      description: 'Exclusively curated opportunities from top companies actively seeking ambitious graduates. No senior roles cluttering your feed.',
      detailedDescription: 'Unlike generic job boards, we filter out senior positions and focus exclusively on entry-level roles, internships, and graduate programs. Our database includes 10,000+ companies actively hiring new graduates, ensuring every opportunity is relevant to your experience level.',
      icon: Target, 
      badge: '🎯', 
      tier: 'TARGETED', 
      metrics: '10K+ graduate roles', 
      color: 'from-blue-400/20 to-cyan-400/20' 
    },
    { 
      title: 'Zero Job Board Fatigue', 
      description: 'Skip the endless scrolling and application black holes. We bring the most relevant opportunities directly to your inbox, pre-screened and ready.',
      detailedDescription: 'No more spending hours scrolling through irrelevant job postings. Our AI pre-screens every opportunity, verifying the company is actively hiring, the role is still open, and the requirements match your profile. You receive only the most promising opportunities, saving 5+ hours weekly.',
      icon: Zap, 
      badge: '⚡', 
      tier: 'EFFICIENT', 
      metrics: '5 hours saved weekly', 
      color: 'from-green-400/20 to-emerald-400/20' 
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Active Graduate Roles', icon: Users },
    { value: '95%', label: 'Match Accuracy', icon: Target },
    { value: '48hrs', label: 'Average Response Time', icon: CheckCircle2 },
  ];

  const socialProof = ['Goldman Sachs','McKinsey & Co','Google','JP Morgan','Bain & Company','Boston Consulting'];

  // Testimonials with faces
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer",
      company: "Google",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      quote: "JobPingAI found me my dream role in 2 weeks. The AI matching was spot-on.",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      role: "Data Analyst",
      company: "McKinsey",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      quote: "From 50+ applications to 3 perfect matches. This platform is a game-changer.",
      rating: 5
    },
    {
      name: "Priya Patel",
      role: "Product Manager",
      company: "JP Morgan",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      quote: "The personalized approach helped me transition into tech seamlessly.",
      rating: 5
    }
  ];

  // Enhanced CTA handler with loading state and analytics
  const handleCTAClick = (location: string = 'hero') => {
    setIsSubmitting(true);
    trackEvent('cta_click', { location, user_context: userContext });
    
    // Simulate processing time
    setTimeout(() => {
      setIsSubmitting(false);
      document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' });
    }, 1500);
  };

  // High contrast styles
  const contrastStyles = highContrast ? {
    backgroundColor: 'white',
    color: 'black',
    borderColor: 'black'
  } : {};

  return (
    <>
      <Head>
        <title>JobPingAI – AI-Powered Career Discovery</title>
      </Head>

      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'GA_MEASUREMENT_ID');
        `}
      </Script>

      <Script
        src="https://tally.so/widgets/embed.js"
        strategy="lazyOnload"
        onLoad={() => {
          if (typeof window !== 'undefined' && (window as unknown as { Tally?: { loadEmbeds?: () => void } }).Tally) {
            (window as unknown as { Tally?: { loadEmbeds?: () => void } }).Tally?.loadEmbeds?.();
          }
        }}
      />

      {/* Skip to content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-gray-700 focus:text-white focus:px-4 focus:py-2 focus:rounded focus:z-50"
      >
        Skip to content
      </a>

      {/* High Contrast Toggle */}
      <button
        onClick={() => setHighContrast(!highContrast)}
        className="fixed top-4 right-4 z-50 p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700 transition-colors focus-visible:outline-white focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label="Toggle high contrast mode"
      >
        <Accessibility className="w-5 h-5" />
      </button>

      <div 
        className="min-h-screen relative text-white bg-gradient-to-b from-black to-[#111]" 
        id="main-content"
        style={contrastStyles}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >

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
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6">
            {['hero','stats','features','social','pricing','signup'].map(id => (
              <a
                key={id}
                href={`#${id}`}
                className={`uppercase text-sm font-medium hover:text-white/90 transition-colors focus-visible:outline-white focus-visible:outline-2 focus-visible:outline-offset-2 rounded ${
                  activeSection===id ? 'text-white' : 'text-white/60'
                }`}
                onClick={() => trackEvent('nav_click', { section: id })}
              >
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </a>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-800/50 rounded-full transition-colors focus-visible:outline-white focus-visible:outline-2 focus-visible:outline-offset-2"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          <MagneticButton
            variant="secondary"
            onClick={() => handleCTAClick('nav')}
            disabled={isSubmitting}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-2xl transition-shadow focus-visible:outline-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </div>
            ) : (
              <>
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </MagneticButton>
        </motion.nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-gray-900 border-b border-gray-700 overflow-hidden"
            >
              <div className="px-6 py-4 space-y-4">
                {['hero','stats','features','social','pricing','signup'].map(id => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className={`block uppercase text-sm font-medium py-2 hover:text-white/90 transition-colors focus-visible:outline-white focus-visible:outline-2 focus-visible:outline-offset-2 rounded ${
                      activeSection===id ? 'text-white' : 'text-white/60'
                    }`}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      trackEvent('mobile_nav_click', { section: id });
                    }}
                  >
                    {id.charAt(0).toUpperCase() + id.slice(1)}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Section - Personalized */}
        <section id="hero" ref={heroRef} className="relative py-32 px-6 text-center overflow-hidden" role="region" aria-labelledby="hero-heading">
          {/* Animated Gradient Background */}
          <motion.div className="absolute inset-0 bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-500 opacity-30" style={{ y: parallaxY }} />

          <motion.div
            className="relative max-w-4xl mx-auto"
            initial={{ opacity:0, y:40 }} 
            animate={visibleSections.has('hero') ? { opacity:1, y:0 } : {}} 
            transition={{ duration:1.2 }}
          >
            <h1 id="hero-heading" className="text-[clamp(3rem,8vw,5rem)] font-extrabold mb-4 text-white">
              {heroMessages[userContext].title}
            </h1>
            {/* Subheadline */}
            <h2 className="text-2xl font-light text-gray-200 mb-8">
              {heroMessages[userContext].subtitle}
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
              {heroMessages[userContext].description}
            </p>
            <MagneticButton 
              onClick={() => handleCTAClick('hero')}
              disabled={isSubmitting}
              className="px-12 py-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-xl hover:shadow-2xl transition-shadow focus-visible:outline-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </div>
              ) : (
                "Start Free Trial"
              )}
            </MagneticButton>
          </motion.div>
        </section>

        <div className="mx-auto my-16 w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" aria-hidden="true"/>

        {/* Stats Section - Simplified Layout */}
        <section id="stats" ref={statsRef} className="py-32 bg-gray-950 px-6" role="region" aria-labelledby="stats-heading">
          <motion.h2 id="stats-heading" className="sr-only">Key Statistics</motion.h2>
          <motion.div
            className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center"
            initial={{ opacity:0, y:40 }} 
            animate={visibleSections.has('stats') ? { opacity:1, y:0 } : {}} 
            transition={{ duration:1 }}
          >
            {stats.map((s,i) => {
              const Icon = s.icon;
              return (
                <motion.div 
                  key={i} 
                  className="bg-gray-900 rounded-2xl p-8 mx-auto max-w-sm shadow-lg" 
                  whileHover={{ y: -4 }} 
                  transition={{ type: 'spring', stiffness: 200, duration:0.6, delay:i*0.1 }}
                  initial={{ opacity:0, y:20 }}
                  animate={visibleSections.has('stats') ? { opacity:1, y:0 } : {}}
                  onClick={() => trackEvent('stat_click', { stat: s.label })}
                >
                  <Icon className="w-6 h-6 text-white mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">{s.value}</div>
                  <div className="text-gray-500">{s.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        <div className="mx-auto my-16 w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" aria-hidden="true"/>

        {/* Features Section - Progressive Disclosure */}
        <section id="features" ref={featuresRef} className="py-32 px-6" role="region" aria-labelledby="features-heading">
          <motion.h2 id="features-heading" className="max-w-5xl mx-auto text-center text-4xl md:text-6xl font-bold mb-6" 
            initial={{ opacity:0, y:30 }} 
            animate={visibleSections.has('features') ? { opacity:1, y:0 } : {}} 
            viewport={{ once:true }} 
            transition={{ duration:0.8 }}
          >
            Why JobPingAI Works
          </motion.h2>
          <motion.p className="max-w-5xl mx-auto text-center text-gray-500 text-xl mb-16" 
            initial={{ opacity:0, y:30 }} 
            animate={visibleSections.has('features') ? { opacity:1, y:0 } : {}} 
            viewport={{ once:true }} 
            transition={{ duration:0.8, delay:0.1 }}
          >
            Core advantages that make us #1 for graduates.
          </motion.p>
          <div className="space-y-12 max-w-4xl mx-auto">
            {features.map((f,i) => {
              const Icon = f.icon;
              return (
                <motion.article
                  key={i}
                  className="relative p-10 bg-gray-950 rounded-2xl overflow-hidden border border-gray-800"
                  initial={{ opacity:0, y:40 }} 
                  animate={visibleSections.has('features') ? { opacity:1, y:0 } : {}} 
                  transition={{ duration:0.6, delay:i*0.15 }}
                  role="group"
                >
                  <div className="flex items-start gap-4">
                    <motion.div 
                      className="bg-gray-800/30 p-3 rounded-full" 
                      animate={{ y: [0, -6, 0] }} 
                      transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-semibold text-white">{f.title}</h3>
                        <button
                          onClick={() => {
                            setExpandedFeature(expandedFeature === i ? null : i);
                            trackEvent('feature_expand', { feature: f.title, expanded: expandedFeature !== i });
                          }}
                          className="p-2 hover:bg-gray-800/50 rounded-full transition-colors focus-visible:outline-white focus-visible:outline-2 focus-visible:outline-offset-2"
                          aria-expanded={expandedFeature === i}
                          aria-label={expandedFeature === i ? 'Collapse details' : 'Expand details'}
                        >
                          {expandedFeature === i ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      <p className="text-gray-500 leading-relaxed">{f.description}</p>
                      
                      {/* Progressive Disclosure */}
                      <AnimatePresence>
                        {expandedFeature === i && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 text-gray-400 leading-relaxed overflow-hidden"
                          >
                            {f.detailedDescription}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      <div className="mt-6 inline-flex items-center gap-3 text-sm uppercase font-semibold bg-gray-800/30 px-4 py-2 rounded-full">
                        {f.badge} {f.tier}
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

        <div className="mx-auto my-16 w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" aria-hidden="true"/>

        {/* Social Proof Section - Enhanced */}
        <section id="social" ref={socialRef} className="py-32 bg-gray-950 px-6" role="region" aria-labelledby="social-heading">
          <motion.h3 id="social-heading" className="max-w-5xl mx-auto text-center text-2xl font-semibold mb-10 text-white" 
            initial={{ opacity:0, y:30 }} 
            animate={visibleSections.has('social') ? { opacity:1, y:0 } : {}} 
            viewport={{ once:true }} 
            transition={{ duration:0.8 }}
          >
            Graduates hired at top companies
          </motion.h3>
          
          {/* Company Logos - Enhanced */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
            {socialProof.map((c,i) => (
              <div key={i} className="flex justify-center">
                <div 
                  className="bg-gray-800/20 px-6 py-3 rounded-full text-gray-200 hover:bg-gray-700/30 hover:scale-105 transition-all duration-300 cursor-pointer font-medium"
                  onClick={() => trackEvent('company_click', { company: c })}
                >
                  {c}
                </div>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <motion.div 
            className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8"
            initial={{ opacity:0, y:30 }}
            animate={visibleSections.has('social') ? { opacity:1, y:0 } : {}}
            transition={{ duration:0.8, delay:0.2 }}
          >
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                className="bg-gray-900 rounded-2xl p-6 hover:bg-gray-800 transition-colors"
                initial={{ opacity:0, y:20 }}
                animate={visibleSections.has('social') ? { opacity:1, y:0 } : {}}
                transition={{ duration:0.6, delay:0.3 + i * 0.1 }}
                whileHover={{ y: -4 }}
                onClick={() => trackEvent('testimonial_click', { name: testimonial.name, company: testimonial.company })}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <img 
                      src={testimonial.avatar} 
                      className="w-12 h-12 rounded-full object-cover" 
                      alt={testimonial.name}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-20" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-gray-500 text-sm">{testimonial.role} at {testimonial.company}</div>
                  </div>
                </div>
                <p className="text-gray-300 italic mb-4">&quot;{testimonial.quote}&quot;</p>
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <div className="mx-auto my-16 w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" aria-hidden="true"/>

        {/* Pricing Section */}
        <section id="pricing" ref={pricingRef} className="py-32 px-6" role="region" aria-labelledby="pricing-heading">
          <motion.h2 id="pricing-heading" className="sr-only">Pricing Plans</motion.h2>
          <PricingSelector onSelect={(plan) => {
            trackEvent('pricing_select', { plan });
            console.log(plan);
          }} />
        </section>

        <div className="mx-auto my-16 w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" aria-hidden="true"/>

        {/* Signup Section */}
        <section id="signup" ref={signupRef} className="py-32 px-6 bg-gray-950 text-center" role="region" aria-labelledby="signup-heading">
          <motion.h2 id="signup-heading" className="text-5xl font-bold mb-6 text-white" 
            initial={{ opacity:0, y:30 }} 
            animate={visibleSections.has('signup') ? { opacity:1, y:0 } : {}} 
            viewport={{ once:true }} 
            transition={{ duration:0.8 }}
          >
            Ready to Launch<br/>
            <span className="text-gradient">Your Career?</span>
          </motion.h2>
          <motion.p className="text-gray-500 mb-8" 
            initial={{ opacity:0, y:30 }} 
            animate={visibleSections.has('signup') ? { opacity:1, y:0 } : {}} 
            viewport={{ once:true }} 
            transition={{ duration:0.8, delay:0.1 }}
          >
            Join graduates who&apos;ve discovered their dream roles via AI matching.
          </motion.p>
          <MagneticButton 
            onClick={() => handleCTAClick('signup')}
            disabled={isSubmitting}
            className="px-10 py-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-xl hover:shadow-2xl transition-shadow focus-visible:outline-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </div>
            ) : (
              "Get Started"
            )}
          </MagneticButton>

          <AnimatePresence>
            {!iframeLoaded && (
              <motion.div 
                initial={{ opacity:1 }} 
                exit={{ opacity:0 }} 
                transition={{ duration:0.4 }} 
                className="absolute inset-0 flex flex-col items-center justify-center space-y-2"
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                <span className="text-white/60">Loading form...</span>
              </motion.div>
            )}
          </AnimatePresence>

          <iframe
            src="https://tally.so/r/mJEqx4?alignLeft=1&transparentBackground=1&hideTitle=1"
            className="w-full h-[700px] rounded-2xl border border-gray-700 mt-8"
            loading="lazy"
            onLoad={() => {
              setIframeLoaded(true);
              trackEvent('form_loaded');
            }}
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
