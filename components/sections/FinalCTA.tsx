"use client";
import { useState, useEffect } from 'react';

export default function FinalCTA() {
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const tallyUrl = 'https://tally.so/r/mJEqx4?tier=free&source=finalcta';

  return (
    <section className="section-pad">
      <div className="container-page">
        <div className="glass-card rounded-2xl p-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Ready to stop endless scrolling and log ins?</h2>
          <p className="mt-4 text-lg text-zinc-300">Join students who get their weekly dose of hand-picked opportunities.</p>
          <div className="mt-6 flex justify-center">
            {isMobile ? (
              <a 
                href={tallyUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Get 5 Jobs matches free every week
              </a>
            ) : (
              <a href="#signup" className="btn-primary">Get 5 Jobs matches free every week</a>
            )}
          </div>
          <p className="mt-4 text-sm text-zinc-400">No CV required • Unsubscribe anytime • GDPR-friendly</p>
        </div>

        {/* Desktop: Embed form below with loading state */}
        {!isMobile && (
          <div id="signup" className="mt-10 rounded-2xl overflow-hidden border border-white/10 relative">
            {/* Loading spinner */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 min-h-[600px]">
                <div className="text-center">
                  <div className="inline-block w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-zinc-300 text-base font-medium">Loading signup form...</p>
                  <p className="text-zinc-500 text-sm mt-2">This will only take a moment</p>
                </div>
              </div>
            )}
            
            <iframe
              src={tallyUrl}
              title="JobPing Signup"
              className="w-full min-h-[500px] md:min-h-[600px] lg:h-[760px] bg-black"
              onLoad={() => setIsLoading(false)}
              style={{ border: 'none' }}
            />
          </div>
        )}

        {/* Mobile: Show helper text */}
        {isMobile && (
          <p className="mt-6 text-center text-sm text-zinc-400">
            📱 Tap the button above to open the signup form in a new tab
          </p>
        )}
      </div>
    </section>
  );
}
