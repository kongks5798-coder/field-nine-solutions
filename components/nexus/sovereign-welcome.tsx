/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 77: SOVEREIGN WELCOME SEQUENCE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Premium welcome experience for new users:
 * - "Welcome to the Empire" message
 * - 100 KAUS bonus notification
 * - Confetti celebration effect
 * - CTA button: "지금 첫 에너지를 매수하고 13.5% 수익을 확보하세요"
 *
 * Features:
 * - Canvas-based confetti for performance
 * - Glassmorphism modal design
 * - Haptic feedback on mobile
 * - Auto-dismiss after interaction
 */

'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { triggerFeedback } from './neon-effects';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFETTI SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  opacity: number;
}

const CONFETTI_COLORS = [
  '#00E5FF', // Cyan
  '#00FF88', // Green
  '#FFD700', // Gold
  '#FF6B6B', // Coral
  '#A855F7', // Purple
  '#FFFFFF', // White
];

function ConfettiCanvas({ active, onComplete }: { active: boolean; onComplete?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pieces = useRef<ConfettiPiece[]>([]);
  const animationId = useRef<number>(0);

  const createConfetti = useCallback(() => {
    const newPieces: ConfettiPiece[] = [];
    const count = window.innerWidth < 768 ? 100 : 200;

    for (let i = 0; i < count; i++) {
      newPieces.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
        y: window.innerHeight / 3,
        vx: (Math.random() - 0.5) * 15,
        vy: -Math.random() * 20 - 10,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: Math.random() * 10 + 5,
        opacity: 1,
      });
    }
    pieces.current = newPieces;
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let activeCount = 0;

    pieces.current.forEach((piece) => {
      // Physics
      piece.vy += 0.5; // Gravity
      piece.vx *= 0.99; // Air resistance
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.rotation += piece.rotationSpeed;
      piece.opacity -= 0.005;

      if (piece.opacity > 0 && piece.y < canvas.height + 100) {
        activeCount++;

        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate((piece.rotation * Math.PI) / 180);
        ctx.globalAlpha = piece.opacity;
        ctx.fillStyle = piece.color;

        // Draw confetti shape (rectangle or circle)
        if (Math.random() > 0.5) {
          ctx.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, piece.size / 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    });

    if (activeCount > 0) {
      animationId.current = requestAnimationFrame(animate);
    } else {
      onComplete?.();
    }
  }, [onComplete]);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    createConfetti();
    animationId.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId.current);
    };
  }, [active, createConfetti, animate]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[100] pointer-events-none"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WELCOME MODAL
// ═══════════════════════════════════════════════════════════════════════════════

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  bonusAmount?: number;
}

function WelcomeModal({ isOpen, onClose, userName, bonusAmount = 100 }: WelcomeModalProps) {
  const router = useRouter();

  const handleCTA = () => {
    triggerFeedback('success', { haptic: true, sound: true });
    onClose();
    router.push('/ko/nexus/exchange');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: 'spring', duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-3xl"
            style={{
              background: 'linear-gradient(135deg, rgba(23,23,23,0.95) 0%, rgba(10,10,10,0.98) 100%)',
              backdropFilter: 'blur(40px)',
              boxShadow: '0 0 60px rgba(0,229,255,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              border: '1px solid rgba(0,229,255,0.3)',
            }}
          >
            {/* Decorative top glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-to-b from-[#00E5FF]/30 to-transparent blur-3xl pointer-events-none" />

            {/* Crown icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl"
            >
              👑
            </motion.div>

            <div className="p-8 pt-12 text-center">
              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-black text-white mb-2"
              >
                Welcome to the Empire
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-white/60 mb-6"
              >
                {userName ? `${userName}님, ` : ''}Field Nine 제국에 오신 것을 환영합니다
              </motion.p>

              {/* Bonus Display */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="relative mb-8"
              >
                <div
                  className="py-6 px-8 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,229,255,0.15) 0%, rgba(0,255,136,0.15) 100%)',
                    border: '1px solid rgba(0,229,255,0.3)',
                    boxShadow: '0 0 40px rgba(0,229,255,0.2) inset',
                  }}
                >
                  <div className="text-sm text-[#00E5FF] mb-2">신규 가입 보너스</div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-5xl font-black text-white">{bonusAmount}</span>
                    <span className="text-2xl font-bold text-[#00E5FF]">KAUS</span>
                  </div>
                  <div className="text-sm text-white/50 mt-2">
                    ≈ ${(bonusAmount * 0.15).toFixed(2)} USD
                  </div>
                </div>

                {/* Animated ring */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.2, 0.5],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-2xl border-2 border-[#00E5FF]/30"
                />
              </motion.div>

              {/* Benefits list */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-left space-y-3 mb-8"
              >
                {[
                  { icon: '⚡', text: '실시간 에너지 거래' },
                  { icon: '📈', text: '최대 13.5% 연수익률' },
                  { icon: '🔒', text: '블록체인 기반 안전한 자산 보관' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-white/80">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </motion.div>

              {/* CTA Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{
                  scale: 1.02,
                  boxShadow: '0 0 40px rgba(0,229,255,0.5)',
                }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCTA}
                className="w-full py-4 rounded-2xl font-bold text-lg text-[#171717] transition-all"
                style={{
                  background: 'linear-gradient(135deg, #00E5FF 0%, #00FF88 100%)',
                  boxShadow: '0 0 30px rgba(0,229,255,0.4)',
                }}
              >
                지금 첫 에너지를 매수하고 13.5% 수익을 확보하세요
              </motion.button>

              {/* Skip link */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={onClose}
                className="mt-4 text-sm text-white/40 hover:text-white/60 transition-colors"
              >
                나중에 하기
              </motion.button>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all"
            >
              ✕
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function SovereignWelcome() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [userName, setUserName] = useState<string>();
  const hasShown = useRef(false);

  useEffect(() => {
    // Check if user is new and hasn't seen welcome
    const checkNewUser = async () => {
      if (hasShown.current) return;

      try {
        const res = await fetch('/api/kaus/user-balance');
        if (!res.ok) return;

        const data = await res.json();

        if (data.success && data.isNewUser && !localStorage.getItem('sovereignWelcomeShown')) {
          hasShown.current = true;
          setUserName(data.email?.split('@')[0] || undefined);

          // Delay to allow page to load
          setTimeout(() => {
            setShowConfetti(true);
            setShowWelcome(true);
            triggerFeedback('success', { haptic: true, sound: true });
          }, 1000);

          // Mark as shown
          localStorage.setItem('sovereignWelcomeShown', 'true');
        }
      } catch (error) {
        // Silent fail
      }
    };

    checkNewUser();
  }, []);

  const handleClose = () => {
    setShowWelcome(false);
    // Keep confetti running a bit longer
    setTimeout(() => setShowConfetti(false), 2000);
  };

  return (
    <>
      <ConfettiCanvas active={showConfetti} />
      <WelcomeModal
        isOpen={showWelcome}
        onClose={handleClose}
        userName={userName}
        bonusAmount={100}
      />
    </>
  );
}

// Manual trigger for testing
export function triggerWelcomeSequence() {
  localStorage.removeItem('sovereignWelcomeShown');
  window.location.reload();
}

export default SovereignWelcome;
