"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  className?: string;
}

/**
 * Consistent section header component
 * Standardizes typography, spacing, and animations across all sections
 */
export default function SectionHeader({ 
  title, 
  description, 
  badge,
  className = "" 
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`text-center mb-12 md:mb-16 ${className}`}
    >
      {badge && <div className="mb-4">{badge}</div>}
      <h2 className="text-heading text-white text-balance mb-4">
        {title}
      </h2>
      {description && (
        <p className="text-body text-neutral-400 max-w-2xl mx-auto">
          {description}
        </p>
      )}
    </motion.div>
  );
}
