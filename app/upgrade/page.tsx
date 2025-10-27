'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import LogoWordmark from '@/components/LogoWordmark';

export default function UpgradePage() {
  const [email, setEmail] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Check for "rhys" promo code - redirect to Tally to complete profile
      if (promoCode.toLowerCase() === 'rhys') {
        const response = await fetch('/api/apply-promo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            promoCode: 'rhys'
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to apply promo code');
        }

        const data = await response.json();
        
        // If user already exists, show success
        if (data.existingUser) {
          router.push('/upgrade/success?promo=rhys');
          return;
        }

        // New user: Redirect to Tally form with promo params
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
          return;
        }

        // Fallback: Direct to Tally with promo params
        window.location.href = `https://tally.so/r/mJEqx4?email=${encodeURIComponent(email)}&promo=rhys&tier=premium`;
        return;
      }

      // Normal Stripe flow
      const priceId = selectedPlan === 'monthly' 
        ? process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_QUARTERLY_PRICE_ID;

      if (!priceId) {
        throw new Error('Stripe price ID not configured');
      }

      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          priceId,
          userId: `temp_${Date.now()}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen premium-bg flex items-center justify-center px-6 py-20 relative">
      {/* Background animations matching Hero */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, y: -20, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: 1,
          rotate: [0, 1, -1, 0]
        }}
        transition={{ 
          duration: 2, 
          ease: [0.23, 1, 0.32, 1],
          repeat: Infinity,
          repeatType: "reverse"
        }}
        className="pointer-events-none absolute inset-0 -z-10 enhanced-grid"
      />
      
      <div className="max-w-md w-full">
        {/* Logo at top */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <LogoWordmark />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-card rounded-2xl p-8 md:p-10 interactive-hover"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 tracking-tight">Upgrade to Premium</h1>
          <p className="text-zinc-400 text-center mb-8">
            Get 3 emails per week with 5 hand-picked roles each
          </p>

          <form onSubmit={handleUpgrade} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Plan Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">Choose your plan</label>
              <div className="space-y-3">
                {/* Monthly */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan('monthly')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    selectedPlan === 'monthly'
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-white/10 bg-zinc-900/50 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">Monthly</p>
                      <p className="text-sm text-zinc-400">��7 per month</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center">
                      {selectedPlan === 'monthly' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-500"></div>
                      )}
                    </div>
                  </div>
                </button>

                {/* Quarterly */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan('quarterly')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    selectedPlan === 'quarterly'
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-white/10 bg-zinc-900/50 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">Quarterly</p>
                      <p className="text-sm text-zinc-400">��15 per quarter (save 29%)</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center">
                      {selectedPlan === 'quarterly' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-500"></div>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Promo Code */}
            <div>
              <label htmlFor="promoCode" className="block text-sm font-medium text-zinc-300 mb-2">
                Promo Code (Optional)
              </label>
              <input
                id="promoCode"
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Enter promo code"
                className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
              {promoCode.toLowerCase() === 'rhys' && (
                <p className="mt-2 text-sm text-green-400"> Premium for free!</p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : (
                `Continue to Payment`
              )}
            </button>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
                Secure checkout
              </span>
              <span>�</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                Cancel anytime
              </span>
            </div>

            {/* Back Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                � Back to home
              </button>
            </div>
          </form>
        </motion.div>

        {/* What's Included */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 text-center text-sm text-zinc-400 space-y-1"
        >
          <p> Five hand-picked roles on signup</p>
          <p> Mon/Wed/Fri delivery (5 roles each)</p>
          <p> Finer filters and priority support</p>
        </motion.div>
      </div>
    </div>
  );
}

