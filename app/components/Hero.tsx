'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Mail, Zap, Sparkles, Globe, Target } from 'lucide-react';
import { useRef } from 'react';

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-gray-50/50 to-white overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-gray-100 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-gray-100 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.2, 0.3],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative grid grid-cols-12 gap-16 max-w-7xl mx-auto px-6 md:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="col-span-12 lg:col-span-7 space-y-12"
        >
          {/* Premium Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-3 bg-black text-white px-6 py-3 rounded-full text-sm font-medium shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            AI-Powered Job Matching
          </motion.div>

          <motion.h1 
            className="text-6xl md:text-7xl font-black tracking-tight text-black leading-tight"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          >
            Jobping AI: Your{' '}
            <span className="relative">
              Job Wingman
              <motion.div
                className="absolute -bottom-3 left-0 right-0 h-2 bg-black"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 1, ease: "easeOut" }}
              />
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-600 max-w-2xl leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Tailored matches: skills, visa, CV—delivered to your inbox daily. 
            Stop scrolling job boards, start landing interviews.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-6"
          >
            <motion.button
              className="group relative inline-flex items-center justify-center gap-3 bg-black text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-800 transition-all duration-300 shadow-xl hover:shadow-2xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>Match Me Tomorrow</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </motion.button>
            <motion.div 
              className="inline-flex items-center gap-3 text-sm font-mono bg-gray-100 text-black px-6 py-4 rounded-2xl border border-gray-200"
              whileHover={{ scale: 1.02 }}
            >
              <Zap className="w-4 h-4 text-yellow-500" />
              5 Free Jobs/Day • One Signup • Easy Out
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex items-center gap-8 pt-8"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600 font-medium">2,800+ Job Sources</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600 font-medium">AI-Powered Matching</span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          style={{ y, opacity }}
          className="col-span-12 lg:col-span-5 relative"
        >
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, rotateY: -15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl blur-2xl opacity-50" />
              <div className="relative bg-white border border-gray-200 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black">Daily Job Matches</h3>
                    <p className="text-sm text-gray-600">AI-curated for you</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { title: "Frontend Developer", company: "TechCorp", match: "94%", location: "San Francisco" },
                    { title: "Data Analyst", company: "StartupXYZ", match: "87%", location: "Remote" },
                    { title: "Product Manager", company: "InnovateCo", match: "82%", location: "New York" }
                  ].map((job, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200 hover:border-black transition-colors duration-200 group"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-black group-hover:text-black transition-colors">{job.title}</h4>
                        <p className="text-sm text-gray-600">{job.company} • {job.location}</p>
                      </div>
                      <span className="font-mono font-bold text-black bg-white border border-gray-200 rounded-xl px-3 py-1 text-sm">{job.match}</span>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                  className="mt-8 pt-8 border-t border-gray-200"
                >
                  <div className="flex justify-between text-sm">
                    <div><div className="font-bold text-black">2,800+</div><div className="text-gray-600">Job Sources</div></div>
                    <div><div className="font-bold text-black">94%</div><div className="text-gray-600">Match Rate</div></div>
                    <div><div className="font-bold text-black">24h</div><div className="text-gray-600">Delivery</div></div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
