/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GLOBAL EMPIRE NODE MAP - Production-Ready 3D Globe
 * ═══════════════════════════════════════════════════════════════════════════════
 * Canvas-based 3D Globe with real-time nodes, interactive controls, and animations
 * "제국은 지구를 품는다"
 */

'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// Type Definitions
// ============================================

type NodeType = 'ENERGY' | 'USER' | 'EXCHANGE' | 'DATA_CENTER';
type NodeStatus = 'ACTIVE' | 'SYNCING' | 'OFFLINE';

interface NodeLocation {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  type: NodeType;
  status: NodeStatus;
  connections: number;
  value?: number;
  apy?: number;
  efficiency?: number;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
  visible: boolean;
  scale: number;
}

interface Connection {
  from: NodeLocation;
  to: NodeLocation;
  progress: number;
  active: boolean;
}

// ============================================
// Constants
// ============================================

const NODE_COLORS: Record<NodeType, string> = {
  ENERGY: '#f59e0b',      // amber
  USER: '#10b981',        // emerald
  EXCHANGE: '#06b6d4',    // cyan
  DATA_CENTER: '#8b5cf6', // purple
};

const STATUS_COLORS: Record<NodeStatus, string> = {
  ACTIVE: '#10b981',
  SYNCING: '#f59e0b',
  OFFLINE: '#ef4444',
};

const GLOBAL_NODES: NodeLocation[] = [
  // Korea (Primary Hub)
  { id: 'KR-YD', name: 'Yeongdong Solar', country: 'Korea', lat: 36.17, lng: 127.78, type: 'ENERGY', status: 'ACTIVE', connections: 1250, value: 50000000, apy: 12.5, efficiency: 84 },
  { id: 'KR-JJ', name: 'Jeju Wind', country: 'Korea', lat: 33.48, lng: 126.53, type: 'ENERGY', status: 'ACTIVE', connections: 890, value: 35000000, apy: 11.8, efficiency: 80 },
  { id: 'KR-SEL', name: 'Seoul Hub', country: 'Korea', lat: 37.56, lng: 126.97, type: 'DATA_CENTER', status: 'ACTIVE', connections: 2500, value: 100000000, apy: 14.2, efficiency: 96 },
  { id: 'KR-BS', name: 'Busan Node', country: 'Korea', lat: 35.17, lng: 129.07, type: 'EXCHANGE', status: 'ACTIVE', connections: 780, value: 28000000, apy: 13.5, efficiency: 92 },
  // USA
  { id: 'US-SF', name: 'San Francisco', country: 'USA', lat: 37.77, lng: -122.42, type: 'DATA_CENTER', status: 'ACTIVE', connections: 1850, value: 75000000, apy: 13.8, efficiency: 94 },
  { id: 'US-NY', name: 'New York', country: 'USA', lat: 40.71, lng: -74.00, type: 'EXCHANGE', status: 'ACTIVE', connections: 2100, value: 85000000, apy: 14.5, efficiency: 95 },
  { id: 'US-TX', name: 'Texas Solar', country: 'USA', lat: 31.97, lng: -99.90, type: 'ENERGY', status: 'SYNCING', connections: 450, value: 18000000, apy: 11.2, efficiency: 78 },
  { id: 'US-LA', name: 'Los Angeles', country: 'USA', lat: 34.05, lng: -118.24, type: 'USER', status: 'ACTIVE', connections: 1200, value: 45000000, apy: 12.8, efficiency: 88 },
  // Australia
  { id: 'AU-SYD', name: 'Sydney Hub', country: 'Australia', lat: -33.86, lng: 151.20, type: 'DATA_CENTER', status: 'ACTIVE', connections: 980, value: 42000000, apy: 13.1, efficiency: 90 },
  { id: 'AU-MEL', name: 'Melbourne', country: 'Australia', lat: -37.81, lng: 144.96, type: 'USER', status: 'ACTIVE', connections: 650, value: 25000000, apy: 12.4, efficiency: 86 },
  // Europe
  { id: 'UK-LON', name: 'London', country: 'UK', lat: 51.50, lng: -0.12, type: 'EXCHANGE', status: 'ACTIVE', connections: 1750, value: 68000000, apy: 13.2, efficiency: 91 },
  { id: 'DE-BER', name: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.40, type: 'USER', status: 'ACTIVE', connections: 890, value: 32000000, apy: 12.6, efficiency: 87 },
  { id: 'FR-PAR', name: 'Paris', country: 'France', lat: 48.85, lng: 2.35, type: 'USER', status: 'ACTIVE', connections: 720, value: 28000000, apy: 12.3, efficiency: 85 },
  { id: 'CH-ZUR', name: 'Zurich', country: 'Switzerland', lat: 47.37, lng: 8.54, type: 'EXCHANGE', status: 'ACTIVE', connections: 560, value: 45000000, apy: 14.0, efficiency: 93 },
  // Asia
  { id: 'JP-TKY', name: 'Tokyo', country: 'Japan', lat: 35.68, lng: 139.69, type: 'EXCHANGE', status: 'ACTIVE', connections: 2200, value: 92000000, apy: 14.8, efficiency: 97 },
  { id: 'SG-SIN', name: 'Singapore', country: 'Singapore', lat: 1.35, lng: 103.82, type: 'DATA_CENTER', status: 'ACTIVE', connections: 1650, value: 58000000, apy: 13.9, efficiency: 94 },
  { id: 'HK-HKG', name: 'Hong Kong', country: 'Hong Kong', lat: 22.39, lng: 114.10, type: 'EXCHANGE', status: 'ACTIVE', connections: 1400, value: 55000000, apy: 14.1, efficiency: 93 },
  { id: 'AE-DXB', name: 'Dubai', country: 'UAE', lat: 25.20, lng: 55.27, type: 'ENERGY', status: 'ACTIVE', connections: 680, value: 38000000, apy: 15.2, efficiency: 92 },
  // South America
  { id: 'BR-SAO', name: 'São Paulo', country: 'Brazil', lat: -23.55, lng: -46.63, type: 'USER', status: 'ACTIVE', connections: 520, value: 22000000, apy: 11.8, efficiency: 82 },
];

