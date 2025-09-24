'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function JobPingPro() {
  const [billing, setBilling] = useState('monthly');

  return (
    <div id="main" className="min-h-screen text-white antialiased">
      {/* Clean background - no patterns */}
      
      
      {/* HEADER - Responsive with details menu */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-black/60 border-b border-white/10">
        <div className="container-x h-16 flex items-center justify-between">
          {/* Left: brand */}
          <Link href="/" className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
            <div className="w-9 h-9 rounded-2xl border border-white/20 bg-white/10 grid place-items-center">
              <span className="text-sm font-bold">JP</span>
            </div>
            <span className="sr-only">JobPing</span>
          </Link>
          {/* Center: nav (hide on mobile) */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm subtle hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded px-2 py-1">Features</a>
            <a href="#preview"  className="text-sm subtle hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded px-2 py-1">Preview</a>
            <a href="#pricing"  className="text-sm subtle hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded px-2 py-1">Pricing</a>
          </nav>
          {/* Right: CTA + mobile menu */}
          <div className="flex items-center gap-3">
            <a href="#signup" className="btn btn-primary hidden sm:inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black">Start Free</a>
            <details className="relative md:hidden">
              <summary className="list-none btn btn-ghost px-3 py-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <svg aria-hidden className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.25" d="M4 6h16M4 12h16M4 18h16"/></svg>
                <span className="sr-only">Menu</span>
              </summary>
              <div className="absolute right-0 mt-2 w-48 card p-2">
                <a href="#features" className="block px-3 py-3 rounded-lg hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 min-h-[44px] flex items-center">Features</a>
                <a href="#preview"  className="block px-3 py-3 rounded-lg hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 min-h-[44px] flex items-center">Preview</a>
                <a href="#pricing"  className="block px-3 py-3 rounded-lg hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 min-h-[44px] flex items-center">Pricing</a>
                <a href="#signup"   className="block px-3 py-3 rounded-lg hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 min-h-[44px] flex items-center">Start Free</a>
              </div>
            </details>
          </div>
        </div>
      </header>

      {/* HERO - Clean, spacious, centered */}
      <section className="relative section-y">
        <div className="container-x text-center px-4 sm:px-6">
          <span className="kicker mb-6 text-center">Early-career job matches</span>
          <h1 className="text-[clamp(2.5rem,6vw,5rem)] leading-[0.95] font-semibold tracking-tight">
            Personalised roles, delivered daily to your inbox
          </h1>
          <p className="muted mt-6 max-w-[55ch] mx-auto">Daily job matches for early-career roles across Europe.</p>
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center">
            <a href="#signup" className="btn btn-primary px-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black min-h-[44px]">Get 5 jobs/day free</a>
            <a href="#preview" className="btn btn-ghost px-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black min-h-[44px]">View a sample email</a>
          </div>
          <p className="text-xs subtle mt-6">GDPR-friendly · Email-only · Unsubscribe anytime</p>
        </div>
      </section>

      {/* PRODUCT PREVIEW - Visual proof */}
      <section id="preview" className="section-y">
        <div className="container-x grid md:grid-cols-2 gap-10 items-center overflow-hidden">
          {/* Left: copy */}
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Sample email</h2>
            <p className="muted mt-4">5 relevant roles, delivered at 7:00 AM daily.</p>
          </div>
          {/* Right: email/browser frame */}
          <div className="card p-4 overflow-hidden">
            {/* Browser frame */}
            <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl">
              {/* Browser bar */}
              <div className="bg-white/[0.02] border-b border-white/[0.08] px-6 py-4 flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-white/20 rounded-full" />
                  <div className="w-3 h-3 bg-white/20 rounded-full" />
                  <div className="w-3 h-3 bg-white/20 rounded-full" />
                </div>
                <div className="flex-1 bg-black/30 rounded-lg px-4 py-2 text-xs subtle">
                  mail.google.com/your-jobping-matches
                </div>
              </div>

              {/* Email content */}
              <div className="p-8 lg:p-12">
                {/* Email header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">JP</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Your JobPing Matches</h3>
                      <p className="text-sm muted">Tuesday, 8:00 AM · 3 perfect matches</p>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 bg-white/10 text-white/80 text-xs font-bold rounded-lg border border-white/20">
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
                    <div key={i} className="card p-4 hover:bg-white/[0.03] transition">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white/[0.08] border border-white/10 grid place-items-center overflow-hidden">
                          <span className="text-xs subtle">{job.company.charAt(0)}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold">{job.title}</h3>
                          <p className="text-sm muted">{job.company} • {job.location}</p>
                        </div>
                        <span className="text-[11px] px-2 py-1 rounded-full border border-white/12 subtle">NEW</span>
                      </div>
                      <div className="mt-3 text-sm subtle line-clamp-2">
                        Early-career role with growth opportunities in {job.location}. Apply directly via company website.
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs subtle">Intern / Junior</span>
                        <a className="btn btn-primary px-4 py-2 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black">View</a>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Email footer */}
                <div className="mt-8 pt-8 border-t border-white/[0.08]">
                  <p className="text-center text-sm subtle">
                    More opportunities coming Thursday · 
                    <button className="text-white font-medium ml-1 hover:text-white/70 transition-colors">Manage preferences</button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING - Premium cards */}
      <section id="pricing" className="section-y">
        <div className="container-x">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Pricing that makes sense
            </h2>
            <p className="text-xl muted mb-8">
              Start free. Upgrade when you're ready.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center p-1 bg-white/[0.05] rounded-xl border border-white/[0.08]">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  billing === 'monthly' 
                    ? 'bg-white/[0.1] text-white shadow-lg' 
                    : 'subtle hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('quarterly')}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  billing === 'quarterly' 
                    ? 'bg-white/[0.1] text-white shadow-lg' 
                    : 'subtle hover:text-white'
                }`}
              >
                Quarterly
                <span className="ml-2 text-xs text-white/80 font-bold">-33%</span>
              </button>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Free tier */}
            <div className="card p-8">
              <div className="flex items-center justify-between">
                <span className="ribbon ribbon-popular">Popular</span>
                <span className="subtle text-xs">Cancel anytime</span>
              </div>
            <h3 className="text-xl font-semibold mt-4">Free</h3>
            <p className="muted text-sm mt-2">Try it out</p>
              <div className="mb-8">
                <span className="text-5xl font-bold">€0</span>
                <span className="muted text-sm">/month</span>
              </div>
              <ul className="mt-5 space-y-2 subtle text-sm">
                <li>5 jobs daily</li>
                <li>Basic matching</li>
              </ul>
              <a href="#signup" className="btn btn-primary mt-6 w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black min-h-[44px]">Get Started — Free</a>
            </div>

            {/* Premium tier */}
            <div className="card p-8">
              <div className="flex items-center justify-between">
                <span className="ribbon ribbon-new">Premium</span>
                <span className="subtle text-xs">Cancel anytime</span>
              </div>
            <h3 className="text-xl font-semibold mt-4">Premium</h3>
            <p className="muted text-sm mt-2">More jobs, faster</p>
              <div className="mb-8">
                <span className="text-5xl font-bold">€{billing === 'monthly' ? '15' : '30'}</span>
                <span className="muted text-sm">/{billing === 'monthly' ? 'month' : '3 months'}</span>
              </div>
              <ul className="mt-5 space-y-2 subtle text-sm">
                <li>10 jobs daily</li>
                <li>Advanced matching</li>
                <li>Priority support</li>
              </ul>
              <button className="btn btn-primary mt-6 w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black min-h-[44px]">Upgrade to Premium</button>
            </div>

          </div>
          <p className="text-center text-xs subtle mt-8">Cancel anytime</p>
        </div>
      </section>

      {/* SIGNUP SECTION */}
      <section id="signup" className="section-y">
        <div className="container-x">
          <div className="card p-4">
            <iframe
              className="w-full h-[560px] bg-transparent"
              src="https://tally.so/r/mJEqx4?alignLeft=1&transparentBackground=1&hideTitle=1&utm_source=landing&utm_medium=cta"
              title="JobPing Signup"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-forms allow-same-origin"
            />
            <noscript>
              <div className="text-center py-12">
                <p className="muted mb-4">JavaScript is required for the signup form.</p>
                <a href="https://tally.so/r/mJEqx4?utm_source=landing&utm_medium=fallback" className="btn btn-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black" target="_blank" rel="noopener noreferrer">
                  Open Signup Form
                </a>
              </div>
            </noscript>
          </div>
        </div>
      </section>

      {/* FOOTER - Ultra minimal */}
      <footer className="section-y border-t border-white/10">
        <div className="container-x">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">JP</span>
              </div>
              <span className="font-semibold text-xl tracking-tight">JobPing</span>
            </div>
            
            <div className="flex items-center gap-8 text-sm">
              <a href="/legal/privacy-policy" className="subtle hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded px-2 py-1">Privacy</a>
              <a href="/legal/terms-of-service" className="subtle hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded px-2 py-1">Terms</a>
              <a href="/legal/unsubscribe" className="subtle hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded px-2 py-1">Unsubscribe</a>
              <a href="mailto:hello@jobping.ai" className="subtle hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded px-2 py-1">Contact</a>
            </div>
            
            <p className="text-sm subtle">
              © 2024 JobPing. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
