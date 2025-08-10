'use client';

import { motion } from 'framer-motion';
import { UserCheck, Search, Mail } from 'lucide-react';

const steps = [
  { 
    number: '01', 
    title: 'Signup (2 Min)', 
    detail: 'Skills & visa matched',
    icon: UserCheck
  },
  { 
    number: '02', 
    title: 'AI Scans 2,800+ Sites', 
    detail: 'Hidden gems found',
    icon: Search
  },
  { 
    number: '03', 
    title: 'Inbox Jobs, Apply First', 
    detail: 'First-applicant edge',
    icon: Mail
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 bg-white">
      <div className="grid grid-cols-12 gap-6 p-6 md:p-12 max-w-screen-xl mx-auto">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="col-span-12 md:col-span-4 bg-gray-50 border border-gray-200 rounded-sm p-6 flex flex-col items-start transition-all duration-150 group hover:bg-black hover:text-white hover:border-black"
            role="listitem"
          >
            <motion.div
              className="flex items-center gap-3 mb-4"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <step.icon className="w-6 h-6 text-gray-400 group-hover:text-white" />
              <motion.span
                className="text-4xl font-black text-gray-200 group-hover:text-white"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3, times: [0, 0.5, 1] }}
              >
                {step.number}
              </motion.span>
            </motion.div>
            
            <h3 className="font-mono text-lg font-bold text-black group-hover:text-white mb-2">
              {step.title}
            </h3>
            <p className="text-xs text-gray-600 group-hover:text-white/80">
              {step.detail}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
