'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 50: API MARKETPLACE UI COMPONENTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * Tesla-grade API Developer Portal
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  API_CATALOG,
  SUBSCRIPTION_TIERS,
  APIEndpoint,
  APISubscription,
  APICategory,
  SubscriptionTier,
  getAPIsByCategory,
  calculateMonthlyCost,
} from '@/lib/api/nexus-connector';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const CATEGORY_CONFIG: Record<APICategory, { icon: string; color: string; gradient: string }> = {
  V2G: { icon: '⚡', color: 'emerald', gradient: 'from-emerald-500 to-green-500' },
  GRID: { icon: '🔌', color: 'blue', gradient: 'from-blue-500 to-cyan-500' },
  ESG: { icon: '🌱', color: 'green', gradient: 'from-green-500 to-teal-500' },
  TRADING: { icon: '📈', color: 'amber', gradient: 'from-amber-500 to-orange-500' },
  ANALYTICS: { icon: '📊', color: 'purple', gradient: 'from-purple-500 to-violet-500' },
  IOT: { icon: '📡', color: 'cyan', gradient: 'from-cyan-500 to-blue-500' },
};

const TIER_CONFIG: Record<SubscriptionTier, { icon: string; color: string }> = {
  FREE: { icon: '🎁', color: 'neutral' },
  PRO: { icon: '⭐', color: 'amber' },
  ENTERPRISE: { icon: '👑', color: 'purple' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// API CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface APICardProps {
  api: APIEndpoint;
  onClick?: () => void;
}

export function APICard({ api, onClick }: APICardProps) {
  const categoryConfig = CATEGORY_CONFIG[api.category];
  const tierConfig = TIER_CONFIG[api.requiredTier];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-[#171717] rounded-2xl border border-white/10 overflow-hidden cursor-pointer group hover:border-white/20 transition-colors"
    >
      {/* Header */}
      <div className={`h-2 bg-gradient-to-r ${categoryConfig.gradient}`} />

      <div className="p-5">
        {/* Category & Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{categoryConfig.icon}</span>
            <span className="text-xs text-white/50 uppercase tracking-wider">{api.category}</span>
          </div>
          <div className="flex items-center gap-2">
            {api.status === 'BETA' && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">BETA</span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              api.requiredTier === 'FREE' ? 'bg-neutral-700 text-neutral-300' :
              api.requiredTier === 'PRO' ? 'bg-amber-500/20 text-amber-400' :
              'bg-purple-500/20 text-purple-400'
            }`}>
              {tierConfig.icon} {api.requiredTier}
            </span>
          </div>
        </div>

        {/* Name & Description */}
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
          {api.nameKo}
        </h3>
        <p className="text-sm text-white/60 line-clamp-2 mb-4">
          {api.descriptionKo}
        </p>

        {/* Endpoint */}
        <div className="flex items-center gap-2 mb-4 p-2 bg-black/30 rounded-lg">
          <span className={`px-2 py-0.5 text-xs font-mono rounded ${
            api.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' :
            api.method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
            api.method === 'PUT' ? 'bg-amber-500/20 text-amber-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {api.method}
          </span>
          <code className="text-xs text-white/70 font-mono truncate">{api.endpoint}</code>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 bg-white/5 rounded-lg">
            <div className="text-lg font-bold text-white">{api.pricePerCall}</div>
            <div className="text-xs text-white/50">KAUS/call</div>
          </div>
          <div className="p-2 bg-white/5 rounded-lg">
            <div className="text-lg font-bold text-emerald-400">{api.latencyMs}ms</div>
            <div className="text-xs text-white/50">Latency</div>
          </div>
          <div className="p-2 bg-white/5 rounded-lg">
            <div className="text-lg font-bold text-cyan-400">{api.uptime}%</div>
            <div className="text-xs text-white/50">Uptime</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// API DETAIL MODAL
// ═══════════════════════════════════════════════════════════════════════════════

interface APIDetailModalProps {
  api: APIEndpoint | null;
  onClose: () => void;
}

export function APIDetailModal({ api, onClose }: APIDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'request' | 'response' | 'try'>('overview');

  if (!api) return null;

  const categoryConfig = CATEGORY_CONFIG[api.category];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0f0f0f] rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden border border-white/10"
        >
          {/* Header */}
          <div className={`h-1 bg-gradient-to-r ${categoryConfig.gradient}`} />
          <div className="p-6 border-b border-white/10">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{categoryConfig.icon}</span>
                  <span className="text-xs text-white/50 uppercase">{api.category}</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                    {api.version}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white">{api.nameKo}</h2>
                <p className="text-white/60 mt-1">{api.descriptionKo}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                ✕
              </button>
            </div>

            {/* Endpoint */}
            <div className="mt-4 flex items-center gap-3 p-3 bg-black/50 rounded-xl">
              <span className={`px-3 py-1 font-mono text-sm rounded ${
                api.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {api.method}
              </span>
              <code className="text-white/80 font-mono flex-1">{api.endpoint}</code>
              <button className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">
                Copy
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {[
              { id: 'overview', label: '개요' },
              { id: 'request', label: '요청' },
              { id: 'response', label: '응답' },
              { id: 'try', label: 'API 테스트' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-emerald-500'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[50vh]">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Pricing */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="text-sm text-white/50 mb-1">호출당 가격</div>
                    <div className="text-2xl font-bold text-white">{api.pricePerCall} <span className="text-lg text-white/50">KAUS</span></div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="text-sm text-white/50 mb-1">월 무료 쿼터</div>
                    <div className="text-2xl font-bold text-emerald-400">{api.monthlyFreeQuota.toLocaleString()}</div>
                  </div>
                </div>

                {/* Rate Limits */}
                <div>
                  <h4 className="text-sm font-medium text-white/70 mb-3">Rate Limits (calls/minute)</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(api.rateLimit).map(([tier, limit]) => (
                      <div key={tier} className="p-3 bg-white/5 rounded-xl text-center">
                        <div className="text-xs text-white/50 uppercase mb-1">{tier}</div>
                        <div className="font-bold text-white">{limit.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance */}
                <div>
                  <h4 className="text-sm font-medium text-white/70 mb-3">Performance</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white/5 rounded-xl">
                      <div className="text-xs text-white/50 mb-1">Average Latency</div>
                      <div className="font-bold text-cyan-400">{api.latencyMs}ms</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl">
                      <div className="text-xs text-white/50 mb-1">Uptime SLA</div>
                      <div className="font-bold text-emerald-400">{api.uptime}%</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'request' && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-white/70">Request Schema</h4>
                <pre className="p-4 bg-black/50 rounded-xl overflow-x-auto">
                  <code className="text-sm text-emerald-400">
                    {JSON.stringify(api.requestSchema, null, 2)}
                  </code>
                </pre>

                <h4 className="text-sm font-medium text-white/70 mt-6">Example Request</h4>
                <pre className="p-4 bg-black/50 rounded-xl overflow-x-auto">
                  <code className="text-sm text-cyan-400">
                    {JSON.stringify(api.exampleRequest, null, 2)}
                  </code>
                </pre>
              </div>
            )}

            {activeTab === 'response' && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-white/70">Response Schema</h4>
                <pre className="p-4 bg-black/50 rounded-xl overflow-x-auto">
                  <code className="text-sm text-emerald-400">
                    {JSON.stringify(api.responseSchema, null, 2)}
                  </code>
                </pre>

                <h4 className="text-sm font-medium text-white/70 mt-6">Example Response</h4>
                <pre className="p-4 bg-black/50 rounded-xl overflow-x-auto">
                  <code className="text-sm text-amber-400">
                    {JSON.stringify(api.exampleResponse, null, 2)}
                  </code>
                </pre>
              </div>
            )}

            {activeTab === 'try' && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <span>🧪</span>
                    <span className="font-medium">Sandbox Mode</span>
                  </div>
                  <p className="text-sm text-white/60">
                    API 테스트 환경에서 실제 비용 없이 호출해볼 수 있습니다.
                  </p>
                </div>

                <div>
                  <label className="text-sm text-white/50 block mb-2">Request Body</label>
                  <textarea
                    className="w-full h-32 p-3 bg-black/50 border border-white/10 rounded-xl text-white font-mono text-sm resize-none focus:outline-none focus:border-emerald-500"
                    defaultValue={JSON.stringify(api.exampleRequest, null, 2)}
                  />
                </div>

                <button className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
                  Send Request
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION TIER CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface TierCardProps {
  tier: APISubscription;
  isPopular?: boolean;
  onSelect?: () => void;
}

export function TierCard({ tier, isPopular = false, onSelect }: TierCardProps) {
  const config = TIER_CONFIG[tier.tier];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className={`relative bg-[#171717] rounded-2xl border overflow-hidden ${
        isPopular ? 'border-emerald-500' : 'border-white/10'
      }`}
    >
      {isPopular && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-center text-xs font-bold py-1">
          MOST POPULAR
        </div>
      )}

      <div className={`p-6 ${isPopular ? 'pt-8' : ''}`}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h3 className="text-xl font-bold text-white">{tier.nameKo}</h3>
            <p className="text-sm text-white/50">{tier.name}</p>
          </div>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-white">
              {tier.priceKAUS === 0 ? '무료' : tier.priceKAUS.toLocaleString()}
            </span>
            {tier.priceKAUS > 0 && (
              <span className="text-white/50">KAUS/월</span>
            )}
          </div>
          {tier.priceKRW > 0 && (
            <p className="text-sm text-white/40">≈ ₩{tier.priceKRW.toLocaleString()}/월</p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-6">
          {tier.featuresKo.map((feature, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <span className="text-sm text-white/70">{feature}</span>
            </li>
          ))}
        </ul>

        {/* API Calls */}
        <div className="p-3 bg-white/5 rounded-xl mb-6">
          <div className="text-xs text-white/50 mb-1">월 API 호출</div>
          <div className="font-bold text-white">
            {tier.apiCallsPerMonth === -1 ? '무제한' : tier.apiCallsPerMonth.toLocaleString()}
          </div>
        </div>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSelect}
          className={`w-full py-3 font-bold rounded-xl transition-colors ${
            isPopular
              ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {tier.tier === 'FREE' ? '시작하기' : '구독하기'}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY FILTER
// ═══════════════════════════════════════════════════════════════════════════════

interface CategoryFilterProps {
  selected: APICategory | 'ALL';
  onChange: (category: APICategory | 'ALL') => void;
}

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const categories: (APICategory | 'ALL')[] = ['ALL', 'V2G', 'GRID', 'ESG', 'TRADING', 'ANALYTICS', 'IOT'];

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => {
        const isAll = cat === 'ALL';
        const config = isAll ? null : CATEGORY_CONFIG[cat];
        const isSelected = selected === cat;

        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isSelected
                ? isAll
                  ? 'bg-white text-black'
                  : `bg-gradient-to-r ${config?.gradient} text-white`
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {isAll ? '전체' : `${config?.icon} ${cat}`}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// API STATS OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════

export function APIStatsOverview() {
  const totalAPIs = API_CATALOG.length;
  const avgUptime = (API_CATALOG.reduce((sum, api) => sum + api.uptime, 0) / totalAPIs).toFixed(2);
  const avgLatency = Math.round(API_CATALOG.reduce((sum, api) => sum + api.latencyMs, 0) / totalAPIs);

  const stats = [
    { label: 'Total APIs', value: totalAPIs, icon: '🔌', suffix: '개' },
    { label: 'Avg Uptime', value: avgUptime, icon: '📊', suffix: '%' },
    { label: 'Avg Latency', value: avgLatency, icon: '⚡', suffix: 'ms' },
    { label: 'Categories', value: Object.keys(CATEGORY_CONFIG).length, icon: '📦', suffix: '개' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-[#171717] rounded-xl p-4 border border-white/10"
        >
          <div className="flex items-center gap-2 mb-2">
            <span>{stat.icon}</span>
            <span className="text-xs text-white/50">{stat.label}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{stat.value}</span>
            <span className="text-white/50">{stat.suffix}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// API QUICK START GUIDE
// ═══════════════════════════════════════════════════════════════════════════════

export function APIQuickStart() {
  const [step, setStep] = useState(1);

  const steps = [
    {
      title: 'API Key 발급',
      code: `// 1. API Key 생성
const apiKey = await fieldnine.createAPIKey({
  name: 'My App',
  permissions: ['read', 'write']
});`,
    },
    {
      title: '첫 번째 호출',
      code: `// 2. API 호출
const response = await fetch(
  'https://api.fieldnine.io/v2/grid/price',
  {
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
console.log(data.currentPrice); // 118.5 KRW/kWh`,
    },
    {
      title: 'Webhook 설정',
      code: `// 3. 실시간 알림 설정
await fieldnine.webhooks.create({
  url: 'https://your-app.com/webhook',
  events: ['price.peak', 'grid.congestion'],
  secret: 'your_webhook_secret'
});`,
    },
  ];

  return (
    <div className="bg-[#171717] rounded-2xl border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <h3 className="font-bold text-white">Quick Start Guide</h3>
        <p className="text-sm text-white/50">3분 만에 첫 API 호출하기</p>
      </div>

      {/* Steps */}
      <div className="flex border-b border-white/10">
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i + 1)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              step === i + 1
                ? 'text-white border-b-2 border-emerald-500'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Step {i + 1}: {s.title}
          </button>
        ))}
      </div>

      {/* Code */}
      <div className="p-4">
        <pre className="p-4 bg-black/50 rounded-xl overflow-x-auto">
          <code className="text-sm text-emerald-400 whitespace-pre">
            {steps[step - 1].code}
          </code>
        </pre>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRICING CALCULATOR
// ═══════════════════════════════════════════════════════════════════════════════

interface PricingCalculatorProps {
  selectedTier: SubscriptionTier;
}

export function PricingCalculator({ selectedTier }: PricingCalculatorProps) {
  const [estimatedCalls, setEstimatedCalls] = useState(10000);
  const [selectedAPIs, setSelectedAPIs] = useState<string[]>(['grid-realtime-price', 'v2g-fleet-status']);

  const cost = useMemo(() => {
    return calculateMonthlyCost(selectedTier, estimatedCalls, selectedAPIs);
  }, [selectedTier, estimatedCalls, selectedAPIs]);

  return (
    <div className="bg-[#171717] rounded-2xl border border-white/10 p-6">
      <h3 className="font-bold text-white mb-4">💰 월간 비용 계산기</h3>

      <div className="space-y-4">
        {/* Calls slider */}
        <div>
          <label className="text-sm text-white/50 block mb-2">
            예상 월간 API 호출: <strong className="text-white">{estimatedCalls.toLocaleString()}</strong>
          </label>
          <input
            type="range"
            min={1000}
            max={1000000}
            step={1000}
            value={estimatedCalls}
            onChange={(e) => setEstimatedCalls(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>

        {/* Cost breakdown */}
        <div className="space-y-2 p-4 bg-white/5 rounded-xl">
          <div className="flex justify-between">
            <span className="text-white/50">기본 구독료</span>
            <span className="text-white">{cost.baseCost.toLocaleString()} KAUS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">사용량 비용</span>
            <span className="text-white">{cost.usageCost.toLocaleString()} KAUS</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-white/10">
            <span className="font-bold text-white">총 예상 비용</span>
            <span className="font-bold text-emerald-400">{cost.totalCost.toLocaleString()} KAUS</span>
          </div>
          <div className="text-right text-xs text-white/40">
            ≈ ₩{(cost.totalCost * 120).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SANDBOX MODE TOGGLE
// ═══════════════════════════════════════════════════════════════════════════════

interface SandboxToggleProps {
  isLive: boolean;
  onToggle: () => void;
}

export function SandboxToggle({ isLive, onToggle }: SandboxToggleProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[#171717] rounded-xl border border-white/10">
      <span className="text-sm text-white/50">Mode:</span>
      <button
        onClick={onToggle}
        className={`relative w-20 h-8 rounded-full transition-colors ${
          isLive ? 'bg-emerald-500' : 'bg-amber-500'
        }`}
      >
        <motion.div
          className="absolute top-1 w-6 h-6 bg-white rounded-full"
          animate={{ left: isLive ? 'calc(100% - 28px)' : '4px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
      <div className={`flex items-center gap-1 ${isLive ? 'text-emerald-400' : 'text-amber-400'}`}>
        <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
        <span className="text-sm font-bold">{isLive ? 'LIVE' : 'SANDBOX'}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  API_CATALOG,
  SUBSCRIPTION_TIERS,
  CATEGORY_CONFIG,
  getAPIsByCategory,
};
