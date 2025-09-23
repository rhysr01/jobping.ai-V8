export default function Hero() {
  const scrollToSignup = () => {
    const signupSection = document.getElementById('signup');
    if (signupSection) {
      signupSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative h-screen flex items-center justify-center bg-black overflow-hidden">
      {/* Advanced Background System */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />
        
        {/* Sophisticated Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-radial from-zinc-100/[0.02] via-zinc-300/[0.01] to-transparent rounded-full blur-3xl animate-pulse opacity-60" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-radial from-zinc-200/[0.015] via-zinc-400/[0.008] to-transparent rounded-full blur-3xl animate-pulse opacity-40" style={{animationDelay: '2s'}} />
        
        {/* Noise Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.02] mix-blend-soft-light" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative text-center max-w-4xl mx-auto px-6">
        {/* Ultra Premium Typography */}
        <h1 className="text-7xl md:text-9xl font-bold text-transparent bg-gradient-to-b from-white via-zinc-100 to-zinc-300 bg-clip-text mb-6 tracking-[-0.04em] leading-[0.9] drop-shadow-sm">
          JobPing
        </h1>
        
        {/* Refined Subtitle */}
        <p className="text-2xl md:text-3xl text-zinc-300 mb-16 font-light leading-relaxed tracking-[-0.01em] max-w-2xl mx-auto">
          Graduate jobs that find you
        </p>
        
        {/* Premium CTA with Advanced Effects */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-200 via-white to-zinc-200 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
          <button 
            onClick={scrollToSignup}
            className="relative bg-gradient-to-r from-white via-zinc-50 to-white text-black px-12 py-5 rounded-2xl text-lg font-medium hover:from-zinc-50 hover:via-zinc-100 hover:to-zinc-50 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 border border-zinc-100/20"
          >
            Find Jobs Now
          </button>
        </div>
      </div>
    </section>
  );
}
