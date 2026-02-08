/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 80: CINEMATIC 4K ENERGY BACKGROUND
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Ultra-premium animated energy visualization background
 * - 4K quality energy flow visuals
 * - Tesla Model S inspired design
 * - GPU-accelerated CSS animations
 * - Reduced motion support
 */

'use client';

import { useEffect, useState, useRef } from 'react';

// Detect reduced motion preference
function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}

interface CinematicBackgroundProps {
  intensity?: number; // 1-3
  variant?: 'energy' | 'exchange' | 'dashboard';
  showGrid?: boolean;
}

export function CinematicBackground({
  intensity = 1,
  variant = 'energy',
  showGrid = true,
}: CinematicBackgroundProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  // Intersection observer for performance
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const colorScheme = {
    energy: { primary: '#00E5FF', secondary: '#00FF88', tertiary: '#00B4D8' },
    exchange: { primary: '#00FF88', secondary: '#00E5FF', tertiary: '#39FF14' },
    dashboard: { primary: '#00E5FF', secondary: '#A855F7', tertiary: '#00FF88' },
  };

  const colors = colorScheme[variant];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none z-0"
      style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #0d1117 50%, #0a0a0a 100%)' }}
    >
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes energy-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes energy-flow-h {
          0% { transform: translateX(-100%) translateZ(0); }
          100% { transform: translateX(100%) translateZ(0); }
        }
        @keyframes energy-flow-v {
          0% { transform: translateY(-100%) translateZ(0); }
          100% { transform: translateY(100%) translateZ(0); }
        }
        @keyframes aurora-drift {
          0% { transform: translateX(-20%) translateY(-10%) rotate(0deg) translateZ(0); }
          33% { transform: translateX(10%) translateY(5%) rotate(120deg) translateZ(0); }
          66% { transform: translateX(-10%) translateY(-5%) rotate(240deg) translateZ(0); }
          100% { transform: translateX(-20%) translateY(-10%) rotate(360deg) translateZ(0); }
        }
        @keyframes core-glow {
          0%, 100% {
            box-shadow: 0 0 60px ${colors.primary}40, 0 0 120px ${colors.primary}20;
            transform: translate(-50%, -50%) scale(1) translateZ(0);
          }
          50% {
            box-shadow: 0 0 100px ${colors.primary}60, 0 0 200px ${colors.primary}30;
            transform: translate(-50%, -50%) scale(1.1) translateZ(0);
          }
        }
        @keyframes particle-orbit {
          0% { transform: rotate(0deg) translateX(80px) rotate(0deg) translateZ(0); }
          100% { transform: rotate(360deg) translateX(80px) rotate(-360deg) translateZ(0); }
        }
        @keyframes grid-pulse {
          0%, 100% { opacity: 0.02; }
          50% { opacity: 0.05; }
        }
        .energy-flow-h {
          animation: energy-flow-h var(--duration) linear infinite;
          will-change: transform;
        }
        .energy-flow-v {
          animation: energy-flow-v var(--duration) linear infinite;
          will-change: transform;
        }
        .aurora {
          animation: aurora-drift 60s ease-in-out infinite;
          will-change: transform;
        }
        .core-glow {
          animation: core-glow ${4 / intensity}s ease-in-out infinite;
          will-change: transform, box-shadow;
        }
        .particle-orbit {
          animation: particle-orbit var(--duration) linear infinite;
          will-change: transform;
        }
        .grid-pulse {
          animation: grid-pulse 4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .energy-flow-h, .energy-flow-v, .aurora, .core-glow, .particle-orbit, .grid-pulse {
            animation: none !important;
          }
        }
      `}</style>

      {/* Aurora Gradient Layers */}
      {isInView && !prefersReducedMotion && (
        <>
          <div
            className="aurora absolute w-[200%] h-[200%] -top-1/2 -left-1/2 opacity-20"
            style={{
              background: `radial-gradient(ellipse 80% 50% at 50% 50%, ${colors.primary}15 0%, transparent 50%)`,
            }}
          />
          <div
            className="aurora absolute w-[150%] h-[150%] -top-1/4 -left-1/4 opacity-15"
            style={{
              background: `radial-gradient(ellipse 60% 40% at 60% 40%, ${colors.secondary}10 0%, transparent 60%)`,
              animationDelay: '-20s',
            }}
          />
        </>
      )}

      {/* Energy Flow Lines - Horizontal */}
      {isInView && !prefersReducedMotion && [...Array(8)].map((_, i) => (
        <div
          key={`h-${i}`}
          className="energy-flow-h absolute h-[1px]"
          style={{
            top: `${10 + i * 12}%`,
            left: 0,
            right: 0,
            background: `linear-gradient(90deg, transparent 0%, ${colors.primary}40 20%, ${colors.primary}80 50%, ${colors.primary}40 80%, transparent 100%)`,
            opacity: 0.3 + (i % 3) * 0.1,
            // @ts-ignore
            '--duration': `${(20 - i * 1.5) / intensity}s`,
          }}
        />
      ))}

      {/* Energy Flow Lines - Vertical */}
      {isInView && !prefersReducedMotion && [...Array(6)].map((_, i) => (
        <div
          key={`v-${i}`}
          className="energy-flow-v absolute w-[1px]"
          style={{
            left: `${15 + i * 15}%`,
            top: 0,
            bottom: 0,
            background: `linear-gradient(180deg, transparent 0%, ${colors.secondary}30 30%, ${colors.secondary}60 50%, ${colors.secondary}30 70%, transparent 100%)`,
            opacity: 0.2,
            // @ts-ignore
            '--duration': `${(25 - i * 2) / intensity}s`,
          }}
        />
      ))}

      {/* Central Energy Core */}
      <div
        className={`absolute top-1/2 left-1/2 w-40 h-40 rounded-full ${!prefersReducedMotion && isInView ? 'core-glow' : ''}`}
        style={{
          background: `radial-gradient(circle, ${colors.primary}20 0%, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Orbiting Particles */}
      {isInView && !prefersReducedMotion && intensity >= 2 && [...Array(6)].map((_, i) => (
        <div
          key={`orbit-${i}`}
          className="absolute top-1/2 left-1/2"
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          <div
            className="particle-orbit w-3 h-3 rounded-full"
            style={{
              background: i % 2 === 0 ? colors.primary : colors.secondary,
              boxShadow: `0 0 15px ${i % 2 === 0 ? colors.primary : colors.secondary}`,
              // @ts-ignore
              '--duration': `${(8 + i * 2) / intensity}s`,
              animationDelay: `${i * -1.5}s`,
            }}
          />
        </div>
      ))}

      {/* Grid Overlay */}
      {showGrid && (
        <div
          className={`absolute inset-0 ${!prefersReducedMotion && isInView ? 'grid-pulse' : ''}`}
          style={{
            opacity: 0.03 * intensity,
            backgroundImage: `
              linear-gradient(${colors.primary}40 1px, transparent 1px),
              linear-gradient(90deg, ${colors.primary}40 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      )}

      {/* Corner Energy Nodes */}
      {[
        { x: '10%', y: '15%' },
        { x: '90%', y: '20%' },
        { x: '85%', y: '80%' },
        { x: '15%', y: '85%' },
      ].map((pos, i) => (
        <div
          key={`node-${i}`}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: pos.x,
            top: pos.y,
            background: i % 2 === 0 ? colors.primary : colors.secondary,
            boxShadow: `0 0 20px ${i % 2 === 0 ? colors.primary : colors.secondary}60`,
            animation: !prefersReducedMotion && isInView
              ? `energy-pulse ${2 + i * 0.5}s ease-in-out infinite`
              : 'none',
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}

      {/* Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 0%, rgba(0,0,0,0.6) 100%)',
        }}
      />
    </div>
  );
}

export default CinematicBackground;
