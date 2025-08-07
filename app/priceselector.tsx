'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, Sparkles, Zap, Users, Crown } from 'lucide-react';

const FeatureItem = ({ text, highlight = false }: { text: string; highlight?: boolean }) => (
  <li className={`flex items-start gap-3 text-base ${highlight ? 'text-white' : 'text-white/70'}`}>
    <CheckCircleIcon className={`w-5 h-5 ${highlight ? 'text-white' : 'text-white/50'} flex-shrink-0 mt-0.5`} />
    <span className={highlight ? 'font-medium' : 'font-normal'}>{text}</span>
  </li>
);

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'premium' | 'popular' }) => {
  const variants = {
    default: 'bg-white/10 text-white/80 border-white/20',
    premium: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border-purple-400/30',
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
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const plans = {
    free: {
      name: 'Starter',
      price: '€0',
      period: 'forever',
      tagline: 'Perfect for exploring opportunities',
      description: 'Everything you need to start your job search journey.',
      features: [
        '5 AI-curated job matches daily',
        'Email delivery to your inbox',
        'Basic location filtering',
        'Graduate-focused opportunities',
        'Company insights included'
      ],
      cta: 'Start Free',
      popular: false
    },
    premium: {
      name: 'Professional',
      price: '€15',
      period: 'month',
      originalPrice: '€25',
      tagline: 'Built for ambitious job seekers',
      description: 'Advanced AI matching with premium features for serious candidates.',
      features: [
        '25 AI-curated job matches daily',
        'Priority AI matching algorithm',
        'Advanced filtering & preferences',
        'Salary insights & negotiation tips',
        'Application tracking dashboard',
        'Interview preparation resources',
        'Direct company contact info',
        'Premium support & career coaching'
      ],
      cta: 'Start Premium Trial',
      popular: true,
      savings: 'Save 40%'
    }
  };

  const testimonials = [
    { text: "Found my dream role at Goldman Sachs in 3 days", author: "Sarah M.", company: "IE University" },
    { text: "The AI matching is incredibly accurate", author: "Marcus L.", company: "London Business School" },
    { text: "Saved me hours of job board scrolling", author: "Emma R.", company: "ESADE" }
  ];

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
            Join 10,000+ students finding their dream careers with AI precision
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
          <div className="relative p-1.5 rounded-full glass-card">
            <div className="relative flex">
              <button
                onClick={() => {
                  setActiveTab('free');
                  onSelect?.('free');
                }}
                className={`relative px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 z-10 ${
                  activeTab === 'free' ? 'text-black' : 'text-white/70 hover:text-white/90'
                }`}
              >
                Starter
              </button>
              <button
                onClick={() => {
                  setActiveTab('premium');
                  onSelect?.('premium');
                }}
                className={`relative px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 z-10 flex items-center gap-2 ${
                  activeTab === 'premium' ? 'text-black' : 'text-white/70 hover:text-white/90'
                }`}
              >
                Professional
                <Crown className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {/* Sliding background */}
            <motion.div
              className="absolute top-1.5 h-[calc(100%-12px)] bg-white rounded-full shadow-lg"
              animate={{
                x: activeTab === 'free' ? 6 : 'calc(100% - 6px)',
                width: activeTab === 'free' ? 72 : 110,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
          >
            {activeTab === 'free' ? (
              // Free Plan - Single Card
              <div className="max-w-md mx-auto">
                <motion.div
                  className="pricing-card p-8 text-center relative"
                  whileHover={{ y: -6 }}
                  onHoverStart={() => setHoveredCard('free')}
                  onHoverEnd={() => setHoveredCard(null)}
                >
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{plans.free.name}</h3>
                    <p className="text-white/60 text-sm mb-4">{plans.free.tagline}</p>
                  </div>

                  <div className="mb-8">
                    <div className="text-4xl font-bold text-white mb-1">
                      {plans.free.price}
                      <span className="text-lg font-normal text-white/60 ml-1">/{plans.free.period}</span>
                    </div>
                    <p className="text-white/50 text-sm">{plans.free.description}</p>
                  </div>

                  <ul className="space-y-4 text-left mb-8">
                    {plans.free.features.map((feature, index) => (
                      <FeatureItem key={index} text={feature} />
                    ))}
                  </ul>

                  <button className="w-full glass-button py-4 text-base font-semibold">
                    {plans.free.cta}
                  </button>
                </motion.div>
              </div>
            ) : (
              // Premium Plans - Multiple Options
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* Monthly Plan */}
                <motion.div
                  className="pricing-card pricing-card-premium p-8 relative"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  onHoverStart={() => setHoveredCard('monthly')}
                  onHoverEnd={() => setHoveredCard(null)}
                >
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge variant="popular">
                      <Users className="w-3 h-3" />
                      MOST POPULAR
                    </Badge>
                  </div>

                  <div