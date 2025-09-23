'use client';

import { useState } from 'react';
import { ArrowRight, Zap, Target, Mail, Globe, Shield, Star, MapPin, Check, Menu, X } from 'lucide-react';
import SignupForm from './components/SignupForm';

export default function Home() {
  const [billing, setBilling] = useState('monthly');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-white antialiased" style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      
      {/* HEADER - Clean and prominent */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-lg border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Left nav */}
            <nav className="hidden md:flex items-center gap-8 flex-1">
              <button onClick={() => scrollToSection('features')} className="text-gray-500 hover:text-white transition-colors text-sm font-light tracking-wide">
                Features
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-gray-500 hover:text-white transition-colors text-sm font-light tracking-wide">
                Pricing
              </button>
            </nav>
            
            {/* Centered logo - MUCH BIGGER, no icon */}
            <div className="flex items-center">
              <span className="font-light text-4xl tracking-tight">JobPing</span>
            </div>
            
            {/* Right nav */}
            <nav className="hidden md:flex items-center gap-8 flex-1 justify-end">
              <button onClick={() => scrollToSection('signup')} className="text-gray-500 hover:text-white transition-colors text-sm font-light tracking-wide">
                Sign in
              </button>
              <button onClick={() => scrollToSection('signup')} className="px-6 py-2.5 bg-[#5B21B6] hover:bg-[#4C1D95] text-white rounded-full font-light text-sm transition-all">
                Get Started
              </button>
            </nav>

            {/* Mobile menu */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-white ml-4">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/[0.06]">
            <nav className="px-6 py-6 space-y-4">
              <button onClick={() => scrollToSection('features')} className="block text-gray-400 hover:text-white transition-colors text-sm font-light">
                Features
              </button>
              <button onClick={() => scrollToSection('pricing')} className="block text-gray-400 hover:text-white transition-colors text-sm font-light">
                Pricing
              </button>
              <div className="h-px bg-white/10 my-4" />
              <button onClick={() => scrollToSection('signup')} className="block text-gray-400 hover:text-white transition-colors text-sm font-light mb-4">
                Sign in
              </button>
              <button onClick={() => scrollToSection('signup')} className="w-full px-5 py-2.5 bg-[#5B21B6] hover:bg-[#4C1D95] text-white rounded-full font-light text-sm transition-all">
                Get Started
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#5B21B6]/10 via-black to-black" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B21B6]/10 border border-[#5B21B6]/20 rounded-full mb-12">
            <div className="w-1.5 h-1.5 bg-[#9333EA] rounded-full animate-pulse" />
            <span className="text-xs font-light text-[#9333EA] uppercase tracking-widest">AI-Powered Matching</span>
          </div>
          
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-extralight tracking-tight mb-8 leading-[0.85]">
            <span className="block text-white">
              Stop searching
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#9333EA] to-[#5B21B6] mt-2">
              Start landing
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-16 max-w-3xl mx-auto font-light leading-relaxed">
            Personalized graduate job matches from 50+ European sources, delivered to your inbox twice weekly
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => scrollToSection('signup')} className="px-10 py-4 bg-[#5B21B6] hover:bg-[#4C1D95] text-white rounded-full font-light text-lg transition-all">
              Start Free Today
            </button>
            <button onClick={() => scrollToSection('product')} className="px-10 py-4 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.1] text-white rounded-full font-light text-lg transition-all">
              See How It Works
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-32 bg-black">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extralight tracking-tight mb-6">
              Everything you need
            </h2>
            <p className="text-lg text-gray-500 font-light">
              Nothing you don't
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: 'AI Matching', desc: 'Smart algorithms find your perfect roles' },
              { icon: Target, title: 'EU Focused', desc: 'Exclusively for European graduates' },
              { icon: Mail, title: 'Inbox Delivery', desc: 'Fresh opportunities, twice weekly' },
              { icon: Globe, title: '50+ Sources', desc: 'All major European job platforms' },
              { icon: Shield, title: 'Privacy First', desc: 'GDPR compliant, data encrypted' },
              { icon: Star, title: 'Premium Quality', desc: 'Hand-picked, verified opportunities' }
            ].map((item, i) => (
              <div key={i} className="group p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.03] hover:border-[#5B21B6]/20 transition-all duration-300">
                <item.icon className="w-8 h-8 text-[#9333EA] mb-6" strokeWidth={1.5} />
                <h3 className="text-xl font-light text-white mb-3">{item.title}</h3>
                <p className="text-gray-500 font-light leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EMAIL PREVIEW SECTION */}
      <section id="product" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-light text-green-400 uppercase tracking-wide">Live Preview</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extralight tracking-tight mb-4">
              Your weekly competitive edge
            </h2>
            <p className="text-xl text-gray-400 font-light">
              See exactly what lands in your inbox
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl">
              <div className="bg-white/[0.02] border-b border-white/[0.08] px-6 py-4 flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-500/50 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-500/50 rounded-full" />
                  <div className="w-3 h-3 bg-green-500/50 rounded-full" />
                </div>
                <div className="flex-1 bg-black/30 rounded-lg px-4 py-2 text-xs text-gray-500">
                  mail.google.com/your-jobping-matches
                </div>
              </div>

              <div className="p-8 lg:p-12">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#5B21B6] to-[#4C1D95] rounded-xl flex items-center justify-center">
                      <span className="text-white font-light text-lg">JP</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-light">Your JobPing Matches</h3>
                      <p className="text-sm text-gray-500">Tuesday, 8:00 AM · 3 perfect matches</p>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 bg-[#5B21B6]/20 text-[#9333EA] text-xs font-light rounded-lg border border-[#5B21B6]/30">
                    PREMIUM
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { title: 'Graduate Frontend Developer', company: 'Adyen', location: 'Amsterdam', match: 94, salary: '€55-65k' },
                    { title: 'Junior Data Analyst', company: 'Spotify', location: 'Stockholm', match: 87, salary: '€50-60k' },
                    { title: 'Associate Product Manager', company: 'Booking.com', location: 'Amsterdam', match: 91, salary: '€60-70k' }
                  ].map((job, i) => (
                    <div key={i} className="group bg-white/[0.02] hover:bg-white/[0.04] rounded-xl border border-white/[0.08] hover:border-[#5B21B6]/30 p-6 transition-all duration-300 cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-light text-lg">{job.title}</h4>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                            <span className="text-white font-light">{job.company}</span>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {job.location}
                            </div>
                            <span className="text-green-400 font-light">{job.salary}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs px-2 py-1 bg-white/[0.05] text-gray-400 rounded-md">Graduate Programme</span>
                            <span className="text-xs text-gray-500">Posted 2 hours ago</span>
                          </div>
                        </div>
                        <div className="ml-6">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex flex-col items-center justify-center">
                            <span className="text-2xl font-light text-white">{job.match}</span>
                            <span className="text-xs text-green-100">match</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-white/[0.08]">
                  <p className="text-center text-sm text-gray-500">
                    More opportunities coming Thursday · 
                    <button className="text-[#9333EA] font-light ml-1 hover:text-[#7C3AED] transition-colors">Manage preferences</button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-32 bg-black">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extralight tracking-tight mb-4">
              Pricing that makes sense
            </h2>
            <p className="text-xl text-gray-400 font-light mb-8">
              Start free. Upgrade when you're ready.
            </p>

            <div className="inline-flex items-center p-1 bg-white/[0.05] rounded-xl border border-white/[0.08]">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-6 py-2.5 rounded-lg font-light text-sm transition-all ${
                  billing === 'monthly' 
                    ? 'bg-white/[0.1] text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('quarterly')}
                className={`px-6 py-2.5 rounded-lg font-light text-sm transition-all ${
                  billing === 'quarterly' 
                    ? 'bg-white/[0.1] text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Quarterly
                <span className="ml-2 text-xs text-green-400 font-light">-33%</span>
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free tier */}
            <div className="relative group">
              <div className="absolute -inset-px bg-gradient-to-r from-white/[0.1] to-white/[0.05] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-8">
                <h3 className="text-xl font-light mb-2">Starter</h3>
                <p className="text-gray-400 text-sm mb-6">Perfect for exploring</p>
                <div className="mb-8">
                  <span className="text-5xl font-extralight">€0</span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {['3 jobs per email', 'Weekly delivery', 'Basic matching', 'Email support'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-white/[0.05] flex items-center justify-center">
                        <Check className="w-3 h-3 text-gray-400" />
                      </div>
                      <span className="text-gray-300 font-light">{item}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => scrollToSection('signup')} className="w-full py-3 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.12] text-white rounded-xl font-light text-sm transition-all">
                  Get Started
                </button>
              </div>
            </div>

            {/* Premium tier */}
            <div className="relative group">
              <div className="absolute -inset-px bg-gradient-to-r from-[#5B21B6] to-[#4C1D95] rounded-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 blur-sm" />
              <div className="relative bg-gradient-to-b from-white/[0.08] to-white/[0.04] backdrop-blur-xl rounded-2xl border border-[#5B21B6]/30 p-8">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-gradient-to-r from-[#5B21B6] to-[#4C1D95] text-white text-xs font-light rounded-full">
                    MOST POPULAR
                  </span>
                </div>
                <h3 className="text-xl font-light mb-2 mt-2">Premium</h3>
                <p className="text-gray-400 text-sm mb-6">For serious job seekers</p>
                <div className="mb-8">
                  <span className="text-5xl font-extralight">€{billing === 'monthly' ? '15' : '30'}</span>
                  <span className="text-gray-500 text-sm">/{billing === 'monthly' ? 'month' : '3 months'}</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {['10 jobs per email', 'Twice weekly', 'AI matching', 'Priority support', 'Profile optimization'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-[#5B21B6]/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-[#9333EA]" />
                      </div>
                      <span className="text-gray-100 font-light">{item}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 bg-[#5B21B6] hover:bg-[#4C1D95] text-white rounded-xl font-light text-sm transition-all">
                  Upgrade to Premium
                </button>
              </div>
            </div>

            {/* Teams tier */}
            <div className="relative group">
              <div className="absolute -inset-px bg-gradient-to-r from-white/[0.1] to-white/[0.05] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-8">
                <h3 className="text-xl font-light mb-2">Teams</h3>
                <p className="text-gray-400 text-sm mb-6">For universities & bootcamps</p>
                <div className="mb-8">
                  <span className="text-5xl font-extralight">Custom</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {['Unlimited jobs', 'Custom frequency', 'Bulk accounts', 'Analytics', 'Dedicated support', 'API access'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-white/[0.05] flex items-center justify-center">
                        <Check className="w-3 h-3 text-gray-400" />
                      </div>
                      <span className="text-gray-300 font-light">{item}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.12] text-white rounded-xl font-light text-sm transition-all">
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIGNUP SECTION - With Tally */}
      <section id="signup" className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5B21B6]/10 via-transparent to-[#4C1D95]/10" />
        
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-extralight tracking-tight mb-6">
            Ready to land your dream job?
          </h2>
          <p className="text-xl text-gray-400 font-light mb-12 max-w-2xl mx-auto">
            Join 10,000+ graduates getting personalized matches twice weekly.
          </p>

          {/* Native Signup Form */}
          <div className="max-w-md mx-auto">
            <SignupForm />
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Free forever plan available • No credit card required
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <span className="font-light text-2xl tracking-tight">JobPing</span>
            
            <div className="flex items-center gap-8 text-sm">
              <a href="#" className="text-gray-500 hover:text-white transition-colors font-light">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors font-light">Terms</a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors font-light">Contact</a>
            </div>
            
            <p className="text-sm text-gray-500 font-light">
              © 2024 JobPing. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
