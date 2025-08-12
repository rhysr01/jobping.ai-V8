'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Play, Shield, Clock, Mail } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative bg-[#0B0B0F] pt-20 pb-16 px-6 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-[#1F1F23]/20 via-transparent to-transparent"></div>
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-[#F8F9FA] font-extrabold text-5xl sm:text-6xl lg:text-7xl leading-tight tracking-tight mb-6"
        >
          Stop Job Hunting.
          <br />
          <span className="text-[#D1D5DB]">Get Jobs Emailed Daily.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-[#9CA3AF] text-lg sm:text-xl leading-relaxed mb-10 max-w-3xl mx-auto"
        >
          AI-powered job matching for students & graduates. 2,800+ sources scraped daily. 
          Visa-friendly roles delivered to your inbox every 48 hours.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <button className="bg-white text-[#0B0B0F] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#F8F9FA] transition-all duration-200 flex items-center gap-3 shadow-xl">
            Start Getting Jobs
            <ArrowRight className="w-5 h-5" />
          </button>
          <button className="text-[#D1D5DB] hover:text-white font-medium text-lg flex items-center gap-2 transition-colors">
            <Play className="w-5 h-5" />
            See How It Works
          </button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-6 text-[#6B7280] text-sm"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span>GDPR compliant</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}