const STATUS_MESSAGES = [
  { icon: '⚡', text: 'Real-Time Energy Trading: 15,420 Nodes Synced' },
  { icon: '💰', text: '₩2.8B Energy Traded Today' },
  { icon: '🌐', text: 'New Node: Dubai Solar Farm Connected' },
  { icon: '📊', text: 'Global Settlement: $1.2M Distributed' },
  { icon: '🔋', text: 'Korea Grid: 50MW Active Capacity' },
  { icon: '🤖', text: 'AI Auto-Pilot: 847 Trades Executed' },
  { icon: '☀️', text: 'Yeongdong Solar: 98.7% Uptime' },
  { icon: '🌍', text: '200+ Active Nodes Worldwide' },
];

// ============================================
// Utility Functions
// ============================================

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function projectTo3D(
  lat: number,
  lng: number,
  centerX: number,
  centerY: number,
  radius: number,
  rotationX: number,
  rotationY: number
): Point3D {
  const latRad = degToRad(lat);
  const lngRad = degToRad(lng + rotationY);

  // Spherical to Cartesian
  let x = radius * Math.cos(latRad) * Math.sin(lngRad);
  let y = radius * Math.sin(latRad);
  let z = radius * Math.cos(latRad) * Math.cos(lngRad);

  // Apply X rotation (tilt)
  const cosX = Math.cos(degToRad(rotationX));
  const sinX = Math.sin(degToRad(rotationX));
  const newY = y * cosX - z * sinX;
  const newZ = y * sinX + z * cosX;
  y = newY;
  z = newZ;

  const visible = z > -radius * 0.1;
  const scale = (z + radius) / (2 * radius);

  return {
    x: centerX + x,
    y: centerY - y,
    z,
    visible,
    scale: Math.max(0.3, scale),
  };
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function formatNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
}

// ============================================
// Main Globe Component
// ============================================

