'use client';

import { Mail, Shield, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0B0B0F] border-t border-[#1A1A1A] section-spacing px-6 sm:px-8 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-[#777777] text-sm">© 2024 JobPing. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <a href="https://jobping.ai/privacy" className="text-[#777777] text-sm hover:text-white transition-colors" rel="noopener noreferrer">Privacy</a>
          <a href="https://jobping.ai/terms" className="text-[#777777] text-sm hover:text-white transition-colors" rel="noopener noreferrer">Terms</a>
          <a href="mailto:support@jobping.ai" className="text-[#777777] text-sm hover:text-white transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}