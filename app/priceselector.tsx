'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon } from 'lucide-react';

const FeatureItem = ({ text }: { text: string }) => (
  <li className="flex items-center gap-3 text-base text-gray-300">
    <CheckCircleIcon className="w-4 h-4 text-white/60 flex-shrink-0" />
    {text}
  </li>
);

interface PricingSelectorProps {
  onSelect?: (plan: 'free' | 'premium') => void;
}

export default function PricingSelector({ onSelect }: PricingSelectorProps = {}) {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium' | null>(null);

  const plans = [
    {
      name: 'Free',
      price: '€0',
      tier: 'FREE FOREVER',
      tagline: 'Perfect for exploring opportunities',
      features: ['5 job matches daily', 'Email delivery', 'Basic filtering'],
      value: 'free' as const
    },
    {
      name: 'Premium',
      price: '€15',
      tier: 'MONTHLY PLAN',
      tagline: 'Built for serious job seekers',
      features: ['15 job matches daily', 'Priority AI matching', 'Advanced filters', 'Custom preferences'],
      value: 'premium' as const,
      highlight: true
    }
  ];

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="text-center mb-12">
        <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Choose Your Plan
        </h3>
        <p className="text-lg text-gray-400 italic">
          No boards. No filters. Just jobs.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto relative">
        {/* Floating bubbles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ 
              x: [0, 30, -20, 0], 
              y: [0, -25, 15, 0],
              scale: [1, 1.1, 0.9, 1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-3 h-3 bg-gray-400/20 rounded-full blur-sm"
          />
          <motion.div
            animate={{ 
              x: [0, -25, 20, 0], 
              y: [0, 20, -15, 0],
              scale: [1, 0.8, 1.2, 1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-1/3 right-1/3 w-2 h-2 bg-gray-300/15 rounded-full blur-sm"
          />
          <motion.div
            animate={{ 
              x: [0, 15, -10, 0], 
              y: [0, -15, 25, 0],
              scale: [1, 1.3, 0.7, 1]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute bottom-1/4 left-1/2 w-2.5 h-2.5 bg-gray-400/10 rounded-full blur-sm"
          />
          <motion.div
            animate={{ 
              x: [0, -20, 35, 0], 
              y: [0, 30, -20, 0],
              scale: [1, 0.9, 1.4, 1]
            }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-gray-300/20 rounded-full blur-sm"
          />
        </div>

        {plans.map((plan) => (
          <motion.div
            key={plan.name}
            onClick={() => {
              setSelectedPlan(plan.value);
              onSelect?.(plan.value);
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative cursor-pointer rounded-full p-10 border backdrop-blur-md transition-all duration-300
              ${selectedPlan === plan.value 
                ? 'border-white/40 bg-white/[0.08] shadow-2xl shadow-white/20 ring-2 ring-white/10' 
                : 'border-white/20 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.05] hover:shadow-lg hover:shadow-white/5'
              }
            `}
          >
            {/* Highlight Badge */}
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-white text-black text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </span>
              </div>
            )}

            {/* Plan Content */}
            <div className="text-center">
              {/* Plan Name - exactly text-4xl as specified */}
              <h4 className="text-4xl font-bold text-white/90 mb-3">
                {plan.name}
              </h4>

              {/* Price - exactly text-3xl, lighter gray, spaced apart */}
              <div className="mb-6">
                <span className="text-3xl font-light text-gray-400">
                  {plan.price}
                </span>
                {plan.value === 'premium' && (
                  <span className="text-lg text-gray-500 ml-2">/month</span>
                )}
              </div>

              {/* Tier Label - text-sm, all caps, subtle gray */}
              <p className="text-sm uppercase tracking-wider text-gray-500 mb-4">
                {plan.tier}
              </p>

              {/* Tagline - italic, light gray, text-lg */}
              <p className="text-lg italic text-gray-400 mb-8">
                {plan.tagline}
              </p>

              {/* Features */}
              <ul className="space-y-4 text-left max-w-xs mx-auto">
                {plan.features.map((feature, index) => (
                  <FeatureItem key={index} text={feature} />
                ))}
              </ul>
            </div>

            {/* Selection Indicator */}
            {selectedPlan === plan.value && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4 w-6 h-6 bg-white rounded-full flex items-center justify-center"
              >
                <CheckCircleIcon className="w-4 h-4 text-black" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Bottom Spacing */}
      <div className="h-8" />
    </div>
  );
}
