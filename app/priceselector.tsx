'use client';

import { motion } from 'framer-motion';
import { Zap, Crown, Check } from 'lucide-react';

interface PricingSelectorProps {
  onSelect?: (plan: 'free' | 'premium') => void;
}

export default function PricingSelector({ onSelect }: PricingSelectorProps = {}) {
  const plans = {
    free: {
      name: 'Free',
      price: '€0',
      period: 'forever',
      tagline: 'Perfect for exploring job opportunities at your own pace',
      features: [
        '6 AI-curated jobs per week',
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
      price: '€15',
      period: 'month',
      tagline: 'Built for ambitious job seekers',
      features: [
        '15 AI-curated jobs every 48 hours',
        'Priority AI matching algorithm',
        'Advanced filtering & preferences',
        'Direct company contact info',
        'Salary range transparency',
        'Visa sponsorship verification'
      ],
      cta: 'Start Premium',
      icon: Crown
    }
  };

  return (
    <section id="pricing" className="py-20 px-6 bg-gradient-to-b from-[#0B0B0F] to-[#151519]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-[#F8F9FA] font-bold text-4xl lg:text-5xl mb-6 tracking-tight"
          >
            Choose Your Plan
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[#9CA3AF] text-xl max-w-2xl mx-auto leading-relaxed"
          >
            Start free and upgrade when you&apos;re ready. No contracts, cancel anytime.
          </motion.p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Free Plan Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="pricing-free card"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#4B5563] to-[#6B7280] rounded-2xl mb-6">
                <plans.free.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-[#F8F9FA] font-bold text-2xl mb-2">{plans.free.name}</h3>
              <div className="mb-4">
                <span className="text-[#F8F9FA] font-black text-5xl">{plans.free.price}</span>
                <span className="text-[#6B7280] text-lg ml-2">/{plans.free.period}</span>
              </div>
              <p className="text-[#9CA3AF] leading-relaxed">
                {plans.free.tagline}
              </p>
            </div>
            
            <ul className="space-y-4 mb-8">
              {plans.free.features.map((feature, index) => (
                <li key={index} className="feature-item">
                  <div className="feature-check">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="feature-text">{feature}</span>
                </li>
              ))}
            </ul>
            
            <button 
              onClick={() => onSelect?.('free')}
              className="btn-secondary w-full py-4 text-lg font-semibold"
            >
              {plans.free.cta}
            </button>
          </motion.div>

          {/* Premium Plan Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="pricing-premium card-premium relative"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-6">
                <plans.premium.icon className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-[#F8F9FA] font-bold text-2xl mb-2">{plans.premium.name}</h3>
              <div className="mb-4">
                <span className="text-[#F8F9FA] font-black text-5xl">{plans.premium.price}</span>
                <span className="text-[#9CA3AF] text-lg ml-2">/{plans.premium.period}</span>
              </div>
              <p className="text-[#9CA3AF] leading-relaxed">
                {plans.premium.tagline}
              </p>
            </div>
            
            <ul className="space-y-4 mb-8">
              {plans.premium.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-black" />
                  </div>
                  <span className="text-[#D1D5DB] font-medium">{feature}</span>
                </li>
              ))}
            </ul>
            
            <button 
              onClick={() => onSelect?.('premium')}
              className="btn-primary w-full py-4 text-lg font-semibold"
            >
              {plans.premium.cta}
            </button>
          </motion.div>
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-[#6B7280] text-lg">
            No credit card required • Cancel anytime • GDPR compliant
          </p>
        </motion.div>
      </div>
    </section>
  );
}