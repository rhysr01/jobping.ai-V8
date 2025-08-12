'use client';

import { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Footer from './components/Footer';
import { JobCard } from './components/JobCard';
import PricingSelector from './priceselector';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0B0F] relative overflow-hidden">
      <Header />
      
      <main className="relative">
        {/* Hero Section */}
        <Hero />
        
        {/* Gmail Job Preview Section */}
        <section className="py-20 bg-[#0B0B0F] relative">
          <JobCard index={0} />
        </section>

        {/* Features Section */}
        <Features />

        {/* Pricing Section */}
        <PricingSelector />
      </main>

      <Footer />
    </div>
  );
}
