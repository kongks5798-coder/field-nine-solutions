'use client';

import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * Spatial Computing - 3D-like Flat Layers
 * 2026 Trend: Depth through layered flat elements
 */
export function SpatialLayers({ children, depth = 3 }: { children: React.ReactNode; depth?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50 * depth]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -30 * depth]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -10 * depth]);
  const opacity1 = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.6, 0.3]);
  const opacity2 = useTransform(scrollYProgress, [0, 0.5, 1], [0.5, 0.8, 0.5]);
  const opacity3 = useTransform(scrollYProgress, [0, 0.5, 1], [0.7, 1, 0.7]);

  return (
    <div ref={ref} className="relative">
      {/* Background layers */}
      <motion.div
        style={{ y: y1, opacity: opacity1 }}
        className="absolute inset-0 -z-10 bg-gradient-to-br from-[#06B6D4]/5 to-[#06B6D4]/10 rounded-3xl blur-3xl"
      />
      <motion.div
        style={{ y: y2, opacity: opacity2 }}
        className="absolute inset-0 -z-10 bg-gradient-to-br from-[#06B6D4]/10 to-[#06B6D4]/15 rounded-2xl blur-2xl"
      />
      <motion.div
        style={{ y: y3, opacity: opacity3 }}
        className="absolute inset-0 -z-10 bg-gradient-to-br from-[#06B6D4]/15 to-[#06B6D4]/20 rounded-xl blur-xl"
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
