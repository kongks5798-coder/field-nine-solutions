'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 46: ENERGY SWAP WIDGET
 * ═══════════════════════════════════════════════════════════════════════════════
 * Wind, Thermal, Solar 에너지원 간 KAUS 스왑 위젯
 * Design: Warm Ivory (#F9F9F7) + Deep Black (#171717)
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ENERGY_SOURCES,
  type EnergySource,
} from '@/lib/energy/sources';
import {
  getEnergySwapQuote,
  getSourceLiveData,
  getIntegratedAssetData,
  type EnergySwapQuote,
  type MultiSourceLiveData,
  type IntegratedAssetData,
} from '@/lib/energy/multi-source';

// ═══════════════════════════════════════════════════════════════════════════════
// ENERGY SWAP WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

export function EnergySwapWidget() {
  const [fromSource, setFromSource] = useState<string>('F9-SOLAR-001');
  const [toSource, setToSource] = useState<string>('F9-WIND-001');
  const [amount, setAmount] = useState<number>(10000);
  const [quote, setQuote] = useState<EnergySwapQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showSourcePicker, setShowSourcePicker] = useState<'from' | 'to' | null>(null);
  const [countdown, setCountdown] = useState(30);

  const sources = Object.values(ENERGY_SOURCES);
  const fromSourceData = ENERGY_SOURCES[fromSource];
  const toSourceData = ENERGY_SOURCES[toSource];

  // Get swap quote
  const fetchQuote = useCallback(() => {
    if (fromSource === toSource || amount <= 0) return;

    setIsLoading(true);
    try {
      const newQuote = getEnergySwapQuote(fromSource, toSource, amount);
      setQuote(newQuote);
      setCountdown(30);
    } catch (error) {
      console.error('Failed to get swap quote:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fromSource, toSource, amount]);

  // Update quote periodically
  useEffect(() => {
    fetchQuote();
    const interval = setInterval(fetchQuote, 30000);
    return () => clearInterval(interval);
  }, [fetchQuote]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchQuote();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [fetchQuote]);

  // Swap sources
  const handleSwapSources = () => {
    setFromSource(toSource);
    setToSource(fromSource);
  };

  // Execute swap
  const handleSwap = async () => {
    if (!quote) return;

    setIsSwapping(true);
    try {
      // Simulate swap execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`Swap Complete!\n${amount.toLocaleString()} kWh ${fromSourceData.type} -> ${quote.toAmount.toLocaleString()} kWh ${toSourceData.type}`);
    } catch (error) {
      console.error('Swap failed:', error);
      alert('Swap failed. Please try again.');
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="bg-[#F9F9F7] rounded-2xl border border-[#171717]/10 overflow-hidden">
      {/* Header */}
      <div className="bg-[#171717] text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-xl">⚡</span>
            </div>
            <div>
              <h3 className="font-bold">Energy Swap</h3>
              <p className="text-white/60 text-xs">Multi-Source Brokerage</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-white/60">LIVE</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* From Source */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#171717]/60">From</span>
            <span className="text-xs text-[#171717]/60">
              Balance: 500,000 kWh
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#171717]/10">
            <button
              onClick={() => setShowSourcePicker('from')}
              className="flex items-center gap-2 px-3 py-2 bg-[#171717] text-white rounded-lg hover:bg-[#171717]/90 transition-colors"
            >
              <span className="text-lg">{fromSourceData.metadata.icon}</span>
              <span className="font-bold text-sm">{fromSourceData.type}</span>
              <span className="text-white/60">▼</span>
            </button>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="flex-1 text-right font-mono text-lg font-bold bg-transparent outline-none"
              min={100}
              step={100}
            />
            <span className="text-[#171717]/60 text-sm">kWh</span>
          </div>
          {/* Quick Amount Buttons */}
          <div className="flex gap-2">
            {[10000, 50000, 100000, 500000].map(val => (
              <button
                key={val}
                onClick={() => setAmount(val)}
                className="flex-1 py-1.5 text-xs bg-[#171717]/5 rounded-lg hover:bg-[#171717]/10 transition-colors"
              >
                {(val / 1000)}K
              </button>
            ))}
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSwapSources}
            className="w-10 h-10 bg-[#171717] text-white rounded-full flex items-center justify-center shadow-lg"
          >
            <span className="text-lg">⇅</span>
          </motion.button>
        </div>

        {/* To Source */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#171717]/60">To</span>
            <span className="text-xs text-[#171717]/60">
              Rate: {quote?.exchangeRate.toFixed(3) || '...'} {toSourceData.type}/{fromSourceData.type}
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#171717]/10">
            <button
              onClick={() => setShowSourcePicker('to')}
              className="flex items-center gap-2 px-3 py-2 bg-[#171717] text-white rounded-lg hover:bg-[#171717]/90 transition-colors"
            >
              <span className="text-lg">{toSourceData.metadata.icon}</span>
              <span className="font-bold text-sm">{toSourceData.type}</span>
              <span className="text-white/60">▼</span>
            </button>
            <div className="flex-1 text-right font-mono text-lg font-bold">
              {isLoading ? '...' : quote?.toAmount.toLocaleString() || '0'}
            </div>
            <span className="text-[#171717]/60 text-sm">kWh</span>
          </div>
        </div>

        {/* Quote Details */}
        {quote && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-[#171717]/5 rounded-xl space-y-3"
          >
            {/* Price Info */}
            <div className="flex justify-between text-sm">
              <span className="text-[#171717]/60">{fromSourceData.type} Price</span>
              <span className="font-mono font-bold">{quote.fromPriceKAUS.toFixed(4)} KAUS/kWh</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#171717]/60">{toSourceData.type} Price</span>
              <span className="font-mono font-bold">{quote.toPriceKAUS.toFixed(4)} KAUS/kWh</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#171717]/60">Slippage</span>
              <span className="font-mono">{quote.slippage.toFixed(2)}%</span>
            </div>

            <div className="border-t border-[#171717]/10 pt-3">
              {/* Carbon Impact */}
              <div className="flex items-center justify-between">
                <span className="text-[#171717]/60 text-sm">Carbon Impact</span>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                  quote.esgImpact === 'POSITIVE' ? 'bg-emerald-100 text-emerald-700' :
                  quote.esgImpact === 'NEGATIVE' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {quote.esgImpact === 'POSITIVE' ? '↓' : quote.esgImpact === 'NEGATIVE' ? '↑' : '—'}
                  {Math.abs(quote.carbonDelta).toLocaleString()} gCO2
                </div>
              </div>

              {/* Total Cost */}
              <div className="flex justify-between mt-3">
                <span className="font-bold">Total Cost</span>
                <span className="font-bold text-lg text-amber-600">
                  {quote.totalCostKAUS.toLocaleString()} KAUS
                </span>
              </div>
            </div>

            {/* Quote Timer */}
            <div className="flex items-center justify-center gap-2 text-xs text-[#171717]/50">
              <span>Quote expires in</span>
              <span className="font-mono font-bold text-[#171717]">{countdown}s</span>
              <button onClick={fetchQuote} className="text-amber-600 hover:underline">
                Refresh
              </button>
            </div>
          </motion.div>
        )}

        {/* Swap Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSwap}
          disabled={!quote || isSwapping || fromSource === toSource}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSwapping ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                ⏳
              </motion.span>
              Processing Swap...
            </span>
          ) : (
            `Swap ${fromSourceData.type} → ${toSourceData.type}`
          )}
        </motion.button>
      </div>

      {/* Source Picker Modal */}
      <AnimatePresence>
        {showSourcePicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowSourcePicker(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#F9F9F7] rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto"
            >
              <div className="w-12 h-1 bg-[#171717]/20 rounded-full mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-4">Select Energy Source</h3>
              <div className="space-y-2">
                {sources.map(source => {
                  const isSelected = showSourcePicker === 'from'
                    ? source.id === fromSource
                    : source.id === toSource;
                  const isDisabled = showSourcePicker === 'from'
                    ? source.id === toSource
                    : source.id === fromSource;

                  return (
                    <button
                      key={source.id}
                      onClick={() => {
                        if (showSourcePicker === 'from') {
                          setFromSource(source.id);
                        } else {
                          setToSource(source.id);
                        }
                        setShowSourcePicker(null);
                      }}
                      disabled={isDisabled}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-[#171717] text-white'
                          : isDisabled
                          ? 'bg-[#171717]/5 opacity-50 cursor-not-allowed'
                          : 'bg-white hover:bg-[#171717]/5 border border-[#171717]/10'
                      }`}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${source.metadata.gradientFrom}, ${source.metadata.gradientTo})`,
                        }}
                      >
                        <span className="text-2xl">{source.metadata.icon}</span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-bold">{source.type}</div>
                        <div className={`text-sm ${isSelected ? 'text-white/60' : 'text-[#171717]/60'}`}>
                          {source.nameKo}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono font-bold ${isSelected ? 'text-white' : ''}`}>
                          {source.pricing.kausPrice.toFixed(3)}
                        </div>
                        <div className={`text-xs ${
                          isSelected ? 'text-white/60' :
                          source.pricing.priceChange24h >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {source.pricing.priceChange24h >= 0 ? '+' : ''}
                          {source.pricing.priceChange24h.toFixed(1)}%
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATED ASSET WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

export function IntegratedAssetWidget() {
  const [assetData, setAssetData] = useState<IntegratedAssetData | null>(null);

  useEffect(() => {
    const fetchData = () => {
      const data = getIntegratedAssetData();
      setAssetData(data);
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!assetData) {
    return (
      <div className="bg-[#F9F9F7] rounded-2xl p-6 border border-[#171717]/10 animate-pulse">
        <div className="h-6 bg-[#171717]/10 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-20 bg-[#171717]/10 rounded-xl" />
          <div className="h-20 bg-[#171717]/10 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F9F9F7] rounded-2xl border border-[#171717]/10 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-xl">🏛️</span>
            </div>
            <div>
              <h3 className="font-bold">Integrated Assets</h3>
              <p className="text-white/80 text-xs">Physical + Digital</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/60">Synergy Bonus</div>
            <div className="font-bold text-lg">+{assetData.combined.synergyBonus}%</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Yeongdong Solar */}
        <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">☀️</span>
              <div>
                <div className="font-bold text-sm">{assetData.yeongdong.name}</div>
                <div className="text-xs text-[#171717]/60">
                  {assetData.yeongdong.areaPyung.toLocaleString()}평
                </div>
              </div>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              assetData.yeongdong.isConnected
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                assetData.yeongdong.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
              }`} />
              {assetData.yeongdong.isConnected ? 'LIVE' : 'OFFLINE'}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-amber-600">
                {assetData.yeongdong.currentOutput} MW
              </div>
              <div className="text-xs text-[#171717]/60">Output</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">
                {assetData.yeongdong.dailyGeneration} MWh
              </div>
              <div className="text-xs text-[#171717]/60">Daily</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-600">
                {assetData.yeongdong.carbonOffset} tCO2
              </div>
              <div className="text-xs text-[#171717]/60">Offset</div>
            </div>
          </div>
        </div>

        {/* Cybertruck V2G */}
        <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚗</span>
              <div>
                <div className="font-bold text-sm">{assetData.cybertruck.name}</div>
                <div className="text-xs text-[#171717]/60">V2G Ready</div>
              </div>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              assetData.cybertruck.isV2GActive
                ? 'bg-cyan-100 text-cyan-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                assetData.cybertruck.isV2GActive ? 'bg-cyan-500 animate-pulse' : 'bg-gray-400'
              }`} />
              {assetData.cybertruck.isV2GActive ? 'V2G ACTIVE' : 'STANDBY'}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-cyan-600">
                {assetData.cybertruck.currentSoC}%
              </div>
              <div className="text-xs text-[#171717]/60">SoC</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">
                {assetData.cybertruck.batteryCapacity} kWh
              </div>
              <div className="text-xs text-[#171717]/60">Capacity</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-600">
                ₩{(assetData.cybertruck.lifetimeEarnings / 10000).toFixed(0)}만
              </div>
              <div className="text-xs text-[#171717]/60">Lifetime</div>
            </div>
          </div>
        </div>

        {/* Combined Stats */}
        <div className="p-4 bg-[#171717] text-white rounded-xl">
          <div className="text-xs text-white/60 mb-2">Combined Daily Revenue</div>
          <div className="text-2xl font-black">
            ₩{assetData.combined.totalDailyRevenue.toLocaleString()}
          </div>
          <div className="text-xs text-white/60">
            = ${Math.round(assetData.combined.totalDailyRevenue / 1350).toLocaleString()} USD
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI-SOURCE PRICE TICKER
// ═══════════════════════════════════════════════════════════════════════════════

export function MultiSourcePriceTicker() {
  const [liveData, setLiveData] = useState<MultiSourceLiveData[]>([]);

  useEffect(() => {
    const fetchData = () => {
      const data = Object.keys(ENERGY_SOURCES).map(id => getSourceLiveData(id));
      setLiveData(data);
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-x-auto scrollbar-hide py-2">
      <div className="flex gap-3 min-w-max px-4">
        {liveData.map(source => (
          <motion.div
            key={source.sourceId}
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-[#171717]/10 cursor-pointer"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${source.metadata.gradientFrom}, ${source.metadata.gradientTo})`,
              }}
            >
              <span className="text-xl">{source.metadata.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{source.sourceType}</span>
                {source.carbon.re100Eligible && (
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">
                    RE100
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">
                  {source.pricing.kausPrice.toFixed(3)} K
                </span>
                <span className={`text-xs ${
                  source.pricing.priceChange24h >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {source.pricing.priceChange24h >= 0 ? '+' : ''}
                  {source.pricing.priceChange24h.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-right ml-2">
              <div className="text-xs text-[#171717]/50">Output</div>
              <div className="font-mono text-sm">{source.supply.currentOutput} MW</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
