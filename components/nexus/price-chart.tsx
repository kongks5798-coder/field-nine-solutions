'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 62: REAL-TIME PRICE CHARTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * KAUS 및 에너지 가격 실시간 차트
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface PricePoint {
  timestamp: number;
  price: number;
  volume?: number;
}

interface ChartData {
  time: string;
  price: number;
  volume?: number;
}

type TimeRange = '1H' | '24H' | '7D' | '30D' | '1Y';

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

function generateMockPriceData(
  basePrice: number,
  points: number,
  volatility: number = 0.02
): PricePoint[] {
  const data: PricePoint[] = [];
  let currentPrice = basePrice;
  const now = Date.now();
  const interval = (24 * 60 * 60 * 1000) / points; // Spread across 24h

  for (let i = points - 1; i >= 0; i--) {
    const change = (Math.random() - 0.5) * 2 * volatility * currentPrice;
    currentPrice = Math.max(currentPrice + change, basePrice * 0.8);
    currentPrice = Math.min(currentPrice, basePrice * 1.2);

    data.push({
      timestamp: now - i * interval,
      price: currentPrice,
      volume: Math.random() * 1000000 + 500000,
    });
  }

  return data;
}

function formatChartData(data: PricePoint[], range: TimeRange): ChartData[] {
  return data.map((point) => {
    let timeFormat: string;
    const date = new Date(point.timestamp);

    switch (range) {
      case '1H':
        timeFormat = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        break;
      case '24H':
        timeFormat = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        break;
      case '7D':
        timeFormat = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
        break;
      case '30D':
        timeFormat = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
        break;
      case '1Y':
        timeFormat = date.toLocaleDateString('ko-KR', { month: 'short' });
        break;
      default:
        timeFormat = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }

    return {
      time: timeFormat,
      price: Math.round(point.price * 100) / 100,
      volume: point.volume,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// KAUS PRICE CHART
// ═══════════════════════════════════════════════════════════════════════════════

interface KausPriceChartProps {
  compact?: boolean;
}

export function KausPriceChart({ compact = false }: KausPriceChartProps) {
  const [range, setRange] = useState<TimeRange>('24H');
  const [data, setData] = useState<ChartData[]>([]);
  const [currentPrice, setCurrentPrice] = useState(120);
  const [priceChange, setPriceChange] = useState(2.34);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(() => {
    setIsLoading(true);

    const pointsMap: Record<TimeRange, number> = {
      '1H': 60,
      '24H': 96,
      '7D': 168,
      '30D': 30,
      '1Y': 365,
    };

    const points = pointsMap[range];
    const rawData = generateMockPriceData(120, points, 0.015);
    const chartData = formatChartData(rawData, range);

    setData(chartData);
    setCurrentPrice(rawData[rawData.length - 1].price);

    const firstPrice = rawData[0].price;
    const lastPrice = rawData[rawData.length - 1].price;
    const change = ((lastPrice - firstPrice) / firstPrice) * 100;
    setPriceChange(change);

    setIsLoading(false);
  }, [range]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const isPositive = priceChange >= 0;

  if (compact) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-[#171717]/10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-[#171717]/50">KAUS/KRW</div>
            <div className="text-2xl font-black">₩{currentPrice.toFixed(0)}</div>
          </div>
          <div className={`px-2 py-1 rounded-lg text-sm font-bold ${
            isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
          }`}>
            {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
          </div>
        </div>
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="kausGradientCompact" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? '#10b981' : '#ef4444'}
                strokeWidth={2}
                fill="url(#kausGradientCompact)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#171717]/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-white">K</span>
            </div>
            <div>
              <h3 className="font-bold text-[#171717]">KAUS/KRW</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black">₩{currentPrice.toFixed(2)}</span>
                <span className={`px-2 py-0.5 rounded text-sm font-bold ${
                  isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                }`}>
                  {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-1 bg-[#171717]/5 rounded-xl p-1">
          {(['1H', '24H', '7D', '30D', '1Y'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                range === r
                  ? 'bg-[#171717] text-white'
                  : 'text-[#171717]/50 hover:text-[#171717]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-[#171717]/40">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              ⏳
            </motion.div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="kausGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: '#999' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: '#999' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₩${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: '#171717',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                }}
                formatter={(value) => [`₩${(value as number)?.toFixed(2) || '0'}`, 'Price']}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? '#10b981' : '#ef4444'}
                strokeWidth={2}
                fill="url(#kausGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-[#171717]/10">
        <div className="text-center">
          <div className="text-xs text-[#171717]/50">24h High</div>
          <div className="font-bold text-emerald-600">₩{(currentPrice * 1.02).toFixed(2)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-[#171717]/50">24h Low</div>
          <div className="font-bold text-red-600">₩{(currentPrice * 0.98).toFixed(2)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-[#171717]/50">24h Volume</div>
          <div className="font-bold">1.2M KAUS</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-[#171717]/50">Market Cap</div>
          <div className="font-bold">₩1.2T</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENERGY PRICE CHART
// ═══════════════════════════════════════════════════════════════════════════════

interface EnergyPriceChartProps {
  energyType?: 'SMP' | 'REC' | 'SOLAR' | 'WIND';
}

export function EnergyPriceChart({ energyType = 'SMP' }: EnergyPriceChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [currentPrice, setCurrentPrice] = useState(130);
  const [priceChange, setPriceChange] = useState(1.5);

  const energyConfig = {
    SMP: { name: 'SMP', unit: '₩/kWh', basePrice: 130, color: '#f59e0b' },
    REC: { name: 'REC', unit: '₩/MWh', basePrice: 75000, color: '#10b981' },
    SOLAR: { name: 'Solar', unit: 'KAUS/kWh', basePrice: 0.12, color: '#eab308' },
    WIND: { name: 'Wind', unit: 'KAUS/kWh', basePrice: 0.10, color: '#06b6d4' },
  };

  const config = energyConfig[energyType];

  useEffect(() => {
    const rawData = generateMockPriceData(config.basePrice, 96, 0.03);
    const chartData = formatChartData(rawData, '24H');
    setData(chartData);
    setCurrentPrice(rawData[rawData.length - 1].price);

    const firstPrice = rawData[0].price;
    const lastPrice = rawData[rawData.length - 1].price;
    setPriceChange(((lastPrice - firstPrice) / firstPrice) * 100);
  }, [energyType, config.basePrice]);

  const isPositive = priceChange >= 0;

  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 border border-[#171717]/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#171717]">{config.name} Price</h3>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black">
              {config.unit.includes('KAUS')
                ? currentPrice.toFixed(4)
                : `₩${currentPrice.toLocaleString()}`}
            </span>
            <span className="text-xs text-[#171717]/50">{config.unit}</span>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-lg text-sm font-bold ${
          isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
        }`}>
          {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
        </div>
      </div>

      {/* Chart */}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`energyGradient-${energyType}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={config.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 9, fill: '#999' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 9, fill: '#999' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: '#171717',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={config.color}
              strokeWidth={2}
              fill={`url(#energyGradient-${energyType})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI CHART GRID
// ═══════════════════════════════════════════════════════════════════════════════

export function MultiChartGrid() {
  return (
    <div className="space-y-6">
      {/* KAUS Main Chart */}
      <KausPriceChart />

      {/* Energy Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EnergyPriceChart energyType="SMP" />
        <EnergyPriceChart energyType="REC" />
        <EnergyPriceChart energyType="SOLAR" />
        <EnergyPriceChart energyType="WIND" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI CHART (for sidebar/cards)
// ═══════════════════════════════════════════════════════════════════════════════

interface MiniChartProps {
  data?: number[];
  color?: string;
  height?: number;
}

export function MiniChart({ data, color = '#10b981', height = 40 }: MiniChartProps) {
  const [chartData, setChartData] = useState<{ value: number }[]>([]);

  useEffect(() => {
    if (data) {
      setChartData(data.map((value) => ({ value })));
    } else {
      // Generate random data
      const randomData = Array.from({ length: 24 }, () => ({
        value: Math.random() * 20 + 100,
      }));
      setChartData(randomData);
    }
  }, [data]);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`miniGradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#miniGradient-${color})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
