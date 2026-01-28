/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 65: DEVELOPER API DOCUMENTATION
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Clean, Tesla-style API docs for Field Nine Energy Platform
 *
 * @route /nexus/api-docs
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MobileBottomNav, MobileHeader } from '@/components/nexus/mobile-nav';

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  auth: boolean;
  response: string;
}

const API_ENDPOINTS: Record<string, APIEndpoint[]> = {
  'Energy': [
    {
      method: 'GET',
      path: '/api/live/tesla',
      description: 'Tesla Powerwall V2G real-time data',
      auth: false,
      response: `{
  "batteryLevel": 72,
  "energyStored": 75.6,
  "v2gAvailable": 54.6,
  "v2gStatus": "ACTIVE",
  "isLive": true
}`,
    },
    {
      method: 'GET',
      path: '/api/live/yeongdong',
      description: 'Yeongdong Solar Farm live metrics',
      auth: false,
      response: `{
  "currentOutput": 42,
  "dailyGeneration": 212,
  "todayEarningsKRW": 27560000,
  "smpPrice": 130,
  "weatherCondition": "sunny",
  "isLive": true
}`,
    },
    {
      method: 'GET',
      path: '/api/energy/nodes',
      description: 'All energy nodes network status',
      auth: true,
      response: `{
  "nodes": [
    { "id": "yd-solar", "name": "Yeongdong Solar", "type": "solar", "status": "online" },
    { "id": "tesla-v2g", "name": "Tesla Powerwall", "type": "battery", "status": "online" }
  ],
  "totalCapacity": 255.6,
  "totalOutput": 140.3
}`,
    },
  ],
  'Exchange': [
    {
      method: 'GET',
      path: '/api/exchange/rates',
      description: 'Current exchange rates (KRW/USD/BTC)',
      auth: false,
      response: `{
  "KRW_USD": 0.00076,
  "BTC_USD": 97450,
  "ETH_USD": 3180,
  "timestamp": "2026-01-28T09:00:00Z"
}`,
    },
    {
      method: 'POST',
      path: '/api/exchange/swap',
      description: 'Execute currency swap',
      auth: true,
      response: `{
  "txId": "swap_abc123",
  "from": { "currency": "KRW", "amount": 1000000 },
  "to": { "currency": "USD", "amount": 760 },
  "fee": 0.001,
  "status": "completed"
}`,
    },
  ],
  'Auth': [
    {
      method: 'POST',
      path: '/api/auth/token',
      description: 'Generate API access token',
      auth: false,
      response: `{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}`,
    },
    {
      method: 'GET',
      path: '/api/auth/me',
      description: 'Get current user info',
      auth: true,
      response: `{
  "id": "user_123",
  "email": "user@example.com",
  "tier": "premium",
  "apiCalls": { "used": 450, "limit": 10000 }
}`,
    },
  ],
};

export default function APIDocsPage() {
  const [activeCategory, setActiveCategory] = useState('Energy');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

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
    <div className="min-h-screen bg-[#0a0a0a]">
      <MobileHeader title="Developer API" />

      <main className="p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-black text-white">Sovereign API</h1>
            <p className="text-sm text-white/50 mt-1">Field Nine Energy Platform v1.0</p>
          </motion.div>

          {/* Base URL */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#171717] rounded-2xl p-4 border border-[#00E5FF]/20"
          >
            <div className="text-xs text-[#00E5FF] mb-2">Base URL</div>
            <code className="text-lg font-mono text-white">https://api.fieldnine.io/v1</code>
          </motion.div>

          {/* Category Tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex gap-2"
          >
            {Object.keys(API_ENDPOINTS).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeCategory === category
                    ? 'bg-[#00E5FF] text-[#171717]'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </motion.div>

          {/* Endpoints */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {API_ENDPOINTS[activeCategory].map((endpoint, index) => (
              <motion.div
                key={endpoint.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="bg-white/5 backdrop-blur rounded-2xl border border-[#00E5FF]/10 overflow-hidden"
              >
                {/* Endpoint Header */}
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

                {/* Response */}
                <div className="bg-[#0a0a0a] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/50 font-medium">Response</span>
                    <button
                      onClick={() => copyToClipboard(endpoint.response, endpoint.path)}
                      className="text-xs text-[#00E5FF] hover:underline transition-colors"
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
          </motion.div>

          {/* Authentication Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-[#00E5FF]/10"
          >
            <h2 className="text-lg font-bold text-white mb-4">Authentication</h2>
            <p className="text-sm text-white/50 mb-4">
              Include your API token in the Authorization header:
            </p>
            <div className="bg-[#0a0a0a] rounded-xl p-4">
              <code className="text-sm font-mono text-[#00E5FF]">
                Authorization: Bearer your_api_token
              </code>
            </div>
          </motion.div>

          {/* Rate Limits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-[#00E5FF]/10"
          >
            <h2 className="text-lg font-bold text-white mb-4">Rate Limits</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/50">Free Tier</span>
                <span className="font-bold text-white">100 req/day</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/50">Premium</span>
                <span className="font-bold text-[#00E5FF]">10,000 req/day</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/50">Enterprise</span>
                <span className="font-bold text-[#00E5FF]">Unlimited</span>
              </div>
            </div>
          </motion.div>

        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
