'use client';

import Header from './components/Header';
import Hero from './components/Hero';
import Footer from './components/Footer';
import FAQ from './components/FAQ';
import Features from './components/Features';
import PriceSelector from './components/PriceSelector';
import { SignupHeader } from './components/SignupHeader';

export default function Home() {

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <Header />
      
      <main className="relative">
        {/* Hero Section */}
        <Hero />
        
        {/* Features Section */}
        <section className="section-spacing bg-black">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
            <Features />
          </div>
        </section>

        {/* Removed redundant email preview section */}

        {/* Job Preview Section */}
        <section className="section-spacing">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-2xl font-semibold text-center mb-8">What you'll receive</h2>
            <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-2xl p-6 border border-white/10">
              <div className="space-y-4">
                <div className="bg-[#0a0a0a] rounded-xl p-4 border border-white/10">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-white font-medium">Frontend Developer</h4>
                    <span className="bg-white/10 backdrop-blur text-white px-2.5 py-1 rounded-full text-xs font-medium border border-white/10">94% match</span>
                  </div>
                  <p className="text-[#a0a0a0] text-sm">Adyen • Amsterdam, Netherlands</p>
                  <p className="text-[#707070] text-xs mt-1">Full-time • €45k-65k • React, TypeScript</p>
                </div>
                <div className="bg-[#0a0a0a] rounded-xl p-4 border border-white/10">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-white font-medium">Junior Product Manager</h4>
                    <span className="bg-white/10 backdrop-blur text-white px-2.5 py-1 rounded-full text-xs font-medium border border-white/10">87% match</span>
                  </div>
                  <p className="text-[#a0a0a0] text-sm">Spotify • Stockholm, Sweden</p>
                  <p className="text-[#707070] text-xs mt-1">Full-time • €40k-55k • Product, Analytics</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <PriceSelector />

        {/* Signup Section */}
        <section id="signup" className="section-spacing bg-black relative">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
            <SignupHeader />
            <div className="max-w-md mx-auto">
              <div className="relative">
                <iframe
                  className="h-[450px] md:h-[600px] w-full border-none focus-visible:ring-2 ring-white/10 rounded-xl"
                src="https://tally.so/r/mJEqx4?alignLeft=1&transparentBackground=1&hideTitle=1"
                data-testid="tally-iframe"
                title="JobPing Signup Form"
                aria-label="JobPing signup form"
                  allow="clipboard-write; fullscreen"
                />
                <div className="absolute inset-0 bg-black/50 backdrop-blur pointer-events-none opacity-0 transition" />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
