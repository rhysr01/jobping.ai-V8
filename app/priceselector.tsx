'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Users } from 'lucide-react';

const FeatureItem = ({ text, highlight = false }: { text: string; highlight?: boolean }) => (
  <li className={`flex items-start gap-3 text-base ${highlight ? 'text-white' : 'text-white/70'}`}>
    <span className={highlight ? 'font-medium' : 'font-normal'}>{text}</span>
  </li>
);

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'premium' | 'popular' }) => {
  const variants = {
    default: 'bg-white/10 text-white/80 border-white/20',
    premium: 'bg-white/20 text-white border-white/30',
    popular: 'bg-white text-black font-semibold shadow-lg'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border transition-all duration-300 ${variants[variant]}`}>
      {children}
    </span>
  );
};

interface PricingSelectorProps {
  onSelect?: (plan: 'free' | 'premium') => void;
}

export default function PricingSelector({ onSelect }: PricingSelectorProps = {}) {
  const [activeTab, setActiveTab] = useState<'free' | 'premium'>('premium');

  const plans = {
    free: {
      name: 'Starter',
      price: '€0',
      period: 'forever',
      tagline: 'Perfect for exploring daily job opportunity alerts',
      description: 'Everything you need to kick start your job search journey.',
      features: [
        '5 AI-curated job matches daily',
        'Email delivery to your inbox',
        'Basic location filtering',
        'Graduate-focused opportunities',
        'Company insights included'
      ],
      cta: 'Start Free'
    },
    premium: {
      name: 'Professional',
      price: '€15',
      period: 'month',
      tagline: 'Built for ambitious job seekers',
      description: 'Advanced AI matching with premium features for serious candidates with serious job search goals.',
      features: [
        '25 AI-curated job matches DAILY',
        'Priority AI matching algorithm',
        'Advanced filtering & preferences',
        'Direct company contact info',
        'Full access to all features, for those serious about their future'
      ],
      cta: 'Upgrade to Premium'
    }
  };

  return (
    <section className="py-20 px-6 relative">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Choose Your Plan
          </h2>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Join students finding their dream careers with AI precision, make mass applications possible and time efficient.
          </p>
        </motion.div>

        {/* Plan Toggle */}
        <motion.div
          className="flex justify-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="relative p-1.5 rounded-full bg-gray-900 border border-gray-800">
            <div className="relative flex">
              <button
                onClick={() => {
                  setActiveTab('free');
                  onSelect?.('free');
                }}
                className={`relative px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 z-10 ${
                  activeTab === 'free'
                    ? 'text-black bg-white shadow-lg'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Free
              </button>
              <button
                onClick={() => {
                  setActiveTab('premium');
                  onSelect?.('premium');
                }}
                className={`relative px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 z-10 ${
                  activeTab === 'premium'
                    ? 'text-black bg-white shadow-lg'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Premium
              </button>
            </div>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Free Plan */}
          <motion.div
            className={`relative p-8 rounded-2xl border transition-all duration-300 ${
              activeTab === 'free'
                ? 'bg-gray-900 border-gray-700 shadow-xl'
                : 'bg-gray-950 border-gray-800 opacity-60'
            }`}
            whileHover={{ y: -4 }}
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">{plans.free.name}</h3>
              <div className="flex items-baseline justify-center gap-2 mb-4">
                <span className="text-4xl font-bold text-white">{plans.free.price}</span>
                <span className="text-white/60">/{plans.free.period}</span>
              </div>
              <p className="text-white/60 text-sm">{plans.free.tagline}</p>
            </div>
            <ul className="space-y-4 mb-8">
              {plans.free.features.map((feature, index) => (
                <FeatureItem key={index} text={feature} />
              ))}
            </ul>
            <button
              onClick={() => onSelect?.('free')}
              className="w-full py-3 px-6 bg-white text-black rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              {plans.free.cta}
            </button>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            className={`relative p-8 rounded-2xl border transition-all duration-300 ${
              activeTab === 'premium'
                ? 'bg-gray-900 border-gray-700 shadow-xl'
                : 'bg-gray-950 border-gray-800 opacity-60'
            }`}
            whileHover={{ y: -4 }}
          >
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge variant="popular">Most Popular</Badge>
            </div>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">{plans.premium.name}</h3>
              <div className="flex items-baseline justify-center gap-2 mb-4">
                <span className="text-4xl font-bold text-white">{plans.premium.price}</span>
                <span className="text-white/60">/{plans.premium.period}</span>
              </div>
              <p className="text-white/60 text-sm">{plans.premium.tagline}</p>
            </div>
            <ul className="space-y-4 mb-8">
              {plans.premium.features.map((feature, index) => (
                <FeatureItem key={index} text={feature} highlight={index < 2} />
              ))}
            </ul>
            <button
              onClick={() => onSelect?.('premium')}
              className="w-full py-3 px-6 bg-white text-black rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              {plans.premium.cta}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
