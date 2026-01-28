/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 50: FOMO & VIRAL ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Shareable Profit Cards + Live Activity Feed + Social Proof
 * "제국은 스스로 번식한다"
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

type InvestmentTier = 'Pioneer' | 'Sovereign' | 'Emperor';

interface UserStats {
  tier: InvestmentTier;
  totalInvested: number;
  totalEarned: number;
  apy: number;
  joinDate: string;
  rank: number;
}

interface ActivityItem {
  id: string;
  type: 'upgrade' | 'profit' | 'investment' | 'milestone' | 'node';
  message: string;
  location?: string;
  amount?: number;
  timestamp: Date;
}

// ============================================
// Constants
// ============================================

const TIER_CONFIG = {
  Pioneer: {
    color: 'from-zinc-400 to-zinc-600',
    textColor: 'text-zinc-400',
    bgColor: 'bg-zinc-900',
    icon: '🌱',
    apy: 12,
  },
  Sovereign: {
    color: 'from-amber-400 to-amber-600',
    textColor: 'text-amber-400',
    bgColor: 'bg-gradient-to-br from-amber-900/50 to-orange-900/50',
    icon: '👑',
    apy: 13.5,
  },
  Emperor: {
    color: 'from-purple-400 to-pink-500',
    textColor: 'text-purple-400',
    bgColor: 'bg-gradient-to-br from-purple-900/50 to-pink-900/50',
    icon: '🏆',
    apy: 15,
  },
};

const LOCATIONS = [
  'New York', 'London', 'Tokyo', 'Seoul', 'Singapore', 'Dubai', 'Sydney',
  'San Francisco', 'Berlin', 'Paris', 'Hong Kong', 'Zurich', 'Toronto',
  'Los Angeles', 'Miami', 'Shanghai', 'Mumbai', 'São Paulo', 'Amsterdam',
];

const ACTIVITY_TEMPLATES = [
  { type: 'upgrade', template: 'Someone from {location} just upgraded to {tier} Tier' },
  { type: 'profit', template: 'Prophet AI just generated ${amount} profit' },
  { type: 'investment', template: '{location} investor joined with ${amount} KAUS' },
  { type: 'milestone', template: 'Global network reached ${amount}M in total value' },
  { type: 'node', template: '{location} node achieved {amount}% efficiency' },
];

// ============================================
// Shareable Profit Card Component
// ============================================

