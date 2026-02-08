/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 68: SOVEREIGN API PORTAL - TESLA-GRADE DEVELOPER EXPERIENCE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * - API Key Issuance System
 * - Real-time Usage Monitoring
 * - Interactive Neural Grid Background
 * - Production-Grade Documentation
 *
 * @route /nexus/api-docs
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileBottomNav, MobileHeader } from '@/components/nexus/mobile-nav';
import { useSession } from 'next-auth/react';

// ═══════════════════════════════════════════════════════════════════════════════
// NEURAL GRID BACKGROUND
// ═══════════════════════════════════════════════════════════════════════════════

function NeuralGridBg() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-[1px] bg-gradient-to-r from-transparent via-[#00E5FF]/30 to-transparent"
          style={{ top: `${20 + i * 15}%`, left: '-100%', width: '200%' }}
          animate={{ x: ['0%', '50%'] }}
          transition={{ duration: 15 + i * 3, repeat: Infinity, ease: 'linear' }}
        />
      ))}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,229,255,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,229,255,1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// API KEY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

interface APIKey {
  id: string;
  key: string;
  name: string;
  createdAt: string;
  lastUsed: string | null;
  callsToday: number;
  callsTotal: number;
  status: 'active' | 'revoked';
}

interface UsageStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  limit: number;
  tier: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 74: PREMIUM API TIER - STRIPE INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

const API_TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: 'Free Forever',
    features: [
      '100 API calls/day',
      'Basic endpoints only',
      'Community support',
      '1 API key',
    ],
    cta: 'Current Plan',
    ctaDisabled: true,
    color: 'white',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    priceLabel: '$29/month',
    features: [
      '10,000 API calls/day',
      'All endpoints access',
      'Real-time WebSocket streams',
      'Priority support',
      'Unlimited API keys',
      'Usage analytics dashboard',
    ],
    cta: 'Upgrade to Pro',
    ctaDisabled: false,
    stripeLink: 'https://buy.stripe.com/test_fieldnine_pro', // Replace with real Stripe link
    color: '#00E5FF',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    priceLabel: '$199/month',
    features: [
      'Unlimited API calls',
      'Dedicated infrastructure',
      'Custom rate limits',
      'SLA guarantee (99.99%)',
      'White-label access',
      'Direct engineering support',
      'Custom endpoints on request',
    ],
    cta: 'Contact Sales',
    ctaDisabled: false,
    stripeLink: 'mailto:enterprise@fieldnine.io',
    color: '#FFD700',
    popular: false,
  },
];

