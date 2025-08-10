'use client';

import { motion } from 'framer-motion';

export default function Header() {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 bg-white/95 backdrop-blur-sm z-50 border-b border-gray-200"
    >
      <div className="max-w-screen-xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <motion.h1 
            className="text-base font-bold text-black uppercase tracking-wide"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            Jobping AI
          </motion.h1>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a 
              href="#features" 
              className="text-sm font-medium text-gray-600 hover:text-black transition-colors duration-150"
            >
              Features
            </a>
            <a 
              href="#pricing" 
              className="text-sm font-medium text-gray-600 hover:text-black transition-colors duration-150"
            >
              Pricing
            </a>
            <a 
              href="#signup" 
              className="text-sm font-medium text-gray-600 hover:text-black transition-colors duration-150"
            >
              Sign Up
            </a>
          </nav>
        </div>
      </div>
    </motion.header>
  );
}