export function ShareableProfitCard({
  stats,
  onShare,
}: {
  stats: UserStats;
  onShare?: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const tierConfig = TIER_CONFIG[stats.tier];

  const generateShareText = () => {
    return `I just earned ${stats.apy}% APY on @FieldNineNexus as a ${stats.tier}! 🚀

💰 Total Earned: $${stats.totalEarned.toLocaleString()}
📈 Investment: $${stats.totalInvested.toLocaleString()}
🏆 Global Rank: #${stats.rank}

Join the Global Energy Empire → https://m.fieldnine.io

#FieldNine #PassiveIncome #RWA #DeFi`;
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(generateShareText());
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, '_blank', 'width=550,height=420');
    onShare?.();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText('https://m.fieldnine.io?ref=share');
      toast.success('Link copied to clipboard!');
    } catch {
      console.error('Failed to copy');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] rounded-2xl overflow-hidden border border-white/5"
    >
      {/* Card Preview */}
      <div
        ref={cardRef}
        className={`relative p-6 ${tierConfig.bgColor}`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
            }}
          />
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 bg-gradient-to-br ${tierConfig.color} rounded-xl flex items-center justify-center shadow-lg`}>
              <span className="text-2xl">{tierConfig.icon}</span>
            </div>
            <div>
              <div className={`text-sm font-bold ${tierConfig.textColor} uppercase tracking-wider`}>
                {stats.tier} Tier
              </div>
              <div className="text-white text-lg font-bold">Field Nine Nexus</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/50">Global Rank</div>
            <div className="text-2xl font-black text-white">#{stats.rank}</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="relative grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur rounded-xl p-4">
            <div className="text-xs text-white/50 uppercase mb-1">Total Earned</div>
            <div className="text-2xl font-black text-emerald-400">
              ${stats.totalEarned.toLocaleString()}
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-4">
            <div className="text-xs text-white/50 uppercase mb-1">Current APY</div>
            <div className={`text-2xl font-black ${tierConfig.textColor}`}>
              {stats.apy}%
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-4">
            <div className="text-xs text-white/50 uppercase mb-1">Invested</div>
            <div className="text-xl font-bold text-white">
              ${stats.totalInvested.toLocaleString()}
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-4">
            <div className="text-xs text-white/50 uppercase mb-1">Member Since</div>
            <div className="text-lg font-bold text-white">{stats.joinDate}</div>
          </div>
        </div>

        {/* Verified Badge */}
        <div className="relative flex items-center justify-center gap-2 text-sm">
          <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-emerald-400 font-bold">Verified RWA Investment</span>
        </div>

        {/* Watermark */}
        <div className="absolute bottom-2 right-4 text-[10px] text-white/20">
          m.fieldnine.io
        </div>
      </div>

      {/* Share Buttons */}
      <div className="p-4 border-t border-white/5">
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTwitterShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1DA1F2] rounded-xl font-bold text-white hover:bg-[#1a8cd8] transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Share on X
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCopyLink}
            className="px-4 py-3 bg-white/10 rounded-xl font-bold text-white hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </motion.button>
        </div>
        <p className="text-center text-xs text-white/40 mt-3">
          Share your success and earn referral bonuses!
        </p>
      </div>
    </motion.div>
  );
}

// ============================================
// Live Activity Feed Component
// ============================================

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Generate random activity
  const generateActivity = useCallback((): ActivityItem => {
    const template = ACTIVITY_TEMPLATES[Math.floor(Math.random() * ACTIVITY_TEMPLATES.length)];
    const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    const tiers: InvestmentTier[] = ['Pioneer', 'Sovereign', 'Emperor'];
    const tier = tiers[Math.floor(Math.random() * tiers.length)];

    let amount: number = 0;
    let message = template.template;

    switch (template.type) {
      case 'profit':
        amount = 50 + Math.floor(Math.random() * 450);
        message = message.replace('{amount}', amount.toString());
        break;
      case 'investment':
        amount = 500 + Math.floor(Math.random() * 9500);
        message = message.replace('{location}', location).replace('{amount}', amount.toLocaleString());
        break;
      case 'milestone':
        amount = 150 + Math.floor(Math.random() * 50);
        message = message.replace('{amount}', amount.toString());
        break;
      case 'node':
        amount = 85 + Math.floor(Math.random() * 15);
        message = message.replace('{location}', location).replace('{amount}', amount.toString());
        break;
      case 'upgrade':
      default:
        message = message.replace('{location}', location).replace('{tier}', tier);
        break;
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      type: template.type as ActivityItem['type'],
      message,
      location,
      amount,
      timestamp: new Date(),
    };
  }, []);

  // Initialize activities
  useEffect(() => {
    const initial = Array.from({ length: 5 }, generateActivity);
    setActivities(initial);
  }, [generateActivity]);

  // Add new activity periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const newActivity = generateActivity();
      setActivities(prev => [newActivity, ...prev.slice(0, 9)]);
      setCurrentIndex(0);
    }, 4000 + Math.random() * 3000);

    return () => clearInterval(interval);
  }, [generateActivity]);

  // Rotate through activities
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % Math.min(activities.length, 5));
    }, 3500);

    return () => clearInterval(interval);
  }, [activities.length]);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'upgrade': return '🚀';
      case 'profit': return '💰';
      case 'investment': return '📈';
      case 'milestone': return '🎯';
      case 'node': return '⚡';
      default: return '✨';
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'upgrade': return 'text-purple-400';
      case 'profit': return 'text-emerald-400';
      case 'investment': return 'text-cyan-400';
      case 'milestone': return 'text-amber-400';
      case 'node': return 'text-blue-400';
      default: return 'text-white';
    }
  };

  const currentActivity = activities[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-[#0a0f1a] via-[#111827] to-[#0a0f1a] rounded-xl border border-white/5 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
            Live Activity
          </span>
        </div>
        <span className="text-xs text-white/40">
          {activities.length} events
        </span>
      </div>

      {/* Activity Display */}
      <div className="h-12 flex items-center px-4 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentActivity && (
            <motion.div
              key={currentActivity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 w-full"
            >
              <span className="text-lg">{getActivityIcon(currentActivity.type)}</span>
              <span className={`text-sm ${getActivityColor(currentActivity.type)}`}>
                {currentActivity.message}
              </span>
              <span className="ml-auto text-xs text-white/30">
                just now
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Activity Dots */}
      <div className="flex items-center justify-center gap-1.5 py-2 border-t border-white/5">
        {activities.slice(0, 5).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === currentIndex ? 'bg-emerald-500 w-3' : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ============================================
// Compact Activity Ticker (for headers)
// ============================================

export function ActivityTicker() {
  const [message, setMessage] = useState('');
  const [icon, setIcon] = useState('');

  useEffect(() => {
    const generateMessage = () => {
      const messages = [
        { icon: '🚀', text: 'New York investor upgraded to Emperor Tier' },
        { icon: '💰', text: 'Prophet AI generated $347 profit' },
        { icon: '📈', text: 'Tokyo user invested 5,000 KAUS' },
        { icon: '⚡', text: 'Dubai Solar reached 94% efficiency' },
        { icon: '🌍', text: 'Global network hit $780M valuation' },
        { icon: '🏆', text: 'London trader earned $1,250 today' },
        { icon: '✨', text: 'Singapore node processed 1,000 trades' },
      ];
      const selected = messages[Math.floor(Math.random() * messages.length)];
      setMessage(selected.text);
      setIcon(selected.icon);
    };

    generateMessage();
    const interval = setInterval(generateMessage, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="flex items-center gap-2 px-3 py-1.5 bg-[#0f1419] rounded-full border border-white/5"
    >
      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
      <AnimatePresence mode="wait">
        <motion.div
          key={message}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex items-center gap-2"
        >
          <span className="text-sm">{icon}</span>
          <span className="text-xs text-white/60 max-w-[200px] truncate">{message}</span>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// Social Proof Counter
// ============================================

export function SocialProofCounter() {
  const [stats, setStats] = useState({
    users: 12847,
    volume24h: 2840000,
    profit24h: 847320,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        users: prev.users + Math.floor(Math.random() * 3),
        volume24h: prev.volume24h + Math.floor(Math.random() * 10000),
        profit24h: prev.profit24h + Math.floor(Math.random() * 500),
      }));
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      <motion.div
        className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] rounded-xl p-4 text-center border border-white/5"
      >
        <div className="text-xs text-white/50 uppercase mb-1">Active Investors</div>
        <motion.div
          key={stats.users}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="text-2xl font-black text-emerald-400"
        >
          {stats.users.toLocaleString()}
        </motion.div>
      </motion.div>
      <motion.div
        className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] rounded-xl p-4 text-center border border-white/5"
      >
        <div className="text-xs text-white/50 uppercase mb-1">24h Volume</div>
        <motion.div
          key={stats.volume24h}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="text-2xl font-black text-cyan-400"
        >
          ${(stats.volume24h / 1000000).toFixed(2)}M
        </motion.div>
      </motion.div>
      <motion.div
        className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] rounded-xl p-4 text-center border border-white/5"
      >
        <div className="text-xs text-white/50 uppercase mb-1">24h Profit</div>
        <motion.div
          key={stats.profit24h}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="text-2xl font-black text-amber-400"
        >
          ${(stats.profit24h / 1000).toFixed(0)}K
        </motion.div>
      </motion.div>
    </div>
  );
}

// ============================================
// Share Modal for Quick Sharing
// ============================================

export function QuickShareModal({
  isOpen,
  onClose,
  stats,
}: {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="max-w-md w-full"
        >
          <ShareableProfitCard stats={stats} onShare={onClose} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
