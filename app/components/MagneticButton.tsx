'use client';
import { motion } from 'framer-motion';

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
  disabled?: boolean;
}

export default function MagneticButton({ 
  children, 
  onClick, 
  variant = "primary",
  className = "",
  disabled = false
}: MagneticButtonProps) {
  const variants = {
    primary: "bg-white text-black hover:shadow-lg hover:shadow-white/20",
    secondary: "border border-white/20 text-white hover:bg-white/5",
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`px-8 py-3 rounded-full font-medium transition-all duration-300 ${variants[variant]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onHoverStart={(e) => {
        if (!disabled && e.target) {
          // Subtle magnetic effect
          (e.target as HTMLElement).style.transform = 'scale(1.02) translateY(-1px)';
        }
      }}
      onHoverEnd={(e) => {
        if (!disabled && e.target) {
          (e.target as HTMLElement).style.transform = 'scale(1) translateY(0)';
        }
      }}
    >
      {children}
    </motion.button>
  );
} 