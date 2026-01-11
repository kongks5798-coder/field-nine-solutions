'use client';

import { useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';

/**
 * Adaptive Typography - Real-time font size adjustment
 * 2026 Trend: Typography that adapts to viewport and content
 */
export function AIAdaptiveTypography({ 
  children, 
  className = '',
  baseSize = 'text-4xl',
  minSize = 'text-2xl',
  maxSize = 'text-6xl'
}: {
  children: React.ReactNode;
  className?: string;
  baseSize?: string;
  minSize?: string;
  maxSize?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!ref.current || !isInView) return;

    const element = ref.current;
    const adjustFontSize = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Adaptive calculation based on viewport
      const scale = Math.min(
        viewportWidth / 1920, // Base width
        viewportHeight / 1080, // Base height
        1.2 // Max scale
      );

      const baseFontSize = parseFloat(getComputedStyle(element).fontSize);
      const newSize = Math.max(
        baseFontSize * 0.8, // Min
        Math.min(baseFontSize * scale, baseFontSize * 1.2) // Max
      );

      element.style.fontSize = `${newSize}px`;
    };

    adjustFontSize();
    window.addEventListener('resize', adjustFontSize);
    return () => window.removeEventListener('resize', adjustFontSize);
  }, [isInView]);

  return (
    <div ref={ref} className={`${baseSize} ${className}`}>
      {children}
    </div>
  );
}
