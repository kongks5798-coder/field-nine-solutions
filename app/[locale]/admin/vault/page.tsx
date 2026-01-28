/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 85: SOVEREIGN VAULT - ABSOLUTE POWER MODE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * ABSOLUTE POWER Security System:
 * - kongks5798@gmail.com = Auto-unlock (no keypad required)
 * - All other admins = Keypad required
 *
 * PHASE 85 Enhancements:
 * - Emperor auto-authentication bypass
 * - Server-side session (survives browser refresh)
 * - 5-minute inactivity auto-lock
 * - Imperial Guard screen for unauthorized access
 * - Full Audit Trail with SHA-256 signatures
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VaultKeypad } from '@/components/admin/VaultKeypad';
import { CentralBank } from '@/components/admin/CentralBank';
import { ImperialGuardScreen } from '@/components/admin/ImperialGuardScreen';
import { useVaultSession, formatRemainingTime } from '@/hooks/use-vault-session';
import { useTactileFeedback } from '@/hooks/use-tactile-feedback';
import { isEmperor } from '@/lib/auth/emperor-whitelist';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type VaultState =
  | 'checking-auth'    // Verifying 1st lock (Supabase Auth)
  | 'unauthorized'     // Not kongks5798@gmail.com
  | 'require-login'    // Not logged in
  | 'keypad'           // 2nd lock (Enter passcode)
  | 'unlocked';        // Full access granted

