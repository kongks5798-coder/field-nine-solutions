'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 50: API DEVELOPER PORTAL
 * ═══════════════════════════════════════════════════════════════════════════════
 * 에너지 데이터 API 허브 - Enterprise-grade Developer Experience
 * V2G_Fleet_Control, Grid_Load_Predictor, ESG_Carbon_Certifier 등
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FinancialSidebar, PriceTicker, MembershipBar } from '@/components/nexus/financial-terminal';
import { MobileBottomNav, MobileHeader } from '@/components/nexus/mobile-nav';
import {
  APICard,
  APIDetailModal,
  TierCard,
  CategoryFilter,
  APIStatsOverview,
  APIQuickStart,
  PricingCalculator,
  SandboxToggle,
  API_CATALOG,
  SUBSCRIPTION_TIERS,
  getAPIsByCategory,
} from '@/components/nexus/api-marketplace';
import type { APIEndpoint, APICategory, SubscriptionTier } from '@/lib/api/nexus-connector';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type ViewType = 'explore' | 'docs' | 'pricing' | 'sandbox';

// ═══════════════════════════════════════════════════════════════════════════════
// HEADER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function PortalHeader() {
  return (
    <div className="bg-gradient-to-br from-[#0a0a0a] to-[#171717] rounded-2xl p-6 md:p-8 text-white overflow-hidden relative">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🔌</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black">API Developer Portal</h1>
            <p className="text-white/60 text-sm">Field Nine Energy Data Hub</p>
          </div>
        </div>

        <p className="text-white/80 max-w-2xl mb-6">
          V2G 차량 제어, 그리드 부하 예측, ESG 탄소 인증 등 엔터프라이즈급 에너지 API를 제공합니다.
          KAUS 코인으로 결제하고 실시간 에너지 데이터에 접근하세요.
        </p>

        <div className="flex flex-wrap gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl"
          >
            API Key 발급받기
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl border border-white/20"
          >
            문서 보기
          </motion.button>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full blur-3xl" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAVIGATION TABS
// ═══════════════════════════════════════════════════════════════════════════════

interface NavTabsProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

function NavTabs({ activeView, onViewChange }: NavTabsProps) {
  const tabs: { id: ViewType; label: string; icon: string }[] = [
    { id: 'explore', label: 'API 탐색', icon: '🔍' },
    { id: 'docs', label: '문서', icon: '📚' },
    { id: 'pricing', label: '요금제', icon: '💰' },
    { id: 'sandbox', label: 'Sandbox', icon: '🧪' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-[#171717]/10 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onViewChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeView === tab.id
              ? 'bg-[#171717] text-white'
              : 'text-[#171717]/70 hover:bg-[#171717]/5'
          }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPLORE VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function ExploreView() {
  const [categoryFilter, setCategoryFilter] = useState<APICategory | 'ALL'>('ALL');
  const [selectedAPI, setSelectedAPI] = useState<APIEndpoint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAPIs = useMemo(() => {
    let apis = categoryFilter === 'ALL'
      ? API_CATALOG
      : getAPIsByCategory(categoryFilter);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      apis = apis.filter(api =>
        api.name.toLowerCase().includes(query) ||
        api.nameKo.toLowerCase().includes(query) ||
        api.description.toLowerCase().includes(query)
      );
    }

    return apis;
  }, [categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <APIStatsOverview />

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="API 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-[#171717]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex-shrink-0">
          <CategoryFilter selected={categoryFilter} onChange={setCategoryFilter} />
        </div>
      </div>

      {/* API Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAPIs.map((api, i) => (
          <motion.div
            key={api.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <APICard api={api} onClick={() => setSelectedAPI(api)} />
          </motion.div>
        ))}
      </div>

      {filteredAPIs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#171717]/50">검색 결과가 없습니다.</p>
        </div>
      )}

      {/* API Detail Modal */}
      <APIDetailModal api={selectedAPI} onClose={() => setSelectedAPI(null)} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOCS VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function DocsView() {
  return (
    <div className="space-y-6">
      <APIQuickStart />

      {/* Documentation sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: 'Authentication', desc: 'API 키 인증 및 OAuth 2.0 설정', icon: '🔐' },
          { title: 'Rate Limits', desc: '티어별 호출 제한 및 최적화', icon: '⏱️' },
          { title: 'Error Handling', desc: '에러 코드 및 복구 전략', icon: '⚠️' },
          { title: 'Webhooks', desc: '실시간 이벤트 알림 설정', icon: '🔔' },
          { title: 'SDKs', desc: 'JavaScript, Python, Go SDK', icon: '📦' },
          { title: 'Best Practices', desc: '성능 최적화 가이드', icon: '✨' },
        ].map((doc, i) => (
          <motion.div
            key={doc.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl p-5 border border-[#171717]/10 cursor-pointer hover:border-emerald-500/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#171717] to-[#2a2a2a] rounded-xl flex items-center justify-center">
                <span className="text-xl">{doc.icon}</span>
              </div>
              <div>
                <h3 className="font-bold text-[#171717]">{doc.title}</h3>
                <p className="text-sm text-[#171717]/60">{doc.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* SDK Downloads */}
      <div className="bg-[#171717] rounded-2xl p-6 text-white">
        <h3 className="font-bold text-lg mb-4">SDK Downloads</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { lang: 'JavaScript', version: 'v2.1.0', icon: '🟨' },
            { lang: 'Python', version: 'v2.0.5', icon: '🐍' },
            { lang: 'Go', version: 'v1.8.2', icon: '🔵' },
            { lang: 'Rust', version: 'v1.2.0', icon: '🦀' },
          ].map((sdk) => (
            <motion.button
              key={sdk.lang}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
            >
              <div className="text-2xl mb-2">{sdk.icon}</div>
              <div className="font-bold">{sdk.lang}</div>
              <div className="text-xs text-white/50">{sdk.version}</div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRICING VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function PricingView() {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('PRO');

  return (
    <div className="space-y-8">
      {/* Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SUBSCRIPTION_TIERS.map((tier, i) => (
          <motion.div
            key={tier.tier}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <TierCard
              tier={tier}
              isPopular={tier.tier === 'PRO'}
              onSelect={() => setSelectedTier(tier.tier)}
            />
          </motion.div>
        ))}
      </div>

      {/* Pricing Calculator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PricingCalculator selectedTier={selectedTier} />

        {/* FAQ */}
        <div className="bg-white rounded-2xl p-6 border border-[#171717]/10">
          <h3 className="font-bold text-[#171717] mb-4">자주 묻는 질문</h3>
          <div className="space-y-4">
            {[
              { q: 'KAUS로 어떻게 결제하나요?', a: '지갑에서 KAUS를 충전 후 구독 시 자동 차감됩니다.' },
              { q: '티어 변경이 가능한가요?', a: '언제든지 업/다운그레이드 가능하며 차액은 정산됩니다.' },
              { q: 'API 호출 초과 시 어떻게 되나요?', a: '초과 호출 시 호출당 가격으로 자동 과금됩니다.' },
            ].map((faq, i) => (
              <div key={i} className="border-b border-[#171717]/10 pb-3 last:border-0">
                <h4 className="font-medium text-[#171717] mb-1">{faq.q}</h4>
                <p className="text-sm text-[#171717]/60">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enterprise CTA */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-2xl p-6 border border-purple-500/30"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-[#171717]">👑 Enterprise 맞춤 상담</h3>
            <p className="text-[#171717]/60">
              대규모 트래픽, 전용 인프라, White-label 솔루션이 필요하시다면 상담하세요.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-500 text-white font-bold rounded-xl whitespace-nowrap"
          >
            상담 신청
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SANDBOX VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function SandboxView() {
  const [isLive, setIsLive] = useState(false);
  const [selectedAPI, setSelectedAPI] = useState<APIEndpoint | null>(API_CATALOG[0]);
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTestAPI = async () => {
    if (!selectedAPI) return;

    setIsLoading(true);
    setResponse(null);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, selectedAPI.latencyMs));

    setResponse(JSON.stringify(selectedAPI.exampleResponse, null, 2));
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Sandbox Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/30">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧪</span>
          <div>
            <h3 className="font-bold text-[#171717]">API Sandbox</h3>
            <p className="text-sm text-[#171717]/60">비용 없이 API를 테스트하세요</p>
          </div>
        </div>
        <SandboxToggle isLive={isLive} onToggle={() => setIsLive(!isLive)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Selector */}
        <div className="bg-white rounded-2xl border border-[#171717]/10 overflow-hidden">
          <div className="p-4 border-b border-[#171717]/10">
            <h3 className="font-bold text-[#171717]">API 선택</h3>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {API_CATALOG.map((api) => (
              <button
                key={api.id}
                onClick={() => setSelectedAPI(api)}
                className={`w-full p-4 text-left border-b border-[#171717]/5 hover:bg-[#171717]/5 transition-colors ${
                  selectedAPI?.id === api.id ? 'bg-emerald-500/10' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 text-xs font-mono rounded ${
                    api.method === 'GET' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {api.method}
                  </span>
                  <span className="font-medium text-[#171717]">{api.nameKo}</span>
                </div>
                <code className="text-xs text-[#171717]/50 font-mono mt-1 block">{api.endpoint}</code>
              </button>
            ))}
          </div>
        </div>

        {/* Request/Response */}
        <div className="space-y-4">
          {/* Request */}
          <div className="bg-white rounded-2xl border border-[#171717]/10 overflow-hidden">
            <div className="p-4 border-b border-[#171717]/10 flex items-center justify-between">
              <h3 className="font-bold text-[#171717]">Request</h3>
              {selectedAPI && (
                <span className={`px-2 py-0.5 text-xs font-mono rounded ${
                  selectedAPI.method === 'GET' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {selectedAPI.method}
                </span>
              )}
            </div>
            <pre className="p-4 bg-[#0a0a0a] text-emerald-400 font-mono text-sm overflow-x-auto">
              {selectedAPI ? JSON.stringify(selectedAPI.exampleRequest, null, 2) : '// Select an API'}
            </pre>
          </div>

          {/* Send Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTestAPI}
            disabled={!selectedAPI || isLoading}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  ⏳
                </motion.span>
                Sending...
              </span>
            ) : (
              'Send Request'
            )}
          </motion.button>

          {/* Response */}
          <div className="bg-white rounded-2xl border border-[#171717]/10 overflow-hidden">
            <div className="p-4 border-b border-[#171717]/10 flex items-center justify-between">
              <h3 className="font-bold text-[#171717]">Response</h3>
              {response && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded">
                  200 OK
                </span>
              )}
            </div>
            <pre className="p-4 bg-[#0a0a0a] text-amber-400 font-mono text-sm overflow-x-auto max-h-[300px]">
              {response || '// Response will appear here'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function APIPortalPage() {
  const [activeView, setActiveView] = useState<ViewType>('explore');

  const renderView = () => {
    switch (activeView) {
      case 'explore':
        return <ExploreView />;
      case 'docs':
        return <DocsView />;
      case 'pricing':
        return <PricingView />;
      case 'sandbox':
        return <SandboxView />;
      default:
        return <ExploreView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Desktop: Financial Terminal Sidebar */}
      <div className="hidden md:block">
        <FinancialSidebar />
      </div>

      {/* Mobile: Header */}
      <div className="md:hidden">
        <MobileHeader title="API Portal" />
      </div>

      <div className="md:ml-56">
        {/* Desktop Only */}
        <div className="hidden md:block">
          <PriceTicker />
          <MembershipBar />
        </div>

        <main className="p-4 md:p-6 pb-24 md:pb-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Portal Header */}
            <PortalHeader />

            {/* Navigation */}
            <NavTabs activeView={activeView} onViewChange={setActiveView} />

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile: Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
