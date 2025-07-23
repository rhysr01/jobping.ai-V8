'use client';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white font-sans px-6 py-12">
      {/* HEADER */}
      <header className="flex justify-between items-center max-w-6xl mx-auto mb-24">
        <h1 className="text-2xl font-light tracking-tight uppercase text-white">JobPingAI</h1>
        <Link
          href="#signup"
          className="px-5 py-2 bg-white text-black rounded-lg font-medium hover:opacity-90 transition"
        >
          Join Free
        </Link>
      </header>

      {/* HERO */}
      <section className="text-center max-w-3xl mx-auto mb-20">
        <h2 className="text-6xl font-light tracking-tight leading-tight mb-6">
          Graduate job opportunities. Straight to your inbox.
        </h2>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          No job boards. No dashboards. Just personalised roles for university grads — delivered by email.
        </p>
      </section>

      {/* SIGNUP FORM */}
      <section id="signup" className="max-w-3xl mx-auto mb-24 text-center">
        <h3 className="text-2xl font-semibold mb-4">Sign Up</h3>
        <p className="text-gray-400 mb-6">
          Choose a plan and get started in under a minute.
        </p>
        <div className="w-full h-[500px] bg-[#111] border border-gray-800 rounded-xl p-4">
          <iframe
            src="https://tally.so/r/mJEqx4?alignLeft=1&transparentBackground=1&hideTitle=1"
            width="100%"
            height="100%"
            frameBorder="0"
            title="JobPing Signup"
            className="rounded-md"
            aria-label="Signup form"
          ></iframe>
          <p className="text-sm text-gray-500 mt-2">Having trouble? <a href="https://tally.so/r/mJEqx4" target="_blank" rel="noopener noreferrer" className="underline">Open the form in a new tab</a>.</p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-4xl mx-auto mb-24 text-center bg-[#0d0d0d] py-12 rounded-xl">
        <h3 className="text-2xl font-semibold mb-8">How It Works</h3>
        <hr className="border-gray-800 mb-10" />
        <div className="grid md:grid-cols-3 gap-12 text-gray-300 text-base">
          <div>
            <span className="text-2xl text-white mb-2 block">1</span>
            <h4 className="text-lg font-medium mb-2">Tell us your preferences</h4>
            <p>Choose your city, goals, and start date — takes 30 seconds.</p>
          </div>
          <div>
            <span className="text-2xl text-white mb-2 block">2</span>
            <h4 className="text-lg font-medium mb-2">We find jobs for you</h4>
            <p>We scan thousands of listings across the web, so you don’t have to.</p>
          </div>
          <div>
            <span className="text-2xl text-white mb-2 block">3</span>
            <h4 className="text-lg font-medium mb-2">You get matches by email</h4>
            <p>Receive job opportunities daily — sorted by location, skills, and visa fit.</p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="max-w-4xl mx-auto mb-24 text-center" id="pricing">
        <h3 className="text-2xl font-semibold mb-8">Plans</h3>
        <div className="grid md:grid-cols-2 gap-8">
          {/* FREE PLAN */}
          <div className="border border-gray-700 hover:border-white transition-all duration-300 rounded-xl p-6 bg-[#111]">
            <h4 className="text-xl font-medium mb-2">Free</h4>
            <p className="text-gray-400 mb-4">5 jobs per day · €0/month</p>
            <p className="text-sm text-gray-500">Ideal if you’re browsing casually.</p>
          </div>

          {/* PREMIUM PLAN */}
          <div className="border border-white hover:bg-[#1f1f1f] transition-all duration-300 rounded-xl p-6 bg-[#1a1a1a] shadow-lg">
            <span className="text-xs uppercase bg-white text-black px-2 py-1 rounded mb-2 inline-block font-semibold">
              Most Popular
            </span>
            <h4 className="text-xl font-medium mb-2">Premium</h4>
            <p className="text-gray-400 mb-2">15 jobs per day</p>
            <p className="text-gray-400 mb-4">€15/month or €30/3 months</p>
            <p className="text-sm text-gray-500">Best for graduates actively applying.</p>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="max-w-2xl mx-auto text-center text-gray-300 text-sm mb-24">
        <h3 className="text-lg font-medium text-white mb-4">About Us</h3>
        <p>
          JobPingAI is built for students and recent university graduates seeking career-aligned job opportunities.
          We remove the noise of job boards and deliver curated matches daily to your inbox.
        </p>
        <p className="mt-4">
          We’re currently available in Madrid, Dublin, Amsterdam, Paris, Berlin, Milan, Lisbon, and London.
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