'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 45: SOVEREIGN CTA - Conversion Trigger Component
 * ═══════════════════════════════════════════════════════════════════════════════
 * "Become a Sovereign Lord" 버튼 - 결제창 연결
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface SovereignCTAProps {
  variant?: 'hero' | 'inline' | 'floating';
  showBenefits?: boolean;
}

const PLATINUM_BENEFITS = [
  { icon: '⚡', text: '에너지 구매 20% 할인' },
  { icon: '📊', text: '영동 발전소 독점 데이터' },
  { icon: '🔮', text: 'Prophet AI 프리미엄' },
  { icon: '🎯', text: 'Early Bird 우선 참여' },
  { icon: '💰', text: '100 KAUS 즉시 지급' },
];

export function SovereignCTA({ variant = 'hero', showBenefits = true }: SovereignCTAProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async () => {
    setIsProcessing(true);

    // Navigate to payment/membership page
    router.push('/ko/nexus/membership');
  };

  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClick}
          className="px-6 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white font-bold rounded-2xl shadow-2xl shadow-amber-500/30"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">👑</span>
            <div className="text-left">
              <div className="text-sm opacity-80">Become a</div>
              <div className="text-lg">Sovereign Lord</div>
            </div>
          </div>
        </motion.button>
      </motion.div>
    );
  }

  if (variant === 'inline') {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        disabled={isProcessing}
        className="w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl"
      >
        <div className="flex items-center justify-center gap-2">
          <span className="text-xl">👑</span>
          <span>Become a Sovereign Lord</span>
          <span className="text-sm opacity-80">$99</span>
        </div>
      </motion.button>
    );
  }

  // Hero variant (default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Main CTA Card */}
      <motion.div
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="relative bg-gradient-to-br from-[#171717] via-[#2a2a2a] to-[#171717] rounded-3xl p-8 overflow-hidden"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <motion.div
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, #f59e0b 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, #f59e0b 0%, transparent 50%)',
                'radial-gradient(circle at 20% 50%, #f59e0b 0%, transparent 50%)',
              ],
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0"
          />
        </div>

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative z-10">
          {/* Crown Icon */}
          <motion.div
            animate={isHovered ? { rotate: [0, -10, 10, 0], scale: 1.1 } : {}}
            transition={{ duration: 0.5 }}
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30"
          >
            <span className="text-5xl">👑</span>
          </motion.div>

          {/* Title */}
          <h2 className="text-3xl font-black text-white text-center mb-2">
            Become a Sovereign Lord
          </h2>
          <p className="text-white/60 text-center mb-6">
            에너지 제국의 주인이 되십시오
          </p>

          {/* Price */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="text-center">
              <div className="text-4xl font-black text-amber-400">$99</div>
              <div className="text-white/40 text-sm">USD</div>
            </div>
            <div className="text-white/30 text-2xl">=</div>
            <div className="text-center">
              <div className="text-4xl font-black text-white">1,200</div>
              <div className="text-white/40 text-sm">KAUS</div>
            </div>
          </div>

          {/* Benefits */}
          <AnimatePresence>
            {showBenefits && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-2 gap-3 mb-6"
              >
                {PLATINUM_BENEFITS.map((benefit, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg"
                  >
                    <span>{benefit.icon}</span>
                    <span className="text-sm text-white/80">{benefit.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClick}
            disabled={isProcessing}
            className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-amber-500/30 disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  ⏳
                </motion.span>
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>Claim Your Throne</span>
                <span>→</span>
              </span>
            )}
          </motion.button>

          {/* Trust Badge */}
          <div className="flex items-center justify-center gap-4 mt-4 text-white/40 text-xs">
            <span>🔒 Secure Payment</span>
            <span>|</span>
            <span>⚡ Instant Activation</span>
            <span>|</span>
            <span>🌍 Global Access</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Platinum Badge Component
export function PlatinumBadge({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-full shadow-lg shadow-amber-500/30 ${sizeClasses[size]}`}
    >
      <span>👑</span>
      <span>PLATINUM</span>
    </motion.div>
  );
}

// Live Data Widget with CTA
export function LiveDataCTA() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-emerald-900/50 to-cyan-900/50 rounded-2xl p-6 border border-emerald-500/20"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-emerald-400 font-bold">LIVE DATA</span>
        </div>
        <PlatinumBadge size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-xs text-white/50 mb-1">Yeongdong Solar</div>
          <div className="text-xl font-bold text-amber-400">42.5 MW</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-xs text-white/50 mb-1">Cybertruck V2G</div>
          <div className="text-xl font-bold text-cyan-400">72%</div>
        </div>
      </div>

      <p className="text-white/60 text-sm mb-4">
        Platinum 멤버십으로 실시간 자산 데이터에 접근하세요
      </p>

      <SovereignCTA variant="inline" showBenefits={false} />
    </motion.div>
  );
}
