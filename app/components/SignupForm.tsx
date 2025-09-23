'use client';

import { useState } from 'react';

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-green-400/30 to-emerald-500/30 rounded-2xl blur opacity-60"></div>
        <div className="relative bg-gradient-to-br from-green-900/80 to-emerald-900/60 backdrop-blur-2xl rounded-2xl border border-green-700/50 p-8 shadow-2xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Welcome to JobPing!</h3>
            <p className="text-green-200 text-lg">
              Check your inbox for a confirmation email. Your first job matches will arrive within 48 hours.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-zinc-600/20 via-zinc-400/10 to-zinc-600/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
      <div className="relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/60 backdrop-blur-2xl rounded-2xl border border-zinc-700/50 p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-white mb-4">Get started today</h3>
          <p className="text-zinc-400 text-lg">Join thousands of EU students finding their dream jobs</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
              Email address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-4 bg-gradient-to-r from-zinc-800/60 to-zinc-900/40 backdrop-blur-sm border border-zinc-600/50 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all duration-300"
              placeholder="your.email@university.edu"
              disabled={isSubmitting}
            />
          </div>
          
          {error && (
            <div className="bg-red-900/50 border border-red-700/50 rounded-xl p-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="relative group/button w-full"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-white via-zinc-200 to-white rounded-xl blur opacity-50 group-hover/button:opacity-100 transition duration-300"></div>
            <div className="relative bg-gradient-to-r from-white via-zinc-50 to-white text-black py-4 px-6 rounded-xl font-semibold text-lg hover:from-zinc-50 hover:via-zinc-100 hover:to-zinc-50 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 border border-zinc-100/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing up...</span>
                </div>
              ) : (
                'Start getting job matches'
              )}
            </div>
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-zinc-500 text-sm">
            Free forever. No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