export function GlobeWidget() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Rotation state (using refs for performance)
  const rotationRef = useRef({ x: 15, y: 0 });
  const targetRotationRef = useRef({ x: 15, y: 0 });
  const autoRotateRef = useRef(true);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Connection animations
  const connectionsRef = useRef<Connection[]>([]);

  // React state for UI
  const [hoveredNode, setHoveredNode] = useState<NodeLocation | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeLocation | null>(null);
  const [statusIndex, setStatusIndex] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 300 });
  const [isLoaded, setIsLoaded] = useState(false);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalConnections = GLOBAL_NODES.reduce((sum, n) => sum + n.connections, 0);
    const totalValue = GLOBAL_NODES.reduce((sum, n) => sum + (n.value || 0), 0);
    const activeNodes = GLOBAL_NODES.filter(n => n.status === 'ACTIVE').length;
    return { totalConnections, totalValue, activeNodes };
  }, []);

  // Initialize connections
  useEffect(() => {
    const conns: Connection[] = [];
    const nodesByType = GLOBAL_NODES.reduce((acc, node) => {
      if (!acc[node.type]) acc[node.type] = [];
      acc[node.type].push(node);
      return acc;
    }, {} as Record<NodeType, NodeLocation[]>);

    // Create strategic connections
    const hubs = GLOBAL_NODES.filter(n => n.type === 'DATA_CENTER');
    hubs.forEach(hub => {
      GLOBAL_NODES.forEach(node => {
        if (node.id !== hub.id && Math.random() > 0.5) {
          conns.push({
            from: hub,
            to: node,
            progress: Math.random(),
            active: node.status === 'ACTIVE',
          });
        }
      });
    });

    // Add some cross-regional connections
    const exchanges = GLOBAL_NODES.filter(n => n.type === 'EXCHANGE');
    for (let i = 0; i < exchanges.length; i++) {
      for (let j = i + 1; j < exchanges.length; j++) {
        if (Math.random() > 0.3) {
          conns.push({
            from: exchanges[i],
            to: exchanges[j],
            progress: Math.random(),
            active: true,
          });
        }
      }
    }

    connectionsRef.current = conns;
  }, []);

  // Status message rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % STATUS_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Responsive canvas sizing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = Math.min(rect.width * 0.75, 400);

      setCanvasSize({
        width: Math.floor(width * dpr),
        height: Math.floor(height * dpr),
      });
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    updateSize();

    return () => resizeObserver.disconnect();
  }, []);

  // Get node at position
  const getNodeAtPosition = useCallback((clientX: number, clientY: number): NodeLocation | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 40;

    for (const node of GLOBAL_NODES) {
      const point = projectTo3D(
        node.lat,
        node.lng,
        centerX,
        centerY,
        radius,
        rotationRef.current.x,
        rotationRef.current.y
      );

      if (point.visible) {
        const nodeRadius = 8 * point.scale + 10;
        const dist = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
        if (dist < nodeRadius) {
          return node;
        }
      }
    }
    return null;
  }, []);

  // Mouse/Touch event handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      autoRotateRef.current = false;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Check for hover
      const node = getNodeAtPosition(e.clientX, e.clientY);
      setHoveredNode(node);

      if (!isDraggingRef.current) {
        canvas.style.cursor = node ? 'pointer' : 'grab';
        return;
      }

      const deltaX = e.clientX - lastMouseRef.current.x;
      const deltaY = e.clientY - lastMouseRef.current.y;

      targetRotationRef.current.y += deltaX * 0.5;
      targetRotationRef.current.x = Math.max(-60, Math.min(60, targetRotationRef.current.x - deltaY * 0.3));

      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      canvas.style.cursor = 'grab';
      // Resume auto-rotation after 3 seconds
      setTimeout(() => {
        if (!isDraggingRef.current) autoRotateRef.current = true;
      }, 3000);
    };

    const handleClick = (e: MouseEvent) => {
      const node = getNodeAtPosition(e.clientX, e.clientY);
      setSelectedNode(prev => prev?.id === node?.id ? null : node);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        autoRotateRef.current = false;
        lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      e.preventDefault();

      const touch = e.touches[0];
      const deltaX = touch.clientX - lastMouseRef.current.x;
      const deltaY = touch.clientY - lastMouseRef.current.y;

      targetRotationRef.current.y += deltaX * 0.5;
      targetRotationRef.current.x = Math.max(-60, Math.min(60, targetRotationRef.current.x - deltaY * 0.3));

      lastMouseRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      setTimeout(() => {
        if (!isDraggingRef.current) autoRotateRef.current = true;
      }, 3000);
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [getNodeAtPosition]);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const draw = (timestamp: number) => {
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2 - 40;

      // Auto rotation
      if (autoRotateRef.current) {
        targetRotationRef.current.y += 0.15;
      }

      // Smooth interpolation
      rotationRef.current.x += (targetRotationRef.current.x - rotationRef.current.x) * 0.08;
      rotationRef.current.y += (targetRotationRef.current.y - rotationRef.current.y) * 0.08;

      // Clear with gradient background
      const bgGradient = ctx.createRadialGradient(centerX, centerY * 0.7, 0, centerX, centerY, radius * 1.5);
      bgGradient.addColorStop(0, '#1a1f2e');
      bgGradient.addColorStop(1, '#0a0d14');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Atmospheric glow
      const atmosphereGradient = ctx.createRadialGradient(centerX, centerY, radius * 0.9, centerX, centerY, radius * 1.15);
      atmosphereGradient.addColorStop(0, 'rgba(16, 185, 129, 0)');
      atmosphereGradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.03)');
      atmosphereGradient.addColorStop(0.8, 'rgba(6, 182, 212, 0.08)');
      atmosphereGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.15, 0, Math.PI * 2);
      ctx.fillStyle = atmosphereGradient;
      ctx.fill();

      // Globe body with gradient
      const globeGradient = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        0,
        centerX,
        centerY,
        radius
      );
      globeGradient.addColorStop(0, '#1e3a3a');
      globeGradient.addColorStop(0.3, '#152a2a');
      globeGradient.addColorStop(0.7, '#0d1a1a');
      globeGradient.addColorStop(1, '#050a0a');

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = globeGradient;
      ctx.fill();

      // Grid lines - Longitude
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.lineWidth = 1;
      for (let lng = -180; lng <= 180; lng += 30) {
        ctx.beginPath();
        let started = false;
        for (let lat = -90; lat <= 90; lat += 3) {
          const point = projectTo3D(lat, lng, centerX, centerY, radius, rotationRef.current.x, rotationRef.current.y);
          if (point.visible && point.z > 0) {
            if (!started) {
              ctx.moveTo(point.x, point.y);
              started = true;
            } else {
              ctx.lineTo(point.x, point.y);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      // Grid lines - Latitude
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let started = false;
        for (let lng = -180; lng <= 180; lng += 3) {
          const point = projectTo3D(lat, lng, centerX, centerY, radius, rotationRef.current.x, rotationRef.current.y);
          if (point.visible && point.z > 0) {
            if (!started) {
              ctx.moveTo(point.x, point.y);
              started = true;
            } else {
              ctx.lineTo(point.x, point.y);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      // Draw connection arcs
      connectionsRef.current.forEach(conn => {
        const p1 = projectTo3D(conn.from.lat, conn.from.lng, centerX, centerY, radius, rotationRef.current.x, rotationRef.current.y);
        const p2 = projectTo3D(conn.to.lat, conn.to.lng, centerX, centerY, radius, rotationRef.current.x, rotationRef.current.y);

        if (p1.visible && p2.visible && p1.z > 0 && p2.z > 0) {
          // Update animation progress
          conn.progress = (conn.progress + 0.002) % 1;

          // Draw curved arc
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
          const curvature = Math.min(dist * 0.3, 50);
          const controlY = midY - curvature;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.quadraticCurveTo(midX, controlY, p2.x, p2.y);

          const alpha = Math.min(p1.scale, p2.scale) * 0.15;
          ctx.strokeStyle = conn.active
            ? `rgba(16, 185, 129, ${alpha})`
            : `rgba(245, 158, 11, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Draw traveling particle
          if (conn.active) {
            const t = easeInOutCubic(conn.progress);
            const particleX = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * midX + t * t * p2.x;
            const particleY = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * controlY + t * t * p2.y;

            const particleGradient = ctx.createRadialGradient(particleX, particleY, 0, particleX, particleY, 4);
            particleGradient.addColorStop(0, 'rgba(16, 185, 129, 0.8)');
            particleGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
            ctx.beginPath();
            ctx.arc(particleX, particleY, 4, 0, Math.PI * 2);
            ctx.fillStyle = particleGradient;
            ctx.fill();
          }
        }
      });

      // Draw nodes (sorted by z-index)
      const sortedNodes = [...GLOBAL_NODES]
        .map(node => ({
          node,
          point: projectTo3D(node.lat, node.lng, centerX, centerY, radius, rotationRef.current.x, rotationRef.current.y),
        }))
        .filter(item => item.point.visible && item.point.z > 0)
        .sort((a, b) => a.point.z - b.point.z);

      sortedNodes.forEach(({ node, point }) => {
        const color = NODE_COLORS[node.type];
        const baseRadius = 6 * point.scale;
        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id;
        const highlight = isHovered || isSelected;

        // Outer glow
        const glowRadius = highlight ? baseRadius * 4 : baseRadius * 2.5;
        const glowGradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, glowRadius);
        glowGradient.addColorStop(0, color + (highlight ? '80' : '40'));
        glowGradient.addColorStop(0.5, color + '20');
        glowGradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(point.x, point.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        // Pulse ring for active nodes
        if (node.status === 'ACTIVE') {
          const pulsePhase = (Date.now() / 1000 + node.lat * 0.01) % 1;
          const pulseRadius = baseRadius + pulsePhase * 15;
          const pulseAlpha = (1 - pulsePhase) * 0.4;
          ctx.beginPath();
          ctx.arc(point.x, point.y, pulseRadius, 0, Math.PI * 2);
          ctx.strokeStyle = color + Math.floor(pulseAlpha * 255).toString(16).padStart(2, '0');
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Core dot
        ctx.beginPath();
        ctx.arc(point.x, point.y, highlight ? baseRadius * 1.5 : baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Inner highlight
        ctx.beginPath();
        ctx.arc(point.x - baseRadius * 0.3, point.y - baseRadius * 0.3, baseRadius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();

        // Node label for hovered/selected
        if (highlight && point.scale > 0.6) {
          ctx.font = `bold ${12 * point.scale}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillStyle = 'white';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 4;
          ctx.fillText(node.name, point.x, point.y - baseRadius - 8);
          ctx.shadowBlur = 0;
        }
      });

      // Mark as loaded after first frame
      if (!isLoaded) setIsLoaded(true);

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [canvasSize, hoveredNode, selectedNode, isLoaded]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] rounded-2xl overflow-hidden border border-white/5"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-lg">🌍</span>
          </div>
          <div>
            <h3 className="font-bold text-white">Global Empire Network</h3>
            <p className="text-xs text-white/40">Real-Time Node Activity</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
          <span className="text-xs font-bold text-emerald-400">LIVE</span>
        </div>
      </div>

      {/* Canvas Container */}
      <div ref={containerRef} className="relative">
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: canvasSize.height / (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1),
            cursor: 'grab',
          }}
          className="block"
        />

        {/* Loading overlay */}
        <AnimatePresence>
          {!isLoaded && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0f1419] flex items-center justify-center"
            >
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Overlay - Top Right */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
          <div className="text-xl font-black text-emerald-400 tabular-nums">
            {stats.activeNodes}
          </div>
          <div className="text-[10px] text-white/50 uppercase tracking-wider">Active Nodes</div>
        </div>

        {/* Stats Overlay - Bottom Left */}
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
          <div className="text-xl font-black text-cyan-400 tabular-nums">
            {formatNumber(stats.totalConnections)}
          </div>
          <div className="text-[10px] text-white/50 uppercase tracking-wider">Connections</div>
        </div>

        {/* Stats Overlay - Bottom Right */}
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
          <div className="text-xl font-black text-amber-400 tabular-nums">
            ${formatNumber(stats.totalValue)}
          </div>
          <div className="text-[10px] text-white/50 uppercase tracking-wider">Total Value</div>
        </div>

        {/* Selected Node Detail Panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute top-3 left-3 bg-black/80 backdrop-blur-md rounded-xl p-4 border border-white/10 min-w-[200px]"
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: NODE_COLORS[selectedNode.type] }}
                />
                <span className="font-bold text-white">{selectedNode.name}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Country</span>
                  <span className="text-white">{selectedNode.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Type</span>
                  <span className="text-white">{selectedNode.type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Status</span>
                  <span style={{ color: STATUS_COLORS[selectedNode.status] }}>
                    {selectedNode.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Connections</span>
                  <span className="text-white">{selectedNode.connections.toLocaleString()}</span>
                </div>
                {selectedNode.value && (
                  <div className="flex justify-between">
                    <span className="text-white/50">Value</span>
                    <span className="text-emerald-400">${formatNumber(selectedNode.value)}</span>
                  </div>
                )}
                {selectedNode.apy && (
                  <div className="flex justify-between">
                    <span className="text-white/50">APY</span>
                    <span className="text-amber-400 font-bold">{selectedNode.apy}%</span>
                  </div>
                )}
                {selectedNode.efficiency && (
                  <div className="flex justify-between">
                    <span className="text-white/50">Efficiency</span>
                    <span className="text-cyan-400">{selectedNode.efficiency}%</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="mt-3 w-full py-1.5 text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status Message Ticker */}
      <div className="h-10 flex items-center justify-center border-t border-white/5 bg-black/20">
        <AnimatePresence mode="wait">
          <motion.div
            key={statusIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 text-sm"
          >
            <span>{STATUS_MESSAGES[statusIndex].icon}</span>
            <span className="text-white/60">{STATUS_MESSAGES[statusIndex].text}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Node Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 p-4 border-t border-white/5">
        {(Object.keys(NODE_COLORS) as NodeType[]).map(type => (
          <div key={type} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: NODE_COLORS[type] }}
            />
            <span className="text-xs text-white/40 capitalize">
              {type.toLowerCase().replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================
// Compact Globe Indicator (for headers/sidebars)
// ============================================

export function CompactGlobeIndicator() {
  const [pulse, setPulse] = useState(false);
  const activeNodes = useMemo(
    () => GLOBAL_NODES.filter(n => n.status === 'ACTIVE').length,
    []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0f1419] rounded-full border border-white/10">
      <div className="relative">
        <div className="w-3 h-3 bg-emerald-500 rounded-full" />
        <motion.div
          className="absolute inset-0 bg-emerald-500 rounded-full"
          animate={pulse ? { scale: [1, 2], opacity: [0.5, 0] } : {}}
          transition={{ duration: 1 }}
        />
      </div>
      <span className="text-xs font-bold text-white tabular-nums">{activeNodes}</span>
      <span className="text-xs text-white/40">Nodes</span>
    </div>
  );
}

// ============================================
// Mini Globe for Dashboard Cards
// ============================================

export function MiniGlobeStats() {
  const stats = useMemo(() => {
    const byType = GLOBAL_NODES.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<NodeType, number>);

    const totalValue = GLOBAL_NODES.reduce((sum, n) => sum + (n.value || 0), 0);

    return { byType, totalValue };
  }, []);

  return (
    <div className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] rounded-xl p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
          <span className="text-sm">🌐</span>
        </div>
        <div>
          <div className="text-sm font-bold text-white">Global Network</div>
          <div className="text-xs text-white/40">{GLOBAL_NODES.length} nodes active</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(Object.entries(stats.byType) as [NodeType, number][]).map(([type, count]) => (
          <div key={type} className="bg-white/5 rounded-lg p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: NODE_COLORS[type] }}
              />
              <span className="text-[10px] text-white/40 uppercase">
                {type.replace('_', ' ')}
              </span>
            </div>
            <div className="text-lg font-bold text-white">{count}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-white/5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/40">Total Network Value</span>
          <span className="text-sm font-bold text-emerald-400">
            ${formatNumber(stats.totalValue)}
          </span>
        </div>
      </div>
    </div>
  );
}
