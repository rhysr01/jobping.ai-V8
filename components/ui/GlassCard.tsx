import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle';
}

export default function GlassCard({ children, className = '', variant = 'subtle' }: GlassCardProps) {
  const baseClasses = 'rounded-2xl border transition-all duration-300 shadow-base backdrop-blur-sm';
  
  const variants = {
    subtle: 'bg-glass-subtle border-border-subtle hover:border-border-default hover:shadow-[0_4px_12px_rgba(255,255,255,0.04)]',
    default: 'bg-glass-default border-border-default hover:border-border-elevated hover:shadow-[0_4px_16px_rgba(255,255,255,0.06)]',
    elevated: 'bg-glass-elevated border-border-elevated hover:border-border-elevated shadow-elev-1 hover:shadow-[0_8px_24px_rgba(255,255,255,0.08)]',
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
