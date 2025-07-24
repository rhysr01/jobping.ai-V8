'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircleIcon, ZapIcon } from 'lucide-react';

const FeatureItem = ({ text }: { text: string }) => (
  <li className="flex items-center gap-2 text-sm text-gray-300">
    <CheckCircleIcon className="w-4 h-4 text-green-400" />
    {text}
  </li>
);

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#0d0d0d] to-[#111] text-white font-sans px-6 pt-32 pb-12 sm:pt-48">
      {/* HEADER */}
      <header className="flex justify-between items-center max-w-6xl mx-auto mb-24">
        <h1 className="text-2xl font-semibold tracking-tight uppercase">JobPingAI</h1>
        <Link
          href="#signup"
          className="px-5 py-2 bg-white text-black rounded-lg font-medium hover:opacity-90 transition"
        >
          Join Free
        </Link>
      </header>

      {/* HERO */}
      <motion.section
        className="relative text-center max-w-3xl mx-auto mb-20"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Blurred Background Glow */}
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <div className="h-64 w-64 bg-[#ff5555] opacity-30 blur-[120px] rounded-full"></div>
        </div>
        <div className="relative z-10">
          <h2 className="text-6xl font-semibold tracking-tight leading-tight mb-6">
            Graduate job opportunities. Delivered to your inbox.
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            No job boards. No dashboards. Just curated roles based on your goals — sent directly to your email.
          </p>
        </div>
      </motion.section>

      {/* SIGNUP FORM */}
      <section id="signup" className="max-w-3xl mx-auto mb-24 text-center bg-[#121212] p-10 rounded-2xl shadow-lg">
        <h3 className="text-2xl font-semibold mb-4">Get Started</h3>
        <p className="text-gray-400 mb-6">Choose your plan and start receiving daily opportunities.</p>
        <iframe
          src="https://tally.so/r/mJEqx4?alignLeft=1&transparentBackground=1&hideTitle=1"
          width="100%"
          height="500"
          frameBorder="0"
          title="JobPing Signup"
          className="w-full rounded-lg"
          aria-label="Signup form"
        ></iframe>
        <p className="text-sm text-gray-500 mt-3">
          Having trouble?{' '}
          <a
            href="https://tally.so/r/mJEqx4"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Open the form in a new tab
          </a>.
        </p>
      </section>

      {/* PRICING */}
      <section className="max-w-6xl mx-auto mb-24 text-center" id="pricing">
        <h3 className="text-3xl font-semibold mb-10 flex items-center justify-center gap-2">
          <ZapIcon className="w-5 h-5 text-accent" /> Choose Your Plan
        </h3>
        <p className="text-gray-400 mb-12 text-base max-w-xl mx-auto">Select the plan that best fits your needs and budget.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* FREE PLAN */}
          <div className="rounded-2xl border border-gray-700 bg-[#1a1a1a] p-10 text-left shadow hover:shadow-xl transition">
            <h4 className="text-3xl font-bold mb-2">Free</h4>
            <p className="italic text-gray-400 mb-6">Ideal for exploring the experience.</p>
            <ul className="space-y-3 mb-8">
              <FeatureItem text="5 job matches daily" />
              <FeatureItem text="Email delivery" />
              <FeatureItem text="Basic filtering" />
            </ul>
            <p className="text-2xl font-bold text-white mb-1">€0</p>
            <p className="text-xs uppercase text-gray-500">Free Forever</p>
          </div>

          {/* PREMIUM PLAN */}
          <div className="rounded-2xl border border-white bg-[#222222] p-10 text-left shadow-lg hover:shadow-xl transition">
            <span className="inline-block bg-white text-black text-xs font-bold px-3 py-1 rounded mb-4">Most Popular</span>
            <h4 className="text-3xl font-bold mb-2">Premium</h4>
            <p className="italic text-gray-400 mb-6">Designed for serious jobseekers.</p>
            <ul className="space-y-3 mb-8">
              <FeatureItem text="15 job matches daily" />
              <FeatureItem text="Priority AI matching" />
              <FeatureItem text="Advanced filters" />
            </ul>
            <p className="text-2xl font-bold text-white mb-1">€15</p>
            <p className="text-xs uppercase text-gray-500">Monthly Plan</p>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="max-w-2xl mx-auto text-center text-gray-400 text-sm mb-24">
        <h3 className="text-lg font-medium text-white mb-4">About JobPingAI</h3>
        <p>
          JobPingAI is built for recent university graduates who want to skip job boards and focus only on what matters.
          We deliver tailored opportunities straight to your inbox — based on your preferences, location, and goals.
        </p>
        <p className="mt-4">
          Currently available in: Madrid, Dublin, Amsterdam, Paris, Berlin, Milan, Lisbon, and London.
        </p>
      </section>

      {/* FOOTER */}
      <footer className="text-center text-xs text-gray-600 border-t border-gray-800 pt-6">
        <p className="hover:text-white/80">© 2025 JobPingAI</p>
        <div className="mt-2 space-x-4">
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
        </div>
      </footer>
    </main>
  );
}