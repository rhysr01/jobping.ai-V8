'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';
import Head from 'next/head';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { GraduationCap, ArrowRight, Users, CheckCircle2, Loader2, Menu, X, Accessibility, Mail, Zap, Target } from 'lucide-react';
import PricingSelector from './priceselector';
import MagneticButton from './components/MagneticButton';

export default function Home() {
  // State
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<'hero'|'features'|'pricing'|'signup'>('hero');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [showPostSignup, setShowPostSignup] = useState(false);
  const [signupStep, setSignupStep] = useState(1);
  
  // User context
  const [userContext, setUserContext] = useState<'student'|'graduate'|'career-switcher'>('student');
  const [highContrast, setHighContrast] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Refs
  const heroRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const pricingRef = useRef<HTMLElement>(null);
  const signupRef = useRef<HTMLElement>(null);

  // Scroll transforms
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 1000], [0, -200]);

  // Analytics tracking
  const trackEvent = useCallback((event: string, properties?: Record<string, unknown>) => {
    if (typeof window !== 'undefined') {
      if ((window as unknown as { gtag?: (command: string, event: string, properties?: Record<string, unknown>) => void }).gtag) {
        (window as unknown as { gtag?: (command: string, event: string, properties?: Record<string, unknown>) => void }).gtag?.('event', event, properties);
      }
      console.log('Track:', event, properties);
    }
  }, []);

  // Smart Content Personalization
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const context = urlParams.get('context') as 'student'|'graduate'|'career-switcher';
    const savedContext = localStorage.getItem('userContext') as 'student'|'graduate'|'career-switcher';
    
    if (context) {
      setUserContext(context);
      localStorage.setItem('userContext', context);
    } else if (savedContext) {
      setUserContext(savedContext);
    }
    
    trackEvent('page_view', { page: 'landing', user_context: userContext });
  }, [userContext, trackEvent]);

  // Personalized messaging
  const heroMessages = {
    student: {
      title: "Stop scrolling job boards",
      subtitle: "AI-powered job matches delivered to your inbox",
      description: "Built by a student, for students. Get matched with internships and graduate roles that actually fit your profile."
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

  // Post-signup steps
  const postSignupSteps = [
    {
      step: 1,
      title: "Profile Analysis",
      description: "AI is analyzing your preferences and career goals...",
      icon: Target,
      duration: 2000
    },
    {
      step: 2,
      title: "First Matches",
      description: "Generating personalized job matches for you...",
      icon: Zap,
      duration: 3000
    },
    {
      step: 3,
      title: "Email Confirmation",
      description: "Check your inbox for your first job matches!",
      icon: Mail,
      duration: 1000
    }
  ];

  // Features - simplified and focused
  const features = [
    {
      title: "AI-Powered Matching",
      description: "Our AI analyzes thousands of job postings to find the perfect matches for your profile, skills, and preferences.",
      icon: Zap,
      color: "from-gray-100/10 to-gray-200/10"
    },
    {
      title: "Daily Email Delivery",
      description: "Get fresh job opportunities delivered to your inbox every morning. No more endless scrolling through job boards.",
      icon: Mail,
      color: "from-gray-100/10 to-gray-200/10"
    },
    {
      title: "Student-Focused",
      description: "Built by students, for students. We understand the challenges of finding internships and graduate roles.",
      icon: Users,
      color: "from-gray-100/10 to-gray-200/10"
    }
  ];

  // Handle form submission
  const handleFormSubmit = () => {
    setShowPostSignup(true);
    setSignupStep(1);
    
    // Simulate post-signup flow
    postSignupSteps.forEach((step, index) => {
      setTimeout(() => {
        setSignupStep(step.step);
        if (step.step === 3) {
          setTimeout(() => {
            setShowPostSignup(false);
          }, 2000);
        }
      }, index * step.duration);
    });
  };

  // Simple edit preferences functionality
  const handleEditPreferences = () => {
    // Scroll to signup section and show a message
    document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' });
    // You could also add a state to show a message like "You can edit your preferences by filling out the form again"
  };

  // Enhanced CTA handler with post-signup flow
  const handleCTAClick = (location: string = 'hero') => {
    setIsSubmitting(true);
    trackEvent('cta_click', { location, user_context: userContext });
    
    setTimeout(() => {
      setIsSubmitting(false);
      document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' });
    }, 1000);
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
        <title>JobPingAI – AI-Powered Job Matching</title>
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
        className="min-h-screen relative text-white bg-black" 
        id="main-content"
        style={contrastStyles}
      >
        {/* Navigation */}
        <motion.nav
          className={`sticky top-0 z-50 px-6 md:px-12 backdrop-blur-xl bg-black/80 border-b border-gray-800 shadow-lg flex justify-between items-center transition-all ${
            scrolled ? 'py-4' : 'py-6'
          }`}
          initial={{ y:-100 }} animate={{ y:0 }} transition={{ duration:0.8 }}
          role="navigation"
        >
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8"/>
            <span className="text-2xl font-bold tracking-tight">JobPingAI</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {['hero','features','pricing','signup'].map(id => (
              <a
                key={id}
                href={`#${id}`}
                className={`uppercase text-sm font-medium hover:text-white/90 transition-colors focus-visible:outline-white focus-visible:outline-2 focus-visible:outline-offset-2 rounded tracking-wide ${
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
            className="px-6 py-2 bg-white text-black rounded-full shadow-lg hover:shadow-2xl transition-shadow focus-visible:outline-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium tracking-wide"
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
              className="md:hidden bg-gray-900 border-b border-gray-800 overflow-hidden"
            >
              <div className="px-6 py-4 space-y-4">
                {['hero','features','pricing','signup'].map(id => (
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

        {/* Hero Section - Clean and focused */}
        <section id="hero" ref={heroRef} className="relative py-40 px-6 text-center overflow-hidden" role="region" aria-labelledby="hero-heading">
          {/* Subtle gradient background */}
          <motion.div className="absolute inset-0 bg-gradient-to-tr from-gray-900 via-black to-gray-900 opacity-50" style={{ y: parallaxY }} />

          <motion.div
            className="relative max-w-4xl mx-auto"
            initial={{ opacity:0, y:40 }} 
            animate={{ opacity:1, y:0 }} 
            transition={{ duration:1.2 }}
          >
            <h1 id="hero-heading" className="text-[clamp(3rem,8vw,5rem)] font-extrabold mb-8 text-white leading-tight tracking-tight">
              {heroMessages[userContext].title}
            </h1>
            <h2 className="text-2xl font-light text-gray-300 mb-8">
              {heroMessages[userContext].subtitle}
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-16 leading-relaxed">
              {heroMessages[userContext].description}
            </p>
            <MagneticButton 
              onClick={() => handleCTAClick('hero')}
              disabled={isSubmitting}
              className="px-12 py-5 rounded-full bg-white text-black shadow-xl hover:shadow-2xl transition-shadow focus-visible:outline-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
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

        {/* Features Section - Clean and simple */}
        <section id="features" ref={featuresRef} className="py-32 px-6 bg-gray-950" role="region" aria-labelledby="features-heading">
          <motion.h2 id="features-heading" className="max-w-4xl mx-auto text-center text-4xl md:text-5xl font-bold mb-20 text-white tracking-tight" 
            initial={{ opacity:0, y:30 }} 
            animate={{ opacity:1, y:0 }} 
            transition={{ duration:0.8 }}
          >
            How it works
          </motion.h2>
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  className="relative p-8 bg-gray-900 rounded-2xl border border-gray-800 hover:border-gray-700 transition-colors"
                  initial={{ opacity:0, y:40 }} 
                  animate={{ opacity:1, y:0 }} 
                  transition={{ duration:0.6, delay:i * 0.2 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-gray-800 rounded-full mb-6">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" ref={pricingRef} className="py-32 px-6" role="region" aria-labelledby="pricing-heading">
          <motion.h2 id="pricing-heading" className="sr-only">Pricing Plans</motion.h2>
          <PricingSelector onSelect={(plan) => {
            trackEvent('pricing_select', { plan });
          }} />
        </section>

        {/* Signup Section */}
        <section id="signup" ref={signupRef} className="py-32 px-6 bg-gray-950 text-center" role="region" aria-labelledby="signup-heading">
          <motion.h2 id="signup-heading" className="text-4xl md:text-5xl font-bold mb-8 text-white tracking-tight" 
            initial={{ opacity:0, y:30 }} 
            animate={{ opacity:1, y:0 }} 
            transition={{ duration:0.8 }}
          >
            Ready to get started?
          </motion.h2>
          <motion.p className="text-gray-400 mb-16 max-w-2xl mx-auto text-lg" 
            initial={{ opacity:0, y:30 }} 
            animate={{ opacity:1, y:0 }} 
            transition={{ duration:0.8, delay:0.1 }}
          >
            Join thousands of students who've found their dream roles through AI matching.
          </motion.p>

          {/* Post-signup flow overlay */}
          <AnimatePresence>
            {showPostSignup && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-gray-900 rounded-2xl p-8 max-w-md mx-4 text-center border border-gray-800"
                >
                  {postSignupSteps.map((step) => {
                    const Icon = step.icon;
                    return (
                      <motion.div
                        key={step.step}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: signupStep >= step.step ? 1 : 0.3,
                          y: signupStep >= step.step ? 0 : 20
                        }}
                        className={`mb-6 ${signupStep >= step.step ? 'text-white' : 'text-gray-500'}`}
                      >
                        <div className="flex items-center justify-center w-12 h-12 bg-gray-800 rounded-full mx-auto mb-4">
                          <Icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                        <p className="text-gray-400">{step.description}</p>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <iframe
            src="https://tally.so/r/mJEqx4?alignLeft=1&transparentBackground=1&hideTitle=1"
            className="w-full max-w-2xl h-[600px] rounded-2xl border border-gray-800 mx-auto bg-gray-900"
            loading="lazy"
            onLoad={() => {
              setIframeLoaded(true);
              trackEvent('form_loaded');
            }}
            title="Signup Form"
          />
        </section>

      </div>
    </>
  );
}
