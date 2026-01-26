'use client';

/**
 * VRD 26SS - Integrated 5-Tab Navigation
 * Tesla-Style Design with Framer Motion
 *
 * Tabs:
 * 1. Brand Philosophy (브랜드 철학)
 * 2. Product Overview (제품 개요)
 * 3. Style Variations (스타일 변형)
 * 4. Premium Positioning (프리미엄 포지셔닝)
 * 5. Global Trends (글로벌 트렌드)
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// Types
// ============================================

type TabId = 'philosophy' | 'products' | 'styles' | 'premium' | 'trends';

interface Tab {
  id: TabId;
  label: string;
  labelKo: string;
  icon: React.ReactNode;
}

interface VRDTabsProps {
  defaultTab?: TabId;
  onTabChange?: (tabId: TabId) => void;
}

// ============================================
// Tab Configuration
// ============================================

const TABS: Tab[] = [
  {
    id: 'philosophy',
    label: 'Philosophy',
    labelKo: '브랜드 철학',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    id: 'products',
    label: 'Products',
    labelKo: '제품 개요',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 'styles',
    label: 'Styles',
    labelKo: '스타일 변형',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
  },
  {
    id: 'premium',
    label: 'Premium',
    labelKo: '프리미엄 포지셔닝',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    id: 'trends',
    label: 'Trends',
    labelKo: '글로벌 트렌드',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

// ============================================
// Animation Variants
// ============================================

const tabContentVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const underlineVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

// ============================================
// Main Component
// ============================================

export default function VRDTabs({ defaultTab = 'philosophy', onTabChange }: VRDTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);

  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  }, [onTabChange]);

  return (
    <div className="w-full bg-[#F9F9F7] min-h-screen">
      {/* Tab Navigation */}
      <nav className="sticky top-0 z-50 bg-[#F9F9F7]/95 backdrop-blur-md border-b border-[#171717]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center gap-1 py-4">
            {TABS.map((tab) => (
              <TabButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onClick={() => handleTabChange(tab.id)}
              />
            ))}
          </div>

          {/* Mobile Navigation - Horizontal Scroll */}
          <div className="md:hidden overflow-x-auto scrollbar-hide py-3">
            <div className="flex items-center gap-2 min-w-max px-2">
              {TABS.map((tab) => (
                <TabButtonMobile
                  key={tab.id}
                  tab={tab}
                  isActive={activeTab === tab.id}
                  onClick={() => handleTabChange(tab.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {activeTab === 'philosophy' && <PhilosophyContent />}
            {activeTab === 'products' && <ProductsContent />}
            {activeTab === 'styles' && <StylesContent />}
            {activeTab === 'premium' && <PremiumContent />}
            {activeTab === 'trends' && <TrendsContent />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// ============================================
// Tab Button Components
// ============================================

function TabButton({
  tab,
  isActive,
  onClick,
}: {
  tab: Tab;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-2 px-6 py-3 rounded-full
        transition-all duration-300 ease-out
        ${isActive
          ? 'text-[#171717]'
          : 'text-[#171717]/50 hover:text-[#171717]/80'
        }
      `}
    >
      <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
        {tab.icon}
      </span>
      <span className="font-medium text-sm tracking-wide">{tab.label}</span>
      <span className="text-xs text-[#171717]/40 hidden lg:inline">
        {tab.labelKo}
      </span>

      {/* Active Indicator */}
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-[#171717]/5 rounded-full -z-10"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}

      {/* Underline */}
      {isActive && (
        <motion.div
          variants={underlineVariants}
          initial="hidden"
          animate="visible"
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#171717] rounded-full"
        />
      )}
    </button>
  );
}

function TabButtonMobile({
  tab,
  isActive,
  onClick,
}: {
  tab: Tab;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 px-4 py-2 rounded-xl
        transition-all duration-300 min-w-[72px]
        ${isActive
          ? 'bg-[#171717] text-[#F9F9F7]'
          : 'bg-[#171717]/5 text-[#171717]/60'
        }
      `}
    >
      {tab.icon}
      <span className="text-[10px] font-medium whitespace-nowrap">{tab.labelKo}</span>
    </button>
  );
}

// ============================================
// Tab Content Components
// ============================================

function PhilosophyContent() {
  return (
    <section className="space-y-16">
      {/* Hero */}
      <div className="text-center space-y-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-light text-[#171717] tracking-tight"
        >
          Versatility · Restraint · Design
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-[#171717]/60 max-w-2xl mx-auto"
        >
          다용도성 · 절제 · 디자인
        </motion.p>
      </div>

      {/* Philosophy Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          {
            title: 'Versatility',
            titleKo: '다용도성',
            description: 'From studio to street, one piece adapts to every moment of your active life.',
            icon: '◇',
          },
          {
            title: 'Restraint',
            titleKo: '절제',
            description: 'Eliminating excess to reveal essential beauty. Less noise, more presence.',
            icon: '○',
          },
          {
            title: 'Design',
            titleKo: '디자인',
            description: 'Every stitch, every cut, every detail serves a purpose. Form follows function.',
            icon: '□',
          },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-3xl text-[#171717]/20 mb-4">{item.icon}</div>
            <h3 className="text-xl font-medium text-[#171717] mb-1">{item.title}</h3>
            <p className="text-sm text-[#171717]/40 mb-4">{item.titleKo}</p>
            <p className="text-[#171717]/60 leading-relaxed">{item.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Brand Statement */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-[#171717] text-[#F9F9F7] p-12 rounded-3xl text-center"
      >
        <blockquote className="text-2xl md:text-3xl font-light leading-relaxed max-w-3xl mx-auto">
          &ldquo;We don&apos;t follow trends. We design for the way you move, the way you live, the way you exist.&rdquo;
        </blockquote>
        <p className="mt-6 text-[#F9F9F7]/50 text-sm tracking-widest uppercase">
          Field Nine Design Studio
        </p>
      </motion.div>
    </section>
  );
}

function ProductsContent() {
  const products = [
    { name: 'Armor-Compression Leggings', category: 'Bottom', price: '₩89,000' },
    { name: 'Signature Support Sports Top', category: 'Top', price: '₩79,000' },
    { name: 'V-Taper Crop Sweat', category: 'Top', price: '₩119,000' },
    { name: 'Giant Overfit Tee', category: 'Top', price: '₩69,000' },
    { name: 'Technical Ethereal Windbreaker', category: 'Outerwear', price: '₩189,000' },
    { name: 'Aura Finisher Ballcap', category: 'Accessory', price: '₩49,000' },
  ];

  return (
    <section className="space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-light text-[#171717]">26SS Collection</h2>
        <p className="text-[#171717]/60">6 Essential Pieces for the Modern Athlete</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product, i) => (
          <motion.div
            key={product.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500"
          >
            <div className="aspect-[4/5] bg-gradient-to-br from-[#171717]/5 to-[#171717]/10 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl text-[#171717]/10">VRD</span>
              </div>
              <div className="absolute top-4 left-4">
                <span className="text-xs px-3 py-1 bg-[#171717] text-[#F9F9F7] rounded-full">
                  {product.category}
                </span>
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-medium text-[#171717] mb-2 group-hover:text-[#171717]/80 transition-colors">
                {product.name}
              </h3>
              <p className="text-[#171717]/60">{product.price}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function StylesContent() {
  const colorPalette = [
    { name: 'Jet Black', code: '#1a1a1a', tcx: '19-0303 TCX' },
    { name: 'Deep Charcoal', code: '#33363a', tcx: '19-4008 TCX' },
    { name: 'Steel Blue', code: '#5d7d9a', tcx: '18-4214 TCX' },
    { name: 'Sand Ivory', code: '#ece7e0', tcx: '11-0105 TCX' },
    { name: 'Light Gray', code: '#c0c8cf', tcx: '14-4102 TCX' },
  ];

  return (
    <section className="space-y-16">
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-light text-[#171717]">Style Variations</h2>
        <p className="text-[#171717]/60">Curated Color Palette for Effortless Coordination</p>
      </div>

      {/* Color Palette */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {colorPalette.map((color, i) => (
          <motion.div
            key={color.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="group"
          >
            <div
              className="aspect-square rounded-2xl shadow-sm group-hover:shadow-md transition-shadow mb-3"
              style={{ backgroundColor: color.code }}
            />
            <p className="font-medium text-sm text-[#171717]">{color.name}</p>
            <p className="text-xs text-[#171717]/40">{color.tcx}</p>
          </motion.div>
        ))}
      </div>

      {/* Style Combinations */}
      <div className="bg-white p-8 rounded-3xl">
        <h3 className="text-xl font-medium text-[#171717] mb-6">Recommended Combinations</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'Monochrome Power', colors: ['#1a1a1a', '#33363a'] },
            { name: 'Studio Essential', colors: ['#ece7e0', '#1a1a1a'] },
            { name: 'Urban Contrast', colors: ['#5d7d9a', '#ece7e0'] },
          ].map((combo, i) => (
            <motion.div
              key={combo.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="p-4 border border-[#171717]/10 rounded-xl"
            >
              <div className="flex gap-2 mb-3">
                {combo.colors.map((c) => (
                  <div
                    key={c}
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <p className="font-medium text-sm text-[#171717]">{combo.name}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PremiumContent() {
  return (
    <section className="space-y-16">
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-light text-[#171717]">Premium Positioning</h2>
        <p className="text-[#171717]/60">Why VRD Commands a Premium</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {[
          {
            title: 'Material Excellence',
            description: 'Italian-sourced fabrics with proprietary compression technology',
            stat: '300gsm',
            statLabel: 'Premium Cotton Weight',
          },
          {
            title: 'Limited Production',
            description: 'Small batch manufacturing ensures exclusivity and quality control',
            stat: '500',
            statLabel: 'Units per Style',
          },
          {
            title: 'Artisan Craftsmanship',
            description: 'Hand-finished details by experienced garment technicians',
            stat: '12',
            statLabel: 'Quality Checkpoints',
          },
          {
            title: 'Sustainable Practice',
            description: 'Eco-conscious production with minimal waste philosophy',
            stat: '85%',
            statLabel: 'Recycled Packaging',
          },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="bg-white p-8 rounded-2xl border border-[#171717]/5"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-medium text-[#171717]">{item.title}</h3>
              <div className="text-right">
                <p className="text-2xl font-light text-[#171717]">{item.stat}</p>
                <p className="text-xs text-[#171717]/40">{item.statLabel}</p>
              </div>
            </div>
            <p className="text-[#171717]/60">{item.description}</p>
          </motion.div>
        ))}
      </div>

      {/* UX Features */}
      <div className="bg-gradient-to-br from-[#171717] to-[#33363a] p-10 rounded-3xl text-[#F9F9F7]">
        <h3 className="text-2xl font-light mb-8 text-center">VRD Experience</h3>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: '✦', title: '향기 브랜딩', desc: 'Signature scent in every package' },
            { icon: '◈', title: 'THE LINE', desc: 'Digital care journal & styling guide' },
            { icon: '◉', title: 'VRD CLUB', desc: 'Members-only drops & events' },
          ].map((feature) => (
            <div key={feature.title} className="text-center">
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h4 className="font-medium mb-2">{feature.title}</h4>
              <p className="text-[#F9F9F7]/60 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrendsContent() {
  return (
    <section className="space-y-16">
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-light text-[#171717]">Global Trends</h2>
        <p className="text-[#171717]/60">Where VRD 26SS Sits in the Market</p>
      </div>

      {/* Trend Analysis */}
      <div className="grid md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl"
        >
          <h3 className="text-xl font-medium text-[#171717] mb-6">Key Market Movements</h3>
          <ul className="space-y-4">
            {[
              'Athleisure-to-Luxleisure evolution',
              'Technical fabrics in everyday wear',
              'Minimalist aesthetics gaining momentum',
              'Gender-fluid sizing demand increase',
              'Sustainable production as baseline',
            ].map((trend, i) => (
              <motion.li
                key={trend}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3 text-[#171717]/70"
              >
                <span className="w-1.5 h-1.5 bg-[#171717] rounded-full" />
                {trend}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-8 rounded-2xl"
        >
          <h3 className="text-xl font-medium text-[#171717] mb-6">VRD Market Position</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#171717]/60">Price Position</span>
                <span className="font-medium">Premium Mid-Range</span>
              </div>
              <div className="h-2 bg-[#171717]/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '70%' }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="h-full bg-[#171717] rounded-full"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#171717]/60">Quality Index</span>
                <span className="font-medium">Top 10%</span>
              </div>
              <div className="h-2 bg-[#171717]/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '90%' }}
                  transition={{ delay: 0.6, duration: 1 }}
                  className="h-full bg-[#171717] rounded-full"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#171717]/60">Trend Alignment</span>
                <span className="font-medium">Strong</span>
              </div>
              <div className="h-2 bg-[#171717]/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  transition={{ delay: 0.7, duration: 1 }}
                  className="h-full bg-[#171717] rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Global Reach */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="bg-[#171717] text-[#F9F9F7] p-10 rounded-3xl"
      >
        <div className="text-center mb-8">
          <h3 className="text-2xl font-light">Global Shipping</h3>
          <p className="text-[#F9F9F7]/60 mt-2">Available in 15+ countries</p>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4 text-center">
          {['Korea', 'Japan', 'USA', 'UK', 'Germany', 'France', 'Australia', 'Singapore', 'Canada', 'UAE'].map((country) => (
            <div key={country} className="text-sm text-[#F9F9F7]/80">
              {country}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
