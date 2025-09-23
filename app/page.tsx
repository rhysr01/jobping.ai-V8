'use client';

import Header from './components/Header';
import Hero from './components/Hero';
import Footer from './components/Footer';
import Features from './components/Features';
import JobPreview from './components/JobPreview';
import PricingSection from './components/PricingSection';
import { SignupHeader } from './components/SignupHeader';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased relative overflow-hidden">
      <Header />
      
      <main className="relative">
        {/* Hero Section */}
        <Hero />
        
        {/* Features Section */}
        <Features />

        {/* Job Preview Section */}
        <JobPreview />

        {/* Pricing Section */}
        <PricingSection />

        {/* Signup Section - Positioned directly after pricing */}
        <section id="signup" className="py-32 bg-black relative">
          <div className="max-w-4xl mx-auto px-6">
            <SignupHeader />
            <div className="max-w-md mx-auto">
              <div className="relative">
                <iframe
                  className="h-[400px] sm:h-[500px] md:h-[600px] w-full border-none focus-visible:ring-2 ring-white/10 rounded-xl bg-transparent"
                  src="https://tally.so/r/mJEqx4?alignLeft=1&transparentBackground=1&hideTitle=1"
                  data-testid="tally-iframe"
                  title="JobPing Signup Form"
                  aria-label="JobPing signup form"
                  allow="clipboard-write; fullscreen"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
