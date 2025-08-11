'use client';

import { motion } from 'framer-motion';
import { Brain, Globe, Target, Zap, Shield, Mail } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Matching',
    description: 'Advanced algorithms match your skills, experience, and visa status with relevant opportunities',
    color: 'text-black'
  },
  {
    icon: Globe,
    title: '2,800+ Job Sources',
    description: 'Scans Greenhouse, Lever, Workday, RemoteOK, and more for hidden opportunities',
    color: 'text-black'
  },
  {
    icon: Target,
    title: 'Visa-Friendly Filtering',
    description: 'Automatically filters jobs that support your visa status and work authorization',
    color: 'text-black'
  },
  {
    icon: Zap,
    title: '48-Hour Delivery',
    description: 'Fresh job matches delivered to your inbox every 48 hours, ready to apply',
    color: 'text-black'
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data is encrypted and never shared. Unsubscribe anytime with one click',
    color: 'text-black'
  },
  {
    icon: Mail,
    title: 'Smart Notifications',
    description: 'Get notified about high-match opportunities and application deadlines',
    color: 'text-black'
  }
];

export function Features() {
  return (
    <section className="py-16 bg-gray-50" id="features">
      <div className="max-w-screen-xl mx-auto px-6">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-black uppercase mb-4">
            Why Jobping AI?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Built by students, for students. Stop scrolling job boards and start landing interviews.
          </p>
        </motion.div>

        <div className="grid grid-cols-12 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="col-span-12 md:col-span-6 lg:col-span-4"
            >
              <div className="bg-white border border-gray-200 rounded-sm p-6 h-full hover:border-black hover:shadow-sm transition-all duration-150 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gray-100 rounded-sm group-hover:bg-black group-hover:text-white transition-all duration-150">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-black group-hover:text-black">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
