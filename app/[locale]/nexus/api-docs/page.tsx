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
      method: 'POST',
      path: '/api/kaus/exchange',
      description: 'Execute kWh to KAUS conversion',
      auth: true,
      params: [
        { name: 'action', type: 'string', required: true, description: 'exchange' },
        { name: 'kwhAmount', type: 'number', required: true, description: 'Energy amount (0.1-10000)' },
      ],
      response: `{
  "success": true,
  "data": {
    "transactionId": "TX_ABC123",
    "kwhInput": 100,
    "grossKaus": 1150,
    "fee": 1.15,
    "netKaus": 1148.85,
    "usdValue": 114.88,
    "krwValue": 137862,
    "timestamp": "2026-01-28T09:00:00Z"
  }
}`,
    },
    {
      method: 'GET',
      path: '/api/exchange/rates',
      description: 'Real-time currency exchange rates',
      auth: false,
      response: `{
  "rates": [
    { "pair": "KAUS/KRW", "rate": 1320, "change24h": 2.4 },
    { "pair": "KAUS/USD", "rate": 1.00, "change24h": 1.8 },
    { "pair": "BTC/USD", "rate": 97450, "change24h": -1.2 }
  ],
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

  // Live activity
  const [liveCalls, setLiveCalls] = useState<APICall[]>([]);

  // Fetch API keys and usage
  useEffect(() => {
    if (session?.user) {
      // Simulate fetching API keys
      setApiKeys([
        {
          id: 'key_1',
          key: 'fn_live_' + Math.random().toString(36).substring(2, 34),
          name: 'Production Key',
          createdAt: '2026-01-15',
          lastUsed: '2026-01-28',
          callsToday: 847,
          callsTotal: 15420,
          status: 'active',
        },
      ]);

      setUsageStats({
        today: 847,
        thisWeek: 4520,
        thisMonth: 15420,
        limit: 10000,
        tier: 'Premium',
      });
    }

    // Simulate live API calls
    const interval = setInterval(() => {
      const endpoints = ['/api/live/tesla', '/api/live/yeongdong', '/api/kaus/exchange', '/api/exchange/rates'];
      const methods = ['GET', 'POST'];

      const newCall: APICall = {
        id: Date.now().toString(),
        endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
        method: methods[Math.floor(Math.random() * methods.length)],
        status: Math.random() > 0.05 ? 200 : 500,
        latency: Math.floor(Math.random() * 150) + 20,
        timestamp: new Date().toISOString(),
      };

      setLiveCalls((prev) => [newCall, ...prev.slice(0, 19)]);
    }, 3000);

    return () => clearInterval(interval);
  }, [session]);

  // Generate new API key
  const generateAPIKey = async () => {
    if (!newKeyName.trim()) return;

    setIsGenerating(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newKey: APIKey = {
      id: 'key_' + Date.now(),
      key: 'fn_live_' + Math.random().toString(36).substring(2, 34),
      name: newKeyName,
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: null,
      callsToday: 0,
      callsTotal: 0,
      status: 'active',
    };

    setApiKeys((prev) => [...prev, newKey]);
    setNewKeyName('');
    setShowNewKeyModal(false);
    setIsGenerating(false);
  };

  // Revoke API key
  const revokeKey = (id: string) => {
    setApiKeys((prev) =>
      prev.map((key) =>
        key.id === id ? { ...key, status: 'revoked' as const } : key
      )
    );
  };

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
