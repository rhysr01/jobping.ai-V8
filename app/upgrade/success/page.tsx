'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import LogoWordmark from '@/components/LogoWordmark';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const isPromo = searchParams.get('promo') === 'rhys';

  return (
    <div className="min-h-screen premium-bg flex items-center justify-center px-6 py-20">
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <LogoWordmark />
        </motion.div>

        {/* Success card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-card rounded-2xl p-8 md:p-10"
        >
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.4 
            }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center"
          >
            <svg 
              className="w-10 h-10 text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={3} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {isPromo ? '🎉 Welcome to Premium!' : '✅ Payment Successful!'}
          </h1>
          
          <p className="text-zinc-300 text-lg mb-8">
            {isPromo 
              ? 'Your premium account has been activated with the promo code. Enjoy free premium access!'
              : 'Your premium subscription is now active. You\'ll receive 3 emails per week with 5 hand-picked job matches each.'
            }
          </p>

          {/* What's Next */}
          <div className="bg-zinc-900/50 rounded-xl p-6 mb-6 text-left">
            <h2 className="text-xl font-semibold mb-4">What's next?</h2>
            <ul className="space-y-3 text-zinc-300">
              <li className="flex items-start">
                <span className="text-brand-400 mr-2">→</span>
                <span>Check your inbox for a welcome email</span>
              </li>
              <li className="flex items-start">
                <span className="text-brand-400 mr-2">→</span>
                <span>You'll receive 5 instant job matches within 30 seconds</span>
              </li>
              <li className="flex items-start">
                <span className="text-brand-400 mr-2">→</span>
                <span>Premium: Get 3 emails per week (Mon/Wed/Fri at 7:30 AM)</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <Link 
            href="/"
            className="inline-block px-8 py-4 bg-gradient-to-r from-brand-500 to-purple-600 rounded-2xl font-semibold hover:shadow-elev-2 transition"
          >
            Back to Homepage
          </Link>
        </motion.div>

        <p className="mt-6 text-sm text-zinc-400">
          Questions? Email us at support@getjobping.com
        </p>
      </div>
    </div>
  );
}

export default function UpgradeSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen premium-bg flex items-center justify-center">
        <div className="text-center">
          <LogoWordmark />
          <p className="mt-4 text-zinc-400">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

