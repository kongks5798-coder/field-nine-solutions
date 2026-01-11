'use client';

import { motion } from 'framer-motion';

/**
 * Imperfect by Design - Organic Asymmetry
 * 2026 Trend: Canva-inspired organic, imperfect shapes
 */
export function ImperfectDesign({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  // Generate organic rotation and position variations
  const variations = [
    { rotate: -2, x: -5, y: 3 },
    { rotate: 1.5, x: 3, y: -4 },
    { rotate: -1, x: -2, y: 2 },
    { rotate: 2.5, x: 4, y: -3 },
  ];

  const randomVariation = variations[Math.floor(Math.random() * variations.length)];

  return (
    <motion.div
      initial={{ opacity: 0, ...randomVariation }}
      whileInView={{ opacity: 1, rotate: 0, x: 0, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
      style={{
        transform: `rotate(${randomVariation.rotate}deg)`,
      }}
    >
      {children}
    </motion.div>
  );
}
