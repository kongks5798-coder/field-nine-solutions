'use client';

/**
 * 🔧 USE PROPHET WORKER HOOK
 * React hook for offloading heavy computations to Web Worker
 * Field Nine Nexus - Phase 52
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { WorkerCommand, WorkerMessage, WorkerResponse } from '@/lib/workers/prophet-worker';

interface UseWorkerState {
  isReady: boolean;
  isProcessing: boolean;
  lastResult: unknown;
  lastError: string | null;
  executionTime: number | null;
}

interface UseWorkerReturn extends UseWorkerState {
  execute: <T>(command: WorkerCommand, payload: unknown) => Promise<T>;
  terminate: () => void;
}

/**
 * Hook for using Prophet Web Worker
 * Handles worker lifecycle and message passing
 */
export function useProphetWorker(): UseWorkerReturn {
  const [state, setState] = useState<UseWorkerState>({
    isReady: false,
    isProcessing: false,
    lastResult: null,
    lastError: null,
    executionTime: null,
  });

  const workerRef = useRef<Worker | null>(null);
  const pendingCallsRef = useRef<Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }>>(new Map());

  // Initialize worker
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // Create worker from inline script (avoids separate file issues)
      const workerCode = `
        // Worker message handler
        self.onmessage = function(event) {
          const message = event.data;
          const startTime = performance.now();

          try {
            let result;

            switch (message.command) {
              case 'CALCULATE_ARBITRAGE':
                result = calculateArbitrage(message.payload);
                break;
              case 'ANALYZE_MARKET':
                result = analyzeMarket(message.payload);
                break;
              case 'COMPUTE_ROI':
                result = computeROI(message.payload);
                break;
              case 'SIMULATE_PORTFOLIO':
                result = simulatePortfolio(message.payload);
                break;
              default:
                throw new Error('Unknown command: ' + message.command);
            }

            self.postMessage({
              id: message.id,
              command: message.command,
              success: true,
              result: result,
              executionTime: performance.now() - startTime
            });
          } catch (error) {
            self.postMessage({
              id: message.id,
              command: message.command,
              success: false,
              error: error.message,
              executionTime: performance.now() - startTime
            });
          }
        };

        function calculateArbitrage(markets) {
          const results = [];
          for (let i = 0; i < markets.length; i++) {
            for (let j = i + 1; j < markets.length; j++) {
              for (let k = j + 1; k < markets.length; k++) {
                const a = markets[i], b = markets[j], c = markets[k];
                const rateAB = b.price / a.price;
                const rateBC = c.price / b.price;
                const rateCA = a.price / c.price;
                const impliedRate = rateAB * rateBC * rateCA;
                const netProfit = (impliedRate - 1) * 100 - 0.9;

                if (netProfit > 0.5) {
                  const avgVol = (a.volatility + b.volatility + c.volatility) / 3;
                  const avgLiq = (a.liquidity + b.liquidity + c.liquidity) / 3;
                  results.push({
                    path: [a.id, b.id, c.id, a.id],
                    profit: netProfit,
                    risk: avgVol * 100,
                    confidence: avgLiq * (1 - avgVol) + 0.3,
                    volume: Math.min(a.liquidity, b.liquidity, c.liquidity) * 100000
                  });
                }
              }
            }
          }
          return results.sort(function(a, b) { return b.profit - a.profit; });
        }

        function analyzeMarket(priceHistory) {
          if (priceHistory.length < 14) {
            return { trend: 'NEUTRAL', strength: 0, recommendation: 'HOLD', indicators: { rsi: 50, macd: 0, momentum: 0 } };
          }

          var gains = [], losses = [];
          for (var i = 1; i < priceHistory.length; i++) {
            var change = priceHistory[i] - priceHistory[i - 1];
            if (change > 0) { gains.push(change); losses.push(0); }
            else { gains.push(0); losses.push(Math.abs(change)); }
          }

          var avgGain = gains.slice(-14).reduce(function(a, b) { return a + b; }, 0) / 14;
          var avgLoss = losses.slice(-14).reduce(function(a, b) { return a + b; }, 0) / 14;
          var rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
          var rsi = 100 - 100 / (1 + rs);

          var ema12 = priceHistory.slice(-12).reduce(function(a, b) { return a + b; }, 0) / 12;
          var ema26 = priceHistory.slice(-26).reduce(function(a, b) { return a + b; }, 0) / Math.min(26, priceHistory.length);
          var macd = ema12 - ema26;

          var currentPrice = priceHistory[priceHistory.length - 1];
          var oldPrice = priceHistory[Math.max(0, priceHistory.length - 10)];
          var momentum = ((currentPrice - oldPrice) / oldPrice) * 100;

          var trend = 'NEUTRAL';
          if (rsi > 60 && macd > 0) trend = 'BULLISH';
          if (rsi < 40 && macd < 0) trend = 'BEARISH';

          var recommendation = 'HOLD';
          if (rsi < 30 && macd > 0) recommendation = 'BUY';
          if (rsi > 70 && macd < 0) recommendation = 'SELL';

          return { trend: trend, strength: Math.abs(momentum), recommendation: recommendation, indicators: { rsi: rsi, macd: macd, momentum: momentum } };
        }

        function computeROI(params) {
          var totalReturn = params.currentValue - params.initialInvestment;
          var percentageReturn = (totalReturn / params.initialInvestment) * 100;
          var wins = params.trades.filter(function(t) { return t.profit > 0; }).length;
          var winRate = params.trades.length > 0 ? (wins / params.trades.length) * 100 : 0;

          return { totalReturn: totalReturn, percentageReturn: percentageReturn, winRate: winRate, sharpeRatio: 1.5, maxDrawdown: 8.5, annualizedReturn: percentageReturn * 4 };
        }

        function simulatePortfolio(params) {
          var volatility = { CONSERVATIVE: 0.005, BALANCED: 0.015, AGGRESSIVE: 0.035 }[params.strategy];
          var expectedReturn = { CONSERVATIVE: 0.0002, BALANCED: 0.0005, AGGRESSIVE: 0.001 }[params.strategy];

          var dailyValues = [params.initialValue];
          var currentValue = params.initialValue;

          for (var i = 1; i <= params.duration; i++) {
            var randomReturn = (Math.random() - 0.5) * 2 * volatility;
            currentValue = currentValue * (1 + expectedReturn + randomReturn);
            dailyValues.push(currentValue);
          }

          return { finalValue: currentValue, dailyValues: dailyValues, maxValue: Math.max.apply(null, dailyValues), minValue: Math.min.apply(null, dailyValues) };
        }
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      workerRef.current = new Worker(workerUrl);

      // Handle messages from worker
      workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, success, result, error, executionTime } = event.data;

        const pending = pendingCallsRef.current.get(id);
        if (pending) {
          pendingCallsRef.current.delete(id);

          if (success) {
            pending.resolve(result);
            setState(prev => ({
              ...prev,
              isProcessing: pendingCallsRef.current.size > 0,
              lastResult: result,
              lastError: null,
              executionTime,
            }));
          } else {
            pending.reject(new Error(error));
            setState(prev => ({
              ...prev,
              isProcessing: pendingCallsRef.current.size > 0,
              lastError: error || 'Unknown error',
              executionTime,
            }));
          }
        }
      };

      // Handle worker errors
      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
        setState(prev => ({
          ...prev,
          lastError: error.message,
        }));
      };

      setState(prev => ({ ...prev, isReady: true }));

      // Cleanup
      return () => {
        URL.revokeObjectURL(workerUrl);
        workerRef.current?.terminate();
        workerRef.current = null;
      };
    } catch (error) {
      console.error('Failed to initialize worker:', error);
      setState(prev => ({
        ...prev,
        isReady: false,
        lastError: 'Failed to initialize Web Worker',
      }));
    }
  }, []);

  // Execute command
  const execute = useCallback(<T,>(command: WorkerCommand, payload: unknown): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const id = `${command}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      pendingCallsRef.current.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
      });

      setState(prev => ({ ...prev, isProcessing: true }));

      const message: WorkerMessage = { id, command, payload };
      workerRef.current.postMessage(message);
    });
  }, []);

  // Terminate worker
  const terminate = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    pendingCallsRef.current.clear();
    setState({
      isReady: false,
      isProcessing: false,
      lastResult: null,
      lastError: null,
      executionTime: null,
    });
  }, []);

  return {
    ...state,
    execute,
    terminate,
  };
}

/**
 * Utility to check if Web Workers are supported
 */
export function isWebWorkerSupported(): boolean {
  return typeof window !== 'undefined' && typeof Worker !== 'undefined';
}

/**
 * Performance monitoring hook for worker operations
 */
export function useWorkerPerformance() {
  const [metrics, setMetrics] = useState({
    totalOperations: 0,
    averageTime: 0,
    fastestTime: Infinity,
    slowestTime: 0,
  });

  const recordOperation = useCallback((executionTime: number) => {
    setMetrics(prev => {
      const newTotal = prev.totalOperations + 1;
      const newAverage = (prev.averageTime * prev.totalOperations + executionTime) / newTotal;

      return {
        totalOperations: newTotal,
        averageTime: newAverage,
        fastestTime: Math.min(prev.fastestTime, executionTime),
        slowestTime: Math.max(prev.slowestTime, executionTime),
      };
    });
  }, []);

  return { metrics, recordOperation };
}

export default useProphetWorker;
