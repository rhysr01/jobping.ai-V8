'use client';

import { useState, useEffect, Suspense } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import Footer from './components/Footer';
import { JobCard } from './components/JobCard';
import PriceSelector from './components/PriceSelector';
import { SignupHeader } from './components/SignupHeader';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0B0F] relative overflow-hidden">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header />
      
      <main id="main-content" className="relative">
        {/* Hero Section */}
        <Hero />
        
        {/* How It Works Section */}
        <HowItWorks />
        
        {/* Gmail Job Preview Section */}
        <section className="py-20 bg-[#0B0B0F] relative">
          <JobCard index={0} />
        </section>

        {/* Features Section */}
        <Features />

        {/* Pricing Section */}
        <Suspense fallback={<div className="py-24 md:py-32">Loading...</div>}>
          <PriceSelector />
        </Suspense>

        {/* Signup Section */}
        <section id="signup" className="py-20 bg-[#0B0B0F] relative">
          <div className="container-frame">
            <Suspense fallback={<div className="mb-6">Loading...</div>}>
              <SignupHeader />
            </Suspense>
            <div className="max-w-md mx-auto">
              {/* Fallback form (shown by default) */}
              {!loaded && <form 
                data-testid="fallback-form" 
                className="bg-white/5 p-6 rounded-lg border border-white/10"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  
                  try {
                    // First try to submit to Tally webhook endpoint
                    const response = await fetch('/api/webhook-tally', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        eventId: `fallback-${Date.now()}`,
                        eventType: 'FORM_RESPONSE',
                        createdAt: new Date().toISOString(),
                        formId: 'fallback-form',
                        responseId: `fallback-${Date.now()}`,
                        data: {
                          fields: [
                            { key: 'name', label: 'Name', type: 'text', value: formData.get('name') },
                            { key: 'email', label: 'Email', type: 'email', value: formData.get('email') },
                            { key: 'plan', label: 'Plan', type: 'select', value: formData.get('plan') }
                          ]
                        }
                      }),
                    });
                     
                    if (response.ok) {
                      // Show success message
                      const successEl = document.querySelector('[data-testid="success-message"]');
                      if (successEl) successEl.classList.remove('hidden');
                    } else {
                      // Fallback to simple subscribe endpoint
                      await fetch('/api/subscribe', {
                        method: 'POST',
                        body: formData,
                      });
                    }
                  } catch (error) {
                    console.error('Form submission error:', error);
                    // Show error message
                    const errorEl = document.querySelector('[data-testid="error-message"]');
                    if (errorEl) errorEl.classList.remove('hidden');
                  }
                }}
              >
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name-input" className="block text-sm font-medium text-white mb-2">
                      Your name
                    </label>
                    <input
                      id="name-input"
                      data-testid="name-input"
                      name="name"
                      type="text"
                      placeholder="Your name"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      aria-describedby="name-error"
                    />
                    <div id="name-error" data-testid="name-error" className="hidden text-red-400 text-sm mt-1">
                      Name is required
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email-input" className="block text-sm font-medium text-white mb-2">
                      Your email
                    </label>
                    <input
                      id="email-input"
                      data-testid="email-input"
                      name="email"
                      type="email"
                      placeholder="Your email"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      aria-describedby="email-error"
                    />
                    <div id="email-error" data-testid="email-error" className="hidden text-red-400 text-sm mt-1">
                      Valid email is required
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="plan-select" className="block text-sm font-medium text-white mb-2">
                      Choose your plan
                    </label>
                    <select
                      id="plan-select"
                      data-testid="plan-select"
                      name="plan"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-describedby="plan-error"
                    >
                      <option value="free">Free Plan</option>
                      <option value="premium">Premium Plan</option>
                    </select>
                    <div id="plan-error" data-testid="plan-error" className="hidden text-red-400 text-sm mt-1">
                      Please select a plan
                    </div>
                  </div>
                  
                  <button
                    data-testid="submit-button"
                    type="submit"
                    className="w-full bg-white text-[#0B0B0F] px-6 py-3 rounded-lg font-semibold hover:bg-[#F8F9FA] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Get Started
                  </button>
                  
                  <div data-testid="success-message" className="hidden text-green-400 text-sm text-center">
                    Thank you! We'll be in touch soon.
                  </div>
                  
                  <div data-testid="error-message" className="hidden text-red-400 text-sm text-center">
                    Something went wrong. Please try again.
                  </div>
                </div>
              </form>}
              
              <iframe
                className="h-[500px] w-full border-none focus-visible:ring-2 ring-white/20 rounded-lg"
                src="https://tally.so/r/mJEqx4?alignLeft=1&transparentBackground=1&hideTitle=1"
                data-testid="tally-iframe"
                title="JobPing Signup Form"
                aria-label="JobPing signup form"
                onLoad={() => setLoaded(true)}
                style={{ display: loaded ? "block" : "none" }}
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