function PremiumAPITierCard({
  tier,
  currentTier,
  onUpgrade,
}: {
  tier: typeof API_TIERS[0];
  currentTier: string;
  onUpgrade: (tierId: string, stripeLink?: string) => void;
}) {
  const isCurrentTier = currentTier === tier.id;
  const isPremium = tier.id !== 'free';

  return (
    <motion.div
      whileHover={{ scale: isPremium ? 1.02 : 1 }}
      className={`relative bg-[#171717] rounded-2xl p-5 border-2 transition-all ${
        tier.popular
          ? 'border-[#00E5FF]'
          : isCurrentTier
          ? 'border-emerald-500/50'
          : 'border-white/10'
      }`}
    >
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#00E5FF] text-[#171717] text-xs font-black rounded-full">
          MOST POPULAR
        </div>
      )}

      <div className="text-center mb-4 pt-2">
        <h3 className="text-lg font-bold text-white">{tier.name}</h3>
        <div className="text-2xl font-black mt-2" style={{ color: tier.color }}>
          {tier.priceLabel}
        </div>
      </div>

      <ul className="space-y-2 mb-6">
        {tier.features.map((feature, idx) => (
          <li key={idx} className="flex items-center gap-2 text-sm text-white/70">
            <span style={{ color: tier.color }}>✓</span>
            {feature}
          </li>
        ))}
      </ul>

      <motion.button
        whileHover={!tier.ctaDisabled ? { scale: 1.05 } : {}}
        whileTap={!tier.ctaDisabled ? { scale: 0.95 } : {}}
        onClick={() => !tier.ctaDisabled && onUpgrade(tier.id, tier.stripeLink)}
        disabled={tier.ctaDisabled}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
          tier.ctaDisabled
            ? 'bg-white/10 text-white/40 cursor-not-allowed'
            : tier.popular
            ? 'bg-[#00E5FF] text-[#171717] hover:shadow-lg hover:shadow-[#00E5FF]/30'
            : 'bg-white/10 text-white hover:bg-white/20'
        }`}
        style={
          !tier.ctaDisabled && tier.id === 'enterprise'
            ? { background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: '#171717' }
            : {}
        }
      >
        {isCurrentTier ? '✓ Current Plan' : tier.cta}
      </motion.button>
    </motion.div>
  );
}

function PremiumUpgradeSection({
  currentTier,
  onUpgrade,
}: {
  currentTier: string;
  onUpgrade: (tierId: string, stripeLink?: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Upgrade Your API Access</h2>
        <p className="text-sm text-white/50">
          Scale your integration with premium features and higher limits
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {API_TIERS.map((tier) => (
          <PremiumAPITierCard
            key={tier.id}
            tier={tier}
            currentTier={currentTier}
            onUpgrade={onUpgrade}
          />
        ))}
      </div>

      {/* Secure Payment Badge */}
      <div className="flex items-center justify-center gap-4 mt-6 text-white/40 text-xs">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
          </svg>
          Secured by Stripe
        </span>
        <span>|</span>
        <span>Cancel anytime</span>
        <span>|</span>
        <span>30-day money back guarantee</span>
      </div>
    </motion.div>
  );
}

function APIKeyCard({ apiKey, onRevoke }: { apiKey: APIKey; onRevoke: (id: string) => void }) {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#171717] rounded-2xl p-5 border border-[#00E5FF]/20"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-white">{apiKey.name}</h3>
          <p className="text-xs text-white/40">Created {apiKey.createdAt}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          apiKey.status === 'active'
            ? 'bg-[#00E5FF]/20 text-[#00E5FF]'
            : 'bg-red-500/20 text-red-400'
        }`}>
          {apiKey.status.toUpperCase()}
        </div>
      </div>

      {/* API Key Display */}
      <div className="bg-[#0a0a0a] rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <code className="font-mono text-sm text-white/70">
            {showKey ? apiKey.key : '••••••••••••••••••••••••••••••••'}
          </code>
          <div className="flex gap-2">
            <button
              onClick={() => setShowKey(!showKey)}
              className="text-xs text-white/50 hover:text-white transition-colors"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
            <button
              onClick={copyKey}
              className="text-xs text-[#00E5FF] hover:underline transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-xs text-white/40">Today</div>
          <div className="text-lg font-bold text-white">{apiKey.callsToday.toLocaleString()}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-xs text-white/40">Total</div>
          <div className="text-lg font-bold text-[#00E5FF]">{apiKey.callsTotal.toLocaleString()}</div>
        </div>
      </div>

      {/* Actions */}
      {apiKey.status === 'active' && (
        <button
          onClick={() => onRevoke(apiKey.id)}
          className="w-full py-2 bg-red-500/10 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-colors"
        >
          Revoke Key
        </button>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// USAGE MONITORING WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

function UsageMonitor({ stats }: { stats: UsageStats }) {
  const usagePercent = (stats.today / stats.limit) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#171717] rounded-2xl p-5 border border-[#00E5FF]/20"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white">API Usage</h3>
        <span className="px-3 py-1 bg-[#00E5FF]/10 text-[#00E5FF] text-xs font-bold rounded-full">
          {stats.tier}
        </span>
      </div>

      {/* Progress Ring */}
      <div className="flex items-center gap-6 mb-6">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
            />
            <motion.circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke="#00E5FF"
              strokeWidth="8"
              strokeLinecap="round"
              initial={{ strokeDasharray: '251.2', strokeDashoffset: '251.2' }}
              animate={{ strokeDashoffset: 251.2 - (251.2 * usagePercent) / 100 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-black text-white">{Math.round(usagePercent)}%</span>
          </div>
        </div>
        <div>
          <div className="text-3xl font-black text-white">{stats.today.toLocaleString()}</div>
          <div className="text-sm text-white/50">of {stats.limit.toLocaleString()} daily</div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-white">{stats.today.toLocaleString()}</div>
          <div className="text-xs text-white/40">Today</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-white">{stats.thisWeek.toLocaleString()}</div>
          <div className="text-xs text-white/40">This Week</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-[#00E5FF]">{stats.thisMonth.toLocaleString()}</div>
          <div className="text-xs text-white/40">This Month</div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE API ACTIVITY FEED
// ═══════════════════════════════════════════════════════════════════════════════

interface APICall {
  id: string;
  endpoint: string;
  method: string;
  status: number;
  latency: number;
  timestamp: string;
}

function LiveActivityFeed({ calls }: { calls: APICall[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#171717] rounded-2xl p-5 border border-[#00E5FF]/20"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white">Live Activity</h3>
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-2 h-2 bg-[#00E5FF] rounded-full"
          />
          <span className="text-xs text-[#00E5FF]">LIVE</span>
        </div>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {calls.map((call, index) => (
          <motion.div
            key={call.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                call.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' :
                call.method === 'POST' ? 'bg-cyan-500/20 text-cyan-400' :
                'bg-amber-500/20 text-amber-400'
              }`}>
                {call.method}
              </span>
              <code className="text-xs text-white/70 font-mono truncate max-w-[150px]">
                {call.endpoint}
              </code>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold ${
                call.status < 300 ? 'text-[#00E5FF]' : 'text-red-400'
              }`}>
                {call.status}
              </span>
              <span className="text-xs text-white/40">{call.latency}ms</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// API ENDPOINT DOCUMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  auth: boolean;
  response: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
}

const API_ENDPOINTS: Record<string, APIEndpoint[]> = {
  'Energy': [
    {
      method: 'GET',
      path: '/api/live/tesla',
      description: 'Tesla Powerwall V2G real-time telemetry',
      auth: false,
      params: [
        { name: 'include_history', type: 'boolean', required: false, description: 'Include 24h history' },
      ],
      response: `{
  "batteryLevel": 72,
  "energyStored": 75.6,
  "v2gAvailable": 54.6,
  "v2gStatus": "ACTIVE",
  "gridFrequency": 60.02,
  "timestamp": "2026-01-28T09:00:00Z",
  "isLive": true
}`,
    },
    {
      method: 'GET',
      path: '/api/live/yeongdong',
      description: 'Yeongdong 100,000평 Solar Farm metrics',
      auth: false,
      response: `{
  "currentOutput": 42,
  "peakOutput": 50,
  "dailyGeneration": 212,
  "monthlyGeneration": 6360,
  "todayEarningsKRW": 27560000,
  "smpPrice": 130,
  "recPrice": 45000,
  "weatherCondition": "sunny",
  "solarIrradiance": 892,
  "panelEfficiency": 0.21,
  "isLive": true
}`,
    },
    {
      method: 'GET',
      path: '/api/kaus/exchange',
      description: 'Energy-to-KAUS conversion rates',
      auth: true,
      params: [
        { name: 'action', type: 'string', required: true, description: 'rate | wallet | uptime' },
      ],
      response: `{
  "kwhToKaus": 10,
  "kausToUsd": 0.10,
  "kausToKrw": 120,
  "gridDemandMultiplier": 1.15,
  "v2gBonus": 0.05,
  "timestamp": "2026-01-28T09:00:00Z"
}`,
    },
  ],
  'Trading': [
    {
      method: 'GET',
      path: '/api/kaus/user-balance',
      description: 'Get authenticated user KAUS & kWh balance',
      auth: true,
      response: `{
  "success": true,
  "userId": "uuid",
  "email": "user@example.com",
  "kausBalance": 1500.50,
  "kwhBalance": 25.5,
  "krwValue": 180060,
  "usdValue": 150.05,
  "isLive": true,
  "timestamp": "2026-01-28T09:00:00Z"
}`,
    },
    {
      method: 'GET',
      path: '/api/kaus/user-exchange',
      description: 'Get real-time exchange rates with dynamic multiplier',
      auth: false,
      response: `{
  "success": true,
  "data": {
    "baseRate": 10,
    "currentRate": 11.5,
    "multiplier": 1.15,
    "kwhToKaus": 11.5,
    "kausToUsd": 0.10,
    "kausToKrw": 120,
    "gridDemandMultiplier": 1.15,
    "v2gBonus": 0,
    "fee": 0.001,
    "minKwh": 0.1,
    "maxKwh": 10000
  },
  "timestamp": "2026-01-28T09:00:00Z"
}`,
    },
    {
      method: 'POST',
      path: '/api/kaus/user-exchange',
      description: 'Execute kWh to KAUS conversion (authenticated)',
      auth: true,
      params: [
        { name: 'action', type: 'string', required: true, description: 'exchange' },
        { name: 'kwhAmount', type: 'number', required: true, description: 'Energy amount (0.1-10000)' },
      ],
      response: `{
  "success": true,
  "data": {
    "transactionId": "TX_M1ABC123",
    "inputKwh": 100,
    "outputKaus": 1150,
    "fee": 1.15,
    "netKaus": 1148.85,
    "rate": 11.5,
    "multiplier": 1.15,
    "newBalance": {
      "kwhBalance": 25.5,
      "kausBalance": 1648.85
    }
  },
  "timestamp": "2026-01-28T09:00:00Z"
}`,
    },
  ],
  'Blockchain': [
    {
      method: 'GET',
      path: '/api/blockchain',
      description: 'Polygon blockchain status and TVL',
      auth: true,
      response: `{
  "network": "polygon",
  "blockNumber": 52847123,
  "gasPrice": "45 gwei",
  "tvl": 156000000,
  "contractAddress": "0x...",
  "isLive": true
}`,
    },
    {
      method: 'GET',
      path: '/api/blockchain/wallet',
      description: 'Wallet balance and transaction history',
      auth: true,
      params: [
        { name: 'address', type: 'string', required: true, description: 'Wallet address' },
      ],
      response: `{
  "address": "0x...",
  "kausBalance": 15420.50,
  "ethBalance": 0.125,
  "transactions": [...],
  "nftCount": 3
}`,
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN API PORTAL PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function APIPortalPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'docs' | 'keys' | 'usage'>('docs');
  const [activeCategory, setActiveCategory] = useState('Energy');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);

  // Usage stats
  const [usageStats, setUsageStats] = useState<UsageStats>({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    limit: 100,
    tier: 'Free',
  });

  // Current tier for premium upgrade
  const [currentTier, setCurrentTier] = useState('free');
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);

  // Live activity
  const [liveCalls, setLiveCalls] = useState<APICall[]>([]);

  // Fetch API keys and usage from server
  useEffect(() => {
    const fetchAPIKeys = async () => {
      if (!session?.user) return;

      try {
        const res = await fetch('/api/developer/keys');
        if (res.ok) {
          const data = await res.json();
          if (data.keys) setApiKeys(data.keys);
          if (data.usage) setUsageStats(data.usage);
        }
      } catch {
        // No API keys yet - show empty state
        setApiKeys([]);
      }
    };

    fetchAPIKeys();
  }, [session]);

  // Fetch live API activity from server
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch('/api/developer/activity');
        if (res.ok) {
          const data = await res.json();
          if (data.calls && Array.isArray(data.calls)) {
            setLiveCalls(data.calls.slice(0, 20));
          }
        }
      } catch {
        // No activity data available
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 10000);
    return () => clearInterval(interval);
  }, []);

  // Generate new API key via server
  const generateAPIKey = async () => {
    if (!newKeyName.trim()) return;

    setIsGenerating(true);

    try {
      const res = await fetch('/api/developer/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.key) {
          setApiKeys((prev) => [...prev, data.key]);
          setNewKeyName('');
          setShowNewKeyModal(false);
        }
      }
    } catch {
      // Failed to generate key
    } finally {
      setIsGenerating(false);
    }
  };

  // Revoke API key
  const revokeKey = (id: string) => {
    setApiKeys((prev) =>
      prev.map((key) =>
        key.id === id ? { ...key, status: 'revoked' as const } : key
      )
    );
  };

  // Handle premium tier upgrade
  const handleTierUpgrade = useCallback((tierId: string, stripeLink?: string) => {
    if (stripeLink) {
      // Open Stripe payment link or mailto
      if (stripeLink.startsWith('mailto:')) {
        window.location.href = stripeLink;
      } else {
        // Add success_url and cancel_url for Stripe
        const successUrl = encodeURIComponent(`${window.location.origin}/ko/nexus/api-docs?upgrade=success`);
        const cancelUrl = encodeURIComponent(`${window.location.origin}/ko/nexus/api-docs?upgrade=cancel`);
        const finalUrl = `${stripeLink}?success_url=${successUrl}&cancel_url=${cancelUrl}`;
        window.open(finalUrl, '_blank');
      }
    }
  }, []);

  // Check for upgrade success from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const upgradeStatus = urlParams.get('upgrade');
    if (upgradeStatus === 'success') {
      setShowUpgradeSuccess(true);
      setCurrentTier('pro');
      setUsageStats(prev => ({
        ...prev,
        tier: 'Pro',
        limit: 10000,
      }));
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const copyToClipboard = (text: string, path: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const methodColors: Record<string, string> = {
    GET: 'bg-emerald-500',
    POST: 'bg-cyan-500',
    PUT: 'bg-amber-500',
    DELETE: 'bg-red-500',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative">
      <NeuralGridBg />
      <MobileHeader title="API Portal" />

      <main className="relative z-10 p-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-2xl font-black text-white">Sovereign API</h1>
              <p className="text-sm text-white/50">Field Nine Energy Platform v2.0</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#00E5FF]/20 border border-[#00E5FF]/30">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-[#00E5FF]"
              />
              <span className="text-xs font-bold text-[#00E5FF]">LIVE</span>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2"
          >
            {[
              { id: 'docs', label: 'Documentation', icon: '📚' },
              { id: 'keys', label: 'API Keys', icon: '🔑' },
              { id: 'usage', label: 'Usage', icon: '📊' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'docs' | 'keys' | 'usage')}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-[#00E5FF] text-[#171717]'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* Documentation Tab */}
          <AnimatePresence mode="wait">
            {activeTab === 'docs' && (
              <motion.div
                key="docs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Base URL */}
                <div className="bg-[#171717] rounded-2xl p-4 border border-[#00E5FF]/20">
                  <div className="text-xs text-[#00E5FF] mb-2">Base URL</div>
                  <code className="text-lg font-mono text-white">https://api.fieldnine.io/v2</code>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {Object.keys(API_ENDPOINTS).map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                        activeCategory === category
                          ? 'bg-[#00E5FF] text-[#171717]'
                          : 'bg-white/5 text-white/60 hover:text-white'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Endpoints */}
                <div className="space-y-4">
                  {API_ENDPOINTS[activeCategory]?.map((endpoint, index) => (
                    <motion.div
                      key={endpoint.path}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/5 backdrop-blur rounded-2xl border border-[#00E5FF]/10 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold text-white ${methodColors[endpoint.method]}`}>
                            {endpoint.method}
                          </span>
                          <code className="text-sm font-mono text-white">{endpoint.path}</code>
                        </div>
                        {endpoint.auth && (
                          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded">
                            AUTH
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <div className="px-4 pb-3">
                        <p className="text-sm text-white/50">{endpoint.description}</p>
                      </div>

                      {/* Parameters */}
                      {endpoint.params && endpoint.params.length > 0 && (
                        <div className="px-4 pb-3">
                          <div className="text-xs text-white/40 mb-2">Parameters</div>
                          <div className="space-y-2">
                            {endpoint.params.map((param) => (
                              <div key={param.name} className="flex items-center gap-3 text-sm">
                                <code className="text-[#00E5FF] font-mono">{param.name}</code>
                                <span className="text-white/30">{param.type}</span>
                                {param.required && (
                                  <span className="text-red-400 text-xs">required</span>
                                )}
                                <span className="text-white/50 text-xs">{param.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Response */}
                      <div className="bg-[#0a0a0a] p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-white/50 font-medium">Response</span>
                          <button
                            onClick={() => copyToClipboard(endpoint.response, endpoint.path)}
                            className="text-xs text-[#00E5FF] hover:underline"
                          >
                            {copiedPath === endpoint.path ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <pre className="text-xs font-mono text-white/70 overflow-x-auto">
                          {endpoint.response}
                        </pre>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* API Keys Tab */}
            {activeTab === 'keys' && (
              <motion.div
                key="keys"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Upgrade Success Banner */}
                {showUpgradeSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-500/20 border border-emerald-500/50 rounded-2xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🎉</span>
                      <div>
                        <p className="font-bold text-emerald-400">Upgrade Successful!</p>
                        <p className="text-sm text-white/60">Your Pro plan is now active. Enjoy unlimited possibilities!</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowUpgradeSuccess(false)}
                      className="text-white/40 hover:text-white"
                    >
                      ✕
                    </button>
                  </motion.div>
                )}

                {/* Premium Tier Upgrade Section */}
                <PremiumUpgradeSection
                  currentTier={currentTier}
                  onUpgrade={handleTierUpgrade}
                />

                {!session?.user ? (
                  <div className="bg-[#171717] rounded-2xl p-8 text-center border border-[#00E5FF]/20">
                    <div className="text-4xl mb-4">🔐</div>
                    <h3 className="text-xl font-bold text-white mb-2">Sign in Required</h3>
                    <p className="text-white/50 mb-4">Sign in to manage your API keys</p>
                  </div>
                ) : (
                  <>
                    {/* Generate Key Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowNewKeyModal(true)}
                      className="w-full py-4 bg-[#00E5FF] text-[#171717] rounded-2xl font-bold text-lg"
                    >
                      + Generate New API Key
                    </motion.button>

                    {/* Existing Keys */}
                    <div className="space-y-4">
                      {apiKeys.map((key) => (
                        <APIKeyCard key={key.id} apiKey={key} onRevoke={revokeKey} />
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Usage Tab */}
            {activeTab === 'usage' && (
              <motion.div
                key="usage"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <UsageMonitor stats={usageStats} />
                <LiveActivityFeed calls={liveCalls} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Authentication Guide */}
          {activeTab === 'docs' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-[#00E5FF]/10"
            >
              <h2 className="text-lg font-bold text-white mb-4">Authentication</h2>
              <p className="text-sm text-white/50 mb-4">
                Include your API key in the Authorization header:
              </p>
              <div className="bg-[#0a0a0a] rounded-xl p-4">
                <code className="text-sm font-mono text-[#00E5FF]">
                  Authorization: Bearer fn_live_your_api_key
                </code>
              </div>
            </motion.div>
          )}

        </div>
      </main>

      <MobileBottomNav />

      {/* New Key Modal */}
      <AnimatePresence>
        {showNewKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowNewKeyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#171717] rounded-3xl p-6 border border-[#00E5FF]/30"
            >
              <h3 className="text-xl font-bold text-white mb-4">Generate API Key</h3>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key name (e.g., Production)"
                className="w-full bg-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#00E5FF] mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewKeyModal(false)}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-medium"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generateAPIKey}
                  disabled={isGenerating || !newKeyName.trim()}
                  className="flex-1 py-3 bg-[#00E5FF] text-[#171717] rounded-xl font-bold disabled:opacity-50"
                >
                  {isGenerating ? 'Generating...' : 'Generate'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
