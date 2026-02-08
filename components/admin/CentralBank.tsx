/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 81: KAUS CENTRAL BANK - MINT/BURN CONTROL
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Emperor-only control for KAUS token supply
 * - Mint: Create new KAUS tokens
 * - Burn: Remove KAUS from circulation
 * - All operations logged with SHA-256 audit trail
 * - Connected to system_reserve table
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ReserveData {
  totalSupply: number;
  circulatingSupply: number;
  reserveBalance: number;
  burnedTotal: number;
  mintedTotal: number;
  lastOperation: {
    type: 'mint' | 'burn';
    amount: number;
    timestamp: string;
    signature: string;
  } | null;
}

interface OperationLog {
  id: string;
  type: 'mint' | 'burn';
  amount: number;
  reason: string;
  signature: string;
  timestamp: string;
  executedBy: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CENTRAL BANK COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function CentralBank() {
  const [reserve, setReserve] = useState<ReserveData | null>(null);
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [operating, setOperating] = useState(false);

  // Operation form state
  const [operationType, setOperationType] = useState<'mint' | 'burn'>('mint');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [operationResult, setOperationResult] = useState<{
    success: boolean;
    message: string;
    signature?: string;
  } | null>(null);

  // Fetch reserve data
  const fetchReserveData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/vault/reserve');
      const data = await res.json();
      if (data.success) {
        setReserve(data.reserve);
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('[Central Bank] Failed to fetch reserve:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReserveData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchReserveData, 30000);
    return () => clearInterval(interval);
  }, [fetchReserveData]);

  // Execute operation
  const executeOperation = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setOperating(true);
    setShowConfirmModal(false);

    try {
      const res = await fetch('/api/admin/vault/operate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: operationType,
          amount: parseFloat(amount),
          reason: reason || `${operationType.toUpperCase()} operation by Emperor`,
        }),
      });

      const data = await res.json();

      setOperationResult({
        success: data.success,
        message: data.message || (data.success ? 'Operation successful' : 'Operation failed'),
        signature: data.signature,
      });

      if (data.success) {
        // Refresh data
        await fetchReserveData();
        setAmount('');
        setReason('');
      }
    } catch (error) {
      setOperationResult({
        success: false,
        message: 'Network error - operation may not have completed',
      });
    } finally {
      setOperating(false);
    }
  };

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-[#00E5FF] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <span className="text-3xl">🏦</span>
            Central Bank
          </h2>
          <p className="text-white/50 text-sm mt-1">KAUS Token Supply Control</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/50 rounded-xl">
          <span className="text-amber-400">⚠️</span>
          <span className="text-amber-300 text-sm font-bold">Emperor Only</span>
        </div>
      </div>

      {/* Reserve Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Supply', value: reserve?.totalSupply || 0, color: 'cyan' },
          { label: 'Circulating', value: reserve?.circulatingSupply || 0, color: 'emerald' },
          { label: 'Reserve', value: reserve?.reserveBalance || 0, color: 'purple' },
          { label: 'Burned', value: reserve?.burnedTotal || 0, color: 'red' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="tesla-card p-4"
          >
            <div className="text-white/50 text-xs mb-1">{stat.label}</div>
            <div className={`text-2xl font-black ${
              stat.color === 'cyan' ? 'text-[#00E5FF]' :
              stat.color === 'emerald' ? 'text-emerald-400' :
              stat.color === 'purple' ? 'text-purple-400' :
              'text-red-400'
            }`}>
              {formatNumber(stat.value)}
            </div>
            <div className="text-white/30 text-xs">KAUS</div>
          </div>
        ))}
      </div>

      {/* Operation Panel */}
      <div className="tesla-panel p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>⚡</span>
          Token Operation
        </h3>

        {/* Operation Type Toggle */}
        <div className="flex gap-2 mb-6">
          {(['mint', 'burn'] as const).map((type) => (
            <motion.button
              key={type}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setOperationType(type)}
              className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${
                operationType === type
                  ? type === 'mint'
                    ? 'bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)]'
                    : 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                  : 'bg-white/5 text-white/50 border border-white/10'
              }`}
            >
              {type === 'mint' ? '🪙 MINT' : '🔥 BURN'}
            </motion.button>
          ))}
        </div>

        {/* Amount Input */}
        <div className="space-y-4">
          <div>
            <label className="text-white/50 text-sm block mb-2">Amount (KAUS)</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-2xl font-bold text-white focus:outline-none focus:border-[#00E5FF]/50 focus:ring-2 focus:ring-[#00E5FF]/20"
            />
          </div>

          <div>
            <label className="text-white/50 text-sm block mb-2">Reason (Audit Log)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`${operationType === 'mint' ? 'Liquidity injection' : 'Supply reduction'}...`}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF]/50"
            />
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex gap-2">
            {[1000, 10000, 100000, 1000000].map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset.toString())}
                className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-white/70 text-sm hover:bg-white/10 transition-colors"
              >
                {formatNumber(preset)}
              </button>
            ))}
          </div>

          {/* Execute Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowConfirmModal(true)}
            disabled={!amount || parseFloat(amount) <= 0 || operating}
            className={`w-full py-4 rounded-xl font-black text-lg disabled:opacity-40 disabled:cursor-not-allowed ${
              operationType === 'mint'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_0_40px_rgba(16,185,129,0.3)]'
                : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-[0_0_40px_rgba(239,68,68,0.3)]'
            }`}
          >
            {operating ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  ⚡
                </motion.span>
                Processing...
              </span>
            ) : (
              `Execute ${operationType.toUpperCase()}`
            )}
          </motion.button>
        </div>
      </div>

      {/* Operation Result */}
      <AnimatePresence>
        {operationResult && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl border ${
              operationResult.success
                ? 'bg-emerald-500/10 border-emerald-500/50'
                : 'bg-red-500/10 border-red-500/50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className={`font-bold ${
                  operationResult.success ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {operationResult.success ? '✓ Operation Complete' : '✕ Operation Failed'}
                </div>
                <div className="text-white/70 text-sm mt-1">
                  {operationResult.message}
                </div>
                {operationResult.signature && (
                  <div className="mt-2 font-mono text-xs text-white/40 break-all">
                    Signature: {operationResult.signature}
                  </div>
                )}
              </div>
              <button
                onClick={() => setOperationResult(null)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Operations Log */}
      <div className="tesla-card p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📜</span>
          Audit Log
        </h3>
        <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
          {logs.length === 0 ? (
            <div className="text-center text-white/40 py-8">
              No operations recorded
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xl ${
                    log.type === 'mint' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {log.type === 'mint' ? '🪙' : '🔥'}
                  </span>
                  <div>
                    <div className="text-white font-bold">
                      {log.type.toUpperCase()} {formatNumber(log.amount)} KAUS
                    </div>
                    <div className="text-white/50 text-xs">{log.reason}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white/50 text-xs">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                  <div className="font-mono text-xs text-white/30 truncate max-w-[100px]">
                    {log.signature.slice(0, 16)}...
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#171717] rounded-2xl border border-white/10 overflow-hidden"
            >
              <div className={`p-6 ${
                operationType === 'mint'
                  ? 'bg-gradient-to-br from-emerald-500/20 to-transparent'
                  : 'bg-gradient-to-br from-red-500/20 to-transparent'
              }`}>
                <div className="text-center">
                  <span className="text-5xl">
                    {operationType === 'mint' ? '🪙' : '🔥'}
                  </span>
                  <h3 className="text-xl font-black text-white mt-4">
                    Confirm {operationType.toUpperCase()}
                  </h3>
                  <div className={`text-3xl font-black mt-2 ${
                    operationType === 'mint' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {parseFloat(amount || '0').toLocaleString()} KAUS
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <div className="text-sm">
                      <div className="text-amber-400 font-bold">Warning</div>
                      <div className="text-amber-300/70">
                        This operation will {operationType === 'mint' ? 'create new' : 'permanently destroy'} tokens.
                        This action is irreversible and will be logged with SHA-256 signature.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-3 bg-white/10 rounded-xl font-bold text-white hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeOperation}
                    className={`flex-1 py-3 rounded-xl font-bold text-white ${
                      operationType === 'mint'
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : 'bg-red-500 hover:bg-red-600'
                    } transition-colors`}
                  >
                    Confirm {operationType.toUpperCase()}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CentralBank;
