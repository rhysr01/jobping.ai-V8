'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, Check, Sparkles } from 'lucide-react';

const FeatureItem = ({ text, highlight = false }: { text: string; highlight?: boolean }) => (
  <li className={`flex items-start gap-4 text-base ${highlight ? 'text-black' : 'text-gray-600'}`}>
    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
      highlight ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
    }`}>
      <Check className="w-3 h-3" />
    </div>
    <span className={highlight ? 'font-medium' : 'font-normal'}>{text}</span>
  </li>
);

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'premium' | 'popular' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-600 border-gray-200',
    premium: 'bg-black text-white border-black',
    popular: 'bg-gradient-to-r from-black to-gray-800 text-white font-semibold shadow-xl'
  };

  return (
    <span className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm border transition-all duration-300 ${variants[variant]}`}>
      {variant === 'popular' && <Sparkles className="w-4 h-4" />}
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
      name: 'Free',
      price: '$0',
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
      cta: 'Start Free',
      icon: Zap
    },
    premium: {
      name: 'Premium',
      price: '$9',
      period: 'month',
      tagline: 'Built for ambitious job seekers',
      description: 'Advanced AI matching with premium features for serious candidates.',
      features: [
        '15 AI-curated job matches DAILY',
        'Priority AI matching algorithm',
        'Advanced filtering & preferences',
        'Direct company contact info',
        'Full access to all features'
      ],
      cta: 'Start Premium',
      icon: Crown
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Plan Toggle */}
      <motion.div
        className="flex justify-center mb-24"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.1 }}
      >
        <div className="relative p-2 rounded-2xl bg-gray-100 border border-gray-200 shadow-lg">
          <div className="relative flex">
            <button
              onClick={() => {
                setActiveTab('free');
                onSelect?.('free');
              }}
              className={`relative px-12 py-4 rounded-xl text-sm font-semibold transition-all duration-300 z-10 ${
                activeTab === 'free'
                  ? 'text-black bg-white shadow-xl'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Free
            </button>
            <button
              onClick={() => {
                setActiveTab('premium');
                onSelect?.('premium');
              }}
              className={`relative px-12 py-4 rounded-xl text-sm font-semibold transition-all duration-300 z-10 ${
                activeTab === 'premium'
                  ? 'text-black bg-white shadow-xl'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Premium
            </button>
          </div>
        </div>
      </motion.div>

      {/* Pricing Cards */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {/* Free Plan */}
        <motion.div
          className={`relative p-16 rounded-3xl border transition-all duration-500 ${
            activeTab === 'free'
              ? 'bg-white border-black shadow-2xl'
              : 'bg-gray-50 border-gray-200 opacity-60'
          }`}
          whileHover={{ y: -16 }}
        >
          <div className="text-center mb-16">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center">
                <plans.free.icon className="w-10 h-10 text-white" />
              </div>
            </div>
            <h3 className="text-4xl font-bold text-black mb-6">{plans.free.name}</h3>
            <div className="flex items-baseline justify-center gap-3 mb-8">
              <span className="text-7xl font-black text-black">{plans.free.price}</span>
              <span className="text-2xl text-gray-600">/{plans.free.period}</span>
            </div>
            <p className="text-gray-600 text-xl">{plans.free.tagline}</p>
          </div>
          <ul className="space-y-8 mb-16">
            {plans.free.features.map((feature, index) => (
              <FeatureItem key={index} text={feature} />
            ))}
          </ul>
          <motion.button
            onClick={() => onSelect?.('free')}
            className="w-full py-8 px-8 border-2 border-black text-black rounded-2xl font-semibold text-xl hover:bg-black hover:text-white transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {plans.free.cta}
          </motion.button>
        </motion.div>

        {/* Premium Plan */}
        <motion.div
          className={`relative p-16 rounded-3xl border transition-all duration-500 ${
            activeTab === 'premium'
              ? 'bg-black border-black shadow-2xl text-white'
              : 'bg-gray-900 border-gray-800 opacity-60 text-white'
          }`}
          whileHover={{ y: -16 }}
        >
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
            <Badge variant="popular">Most Popular</Badge>
          </div>
          <div className="text-center mb-16">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center">
                <plans.premium.icon className="w-10 h-10 text-black" />
              </div>
            </div>
            <h3 className="text-4xl font-bold text-white mb-6">{plans.premium.name}</h3>
            <div className="flex items-baseline justify-center gap-3 mb-8">
              <span className="text-7xl font-black text-white">{plans.premium.price}</span>
              <span className="text-2xl text-white/60">/{plans.premium.period}</span>
            </div>
            <p className="text-white/60 text-xl">{plans.premium.tagline}</p>
          </div>
          <ul className="space-y-8 mb-16">
            {plans.premium.features.map((feature, index) => (
              <FeatureItem key={index} text={feature} highlight={index < 2} />
            ))}
          </ul>
          <motion.button
            onClick={() => onSelect?.('premium')}
            className="w-full py-8 px-8 bg-white text-black rounded-2xl font-semibold text-xl hover:bg-gray-100 transition-all duration-300 shadow-xl"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {plans.premium.cta}
          </motion.button>
        </motion.div>
      </motion.div>
      
      {/* Trust Indicators */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="text-center mt-24"
      >
        <p className="text-lg text-gray-500">
          Trusted by 10,000+ students • No credit card required • Cancel anytime
        </p>
      </motion.div>
    </div>
  );
}
