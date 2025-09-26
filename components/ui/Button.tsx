import React from 'react';

interface ButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'outline';
}

export function ButtonPrimary({ children, className = '', ...props }: ButtonProps) {
  return (
    <a
      {...props}
      className={`inline-block rounded-2xl px-6 py-3.5 text-lg font-semibold
                  bg-brand-500 text-white hover:bg-brand-600
                  focus:outline-none focus:ring-2 focus:ring-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400/50
                  transition will-change-transform hover:-translate-y-0.5 ${className}`}
    >
      {children}
    </a>
  );
}

export function ButtonOutline({ children, className = '', ...props }: ButtonProps) {
  return (
    <a
      {...props}
      className={`inline-block rounded-2xl px-6 py-3.5 font-semibold
                  border border-white/15 text-white hover:border-brand-500/40
                  focus:outline-none focus:ring-2 focus:ring-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400/50
                  transition hover:-translate-y-0.5 ${className}`}
    >
      {children}
    </a>
  );
}
