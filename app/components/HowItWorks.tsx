'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Target, Search, Mail } from 'lucide-react';

const steps = [
  {
    icon: Target,
    title: 'Tell us what you want',
    body: 'Role, location, visa needs.',
  },
  {
    icon: Search,
    title: 'We find hidden jobs',
    body: '2,800+ sources, fresh only.',
  },
  {
    icon: Mail,
    title: 'Get matched daily',
    body: 'Curated opportunities in your inbox.',
  },
];

export default function HowItWorks() {
  const prefersReduced = useReducedMotion();



  return (
    <section
      id="how"
      className="scroll-mt-[96px] border-t border-[#374151] bg-transparent"
      aria-labelledby="how-heading"
    >
      <div className="container-frame py-24 md:py-32">
        <motion.h2
          initial={prefersReduced ? undefined : { opacity: 0, y: 20 }}
          whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          id="how-heading"
          className="text-[#F8F9FA] font-bold text-4xl lg:text-5xl mb-20 text-center"
        >
          How it works
        </motion.h2>

        <motion.ul
          initial={prefersReduced ? undefined : {}}
          whileInView={prefersReduced ? undefined : {}}
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-16"
        >
          {steps.map(({ icon: Icon, title, body }, index) => (
            <motion.li
              key={title}
              initial={prefersReduced ? undefined : { opacity: 0, y: 20 }}
              whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-8 border border-white/10">
                  <Icon size={28} className="text-white" aria-hidden />
                </div>
                <h3 className="text-[#F8F9FA] font-semibold text-2xl mb-4">
                  {title}
                </h3>
                <p className="text-[#9CA3AF] text-lg leading-relaxed max-w-xs">
                  {body}
                </p>
              </div>
            </motion.li>
          ))}
        </motion.ul>

        <motion.p
          initial={prefersReduced ? undefined : { opacity: 0, y: 20 }}
          whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center text-[#6B7280] text-base"
        >
          Built from company career pages and major boards. GDPR compliant.
        </motion.p>
      </div>
    </section>
  );
}
