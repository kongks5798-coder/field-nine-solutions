/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 84: IMPERIAL GUARD SECURITY SCREEN
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Dedicated security screen for unauthorized access attempts
 * - Displays "Access Denied by Imperial Guard" message
 * - Logs security violations
 * - Tesla/Musinsa grade visual design
 * - Scan-line security effect
 */

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface ImperialGuardScreenProps {
  email?: string | null;
  reason?: string;
  attemptedPath?: string;
}

export function ImperialGuardScreen({
  email,
  reason = 'Unauthorized access attempt',
  attemptedPath = '/admin/vault',
}: ImperialGuardScreenProps) {
  const [securityLog, setSecurityLog] = useState({
    timestamp: '',
    ip: 'Detecting...',
    signature: '',
  });

  useEffect(() => {
    // Generate security log data
    const timestamp = new Date().toISOString();
    const signature = btoa(`${email}-${timestamp}-${attemptedPath}`).slice(0, 32);

    setSecurityLog({
      timestamp,
      ip: 'Logged by Server',
      signature,
    });

    // Report violation to Imperial Guard
    fetch('/api/admin/vault/blacklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'unauthorized_access',
        email,
        path: attemptedPath,
      }),
    }).catch(() => {});
  }, [email, attemptedPath]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Scan-line effect */}
      <motion.div
        initial={{ top: 0 }}
        animate={{ top: '100%' }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-b from-transparent via-red-500/50 to-transparent pointer-events-none z-10"
      />

      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(239,68,68,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(239,68,68,1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Main content */}
      <div className="relative z-20 max-w-lg w-full text-center">
        {/* Shield Icon */}
        <motion.div
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(239,68,68,0)',
              '0 0 80px 30px rgba(239,68,68,0.4)',
              '0 0 0 0 rgba(239,68,68,0)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-red-500/10 border-2 border-red-500/50 mb-8"
        >
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-6xl"
          >
            🛡️
          </motion.span>
        </motion.div>

        {/* Title */}
        <h1 className="text-4xl font-black text-red-500 mb-2 tracking-tight">
          ACCESS DENIED
        </h1>
        <p className="text-xl text-white/70 mb-8">
          by <span className="text-red-400 font-bold">Imperial Guard</span>
        </p>

        {/* Security Message */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <span className="text-3xl">⚠️</span>
            <div className="text-left flex-1">
              <p className="text-red-400 font-bold mb-2">Security Protocol Activated</p>
              <p className="text-white/60 text-sm">
                You do not have the required clearance to access the Sovereign Vault.
                This incident has been logged and reported to the Emperor.
              </p>
            </div>
          </div>
        </div>

        {/* Violation Log */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8">
          <h3 className="text-xs text-white/40 uppercase tracking-wider mb-3 text-left">
            Security Violation Log
          </h3>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-white/40">Email</span>
              <span className="text-red-400">{email || 'Not authenticated'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Attempted</span>
              <span className="text-white/60">{attemptedPath}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Timestamp</span>
              <span className="text-white/60">
                {new Date(securityLog.timestamp).toLocaleString('ko-KR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Signature</span>
              <span className="text-white/40 text-xs truncate max-w-[200px]">
                {securityLog.signature}...
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/5">
              <span className="text-white/40">Status</span>
              <span className="text-red-500 font-bold">BLOCKED</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href="/ko/nexus">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
            >
              Return to Nexus
            </motion.button>
          </Link>
          <Link href="/ko/auth/login">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-transparent text-white/50 text-sm font-medium hover:text-white/70 transition-colors"
            >
              Sign in with different account
            </motion.button>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-red-500"
            />
            <span className="text-white/30 text-xs">Security Monitor Active</span>
          </div>
          <p className="text-white/20 text-xs">
            Imperial Guard Protocol v84.0 • Field Nine Security Division
          </p>
        </div>
      </div>
    </div>
  );
}

export default ImperialGuardScreen;
