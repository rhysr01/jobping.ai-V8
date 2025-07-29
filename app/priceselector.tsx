'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, Sparkles } from 'lucide-react';

const FeatureItem = ({ text }: { text: string }) => (
  <li className="flex items-center gap-3 text-lg text-white/80">
    <CheckCircleIcon className="w-5 h-5 text-white/60 flex-shrink-0" />
    {text}
  </li>
);

interface PricingSelectorProps {
  onSelect?: (plan: 'free' | 'premium') => void;
}

export default function PricingSelector({ onSelect }: PricingSelectorProps = {}) {
  const [activeTab, setActiveTab] = useState<'free' | 'premium'>('free');

  const plans = [
    {
      name: 'Free',
      price: '€0',
      tier: 'Free Forever',
      tagline: 'Perfect for curious explorers',
      features: ['5 job matches daily', 'Email delivery', 'Basic filtering'],
      value: 'free' as const
    },
    {
      name: 'Premium',
      price: '€15',
      tier: 'Monthly Plan',
      tagline: 'Built for serious job seekers',
      features: ['15 job matches daily', 'Priority AI matching', 'Advanced filters', 'Custom preferences'],
      value: 'premium' as const,
      highlight: true
    }
  ];

  return (
    <section className="py-32 px-6 relative">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div className="text-center mb-16">
          <h2 className="text-4xl font-light text-white mb-4">Choose Your Plan</h2>
          <p className="text-white/50 text-lg">Built for ambition in this job market.</p>
        </motion.div>

        {/* Toggle with visual connector */}
        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-white/20 to-transparent" />
          
          {/* Toggle */}
          <div className="flex justify-center mb-20">
            <motion.div 
              className="relative p-1 rounded-full bg-white/5 backdrop-blur-xl border border-white/10"
              whileHover={{ scale: 1.02 }}
            >
              {/* Toggle buttons */}
              <div className="relative flex">
                <button
                  onClick={() => {
                    setActiveTab('free');
                    onSelect?.('free');
                  }}
                  className={`relative px-8 py-3 rounded-full text-sm font-medium transition-all duration-300 z-10 ${
                    activeTab === 'free' ? 'text-black' : 'text-white/60'
                  }`}
                >
                  Free
                </button>
                <button
                  onClick={() => {
                    setActiveTab('premium');
                    onSelect?.('premium');
                  }}
                  className={`relative px-8 py-3 rounded-full text-sm font-medium transition-all duration-300 z-10 ${
                    activeTab === 'premium' ? 'text-black' : 'text-white/60'
                  }`}
                >
                  Premium
                  {/* Savings badge */}
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: activeTab === 'premium' ? 1 : 0 }}
                    className="absolute -top-2 -right-2 bg-green-500 text-black text-xs px-2 py-0.5 rounded-full font-bold"
                  >
                    SAVE 33%
                  </motion.span>
                </button>
              </div>
              
              {/* Sliding background */}
              <motion.div
                className="absolute top-1 h-[calc(100%-8px)] bg-white rounded-full"
                animate={{
                  x: activeTab === 'free' ? 4 : 'calc(100% - 4px)',
                  width: activeTab === 'free' ? 80 : 96,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </motion.div>
          </div>
        </div>

        {/* Animated card entrance */}
        <AnimatePresence mode="wait">
          {activeTab === 'free' ? (
            <motion.div
              key="free"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="max-w-2xl mx-auto"
            >
              {/* Free plan card */}
              <div className="relative rounded-3xl p-10 border-2 border-white/10 bg-white/2 backdrop-blur-md">
                <div className="text-center">
                  <h3 className="text-4xl font-bold text-white/90 mb-3">Free</h3>
                  <div className="text-3xl font-light text-gray-400 mb-6">€0</div>
                  <p className="text-sm uppercase tracking-wide text-white/50 mb-3">Free Forever</p>
                  <p className="text-lg italic text-white/60 mb-8">Perfect for curious explorers</p>
                  <ul className="space-y-4 text-left max-w-xs mx-auto mb-8">
                    {plans[0].features.map((feature, index) => (
                      <FeatureItem key={index} text={feature} />
                    ))}
                  </ul>
                  <button className="w-full py-3 px-6 rounded-full bg-white/5 border border-white/20 text-white font-medium hover:bg-white/10 transition-all duration-300">
                    Get Started Free
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="premium"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="max-w-4xl mx-auto"
            >
              {/* Premium plan cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Monthly Plan */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative rounded-3xl p-10 border-2 border-white/10 bg-white/2 backdrop-blur-md"
                >
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-white text-black text-xs font-bold px-4 py-1 rounded-full shadow-sm">
                      MOST POPULAR
                    </span>
                  </div>
                  <div className="text-center">
                    <h3 className="text-4xl font-bold text-white/90 mb-3">Premium</h3>
                    <div className="text-3xl font-light text-gray-400 mb-6">€15<span className="text-lg ml-1">/month</span></div>
                    <p className="text-sm uppercase tracking-wide text-white/50 mb-3">Monthly Plan</p>
                    <p className="text-lg italic text-white/60 mb-8">Built for serious job seekers</p>
                    <ul className="space-y-4 text-left max-w-xs mx-auto mb-8">
                      {plans[1].features.map((feature, index) => (
                        <FeatureItem key={index} text={feature} />
                      ))}
                    </ul>
                    <button className="w-full py-3 px-6 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-all duration-300">
                      Start Premium Trial
                    </button>
                  </div>
                </motion.div>

                {/* Annual Plan */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative rounded-3xl p-10 border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent backdrop-blur-md"
                >
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      BEST VALUE
                    </span>
                  </div>
                  <div className="text-center">
                    <h3 className="text-4xl font-bold text-white/90 mb-3">Premium</h3>
                    <div className="text-3xl font-light text-gray-400 mb-6">€120<span className="text-lg ml-1">/year</span></div>
                    <p className="text-sm uppercase tracking-wide text-white/50 mb-3">Annual Plan</p>
                    <p className="text-lg italic text-white/60 mb-8">Save €60 per year</p>
                    <ul className="space-y-4 text-left max-w-xs mx-auto mb-8">
                      {plans[1].features.map((feature, index) => (
                        <FeatureItem key={index} text={feature} />
                      ))}
                    </ul>
                    <button className="w-full py-3 px-6 rounded-full bg-purple-500 text-white font-medium hover:bg-purple-600 transition-all duration-300">
                      Start Annual Plan
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
                </AnimatePresence>
      </div>
    </section>
  );
}
