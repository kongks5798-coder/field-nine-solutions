'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 52: SMART TRADING TERMINAL PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Professional trading interface with advanced order types
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FinancialSidebar, PriceTicker, MembershipBar } from '@/components/nexus/financial-terminal';
import { MobileBottomNav, MobileHeader } from '@/components/nexus/mobile-nav';
import {
  AdvancedOrderForm,
  OrderBookWidget,
  PositionsList,
  OpenOrdersList,
  RecentTradesWidget,
  TradingStatsWidget,
  AssetSelector,
} from '@/components/nexus/smart-trading-terminal';
import { SmartOrders } from '@/lib/trading/smart-orders';

type TerminalView = 'trade' | 'positions' | 'orders' | 'history';

export default function TradingTerminalPage() {
  const [selectedAsset, setSelectedAsset] = useState('KAUS');
  const [activeView, setActiveView] = useState<TerminalView>('trade');
  const [lastPrice, setLastPrice] = useState(120);
  const [priceChange, setPriceChange] = useState(2.5);

  useEffect(() => {
    // Simulate price updates
    const interval = setInterval(() => {
      const asset = SmartOrders.ASSETS.find(a => a.id === selectedAsset);
      if (asset) {
        const newPrice = asset.basePrice * (1 + (Math.random() * 0.02 - 0.01));
        const change = ((newPrice - asset.basePrice) / asset.basePrice) * 100;
        setLastPrice(Math.round(newPrice * 100) / 100);
        setPriceChange(Math.round(change * 100) / 100);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedAsset]);

  const views = [
    { id: 'trade', label: 'Trade', icon: '📊' },
    { id: 'positions', label: 'Positions', icon: '💼' },
    { id: 'orders', label: 'Orders', icon: '📋' },
    { id: 'history', label: 'History', icon: '📜' },
  ];

  const currentAsset = SmartOrders.ASSETS.find(a => a.id === selectedAsset);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Desktop: Financial Terminal Sidebar */}
      <div className="hidden md:block">
        <FinancialSidebar />
      </div>

      {/* Mobile: Header */}
      <div className="md:hidden">
        <MobileHeader title="Trading Terminal" />
      </div>

      <div className="md:ml-56">
        {/* Desktop Only */}
        <div className="hidden md:block">
          <PriceTicker />
          <MembershipBar />
        </div>

        <main className="p-4 md:p-6 pb-24 md:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{currentAsset?.icon}</span>
                  <div>
                    <h1 className="text-2xl font-bold text-white">{currentAsset?.name}</h1>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white">₩{lastPrice.toLocaleString()}</span>
                      <span className={`text-sm font-medium ${priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {priceChange >= 0 ? '+' : ''}{priceChange}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Indicator */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 rounded-full">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-2 h-2 rounded-full bg-emerald-500"
                  />
                  <span className="text-emerald-400 text-sm font-medium">LIVE</span>
                </div>
              </div>

              {/* Asset Selector */}
              <AssetSelector selectedAsset={selectedAsset} onSelect={setSelectedAsset} />
            </motion.div>

            {/* View Tabs - Mobile Only */}
            <div className="flex gap-2 mb-4 md:hidden overflow-x-auto pb-2">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id as TerminalView)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${
                    activeView === view.id
                      ? 'bg-violet-500 text-white'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  <span>{view.icon}</span>
                  <span>{view.label}</span>
                </button>
              ))}
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:grid md:grid-cols-12 gap-4">
              {/* Left: Order Book */}
              <div className="col-span-3">
                <OrderBookWidget assetId={selectedAsset} />
              </div>

              {/* Center: Order Form & Stats */}
              <div className="col-span-5 space-y-4">
                <AdvancedOrderForm selectedAsset={selectedAsset} />
                <TradingStatsWidget />
              </div>

              {/* Right: Trades & Orders */}
              <div className="col-span-4 space-y-4">
                <RecentTradesWidget assetId={selectedAsset} />
                <OpenOrdersList />
              </div>
            </div>

            {/* Positions - Desktop */}
            <div className="hidden md:block mt-6">
              <PositionsList />
            </div>

            {/* Mobile Layout - View Based */}
            <div className="md:hidden">
              {activeView === 'trade' && (
                <div className="space-y-4">
                  <AdvancedOrderForm selectedAsset={selectedAsset} />
                  <OrderBookWidget assetId={selectedAsset} />
                  <RecentTradesWidget assetId={selectedAsset} />
                </div>
              )}

              {activeView === 'positions' && (
                <div className="space-y-4">
                  <TradingStatsWidget />
                  <PositionsList />
                </div>
              )}

              {activeView === 'orders' && (
                <div className="space-y-4">
                  <OpenOrdersList />
                </div>
              )}

              {activeView === 'history' && (
                <div className="space-y-4">
                  <TradingStatsWidget />
                  <RecentTradesWidget assetId={selectedAsset} />
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 p-4 bg-neutral-900/50 rounded-xl border border-neutral-800"
            >
              <p className="text-neutral-500 text-xs text-center">
                ⚠️ 이 거래 시스템은 데모 목적으로 제공됩니다. 실제 자산 거래 시 손실이 발생할 수 있습니다.
                투자 결정은 본인의 책임 하에 이루어져야 합니다.
              </p>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Mobile: Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
