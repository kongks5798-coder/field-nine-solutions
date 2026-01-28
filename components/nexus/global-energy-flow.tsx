/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 76: 3D GLOBAL ENERGY NODE VISUALIZATION - MOBILE OPTIMIZED
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * High-performance CSS 3D globe showing energy flowing from global nodes
 * to Field Nine HQ in Seoul
 *
 * PHASE 76 OPTIMIZATIONS:
 * - CSS-only animations for 60fps on 5-year-old phones
 * - Reduced motion support (prefers-reduced-motion)
 * - GPU acceleration with will-change and transform3d
 * - Fewer particles on mobile devices
 * - Intersection Observer for lazy loading
 * - requestAnimationFrame for smooth updates
 */

'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Global energy nodes with coordinates (approximate screen positions)
const GLOBAL_NODES = [
  { id: 'seoul', name: 'Seoul HQ', x: 78, y: 35, power: 100, isHQ: true, country: 'Korea' },
  { id: 'tokyo', name: 'Tokyo', x: 85, y: 38, power: 45, isHQ: false, country: 'Japan' },
  { id: 'singapore', name: 'Singapore', x: 72, y: 58, power: 38, isHQ: false, country: 'Singapore' },
  { id: 'sydney', name: 'Sydney', x: 88, y: 78, power: 32, isHQ: false, country: 'Australia' },
  { id: 'dubai', name: 'Dubai', x: 55, y: 42, power: 28, isHQ: false, country: 'UAE' },
  { id: 'london', name: 'London', x: 42, y: 28, power: 52, isHQ: false, country: 'UK' },
  { id: 'frankfurt', name: 'Frankfurt', x: 45, y: 32, power: 41, isHQ: false, country: 'Germany' },
  { id: 'nyc', name: 'New York', x: 22, y: 35, power: 67, isHQ: false, country: 'USA' },
  { id: 'la', name: 'Los Angeles', x: 12, y: 40, power: 55, isHQ: false, country: 'USA' },
  { id: 'saopaulo', name: 'São Paulo', x: 28, y: 72, power: 25, isHQ: false, country: 'Brazil' },
];

// Detect if user prefers reduced motion
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

// Detect mobile devices for reduced complexity
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}

// CSS-only animated flow line (much more performant than Framer Motion)
function EnergyFlowLine({ from, to, intensity, index }: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  intensity: number;
  index: number;
}) {
  const gradientId = `flow-gradient-${index}`;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="50%" stopColor="#00E5FF" stopOpacity={0.6 * intensity} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <line
        x1={`${from.x}%`}
        y1={`${from.y}%`}
        x2={`${to.x}%`}
        y2={`${to.y}%`}
        stroke={`url(#${gradientId})`}
        strokeWidth="1"
        strokeDasharray="5,5"
        className="energy-dash-line"
      />
    </svg>
  );
}

// CSS-only node marker (GPU accelerated)
function NodeMarker({ node, isSelected, onClick, reducedMotion }: {
  node: typeof GLOBAL_NODES[0];
  isSelected: boolean;
  onClick: () => void;
  reducedMotion: boolean;
}) {
  const size = node.isHQ ? 'w-6 h-6' : 'w-3 h-3';

  return (
    <button
      onClick={onClick}
      className={`absolute ${size} rounded-full cursor-pointer z-10 ${
        node.isHQ ? 'node-marker-hq' : 'node-marker'
      } ${reducedMotion ? '' : 'node-pulse'}`}
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
        transform: 'translate(-50%, -50%) translateZ(0)',
        willChange: reducedMotion ? 'auto' : 'transform, box-shadow',
        background: node.isHQ
          ? 'linear-gradient(135deg, #00E5FF 0%, #00FF88 100%)'
          : '#00E5FF',
      }}
      aria-label={`${node.name} - ${node.power} MW`}
    >
      {node.isHQ && (
        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-lg">👑</span>
      )}
    </button>
  );
}

