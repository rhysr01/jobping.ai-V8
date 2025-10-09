export default function FinalCTA() {
  const tallyUrl = 'https://tally.so/r/mJEqx4?tier=free&source=finalcta';

  return (
    <section className="section-pad">
      <div className="container-page">
        <div className="glass-card rounded-2xl p-10 md:p-12 text-center relative overflow-hidden">
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(99,102,241,0.3) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Stop the scroll</h2>
            <p className="mt-4 text-lg text-zinc-300">Join students who receive five high fit roles each week.</p>
            
            {/* Email preview mockup */}
            <div className="mt-8 max-w-md mx-auto bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 text-left shadow-2xl">
              <div className="text-xs text-zinc-500 mb-2">📧 Your Weekly JobPing</div>
              <div className="space-y-2">
                <div className="bg-gradient-to-r from-brand-500/10 to-purple-600/10 border border-brand-500/20 rounded p-2">
                  <div className="text-sm font-semibold text-white">Product Designer</div>
                  <div className="text-xs text-zinc-400">Figma · Berlin · €45-55k</div>
                </div>
                <div className="bg-gradient-to-r from-brand-500/10 to-purple-600/10 border border-brand-500/20 rounded p-2">
                  <div className="text-sm font-semibold text-white">Frontend Developer</div>
                  <div className="text-xs text-zinc-400">Remote · London · £35-45k</div>
                </div>
                <div className="text-xs text-zinc-500 text-center">+ 3 more matches</div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center">
              <a 
                href={tallyUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Start with 5 free roles
              </a>
            </div>
            <p className="mt-4 text-sm text-zinc-400">No CV required. Unsubscribe anytime. GDPR friendly.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
