'use client';

import { motion } from 'framer-motion';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-8 px-6">
      <div className="grid grid-cols-12 gap-6 max-w-screen-xl mx-auto">
        <motion.div 
          className="col-span-12 md:col-span-3 text-base font-bold text-black uppercase tracking-wide"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Jobping AI
        </motion.div>
        
        <motion.div 
          className="col-span-12 md:col-span-9 space-y-4 md:flex md:space-x-8 md:space-y-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <ul className="text-xs font-medium text-gray-600 list-none space-y-2">
            <li>
              <a 
                href="#features" 
                className="hover:text-black hover:underline transition-all duration-150"
              >
                AI Matching
              </a>
            </li>
            <li>
              <a 
                href="#features" 
                className="hover:text-black hover:underline transition-all duration-150"
              >
                Visa Support
              </a>
            </li>
            <li>
              <a 
                href="#features" 
                className="hover:text-black hover:underline transition-all duration-150"
              >
                48-Hour Delivery
              </a>
            </li>
          </ul>
          
          <ul className="text-xs font-medium text-gray-600 list-none space-y-2">
            <li>
              <a 
                href="/privacy" 
                className="hover:text-black hover:underline transition-all duration-150"
              >
                Privacy
              </a>
            </li>
            <li>
              <a 
                href="/terms" 
                className="hover:text-black hover:underline transition-all duration-150"
              >
                Terms
              </a>
            </li>
            <li>
              <a 
                href="/contact" 
                className="hover:text-black hover:underline transition-all duration-150"
              >
                Contact
              </a>
            </li>
          </ul>
        </motion.div>
      </div>
      
      <motion.div 
        className="text-center mt-8 pt-8 border-t border-gray-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <p className="text-xs text-gray-600">
          AI Career Edge © 2025
        </p>
      </motion.div>
    </footer>
  );
}