// CSS-only flowing particle (replaces Framer Motion version)
function FlowingParticle({ from, to, index, totalParticles }: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  index: number;
  totalParticles: number;
}) {
  // Stagger animation delay based on index
  const delay = (index / totalParticles) * 3;

  return (
    <div
      className="absolute w-2 h-2 rounded-full bg-[#00E5FF] z-20 particle-flow"
      style={{
        '--from-x': `${from.x}%`,
        '--from-y': `${from.y}%`,
        '--to-x': `${to.x}%`,
        '--to-y': `${to.y}%`,
        '--delay': `${delay}s`,
        animationDelay: `${delay}s`,
        transform: 'translateZ(0)',
        willChange: 'transform, opacity',
        boxShadow: '0 0 10px #00E5FF, 0 0 20px #00E5FF',
      } as React.CSSProperties}
      aria-hidden="true"
    />
  );
}

export function GlobalEnergyFlow() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [totalPower, setTotalPower] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  const hqNode = useMemo(() => GLOBAL_NODES.find(n => n.isHQ)!, []);
  const remoteNodes = useMemo(() => GLOBAL_NODES.filter(n => !n.isHQ), []);

  // On mobile, reduce number of particles for better performance
  const particleNodes = useMemo(() => {
    if (prefersReducedMotion) return []; // No particles for reduced motion
    if (isMobile) return remoteNodes.slice(0, 5); // Half the particles on mobile
    return remoteNodes;
  }, [isMobile, prefersReducedMotion, remoteNodes]);

  // Intersection Observer for lazy loading animations
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Smooth power update using requestAnimationFrame
  useEffect(() => {
    if (!isInView) return;

    const base = remoteNodes.reduce((sum, n) => sum + n.power, 0);
    let animationId: number;
    let lastUpdate = 0;

    const updatePower = (timestamp: number) => {
      if (timestamp - lastUpdate > 2000) {
        setTotalPower(base + Math.floor(Math.random() * 20));
        lastUpdate = timestamp;
      }
      animationId = requestAnimationFrame(updatePower);
    };

    setTotalPower(base);
    animationId = requestAnimationFrame(updatePower);

    return () => cancelAnimationFrame(animationId);
  }, [isInView, remoteNodes]);

  const selectedNodeData = useMemo(
    () => selectedNode ? GLOBAL_NODES.find(n => n.id === selectedNode) : null,
    [selectedNode]
  );

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode(prev => prev === nodeId ? null : nodeId);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[2/1] min-h-[300px] max-h-[500px] bg-gradient-to-b from-[#0a0a0a] to-[#0d1117] rounded-3xl overflow-hidden border border-[#00E5FF]/20"
    >
      {/* CSS Animations - All GPU accelerated */}
      <style jsx global>{`
        @keyframes energy-dash {
          to { stroke-dashoffset: -20; }
        }
        @keyframes node-pulse-anim {
          0%, 100% {
            transform: translate(-50%, -50%) translateZ(0) scale(1);
            box-shadow: 0 0 20px rgba(0,229,255,0.5);
          }
          50% {
            transform: translate(-50%, -50%) translateZ(0) scale(1.1);
            box-shadow: 0 0 30px rgba(0,229,255,0.8);
          }
        }
        @keyframes node-pulse-hq-anim {
          0%, 100% {
            transform: translate(-50%, -50%) translateZ(0) scale(1);
            box-shadow: 0 0 40px rgba(0,229,255,0.5);
          }
          50% {
            transform: translate(-50%, -50%) translateZ(0) scale(1.2);
            box-shadow: 0 0 60px rgba(0,229,255,0.8);
          }
        }
        @keyframes particle-flow-anim {
          0% {
            left: var(--from-x);
            top: var(--from-y);
            transform: translateZ(0) scale(0.5);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            left: var(--to-x);
            top: var(--to-y);
            transform: translateZ(0) scale(0.5);
            opacity: 0;
          }
        }
        .energy-dash-line {
          animation: energy-dash 1s linear infinite;
        }
        .node-pulse {
          animation: node-pulse-anim 3s ease-in-out infinite;
        }
        .node-marker-hq.node-pulse {
          animation: node-pulse-hq-anim 2s ease-in-out infinite;
        }
        .particle-flow {
          animation: particle-flow-anim 2.5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .energy-dash-line,
          .node-pulse,
          .node-marker-hq.node-pulse,
          .particle-flow {
            animation: none !important;
          }
          .node-marker {
            box-shadow: 0 0 20px rgba(0,229,255,0.5);
          }
          .node-marker-hq {
            box-shadow: 0 0 40px rgba(0,229,255,0.8);
          }
        }
      `}</style>

      {/* World Map Grid Background - Static, no animation */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,229,255,0.1) 100%),
              linear-gradient(rgba(0,229,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,229,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 8% 8%, 8% 8%',
          }}
        />
      </div>

      {/* Globe Outline - Static */}
      <div className="absolute inset-4 rounded-full border border-[#00E5FF]/10 opacity-30 pointer-events-none" />
      <div className="absolute inset-8 rounded-full border border-[#00E5FF]/10 opacity-20 pointer-events-none" />

      {/* Energy Flow Lines - Only render when in view */}
      {isInView && !prefersReducedMotion && remoteNodes.map((node, idx) => (
        <EnergyFlowLine
          key={`line-${node.id}`}
          from={{ x: node.x, y: node.y }}
          to={{ x: hqNode.x, y: hqNode.y }}
          intensity={node.power / 100}
          index={idx}
        />
      ))}

      {/* Flowing Particles - Reduced on mobile, none for reduced motion */}
      {isInView && particleNodes.map((node, idx) => (
        <FlowingParticle
          key={`particle-${node.id}`}
          from={{ x: node.x, y: node.y }}
          to={{ x: hqNode.x, y: hqNode.y }}
          index={idx}
          totalParticles={particleNodes.length}
        />
      ))}

      {/* Node Markers */}
      {GLOBAL_NODES.map(node => (
        <NodeMarker
          key={node.id}
          node={node}
          isSelected={selectedNode === node.id}
          onClick={() => handleNodeClick(node.id)}
          reducedMotion={prefersReducedMotion}
        />
      ))}

      {/* Header - Static */}
      <div className="absolute top-4 left-4 z-30 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full bg-[#00E5FF] ${prefersReducedMotion ? '' : 'node-pulse'}`} />
          <span className="text-[#00E5FF] font-bold text-sm">GLOBAL ENERGY NETWORK</span>
        </div>
        <p className="text-white/40 text-xs mt-1">Real-time energy flow to Seoul HQ</p>
      </div>

      {/* Stats Panel */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-xl p-3 z-30 border border-[#00E5FF]/20">
        <div className="text-xs text-white/50 uppercase">Total Incoming Power</div>
        <div className="text-2xl font-black text-[#00E5FF]">
          {totalPower.toLocaleString()} <span className="text-sm">MW</span>
        </div>
        <div className="text-xs text-white/40 mt-1">
          {remoteNodes.length} Active Nodes
        </div>
      </div>

      {/* Node Info Popup - Uses Framer Motion only for this interactive element */}
      <AnimatePresence>
        {selectedNodeData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md rounded-xl p-4 z-30 border border-[#00E5FF]/30 min-w-[200px]"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-[#00E5FF]" />
              <span className="font-bold text-white">{selectedNodeData.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-white/40 text-xs">Country</div>
                <div className="text-white">{selectedNodeData.country}</div>
              </div>
              <div>
                <div className="text-white/40 text-xs">Output</div>
                <div className="text-[#00E5FF] font-bold">{selectedNodeData.power} MW</div>
              </div>
            </div>
            {selectedNodeData.isHQ && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <div className="text-xs text-[#00FF88]">👑 Empire Headquarters</div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend - Static */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs text-white/40 z-20 pointer-events-none">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#00E5FF]" />
          <span>Energy Node</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#00E5FF] to-[#00FF88]" />
          <span>HQ</span>
        </div>
      </div>
    </div>
  );
}

export default GlobalEnergyFlow;
