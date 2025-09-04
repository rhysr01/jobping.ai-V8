'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Play, Shield, Clock, Mail } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative bg-[#0B0B0F] pt-32 pb-24 px-6 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-[#1F1F23]/10 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-pattern opacity-30"></div>
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-[#10B981]/20 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-tl from-[#3B82F6]/20 to-transparent rounded-full blur-3xl"></div>
      
      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Main Headline - CLEAR & FUNCTIONAL */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-[#F8F9FA] font-extrabold text-4xl sm:text-6xl lg:text-8xl leading-tight tracking-tight mb-6 sm:mb-8"
        >
          Get EU Tech Jobs
          <br />
          <span className="text-[#10B981]">Delivered to Your Inbox</span>
        </motion.h1>

        {/* Subheadline - WHAT IT DOES */}
        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-[#9CA3AF] text-lg sm:text-xl lg:text-2xl leading-relaxed mb-12 max-w-4xl mx-auto"
        >
          AI-curated job matches from 2,800+ sources.
          <br />
          <span className="text-[#D1D5DB] font-semibold">No more job board hunting.</span>
        </motion.p>

        {/* Value Props - SPECIFIC & REAL */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mb-16 text-[#D1D5DB] text-sm sm:text-base font-medium"
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
            <span>Visa-friendly roles prioritized</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
            <span>Early-career focused</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
            <span>EU/UK locations only</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
            <span>Fresh opportunities daily</span>
          </div>
        </motion.div>

        {/* CTA Buttons - CLEAR ACTION */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
        >
          <a href="#signup" className="premium-button bg-[#10B981] text-white px-8 sm:px-12 py-4 sm:py-6 rounded-2xl font-bold text-lg sm:text-xl hover:bg-[#059669] transition-all duration-300 flex items-center gap-3 shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] active:scale-[0.98] min-h-[56px]">
            Start Getting Job Matches
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </a>
          <a href="#preview" className="text-[#D1D5DB] hover:text-white font-medium text-lg sm:text-xl flex items-center gap-3 transition-colors">
            <Play className="w-5 h-5 sm:w-6 sm:h-6" />
            See Email Preview
          </a>
        </motion.div>

        {/* Trust Indicators - REAL FACTS */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-[#6B7280] text-sm sm:text-base"
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
            <span>Unsubscribe anytime</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}