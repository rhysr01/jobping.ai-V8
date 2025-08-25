'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Menu } from 'lucide-react';

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 bg-[#0B0B0F]/95 backdrop-blur-md border-b border-[#374151]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section - Typography-First Design */}
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="jobping-logo">
              <span className="job">Job</span>
              <span className="ping">Ping</span>
            </h1>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a 
              href="#features" 
              className="text-[#9CA3AF] hover:text-white transition-colors duration-200 text-sm font-medium"
            >
              Features
            </a>
            <a 
              href="#pricing" 
              className="text-[#9CA3AF] hover:text-white transition-colors duration-200 text-sm font-medium"
            >
              Pricing
            </a>
            <button className="bg-white text-[#0B0B0F] px-6 py-2 rounded-lg font-semibold hover:bg-[#F8F9FA] transition-all duration-200 text-sm flex items-center gap-2">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-[#9CA3AF] hover:text-white p-2 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.header>
  );
}