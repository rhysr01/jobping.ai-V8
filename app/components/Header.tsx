'use client';

export default function Header() {
  const scrollToSignup = () => {
    const signupSection = document.getElementById('signup');
    if (signupSection) {
      signupSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-2xl border-b border-zinc-800/50">
      <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
        <div className="text-2xl font-medium text-white tracking-[-0.02em] bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
          JobPing
        </div>
        <button 
          onClick={scrollToSignup}
          className="bg-gradient-to-r from-white via-zinc-50 to-zinc-100 text-black px-8 py-3 rounded-full text-sm font-medium hover:from-zinc-50 hover:via-zinc-100 hover:to-zinc-200 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border border-zinc-200/20"
        >
          Get Started
        </button>
      </div>
    </header>
  );
}
