'use client';

import { useEffect, useState } from 'react';

interface JobMatch {
  job: {
    title: string;
    company: string;
    location: string;
    description: string;
    job_url: string;
  };
  match_score: number;
  match_reason: string;
}

export default function FinalCTA() {
  const tallyUrl = 'https://tally.so/r/mJEqx4?tier=free&source=finalcta';
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real job matches for preview
    fetch('/api/sample-email-preview')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.matches) {
          setMatches(data.matches);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load sample jobs:', err);
        setLoading(false);
      });
  }, []);

  return (
    <section className="section-pad">
      <div className="container-page">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Stop the scroll</h2>
          <p className="mt-4 text-lg text-zinc-300">Here's exactly what you'll receive every week:</p>
        </div>

        {/* Real email preview with actual jobs */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-black border border-zinc-800 rounded-xl overflow-hidden shadow-[0_0_60px_rgba(99,102,241,0.15)]">
            
            {/* Purple gradient header - EXACT match */}
            <div className="relative overflow-hidden" style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 50%, #8B5CF6 100%)',
              padding: '40px 32px'
            }}>
              <div className="absolute inset-0" style={{
                background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1), transparent 50%)',
                pointerEvents: 'none'
              }}></div>
              <div className="relative z-10 text-center">
                <div className="text-4xl font-extrabold text-white mb-1" style={{
                  letterSpacing: '-1px',
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                }}>
                  🎯 JobPing
                </div>
                <div className="text-xs text-white/95 font-semibold uppercase tracking-wider">
                  AI-Powered Job Matching for Europe
                </div>
              </div>
            </div>

            {/* Email content */}
            <div className="p-8 bg-black">
              {/* Greeting */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-3">Hi Alex 👋</h3>
                <p className="text-zinc-400 text-sm">5 roles matched to your profile. Here's your weekly curated list:</p>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                  <p className="mt-4 text-zinc-500 text-sm">Loading real jobs...</p>
                </div>
              ) : matches.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <p>Could not load sample jobs. Check console for errors.</p>
                </div>
              ) : (
                <>
                  {/* Show first 2 jobs with full details */}
                  {matches.slice(0, 2).map((match, idx) => (
                    <div 
                      key={idx}
                      className={`mb-6 p-6 rounded-2xl ${
                        idx === 0 
                          ? 'border-2 border-purple-500/60 bg-gradient-to-br from-brand-500/8 to-purple-600/5 shadow-[0_8px_32px_rgba(99,102,241,0.25)]'
                          : 'border border-brand-500/20 bg-[#111111] shadow-[0_4px_20px_rgba(99,102,241,0.15)]'
                      }`}
                    >
                      {idx === 0 && (
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-brand-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg mb-3">
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                          🔥 Top Match • {Math.round(match.match_score)}% Match
                        </div>
                      )}
                      
                      <div className="text-lg font-bold text-white mb-2">{match.job.title}</div>
                      <div className="text-zinc-300 font-semibold text-sm mb-1">{match.job.company}</div>
                      <div className="text-zinc-500 text-sm mb-3">📍 {match.job.location}</div>
                      
                      {idx !== 0 && (
                        <div className="mb-3">
                          <span className="inline-block bg-gradient-to-r from-brand-500 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
                            {Math.round(match.match_score)}% Match
                          </span>
                        </div>
                      )}
                      
                      {/* WOW AI Match Reason */}
                      <div className="bg-brand-500/5 border border-brand-500/20 rounded-lg p-3 mb-3">
                        <p className="text-xs text-purple-400 font-semibold uppercase tracking-wide mb-1.5">🎯 Why this matches you:</p>
                        <p className="text-zinc-300 text-sm leading-relaxed">
                          {match.match_reason || 'Great fit for your profile!'}
                        </p>
                      </div>
                      
                      {idx === 0 && (
                        <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-3">
                          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide mb-2">📎 Application Link</p>
                          <p className="text-xs text-brand-400 font-mono break-all bg-black/40 p-2 rounded border border-brand-500/15">
                            {match.job.job_url}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Remaining 3 jobs - compact view */}
                  {matches.length > 2 && (
                    <div className="text-center text-zinc-500 text-sm mb-6">
                      + {matches.length - 2} more hand-picked roles in your email
                    </div>
                  )}
                </>
              )}

              {/* CTA at bottom */}
              <div className="text-center pt-6 border-t border-zinc-800">
                <p className="text-zinc-500 text-xs mb-4">+ 3 more matches in your weekly email</p>
                <a 
                  href={tallyUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-primary inline-block"
                >
                  Start with 5 free roles
                </a>
                <p className="mt-4 text-xs text-zinc-500">No CV required. Unsubscribe anytime. GDPR friendly.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#0a0a0a]/80 border-t border-brand-500/15 p-6 text-center">
              <div className="text-sm font-semibold text-purple-500 mb-1">🎯 JobPing</div>
              <p className="text-xs text-zinc-600">AI-powered job matching for Europe</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
