'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon } from 'lucide-react';

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
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium' | null>(null);

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
    <section id="plans" className="py-32 px-6 relative bg-[#0A0A0A] border-t border-white/10">
      <div className="text-center mb-16">
        <h2 className="text-5xl md:text-6xl font-semibold text-white/90 mb-4">Choose Your Plan</h2>
        <p className="text-xl italic text-white/60">No boards. No filters. Just jobs — delivered.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto relative">
        {/* Floating bubbles with gradient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ x: [0, 30, -20, 0], y: [0, -25, 15, 0], scale: [1, 1.1, 0.9, 1] }}
              transition={{ duration: 10 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: i }}
              className={`absolute w-3 h-3 rounded-full blur-sm bg-gradient-to-br from-white/10 to-transparent ${
                i % 2 === 0 ? 'top-1/4 left-1/4' : 'bottom-1/3 right-1/4'
              }`}
            />
          ))}
        </div>

        {plans.map((plan) => (
          <motion.div
            key={plan.name}
            onClick={() => {
              setSelectedPlan(plan.value);
              onSelect?.(plan.value);
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`relative cursor-pointer rounded-3xl p-10 border-2 backdrop-blur-md transition-all duration-300 ${
              selectedPlan === plan.value
                ? 'border-white/40 bg-white/5 shadow-xl ring-2 ring-white/10'
                : 'border-white/10 bg-white/2 hover:border-white/20 hover:bg-white/5 hover:shadow-lg'
            }`}
          >
            {/* Badge */}
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-white text-black text-xs font-bold px-4 py-1 rounded-full shadow-sm">
                  MOST POPULAR
                </span>
              </div>
            )}

            <div className="text-center">
              <h3 className="text-4xl font-bold text-white/90 mb-3">{plan.name}</h3>
              <div className="text-3xl font-light text-gray-400 mb-6">
                {plan.price} {plan.value === 'premium' && <span className="text-lg ml-1">/month</span>}
              </div>
              <p className="text-sm uppercase tracking-wide text-white/50 mb-3">{plan.tier}</p>
              <p className="text-lg italic text-white/60 mb-8">{plan.tagline}</p>
              <ul className="space-y-4 text-left max-w-xs mx-auto">
                {plan.features.map((feature, index) => (
                  <FeatureItem key={index} text={feature} />
                ))}
              </ul>
            </div>

            {/* Selection marker */}
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
    </section>
  );
}
