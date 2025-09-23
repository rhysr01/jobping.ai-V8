'use client';

import React, { useState } from 'react';
import { ArrowRight, Sparkles, Zap, Target, Mail, TrendingUp, MapPin, Check, ChevronRight, Star, Globe, Shield, Award, Menu, X } from 'lucide-react';

export default function JobPingPro() {
  const [billing, setBilling] = useState('monthly');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-white antialiased" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif' }}>
      {/* Clean background - no patterns */}
      
      {/* HEADER - Centered, prominent */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-lg border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Left nav */}
            <nav className="hidden md:flex items-center gap-8 flex-1">
              <button onClick={() => scrollToSection('features')} className="text-gray-500 hover:text-white transition-colors text-sm font-normal tracking-wide">
                Features
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-gray-500 hover:text-white transition-colors text-sm font-normal tracking-wide">
                Pricing
              </button>
            </nav>
            
            {/* Centered logo - BIGGER */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">JP</span>
              </div>
              <span className="font-medium text-2xl tracking-tight">JobPing</span>
            </div>
            
            {/* Right nav */}
            <nav className="hidden md:flex items-center gap-8 flex-1 justify-end">
              <button onClick={() => scrollToSection('signup')} className="text-gray-500 hover:text-white transition-colors text-sm font-normal tracking-wide">
                Sign in
              </button>
              <button onClick={() => scrollToSection('signup')} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium text-sm transition-all">
                Get Started
              </button>
            </nav>

            {/* Mobile menu */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-white ml-4">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* HERO - Clean, spacious, centered */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Simple gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-black to-black" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-32 text-center">
          {/* Small accent */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-12">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
            <span className="text-xs font-normal text-purple-300 uppercase tracking-widest">AI-Powered Matching</span>
          </div>
          
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-light tracking-tight mb-8 leading-[0.85]">
            <span className="block text-white">
              Stop searching
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600 mt-2">
              Start landing
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-16 max-w-3xl mx-auto font-light leading-relaxed">
            Personalized job matches from 50+ European sources, delivered to your inbox twice weekly
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => scrollToSection('signup')} className="px-10 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-normal text-lg transition-all">
              Start Free Today
            </button>
            <button onClick={() => scrollToSection('product')} className="px-10 py-4 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.1] text-white rounded-full font-normal text-lg transition-all">
              See How It Works
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES GRID - Simple, clean cards */}
      <section id="features" className="py-32 bg-black">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-light tracking-tight mb-6">
              Everything you need
            </h2>
            <p className="text-xl text-gray-500 font-light">
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
              <div key={i} className="group p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.03] hover:border-purple-500/20 transition-all duration-300">
                <item.icon className="w-8 h-8 text-purple-400 mb-6" strokeWidth={1.5} />
                <h3 className="text-xl font-normal text-white mb-3">{item.title}</h3>
                <p className="text-gray-500 font-light leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT PREVIEW - Sleek email mockup */}
      <section id="product" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-green-400 uppercase tracking-wide">Live Preview</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Your weekly competitive edge
            </h2>
            <p className="text-xl text-gray-400">
              See exactly what lands in your inbox
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            {/* Browser frame */}
            <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl">
              {/* Browser bar */}
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

              {/* Email content */}
              <div className="p-8 lg:p-12">
                {/* Email header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/20">
                      <span className="text-white font-bold text-lg">JP</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Your JobPing Matches</h3>
                      <p className="text-sm text-gray-500">Tuesday, 8:00 AM · 3 perfect matches</p>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 bg-purple-600/20 text-purple-400 text-xs font-bold rounded-lg border border-purple-600/30">
                    PREMIUM
                  </div>
                </div>

                {/* Job cards */}
                <div className="space-y-4">
                  {[
                    { title: 'Graduate Frontend Developer', company: 'Adyen', location: 'Amsterdam', match: 94, salary: '€55-65k', trending: true },
                    { title: 'Junior Data Analyst', company: 'Spotify', location: 'Stockholm', match: 87, salary: '€50-60k' },
                    { title: 'Associate Product Manager', company: 'Booking.com', location: 'Amsterdam', match: 91, salary: '€60-70k', trending: true }
                  ].map((job, i) => (
                    <div key={i} className="group bg-white/[0.02] hover:bg-white/[0.04] rounded-xl border border-white/[0.08] hover:border-purple-600/30 p-6 transition-all duration-300 cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-lg">{job.title}</h4>
                            {job.trending && (
                              <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-md border border-orange-500/30 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                HOT
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                            <span className="text-white font-medium">{job.company}</span>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {job.location}
                            </div>
                            <span className="text-green-400 font-medium">{job.salary}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs px-2 py-1 bg-white/[0.05] text-gray-400 rounded-md">Graduate Programme</span>
                            <span className="text-xs text-gray-500">Posted 2 hours ago</span>
                          </div>
                        </div>
                        <div className="ml-6">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex flex-col items-center justify-center shadow-lg shadow-green-500/20">
                            <span className="text-2xl font-bold text-white">{job.match}</span>
                            <span className="text-xs text-green-100">match</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Email footer */}
                <div className="mt-8 pt-8 border-t border-white/[0.08]">
                  <p className="text-center text-sm text-gray-500">
                    More opportunities coming Thursday · 
                    <button className="text-purple-400 font-medium ml-1 hover:text-purple-300 transition-colors">Manage preferences</button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING - Premium cards */}
      <section id="pricing" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Pricing that makes sense
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Start free. Upgrade when you're ready.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center p-1 bg-white/[0.05] rounded-xl border border-white/[0.08]">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  billing === 'monthly' 
                    ? 'bg-white/[0.1] text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('quarterly')}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  billing === 'quarterly' 
                    ? 'bg-white/[0.1] text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Quarterly
                <span className="ml-2 text-xs text-green-400 font-bold">-33%</span>
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free tier */}
            <div className="relative group">
              <div className="absolute -inset-px bg-gradient-to-r from-white/[0.1] to-white/[0.05] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-8">
                <h3 className="text-xl font-semibold mb-2">Starter</h3>
                <p className="text-gray-400 text-sm mb-6">Perfect for exploring</p>
                <div className="mb-8">
                  <span className="text-5xl font-bold">€0</span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {['3 jobs per email', 'Weekly delivery', 'Basic matching', 'Email support'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-white/[0.05] flex items-center justify-center">
                        <Check className="w-3 h-3 text-gray-400" />
                      </div>
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => scrollToSection('signup')} className="w-full py-3 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.12] text-white rounded-xl font-medium text-sm transition-all">
                  Get Started
                </button>
              </div>
            </div>

            {/* Premium tier */}
            <div className="relative group">
              <div className="absolute -inset-px bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 blur-sm" />
              <div className="relative bg-gradient-to-b from-white/[0.08] to-white/[0.04] backdrop-blur-xl rounded-2xl border border-purple-600/30 p-8">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-bold rounded-full">
                    MOST POPULAR
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2 mt-2">Premium</h3>
                <p className="text-gray-400 text-sm mb-6">For serious job seekers</p>
                <div className="mb-8">
                  <span className="text-5xl font-bold">€{billing === 'monthly' ? '15' : '30'}</span>
                  <span className="text-gray-500 text-sm">/{billing === 'monthly' ? 'month' : '3 months'}</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {['10 jobs per email', 'Twice weekly', 'AI matching', 'Priority support', 'Profile optimization'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-purple-600/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-purple-400" />
                      </div>
                      <span className="text-gray-100">{item}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40">
                  Upgrade to Premium
                </button>
              </div>
            </div>

            {/* Teams tier */}
            <div className="relative group">
              <div className="absolute -inset-px bg-gradient-to-r from-white/[0.1] to-white/[0.05] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-8">
                <h3 className="text-xl font-semibold mb-2">Teams</h3>
                <p className="text-gray-400 text-sm mb-6">For universities & bootcamps</p>
                <div className="mb-8">
                  <span className="text-5xl font-bold">Custom</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {['Unlimited jobs', 'Custom frequency', 'Bulk accounts', 'Analytics', 'Dedicated support', 'API access'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-white/[0.05] flex items-center justify-center">
                        <Check className="w-3 h-3 text-gray-400" />
                      </div>
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.12] text-white rounded-xl font-medium text-sm transition-all">
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION - Clean metrics */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '10,000+', label: 'Active users' },
              { value: '94%', label: 'Match accuracy' },
              { value: '21 days', label: 'Avg. time to hire' },
              { value: '50+', label: 'Job sources' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 uppercase tracking-wide">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION - Final conversion */}
      <section id="signup" className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-purple-800/10" />
        
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Ready to land your dream job?
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Join 10,000+ graduates getting personalized matches twice weekly. No credit card required.
          </p>

          {/* Tally embed */}
          <div className="max-w-xl mx-auto">
            <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden">
              <div className="bg-white/[0.02] border-b border-white/[0.08] px-4 py-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-400">Signup form</span>
              </div>
              <iframe
                className="w-full h-[560px] bg-transparent"
                src="https://tally.so/r/mJEqx4?alignLeft=1&transparentBackground=1&hideTitle=1"
                title="JobPing Signup Form"
                loading="lazy"
              />
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              Free forever plan available • No credit card required
            </p>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-6 mt-12 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>GDPR Compliant</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>4.9/5 Rating</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Available in 27 countries</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER - Ultra minimal */}
      <footer className="py-12 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/20">
                <span className="text-white font-bold text-sm">JP</span>
              </div>
              <span className="font-semibold text-xl tracking-tight">JobPing</span>
            </div>
            
            <div className="flex items-center gap-8 text-sm">
              <a href="#" className="text-gray-500 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">Contact</a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">Blog</a>
            </div>
            
            <p className="text-sm text-gray-500">
              © 2024 JobPing. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
