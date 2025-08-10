'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Mail, Shield, Zap } from 'lucide-react';

export function Signup() {
  const [progress, setProgress] = useState(33);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    // Simulate progress updates
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 33;
      });
      
      setCurrentStep(prev => {
        if (prev >= 3) return 3;
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 bg-gradient-to-b from-black to-gray-900 text-white relative overflow-hidden" id="signup">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-gray-800 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-gray-800 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="max-w-md mx-auto px-6 relative z-10"
      >
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">AI-Powered Matching</span>
          </motion.div>

          <motion.h2 
            className="text-4xl font-bold uppercase text-center mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Launch Now
          </motion.h2>
          
          <motion.p 
            className="text-lg opacity-80 text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Personalized: Skills, Visa, CV Matches
          </motion.p>
        </motion.div>
        
        <motion.div
          className="bg-white p-8 border border-gray-200 rounded-2xl shadow-2xl relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {/* Premium Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-400 to-transparent rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-gray-400 to-transparent rounded-full translate-y-12 -translate-x-12" />
          </div>

          <div className="relative">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Setup Progress</span>
                <span className="text-sm font-mono text-gray-600">{currentStep}/3</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-black to-gray-700 rounded-full"
                  initial={{ width: '33%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs font-mono text-gray-500">
                  {progress}% Complete
                </span>
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-gray-500">Secure</span>
                </div>
              </div>
            </div>
            
            {/* Form Container */}
            <div className="relative">
              <iframe
                className="h-[400px] md:h-[500px] w-full border-none focus-visible:ring-2 ring-black rounded-lg"
                src="https://tally.so/r/mJEqx4?alignLeft=1&transparentBackground=1&hideTitle=1"
                title="Jobping Signup Form"
                aria-label="Jobping signup form"
              />
            </div>
          </div>
        </motion.div>
        
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="flex items-center justify-center gap-6 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>No spam</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Unsubscribe anytime</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
