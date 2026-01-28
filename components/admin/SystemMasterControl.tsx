/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 76: SYSTEM MASTER CONTROL - GOD MODE ADMIN UI
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Boss-only control panel for system-level operations:
 * - Real-time interest rate adjustment slider
 * - Emergency system shutdown button
 * - User ban list management (DB connected)
 *
 * Security: Confirmation dialogs for dangerous actions, audit logging
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface SystemSettings {
  interest_rate: number;
  is_maintenance: boolean;
  maintenance_message: string;
  emergency_shutdown: boolean;
  last_modified_by: string;
  last_modified_at: string;
}

interface BannedUser {
  id: string;
  user_id: string;
  email: string;
  reason: string;
  banned_by: string;
  banned_at: string;
  expires_at: string | null;
  is_permanent: boolean;
}

interface AuditLogEntry {
  id: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  performedBy: string;
  timestamp: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTEREST RATE SLIDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function InterestRateSlider({
  currentRate,
  onRateChange,
  isUpdating,
}: {
  currentRate: number;
  onRateChange: (rate: number) => void;
  isUpdating: boolean;
}) {
  const [localRate, setLocalRate] = useState(currentRate);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      setLocalRate(currentRate);
    }
  }, [currentRate, isDragging]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalRate(parseFloat(e.target.value));
  };

  const handleSliderEnd = () => {
    setIsDragging(false);
    if (localRate !== currentRate) {
      onRateChange(localRate);
    }
  };

  // Color gradient based on rate
  const getRateColor = (rate: number) => {
    if (rate < 20) return 'from-blue-500 to-blue-600';
    if (rate < 35) return 'from-cyan-500 to-cyan-600';
    if (rate < 50) return 'from-emerald-500 to-emerald-600';
    if (rate < 65) return 'from-amber-500 to-amber-600';
    if (rate < 80) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const getRateLabel = (rate: number) => {
    if (rate < 20) return 'Conservative';
    if (rate < 35) return 'Standard';
    if (rate < 50) return 'Competitive';
    if (rate < 65) return 'Aggressive';
    if (rate < 80) return 'High Risk';
    return 'MAXIMUM YIELD';
  };

  return (
    <div className="bg-gradient-to-br from-emerald-900/30 to-black border-2 border-emerald-500/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <span className="text-emerald-400 font-bold text-lg">INTEREST RATE CONTROL</span>
        </div>
        {isUpdating && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <span className="text-xs text-emerald-400">Updating...</span>
          </div>
        )}
      </div>

      {/* Current Rate Display */}
      <div className="flex items-center justify-center mb-6">
        <motion.div
          key={localRate}
          initial={{ scale: 0.9, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className={`text-6xl font-black bg-gradient-to-r ${getRateColor(localRate)} bg-clip-text text-transparent`}>
            {localRate.toFixed(1)}%
          </div>
          <div className="text-sm text-zinc-400 mt-1">
            {getRateLabel(localRate)}
          </div>
        </motion.div>
      </div>

      {/* Slider */}
      <div className="relative mb-4">
        <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getRateColor(localRate)} transition-all`}
            style={{ width: `${localRate}%` }}
          />
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={localRate}
          onChange={handleSliderChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={handleSliderEnd}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={handleSliderEnd}
          className="relative w-full h-6 appearance-none bg-transparent cursor-pointer z-10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:shadow-emerald-500/50
            [&::-webkit-slider-thumb]:border-4
            [&::-webkit-slider-thumb]:border-emerald-500
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-moz-range-thumb]:w-6
            [&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:border-4
            [&::-moz-range-thumb]:border-emerald-500"
        />
      </div>

      {/* Rate Markers */}
      <div className="flex justify-between text-xs text-zinc-500 mb-4">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>

      {/* Quick Presets */}
      <div className="grid grid-cols-5 gap-2">
        {[15, 25, 42.5, 65, 85].map((preset) => (
          <button
            key={preset}
            onClick={() => {
              setLocalRate(preset);
              onRateChange(preset);
            }}
            className={`py-2 rounded-lg text-sm font-medium transition-all ${
              Math.abs(currentRate - preset) < 0.5
                ? 'bg-emerald-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {preset}%
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMERGENCY SHUTDOWN PANEL
// ═══════════════════════════════════════════════════════════════════════════════

function EmergencyShutdownPanel({
  isShutdown,
  onToggleShutdown,
  isProcessing,
}: {
  isShutdown: boolean;
  onToggleShutdown: (enabled: boolean, reason?: string) => void;
  isProcessing: boolean;
}) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [shutdownReason, setShutdownReason] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const CONFIRM_PHRASE = 'SHUTDOWN';

  const handleShutdown = () => {
    if (isShutdown) {
      // Restoring system
      onToggleShutdown(false);
      setShowConfirmation(false);
    } else {
      // Activating shutdown
      if (confirmText === CONFIRM_PHRASE) {
        onToggleShutdown(true, shutdownReason || 'Manual emergency shutdown');
        setShowConfirmation(false);
        setConfirmText('');
        setShutdownReason('');
      }
    }
  };

  return (
    <div className={`border-2 rounded-xl p-5 ${
      isShutdown
        ? 'bg-gradient-to-br from-red-900/50 to-black border-red-500/80'
        : 'bg-gradient-to-br from-zinc-900 to-black border-red-500/30'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{isShutdown ? '🚨' : '⚠️'}</span>
          <span className={`font-bold text-lg ${isShutdown ? 'text-red-400' : 'text-red-500'}`}>
            EMERGENCY SHUTDOWN
          </span>
        </div>
        {isShutdown && (
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="px-3 py-1 bg-red-500/20 border border-red-500 rounded-full text-red-400 text-xs font-bold"
          >
            SYSTEM OFFLINE
          </motion.div>
        )}
      </div>

      {/* Status Display */}
      <div className={`p-4 rounded-lg mb-4 ${
        isShutdown ? 'bg-red-500/20 border border-red-500/50' : 'bg-zinc-800/50'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${
            isShutdown ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
          }`} />
          <div>
            <div className={`text-sm font-medium ${isShutdown ? 'text-red-400' : 'text-emerald-400'}`}>
              {isShutdown ? 'ALL SYSTEMS HALTED' : 'Systems Operational'}
            </div>
            <div className="text-xs text-zinc-500">
              {isShutdown
                ? 'Trading, staking, and withdrawals are disabled'
                : 'All services running normally'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Button */}
      {!showConfirmation ? (
        <button
          onClick={() => setShowConfirmation(true)}
          disabled={isProcessing}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            isShutdown
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white'
              : 'bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </span>
          ) : isShutdown ? (
            '✅ RESTORE SYSTEM'
          ) : (
            '🚨 INITIATE EMERGENCY SHUTDOWN'
          )}
        </button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {!isShutdown && (
              <>
                <textarea
                  value={shutdownReason}
                  onChange={(e) => setShutdownReason(e.target.value)}
                  placeholder="Reason for shutdown (optional)..."
                  className="w-full p-3 bg-zinc-800 border border-red-500/30 rounded-lg text-white text-sm resize-none focus:outline-none focus:border-red-500"
                  rows={2}
                />
                <div>
                  <label className="block text-xs text-zinc-400 mb-2">
                    Type <span className="text-red-400 font-mono">{CONFIRM_PHRASE}</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    className="w-full p-3 bg-zinc-800 border border-red-500/30 rounded-lg text-white font-mono focus:outline-none focus:border-red-500"
                    placeholder="Type SHUTDOWN"
                  />
                </div>
              </>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setConfirmText('');
                }}
                className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleShutdown}
                disabled={!isShutdown && confirmText !== CONFIRM_PHRASE}
                className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                  isShutdown
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : confirmText === CONFIRM_PHRASE
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
                }`}
              >
                {isShutdown ? 'Confirm Restore' : 'Confirm Shutdown'}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER BAN LIST COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function UserBanList({
  bannedUsers,
  onBanUser,
  onUnbanUser,
  isLoading,
}: {
  bannedUsers: BannedUser[];
  onBanUser: (data: { userId?: string; email: string; reason: string; isPermanent: boolean; durationDays?: number }) => void;
  onUnbanUser: (banId: string, userId: string) => void;
  isLoading: boolean;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBan, setNewBan] = useState({
    email: '',
    reason: '',
    isPermanent: false,
    durationDays: 30,
  });

  const handleAddBan = () => {
    if (!newBan.email || !newBan.reason) return;
    onBanUser(newBan);
    setNewBan({ email: '', reason: '', isPermanent: false, durationDays: 30 });
    setShowAddForm(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-gradient-to-br from-orange-900/30 to-black border-2 border-orange-500/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚫</span>
          <span className="text-orange-400 font-bold text-lg">USER BAN LIST</span>
          <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full">
            {bannedUsers.length} banned
          </span>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 rounded-lg text-orange-400 text-sm font-medium transition-all"
        >
          {showAddForm ? 'Cancel' : '+ Add Ban'}
        </button>
      </div>

      {/* Add Ban Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-4 bg-zinc-800/50 rounded-xl border border-orange-500/30 space-y-3">
              <input
                type="email"
                value={newBan.email}
                onChange={(e) => setNewBan({ ...newBan, email: e.target.value })}
                placeholder="User email address..."
                className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              />
              <textarea
                value={newBan.reason}
                onChange={(e) => setNewBan({ ...newBan, reason: e.target.value })}
                placeholder="Reason for ban..."
                className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white resize-none focus:outline-none focus:border-orange-500"
                rows={2}
              />
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newBan.isPermanent}
                    onChange={(e) => setNewBan({ ...newBan, isPermanent: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-600 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-zinc-300">Permanent ban</span>
                </label>
                {!newBan.isPermanent && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-400">Duration:</span>
                    <select
                      value={newBan.durationDays}
                      onChange={(e) => setNewBan({ ...newBan, durationDays: parseInt(e.target.value) })}
                      className="p-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                    >
                      <option value="7">7 days</option>
                      <option value="14">14 days</option>
                      <option value="30">30 days</option>
                      <option value="90">90 days</option>
                      <option value="365">1 year</option>
                    </select>
                  </div>
                )}
              </div>
              <button
                onClick={handleAddBan}
                disabled={!newBan.email || !newBan.reason}
                className="w-full py-3 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-600 disabled:cursor-not-allowed rounded-lg text-white font-bold transition-all"
              >
                Confirm Ban
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ban List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : bannedUsers.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">
          No banned users
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {bannedUsers.map((user) => (
            <motion.div
              key={user.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{user.email}</span>
                    {user.is_permanent ? (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded-full font-bold">
                        PERMANENT
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded-full">
                        TEMPORARY
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">{user.reason}</div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    Banned: {formatDate(user.banned_at)}
                    {user.expires_at && ` | Expires: ${formatDate(user.expires_at)}`}
                  </div>
                </div>
                <button
                  onClick={() => onUnbanUser(user.id, user.user_id)}
                  className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs rounded-lg transition-all"
                >
                  Unban
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function SystemMasterControl() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/system-control');
      const data = await response.json();

      if (data.success) {
        setSettings(data.settings);
        setBannedUsers(data.bannedUsers || []);
        setAuditLog(data.auditLog || []);
      }
    } catch (error) {
      console.error('[SystemMasterControl] Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  // Update interest rate
  const handleRateChange = async (rate: number) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/system-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_INTEREST_RATE', rate }),
      });
      const data = await response.json();

      if (data.success) {
        setSettings((prev) => prev ? { ...prev, interest_rate: rate } : null);
        setLastAction(`Interest rate updated to ${rate}%`);
        setTimeout(() => setLastAction(null), 3000);
      }
    } catch (error) {
      console.error('[SystemMasterControl] Rate update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle emergency shutdown
  const handleShutdownToggle = async (enabled: boolean, reason?: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/system-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'EMERGENCY_SHUTDOWN', enabled, reason }),
      });
      const data = await response.json();

      if (data.success) {
        setSettings((prev) => prev ? { ...prev, emergency_shutdown: enabled } : null);
        setLastAction(data.message);
        setTimeout(() => setLastAction(null), 5000);
      }
    } catch (error) {
      console.error('[SystemMasterControl] Shutdown toggle error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Ban user
  const handleBanUser = async (banData: {
    userId?: string;
    email: string;
    reason: string;
    isPermanent: boolean;
    durationDays?: number;
  }) => {
    try {
      const response = await fetch('/api/admin/system-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'BAN_USER', ...banData }),
      });
      const data = await response.json();

      if (data.success) {
        fetchData(); // Refresh ban list
        setLastAction(`User ${banData.email} has been banned`);
        setTimeout(() => setLastAction(null), 3000);
      }
    } catch (error) {
      console.error('[SystemMasterControl] Ban user error:', error);
    }
  };

  // Unban user
  const handleUnbanUser = async (banId: string, userId: string) => {
    try {
      const response = await fetch('/api/admin/system-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UNBAN_USER', banId, userId }),
      });
      const data = await response.json();

      if (data.success) {
        setBannedUsers((prev) => prev.filter((u) => u.id !== banId));
        setLastAction('User has been unbanned');
        setTimeout(() => setLastAction(null), 3000);
      }
    } catch (error) {
      console.error('[SystemMasterControl] Unban user error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-zinc-900 to-black border-2 border-amber-500/30 rounded-xl p-8">
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">👑</span>
          <div>
            <h2 className="text-2xl font-black text-amber-400">SYSTEM MASTER CONTROL</h2>
            <p className="text-xs text-zinc-500">God-Mode Admin Panel | All actions are logged</p>
          </div>
        </div>
        {lastAction && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400 text-sm"
          >
            {lastAction}
          </motion.div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interest Rate Control */}
        <InterestRateSlider
          currentRate={settings?.interest_rate || 42.5}
          onRateChange={handleRateChange}
          isUpdating={isUpdating}
        />

        {/* Emergency Shutdown */}
        <EmergencyShutdownPanel
          isShutdown={settings?.emergency_shutdown || false}
          onToggleShutdown={handleShutdownToggle}
          isProcessing={isUpdating}
        />
      </div>

      {/* User Ban List */}
      <UserBanList
        bannedUsers={bannedUsers}
        onBanUser={handleBanUser}
        onUnbanUser={handleUnbanUser}
        isLoading={isLoading}
      />

      {/* Audit Log Preview */}
      <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-700/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📋</span>
          <span className="text-zinc-400 font-bold">RECENT AUDIT LOG</span>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {auditLog.slice(0, 5).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-2 bg-zinc-800/30 rounded-lg text-xs">
              <div className="flex items-center gap-3">
                <span className="text-zinc-500">{new Date(entry.timestamp).toLocaleString('ko-KR')}</span>
                <span className="text-amber-400 font-medium">{entry.action}</span>
              </div>
              <span className="text-zinc-400">{entry.performedBy}</span>
            </div>
          ))}
          {auditLog.length === 0 && (
            <div className="text-center py-4 text-zinc-500 text-sm">No recent actions</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SystemMasterControl;
