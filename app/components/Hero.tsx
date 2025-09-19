export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050505] to-black">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.02) 0%, transparent 50%),
               radial-gradient(circle at 80% 80%, rgba(255,255,255,0.02) 0%, transparent 50%)`
          }}
        />
      </div>

      {/* Floating elements for depth */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-[10%] w-64 h-32 bg-white/[0.02] rounded-lg rotate-12 blur-xl" />
        <div className="absolute bottom-1/3 right-[15%] w-48 h-24 bg-white/[0.02] rounded-lg -rotate-6 blur-xl" />
      </div>

      {/* Centered Brand */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mb-16">
        <h1 className="text-7xl md:text-9xl font-black mb-8 tracking-tight text-white animate-fade-in-up">
          JobPing
        </h1>
        <p className="text-xl text-[#a0a0a0] mb-12 animate-fade-in-up animation-delay-200">
          Graduate jobs that don't suck
        </p>
      </div>

      {/* CTAs */}
      <div className="relative z-10 flex gap-4 justify-center animate-fade-in-up animation-delay-400">
        <a href="#signup" className="btn-primary px-9 py-3.5 hover:scale-[1.02] transition-transform">
          Find My Dream Job
        </a>
        <a href="#pricing" className="btn-secondary px-9 py-3.5">
          View Pricing
        </a>
      </div>
    </section>
  );
}