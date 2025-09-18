'use client';

import { ArrowRight } from 'lucide-react';

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

export default function Header() {
  // Mobile menu removed until implemented

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section - Typography-First Design */}
          <div className="flex items-center">
            <h1 className="jobping-logo">
              <span className="job">Job</span>
              <span className="ping">Ping</span>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('pricing')}
              className="text-[#888888] hover:text-white transition-colors text-sm font-medium underline decoration-white/10 underline-offset-4 hover:decoration-white/40"
            >
              Pricing
            </button>
            <button 
              onClick={() => scrollToSection('signup')}
              className="btn-primary text-sm flex items-center gap-2"
              data-testid="header-cta"
              data-analytics="cta_click"
              data-cta-type="primary"
              data-cta-location="header"
            >
              Get started free
              <ArrowRight className="w-4 h-4" />
            </button>
          </nav>

          {/* Mobile menu removed */}
        </div>

        {/* Mobile menu placeholder */}
      </div>
    </header>
  );
}