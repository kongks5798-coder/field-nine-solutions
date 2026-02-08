/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 61: PWA UPDATE NOTIFICATION
 * ═══════════════════════════════════════════════════════════════════════════════
 * Shows notification when a new version of the app is available
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useUpdateNotification } from '@/lib/pwa/hooks';

export function PWAUpdateNotification() {
  const { updateAvailable, applyUpdate, dismissUpdate } = useUpdateNotification();

  return (
    <AnimatePresence>
      {updateAvailable && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-4 right-4 z-[100] max-w-md mx-auto"
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-2xl shadow-blue-500/30 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🔄</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm">Update Available</h4>
                  <p className="text-xs text-white/80 mt-0.5">
                    A new version of NEXUS Empire is ready
                  </p>
                </div>
                <button
                  onClick={dismissUpdate}
                  className="p-1 text-white/50 hover:text-white flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={dismissUpdate}
                  className="flex-1 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
                >
                  Later
                </button>
                <button
                  onClick={applyUpdate}
                  className="flex-1 py-2 bg-white text-blue-600 text-sm font-bold rounded-xl hover:bg-white/90 transition-colors"
                >
                  Update Now
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
