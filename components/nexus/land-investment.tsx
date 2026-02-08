/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 49: YEONGDONG LAND RWA INVESTMENT UI
 * ═══════════════════════════════════════════════════════════════════════════════
 * Digital Tiles 시각화 + KAUS 구매
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  YEONGDONG_LAND,
  TILE_CONFIG,
  getTilePrice,
  calculateYield,
  calculateYieldInKaus,
  getLandStats,
  getUserDividends,
} from '@/lib/rwa/land-tokenization';

// ============================================
// Tile Grid Visualizer
// ============================================

interface TileGridProps {
  onTileSelect: (x: number, y: number) => void;
  selectedTile: { x: number; y: number } | null;
}

export function TileGridVisualizer({ onTileSelect, selectedTile }: TileGridProps) {
  const gridSize = 50; // Simplified 50x50 view (represents 100x100 actual)

  // Generate ownership pattern
  const ownedTiles = useMemo(() => {
    const owned = new Set<string>();
    for (let i = 0; i < 200; i++) { // 8% sold
      const x = Math.floor(Math.random() * gridSize);
      const y = Math.floor(Math.random() * gridSize);
      owned.add(`${x}-${y}`);
    }
    return owned;
  }, []);

  // Solar intensity based on position
  const getSolarIntensity = useCallback((x: number, y: number) => {
    const distFromCenter = Math.sqrt(Math.pow(x - 25, 2) + Math.pow(y - 25, 2));
    return 1 - (distFromCenter / 35) * 0.4;
  }, []);

  return (
    <div className="relative">
      {/* Grid Container */}
      <div
        className="w-full aspect-square bg-[#171717] rounded-xl p-2 overflow-hidden"
        style={{ maxHeight: '400px' }}
      >
        <div
          className="grid gap-px h-full w-full"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          }}
        >
          {Array.from({ length: gridSize * gridSize }, (_, i) => {
            const x = i % gridSize;
            const y = Math.floor(i / gridSize);
            const isOwned = ownedTiles.has(`${x}-${y}`);
            const isSelected = selectedTile?.x === x && selectedTile?.y === y;
            const solarIntensity = getSolarIntensity(x, y);

            return (
              <motion.div
                key={`${x}-${y}`}
                whileHover={{ scale: 1.5, zIndex: 10 }}
                onClick={() => !isOwned && onTileSelect(x, y)}
                className={`cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-amber-500'
                    : isOwned
                    ? 'bg-cyan-500/60'
                    : `bg-emerald-500`
                }`}
                style={{
                  opacity: isOwned ? 0.6 : 0.3 + solarIntensity * 0.7,
                }}
                title={`Tile (${x}, ${y}) - ${isOwned ? 'Owned' : 'Available'}`}
              />
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-500 rounded" />
          <span className="text-xs text-[#171717]/60">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-cyan-500/60 rounded" />
          <span className="text-xs text-[#171717]/60">Owned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-500 rounded" />
          <span className="text-xs text-[#171717]/60">Selected</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Land Investment Section
// ============================================

export function LandInvestmentSection() {
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);
  const [tileCount, setTileCount] = useState(1);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const stats = getLandStats();
  const price = getTilePrice(tileCount);
  const yieldUsd = calculateYield(tileCount);
  const yieldKaus = calculateYieldInKaus(tileCount);

  const handleTileSelect = (x: number, y: number) => {
    setSelectedTile({ x, y });
  };

  const handlePurchase = async () => {
    setShowPurchaseModal(true);
    // Would integrate with payment API here
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-900 to-cyan-900 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
              <span className="text-3xl">🏞️</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Yeongdong Land RWA</h2>
              <p className="text-white/60 text-sm">Real-World Asset Tokenization</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-amber-400">
              {YEONGDONG_LAND.apy}% APY
            </div>
            <div className="text-white/50 text-sm">Solar Energy Yield</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-emerald-400">
              {YEONGDONG_LAND.totalArea.toLocaleString()}평
            </div>
            <div className="text-xs text-white/50">Total Area</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-cyan-400">
              ${(YEONGDONG_LAND.currentValue / 1000000).toFixed(0)}M
            </div>
            <div className="text-xs text-white/50">Current Value</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-amber-400">
              {stats.totalInvestors}
            </div>
            <div className="text-xs text-white/50">Investors</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-xl font-black">
              {((stats.ownedTiles / stats.totalTiles) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-white/50">Sold</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tile Grid */}
        <div className="bg-white rounded-2xl p-6 border border-[#171717]/10">
          <h3 className="font-bold text-[#171717] mb-4">Digital Land Tiles</h3>
          <p className="text-sm text-[#171717]/60 mb-4">
            Click on an available tile to select. Each tile = 10평 (33m²)
          </p>
          <TileGridVisualizer
            onTileSelect={handleTileSelect}
            selectedTile={selectedTile}
          />
        </div>

        {/* Purchase Panel */}
        <div className="bg-[#171717] rounded-2xl p-6 text-white">
          <h3 className="font-bold mb-4">Purchase Land Tiles</h3>

          {selectedTile && (
            <div className="mb-4 p-3 bg-amber-500/20 rounded-xl border border-amber-500/30">
              <div className="flex items-center gap-2">
                <span className="text-amber-400">📍</span>
                <span className="text-sm">
                  Selected: Tile ({selectedTile.x}, {selectedTile.y})
                </span>
              </div>
            </div>
          )}

          {/* Tile Count */}
          <div className="mb-4">
            <label className="text-xs text-white/50 mb-2 block">Number of Tiles</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTileCount(Math.max(1, tileCount - 1))}
                className="w-10 h-10 bg-white/10 rounded-lg hover:bg-white/20 text-xl"
              >
                −
              </button>
              <input
                type="number"
                value={tileCount}
                onChange={e => setTileCount(Math.min(100, Math.max(1, Number(e.target.value))))}
                className="flex-1 p-3 bg-white/10 rounded-xl text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                min={1}
                max={100}
              />
              <button
                onClick={() => setTileCount(Math.min(100, tileCount + 1))}
                className="w-10 h-10 bg-white/10 rounded-lg hover:bg-white/20 text-xl"
              >
                +
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              {[1, 5, 10, 25, 50].map(val => (
                <button
                  key={val}
                  onClick={() => setTileCount(val)}
                  className={`flex-1 py-1 text-xs rounded-lg transition-colors ${
                    tileCount === val ? 'bg-amber-500' : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-white/50">Area</span>
              <span>{(tileCount * TILE_CONFIG.pyeongPerTile).toLocaleString()}평</span>
            </div>
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-white/50">Price per 평</span>
              <span>${YEONGDONG_LAND.pricePerPyeong.toLocaleString()}</span>
            </div>
            <div className="border-t border-white/10 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-bold">Total</span>
                <div className="text-right">
                  <div className="text-xl font-black text-amber-400">
                    {price.kaus.toLocaleString()} KAUS
                  </div>
                  <div className="text-xs text-white/50">
                    ${price.usd.toLocaleString()} USD
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Yield Projection */}
          <div className="bg-emerald-500/10 rounded-xl p-4 mb-4 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-emerald-400">📊</span>
              <span className="font-bold text-emerald-400">Expected Yield ({YEONGDONG_LAND.apy}% APY)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  ${yieldUsd.monthly.toFixed(2)}/mo
                </div>
                <div className="text-xs text-white/50">Monthly (USD)</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-amber-400">
                  {Math.round(yieldKaus.monthly).toLocaleString()} KAUS
                </div>
                <div className="text-xs text-white/50">Monthly (KAUS)</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 text-center">
              <div className="text-2xl font-black text-emerald-400">
                ${yieldUsd.yearly.toFixed(0)}/year
              </div>
              <div className="text-xs text-white/50">Projected Annual Return</div>
            </div>
          </div>

          {/* Purchase Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePurchase}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-bold text-lg"
          >
            Purchase {tileCount} Tile{tileCount > 1 ? 's' : ''} with KAUS
          </motion.button>

          {/* Trust Badge */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/40">
            <span>🏛️</span>
            <span>Backed by Real Land Title • Verified by Korean Law</span>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      <AnimatePresence>
        {showPurchaseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={() => setShowPurchaseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#171717] rounded-2xl p-8 max-w-md w-full mx-4 text-white"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold mb-2">Purchase Initiated!</h3>
                <p className="text-white/60 mb-6">
                  Your land tile purchase of {tileCount} tile{tileCount > 1 ? 's' : ''} ({(tileCount * 10).toLocaleString()}평) is being processed.
                </p>
                <div className="bg-white/5 rounded-xl p-4 mb-6">
                  <div className="text-2xl font-black text-amber-400">
                    {price.kaus.toLocaleString()} KAUS
                  </div>
                  <div className="text-sm text-white/50">
                    Expected Yield: ${yieldUsd.yearly.toFixed(0)}/year
                  </div>
                </div>
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="w-full py-3 bg-amber-500 rounded-xl font-bold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// Dividend Widget (for Wallet)
// ============================================

interface DividendWidgetProps {
  tilesOwned?: number;
}

export function DividendWidget({ tilesOwned = 5 }: DividendWidgetProps) {
  const dividends = getUserDividends('current-user', tilesOwned);
  const nextDistDate = new Date(dividends.nextDistribution);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-6 border border-amber-500/20"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
            <span className="text-2xl">💰</span>
          </div>
          <div>
            <h3 className="font-bold text-[#171717]">Expected Dividends</h3>
            <p className="text-xs text-[#171717]/50">From AI Auto-Pilot + Land Yield</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
          EARNING
        </div>
      </div>

      {/* Pending Dividend */}
      <div className="bg-white rounded-xl p-4 mb-4">
        <div className="text-xs text-[#171717]/50 mb-1">Pending Dividend</div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-emerald-600">
            ${dividends.pendingDividend.toFixed(2)}
          </span>
          <span className="text-[#171717]/50">
            (~{Math.round(dividends.pendingDividend / 0.09).toLocaleString()} KAUS)
          </span>
        </div>
        <div className="text-xs text-[#171717]/40 mt-1">
          Accrued since last distribution
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-amber-600">
            ${dividends.projectedMonthly.toFixed(0)}/mo
          </div>
          <div className="text-xs text-[#171717]/50">Monthly</div>
        </div>
        <div className="bg-white rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-emerald-600">
            ${dividends.projectedYearly.toFixed(0)}/yr
          </div>
          <div className="text-xs text-[#171717]/50">Yearly</div>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="bg-white/50 rounded-xl p-3">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[#171717]/50">Your Holdings</span>
          <span className="font-bold">{tilesOwned} Tiles ({dividends.pyeongOwned}평)</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[#171717]/50">Investment Value</span>
          <span className="font-bold">${dividends.investmentValue.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#171717]/50">Total Claimed</span>
          <span className="font-bold text-emerald-600">${dividends.claimedDividend.toFixed(0)}</span>
        </div>
      </div>

      {/* Next Distribution */}
      <div className="mt-4 pt-4 border-t border-[#171717]/10 flex items-center justify-between text-xs">
        <span className="text-[#171717]/50">Next Distribution</span>
        <span className="font-bold text-[#171717]">
          {nextDistDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </motion.div>
  );
}
