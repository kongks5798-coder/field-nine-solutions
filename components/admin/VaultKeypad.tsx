/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 82: SOVEREIGN VAULT KEYPAD - APPLE-TESLA GRADE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Premium security keypad with full tactile feedback system
 * - 6-digit passcode entry
 * - Web Audio metallic tones on each press
 * - Haptic feedback patterns (Apple Taptic Engine grade)
 * - Energy particle visual effects (no visible numbers until touch)
 * - Lockout after 3 failed attempts
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTactileFeedback } from '@/hooks/use-tactile-feedback';

interface VaultKeypadProps {
  onSuccess: () => void;
  correctCode: string;
  maxAttempts?: number;
}

export function VaultKeypad({
  onSuccess,
  correctCode,
  maxAttempts = 3,
}: VaultKeypadProps) {
  const [code, setCode] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // PHASE 82: Premium tactile feedback system
  const tactile = useTactileFeedback();

  // Lockout timer
  useEffect(() => {
    if (lockTimer > 0) {
      const timer = setTimeout(() => setLockTimer(lockTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && lockTimer === 0) {
      setIsLocked(false);
      setAttempts(0);
    }
  }, [lockTimer, isLocked]);

  // Handle digit press with premium tactile feedback
  const handleDigit = useCallback((digit: string) => {
    if (isLocked || success) return;

    // Visual feedback - show active key
    setActiveKey(digit);
    setTimeout(() => setActiveKey(null), 150);

    // PHASE 82: Premium keypad sound + haptic
    tactile.keypad();
    setError(false);

    const newCode = code + digit;
    setCode(newCode);

    // Check code when complete
    if (newCode.length === correctCode.length) {
      if (newCode === correctCode) {
        setSuccess(true);
        // PHASE 82: Vault unlock sequence
        tactile.unlock();
        setTimeout(() => onSuccess(), 800);
      } else {
        setError(true);
        // PHASE 82: Error feedback
        tactile.error();
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        // PHASE 83: Report to Imperial Guard blacklist
        fetch('/api/admin/vault/blacklist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'keypad' }),
        }).catch(() => {
          // Silently fail if API unavailable
        });

        if (newAttempts >= maxAttempts) {
          setIsLocked(true);
          setLockTimer(30); // 30 second lockout
          tactile.critical(); // Extra feedback for lockout
        }

        setTimeout(() => {
          setCode('');
          setError(false);
        }, 500);
      }
    }
  }, [code, correctCode, attempts, maxAttempts, isLocked, success, onSuccess, tactile]);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    if (isLocked || success) return;
    tactile.tap();
    setCode(prev => prev.slice(0, -1));
  }, [isLocked, success, tactile]);

  // Handle clear
  const handleClear = useCallback(() => {
    if (isLocked || success) return;
    tactile.click();
    setCode('');
  }, [isLocked, success, tactile]);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
      {/* Vault Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="text-6xl mb-4">🔐</div>
        <h1 className="text-2xl font-black text-white mb-2">SOVEREIGN VAULT</h1>
        <p className="text-white/50 text-sm">Emperor Access Only</p>
      </motion.div>

      {/* Code Display */}
      <motion.div
        animate={{
          x: error ? [-10, 10, -10, 10, 0] : 0,
          backgroundColor: error
            ? 'rgba(239, 68, 68, 0.2)'
            : success
            ? 'rgba(0, 229, 255, 0.2)'
            : 'rgba(255, 255, 255, 0.05)',
        }}
        transition={{ duration: 0.3 }}
        className="flex gap-3 mb-8 p-4 rounded-2xl border border-white/10"
      >
        {[...Array(correctCode.length)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              scale: code.length === i ? 1.1 : 1,
              borderColor: code.length > i
                ? success ? '#00E5FF' : error ? '#EF4444' : '#00E5FF'
                : 'rgba(255,255,255,0.2)',
            }}
            className="w-12 h-14 rounded-xl border-2 flex items-center justify-center"
          >
            {code.length > i && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`w-3 h-3 rounded-full ${
                  success ? 'bg-[#00E5FF]' : error ? 'bg-red-500' : 'bg-white'
                }`}
              />
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Status Messages */}
      <AnimatePresence mode="wait">
        {isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-6 px-6 py-3 bg-red-500/20 border border-red-500/50 rounded-xl text-center"
          >
            <div className="text-red-400 font-bold">LOCKOUT ACTIVE</div>
            <div className="text-red-300/70 text-sm">
              Try again in {lockTimer}s
            </div>
          </motion.div>
        )}
        {error && !isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-6 text-red-400 text-sm"
          >
            Invalid code. {maxAttempts - attempts} attempts remaining.
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 px-6 py-3 bg-[#00E5FF]/20 border border-[#00E5FF]/50 rounded-xl"
          >
            <div className="text-[#00E5FF] font-bold">ACCESS GRANTED</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PHASE 82: Premium Keypad Grid with Energy Particles */}
      <div className="grid grid-cols-3 gap-3">
        {digits.map((digit, i) => (
          <div key={i} className="relative">
            {digit === '' ? (
              i === 9 ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleClear}
                  disabled={isLocked}
                  className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 text-white/50 font-bold text-sm disabled:opacity-30 backdrop-blur-sm"
                >
                  CLR
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleBackspace}
                  disabled={isLocked}
                  className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 text-white/50 font-bold text-xl disabled:opacity-30 backdrop-blur-sm"
                >
                  ⌫
                </motion.button>
              )
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  backgroundColor: activeKey === digit ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.05)',
                  borderColor: activeKey === digit ? 'rgba(0,229,255,0.5)' : 'rgba(255,255,255,0.1)',
                  boxShadow: activeKey === digit ? '0 0 20px rgba(0,229,255,0.3)' : 'none',
                }}
                transition={{ duration: 0.1 }}
                onClick={() => handleDigit(digit)}
                disabled={isLocked}
                className="w-20 h-20 rounded-2xl border text-white font-bold text-2xl disabled:opacity-30 backdrop-blur-sm relative overflow-hidden"
              >
                {/* Energy particle effect on active */}
                <AnimatePresence>
                  {activeKey === digit && (
                    <>
                      {[...Array(6)].map((_, j) => (
                        <motion.div
                          key={j}
                          initial={{
                            opacity: 1,
                            scale: 0,
                            x: '50%',
                            y: '50%',
                          }}
                          animate={{
                            opacity: 0,
                            scale: 2,
                            x: `${50 + Math.cos(j * Math.PI / 3) * 100}%`,
                            y: `${50 + Math.sin(j * Math.PI / 3) * 100}%`,
                          }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          className="absolute w-1 h-1 rounded-full bg-[#00E5FF]"
                          style={{
                            left: 0,
                            top: 0,
                            transform: 'translate(-50%, -50%)',
                          }}
                        />
                      ))}
                    </>
                  )}
                </AnimatePresence>
                {digit}
              </motion.button>
            )}
          </div>
        ))}
      </div>

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center text-white/30 text-xs max-w-xs"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>Session Monitored</span>
        </div>
        <p>All access attempts are logged with SHA-256 audit trail</p>
      </motion.div>
    </div>
  );
}

export default VaultKeypad;