interface AuthData {
  email: string;
  role: string;
  lastSignIn?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VAULT PASSCODE - 2nd Lock
// ═══════════════════════════════════════════════════════════════════════════════

const VAULT_PASSCODE = '042500';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN VAULT PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function VaultPage() {
  const [vaultState, setVaultState] = useState<VaultState>('checking-auth');
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  // PHASE 82: Premium tactile feedback
  const tactile = useTactileFeedback();

  // PHASE 82: Session management with 5-minute auto-lock
  const {
    isSessionValid,
    remainingTime,
    isWarning,
    startSession,
    endSession,
    refreshSession,
  } = useVaultSession({
    onTimeout: () => {
      // Auto-lock when session expires
      tactile.lock();
      setVaultState('keypad');
      setShowTimeoutWarning(false);
    },
    onWarning: () => {
      // Show warning 1 minute before timeout
      tactile.notification();
      setShowTimeoutWarning(true);
    },
  });

  // PHASE 84: Check both 1st Lock (Supabase Auth) and server session
  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      setVaultState('checking-auth');

      // Check 1st Lock (Supabase Auth)
      const authRes = await fetch('/api/admin/vault/auth');
      const authData = await authRes.json();

      if (!authData.authorized) {
        if (authData.requiresLogin) {
          setVaultState('require-login');
          setError('Login required');
        } else {
          // PHASE 84: Show Imperial Guard screen instead of generic unauthorized
          setVaultState('unauthorized');
          setAuthData(authData.user || null);
          setError(authData.error || 'Access denied');
        }
        return;
      }

      setAuthData(authData.user);

      // PHASE 85: ABSOLUTE POWER - Emperor auto-unlock (no keypad required)
      if (isEmperor(authData.user?.email)) {
        console.log('[Vault] 👑 ABSOLUTE POWER: Emperor detected - auto-unlocking');

        // Create server session automatically for Emperor
        try {
          await fetch('/api/admin/vault/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create',
              passcode: VAULT_PASSCODE,
            }),
          });
        } catch (err) {
          console.error('[Vault] Emperor session creation error:', err);
        }

        startSession();
        setVaultState('unlocked');
        return;
      }

      // Non-Emperor: Check server-side session (survives browser refresh)
      const sessionRes = await fetch('/api/admin/vault/session');
      const sessionData = await sessionRes.json();

      if (sessionData.valid) {
        // Server session exists and is valid - restore unlocked state
        startSession();
        setVaultState('unlocked');
        console.log('[Vault] Server session restored');
      } else {
        // No valid server session - require keypad entry
        setVaultState('keypad');
      }
    } catch (err) {
      console.error('[Vault] Auth check failed:', err);
      // Allow access in development/error scenarios
      setAuthData({ email: 'dev@fieldnine.io', role: 'EMPEROR' });
      setVaultState('keypad');
    }
  };

  // PHASE 84: Handle successful keypad entry (2nd Lock) with server session
  const handleKeypadSuccess = useCallback(async () => {
    // Create server-side session
    try {
      const res = await fetch('/api/admin/vault/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          passcode: VAULT_PASSCODE,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        console.error('[Vault] Server session creation failed');
      } else {
        console.log('[Vault] Server session created');
      }
    } catch (err) {
      console.error('[Vault] Server session error:', err);
    }

    startSession(); // Start local 5-minute session timer
    setVaultState('unlocked');
    setShowTimeoutWarning(false);
  }, [startSession]);

  // PHASE 84: Handle manual lock with server session cleanup
  const handleLockVault = useCallback(async () => {
    tactile.lock();
    endSession();

    // End server-side session
    try {
      await fetch('/api/admin/vault/session', { method: 'DELETE' });
      console.log('[Vault] Server session ended');
    } catch (err) {
      console.error('[Vault] Server session end error:', err);
    }

    setVaultState('keypad');
  }, [tactile, endSession]);

  // PHASE 84: Extend session with server refresh
  const handleExtendSession = useCallback(async () => {
    refreshSession();
    setShowTimeoutWarning(false);
    tactile.success();

    // Refresh server-side session
    try {
      await fetch('/api/admin/vault/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' }),
      });
      console.log('[Vault] Server session refreshed');
    } catch (err) {
      console.error('[Vault] Server session refresh error:', err);
    }
  }, [refreshSession, tactile]);

  // Redirect to login
  const handleLogin = () => {
    // Get current locale from URL
    const locale = window.location.pathname.split('/')[1] || 'ko';
    window.location.href = `/${locale}/auth/login?redirect=/admin/vault`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AnimatePresence mode="wait">
        {/* STATE: Checking Authorization */}
        {vaultState === 'checking-auth' && (
          <motion.div
            key="checking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-24 h-24 border-4 border-[#00E5FF] border-t-transparent rounded-full mb-8"
            />
            <div className="text-2xl font-black text-white mb-2">SOVEREIGN VAULT</div>
            <div className="text-white/50 flex items-center gap-2">
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Verifying Emperor Clearance...
              </motion.span>
            </div>

            {/* Security scan animation */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '200px' }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              className="h-1 bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent mt-6"
            />
          </motion.div>
        )}

        {/* STATE: Require Login */}
        {vaultState === 'require-login' && (
          <motion.div
            key="require-login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen flex flex-col items-center justify-center p-4"
          >
            <div className="text-6xl mb-6">🔐</div>
            <h1 className="text-3xl font-black text-white mb-2">SOVEREIGN VAULT</h1>
            <p className="text-white/50 mb-8">Emperor Authentication Required</p>

            <div className="w-full max-w-md space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-center">
                <div className="text-amber-400 font-bold mb-2">⚠️ 1st Lock Active</div>
                <p className="text-amber-300/70 text-sm">
                  You must login with Emperor credentials to access the Vault.
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogin}
                className="w-full py-4 bg-[#00E5FF] text-black font-black rounded-2xl shadow-[0_0_40px_rgba(0,229,255,0.3)]"
              >
                AUTHENTICATE
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* STATE: Unauthorized - PHASE 84: Imperial Guard Screen */}
        {vaultState === 'unauthorized' && (
          <motion.div
            key="unauthorized"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ImperialGuardScreen
              email={authData?.email}
              reason={error || 'Unauthorized access attempt'}
              attemptedPath="/admin/vault"
            />
          </motion.div>
        )}

        {/* STATE: Keypad (2nd Lock) */}
        {vaultState === 'keypad' && (
          <motion.div
            key="keypad"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <VaultKeypad
              onSuccess={handleKeypadSuccess}
              correctCode={VAULT_PASSCODE}
              maxAttempts={3}
            />
          </motion.div>
        )}

        {/* STATE: Unlocked - Full Access */}
        {vaultState === 'unlocked' && (
          <motion.div
            key="unlocked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen"
          >
            {/* Header */}
            <div className="bg-gradient-to-b from-[#00E5FF]/10 to-transparent border-b border-[#00E5FF]/20">
              <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                      className="text-4xl"
                    >
                      🔓
                    </motion.div>
                    <div>
                      <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        SOVEREIGN VAULT
                        <span className="text-xs px-2 py-1 bg-[#00E5FF]/20 text-[#00E5FF] rounded-full">
                          UNLOCKED
                        </span>
                      </h1>
                      <p className="text-white/50 text-sm">
                        Emperor Command Center • {authData?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* PHASE 82: Session timer with warning indicator */}
                    <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border ${
                      isWarning
                        ? 'bg-amber-500/20 border-amber-500/50'
                        : 'bg-emerald-500/10 border-emerald-500/30'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        isWarning ? 'bg-amber-400' : 'bg-emerald-400'
                      } animate-pulse`} />
                      <span className={isWarning ? 'text-amber-400' : 'text-emerald-400'}>
                        {formatRemainingTime(remainingTime)}
                      </span>
                    </div>

                    {/* Lock button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLockVault}
                      className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 font-bold text-sm hover:bg-red-500/30 transition-colors"
                    >
                      🔒 Lock Vault
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>

            {/* PHASE 82: Session Timeout Warning Modal */}
            <AnimatePresence>
              {showTimeoutWarning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-[#171717] border border-amber-500/50 rounded-3xl p-8 max-w-md mx-4 shadow-[0_0_60px_rgba(245,158,11,0.2)]"
                  >
                    <div className="text-center">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-6xl mb-4"
                      >
                        ⏱️
                      </motion.div>
                      <h2 className="text-2xl font-black text-amber-400 mb-2">
                        Session Expiring
                      </h2>
                      <p className="text-white/70 mb-4">
                        Your vault session will auto-lock in
                      </p>
                      <div className="text-5xl font-mono font-black text-white mb-6">
                        {formatRemainingTime(remainingTime)}
                      </div>
                      <div className="space-y-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleExtendSession}
                          className="w-full py-4 bg-[#00E5FF] text-black font-black rounded-2xl"
                        >
                          STAY ACTIVE (+5 min)
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleLockVault}
                          className="w-full py-3 bg-red-500/20 border border-red-500/50 text-red-400 font-bold rounded-xl"
                        >
                          Lock Now
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 py-8">
              {/* Quick Stats Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">👑</span>
                      <div>
                        <div className="text-xs text-white/50">Emperor</div>
                        <div className="text-white font-bold">{authData?.email?.split('@')[0]}</div>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🛡️</span>
                      <div>
                        <div className="text-xs text-white/50">Security Level</div>
                        <div className="text-[#00E5FF] font-bold">MAXIMUM</div>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⏱️</span>
                      <div>
                        <div className="text-xs text-white/50">Auto-Lock In</div>
                        <div className={`font-mono text-sm font-bold ${
                          isWarning ? 'text-amber-400' : 'text-white'
                        }`}>
                          {formatRemainingTime(remainingTime)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-white/30 font-mono">
                    SHA-256 Audit Active
                  </div>
                </div>
              </div>

              {/* Central Bank Component */}
              <CentralBank />

              {/* Additional Vault Controls */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* System Control Link */}
                <motion.a
                  href="/ko/admin/emperor"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-[#00E5FF]/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">⚡</span>
                    <div>
                      <h3 className="text-lg font-bold text-white">System Control</h3>
                      <p className="text-white/50 text-sm">
                        Interest rates, shutdown, user management
                      </p>
                    </div>
                  </div>
                </motion.a>

                {/* Observability Link */}
                <motion.a
                  href="/ko/admin/observability"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">📊</span>
                    <div>
                      <h3 className="text-lg font-bold text-white">Observability</h3>
                      <p className="text-white/50 text-sm">
                        Logs, metrics, performance monitoring
                      </p>
                    </div>
                  </div>
                </motion.a>
              </div>

              {/* Security Footer */}
              <div className="mt-12 text-center text-white/30 text-xs">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>5-Min Session Lock • SHA-256 Audit Trail</span>
                </div>
                <p>Sovereign Vault v82.0 • Imperial Security Protocol Active</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
