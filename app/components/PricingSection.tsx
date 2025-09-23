'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

export default function PricingSection() {
  const [billing, setBilling] = useState<'monthly' | 'quarterly'>('monthly');

  const handlePlanClick = async (plan: 'free' | 'premium') => {
    if (plan === 'free') {
      // Scroll to signup section
      const signupSection = document.getElementById('signup');
      if (signupSection) {
        signupSection.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // Handle premium plan - redirect to checkout
    const priceId = billing === 'monthly' ? 'price_monthly' : 'price_quarterly';
    window.location.href = `/api/create-checkout-session?priceId=${priceId}`;
  };

  return (
    <section id="pricing" className="py-32 bg-gradient-to-b from-black via-zinc-950 to-black relative overflow-hidden">
      
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 30% 40%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.1) 0%, transparent 50%)`
      }} />
      
      <div className="max-w-6xl mx-auto px-6 relative">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold text-transparent bg-gradient-to-b from-white to-zinc-300 bg-clip-text mb-8 tracking-[-0.02em]">
            Simple pricing
          </h2>
          <p className="text-2xl text-zinc-400">
            Start free, upgrade when ready
          </p>
        </div>

        {/* Premium Billing Toggle */}
        <div className="flex justify-center mb-16">
          <div className="relative bg-gradient-to-r from-zinc-900/80 to-zinc-900/60 backdrop-blur-xl rounded-full p-1.5 border border-zinc-700/50 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-white/[0.03] to-white/[0.01] rounded-full pointer-events-none" />
            {(['monthly', 'quarterly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setBilling(period)}
                className={`relative px-8 py-3.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  billing === period
                    ? 'bg-gradient-to-r from-white via-zinc-50 to-white text-black shadow-xl scale-105'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {period === 'monthly' ? 'Monthly' : '3 Months (Save 33%)'}
              </button>
            ))}
          </div>
        </div>

        {/* Ultra Premium Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          
          {/* Free Plan - Premium Glass */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-zinc-600/20 to-zinc-700/20 rounded-[2rem] blur opacity-50 group-hover:opacity-75 transition duration-300" />
            <div className="relative bg-gradient-to-br from-zinc-900/60 to-zinc-950/40 backdrop-blur-2xl rounded-[2rem] border border-zinc-700/40 p-10 shadow-2xl hover:shadow-3xl transition-all duration-500">
              
              <div className="text-center mb-10">
                <h3 className="text-3xl font-semibold text-white mb-6 tracking-[-0.01em]">Free</h3>
                <div className="mb-6">
                  <span className="text-6xl font-bold text-transparent bg-gradient-to-b from-white to-zinc-300 bg-clip-text">€0</span>
                </div>
                <p className="text-zinc-400 text-lg">Perfect for getting started</p>
              </div>
              
              <ul className="space-y-5 mb-10">
                {['3 jobs per send', 'Graduate-focused roles', 'Email delivery'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 bg-gradient-to-br from-zinc-700/60 to-zinc-800/40 rounded-full flex items-center justify-center border border-zinc-600/40">
                      <Check className="w-4 h-4 text-zinc-300" strokeWidth={2.5} />
                    </div>
                    <span className="text-zinc-200 text-lg">{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handlePlanClick('free')}
                className="w-full bg-gradient-to-r from-zinc-800/80 to-zinc-900/60 backdrop-blur-sm border border-zinc-600/50 text-white py-5 rounded-2xl font-medium text-lg hover:from-zinc-700/80 hover:to-zinc-800/60 hover:border-zinc-500/60 transition-all duration-300 hover:scale-105 shadow-xl"
              >
                Start Free
              </button>
            </div>
          </div>

          {/* Premium Plan - Hero Treatment */}
          <div className="relative group">
            {/* Enhanced Glow */}
            <div className="absolute -inset-2 bg-gradient-to-r from-zinc-400/30 via-white/20 to-zinc-400/30 rounded-[2rem] blur-lg opacity-60 group-hover:opacity-100 transition duration-500" />
            
            <div className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/60 backdrop-blur-2xl rounded-[2rem] border border-zinc-600/60 p-10 shadow-3xl hover:shadow-4xl transition-all duration-500 transform hover:scale-105">
              
              {/* Premium Badge */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                <div className="bg-gradient-to-r from-white via-zinc-50 to-white text-black px-6 py-2 rounded-full text-sm font-semibold shadow-xl border border-zinc-200/20">
                  Most Popular
                </div>
              </div>
              
              <div className="text-center mb-10 pt-4">
                <h3 className="text-3xl font-semibold text-white mb-6 tracking-[-0.01em]">Premium</h3>
                <div className="mb-6">
                  <span className="text-6xl font-bold text-transparent bg-gradient-to-b from-white via-zinc-100 to-zinc-300 bg-clip-text">
                    €{billing === 'monthly' ? '15' : '30'}
                  </span>
                  <span className="text-zinc-400 text-xl ml-2">
                    /{billing === 'monthly' ? 'month' : '3 months'}
                  </span>
                </div>
                <p className="text-zinc-400 text-lg">For serious job hunters</p>
              </div>
              
              <ul className="space-y-5 mb-10">
                {['6 jobs per send', 'Early access to new jobs', 'Priority matching'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 bg-gradient-to-br from-zinc-600/80 to-zinc-700/60 rounded-full flex items-center justify-center border border-zinc-500/50">
                      <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-white text-lg font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Hero CTA */}
              <div className="relative group/button">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-white via-zinc-200 to-white rounded-2xl blur opacity-50 group-hover/button:opacity-100 transition duration-300" />
                <button 
                  onClick={() => handlePlanClick('premium')}
                  className="relative w-full bg-gradient-to-r from-white via-zinc-50 to-white text-black py-5 rounded-2xl font-semibold text-lg hover:from-zinc-50 hover:via-zinc-100 hover:to-zinc-50 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 border border-zinc-100/20"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
