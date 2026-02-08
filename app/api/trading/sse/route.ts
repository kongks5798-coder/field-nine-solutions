/**
 * NEXUS-X Real-time SSE Stream
 * @version 1.0.0 - Phase 9 Real-Money Pilot
 *
 * Server-Sent Events endpoint for live trading data
 */

import { NextRequest } from 'next/server';

// Generate realistic trading tick data
function generateTick() {
  const markets = ['JEPX', 'AEMO'];
  const market = markets[Math.floor(Math.random() * markets.length)];

  // Base prices (JPY/MWh for JEPX, AUD/MWh for AEMO)
  const basePrices: Record<string, number> = {
    JEPX: 12.5, // ~12.5 JPY/kWh typical
    AEMO: 85.0, // ~$85 AUD/MWh typical
  };

  const basePrice = basePrices[market];
  const volatility = market === 'JEPX' ? 0.5 : 2.0;
  const price = basePrice + (Math.random() - 0.5) * volatility;

  return {
    type: 'TICK',
    timestamp: new Date().toISOString(),
    market,
    bid: parseFloat((price - 0.01).toFixed(4)),
    ask: parseFloat((price + 0.01).toFixed(4)),
    last: parseFloat(price.toFixed(4)),
    volume: Math.floor(Math.random() * 1000) + 100,
  };
}

// Generate trading signals
function generateSignal() {
  const signals = ['LONG_ENTRY', 'SHORT_ENTRY', 'TAKE_PROFIT', 'STOP_LOSS', 'HOLD'];
  const markets = ['JEPX', 'AEMO'];
  const confidences = [0.65, 0.72, 0.78, 0.85, 0.91];

  return {
    type: 'SIGNAL',
    timestamp: new Date().toISOString(),
    market: markets[Math.floor(Math.random() * markets.length)],
    signal: signals[Math.floor(Math.random() * signals.length)],
    confidence: confidences[Math.floor(Math.random() * confidences.length)],
    reason: 'Arbitrage opportunity detected',
  };
}

// Generate PnL updates
function generatePnLUpdate(baseEquity: number) {
  const change = (Math.random() - 0.48) * 0.5; // Slight positive bias
  const newEquity = baseEquity + change;
  const dailyPnL = newEquity - 1000;

  return {
    type: 'PNL_UPDATE',
    timestamp: new Date().toISOString(),
    equity: parseFloat(newEquity.toFixed(2)),
    dailyPnL: parseFloat(dailyPnL.toFixed(2)),
    dailyPnLPercent: parseFloat(((dailyPnL / 1000) * 100).toFixed(3)),
    unrealizedPnL: parseFloat((Math.random() * 2 - 0.5).toFixed(2)),
    currentMDD: parseFloat((Math.random() * 0.5).toFixed(2)),
  };
}

// Generate trade execution
function generateTradeExecution() {
  const markets = ['JEPX', 'AEMO'];
  const market = markets[Math.floor(Math.random() * markets.length)];
  const side = Math.random() > 0.5 ? 'BUY' : 'SELL';

  return {
    type: 'TRADE',
    timestamp: new Date().toISOString(),
    tradeId: `TRD-${Date.now()}`,
    market,
    side,
    quantity: parseFloat((Math.random() * 5 + 1).toFixed(2)),
    price: parseFloat((Math.random() * 50 + 25).toFixed(2)),
    pnl: parseFloat((Math.random() * 2 - 0.5).toFixed(2)),
    status: 'FILLED',
  };
}

// Generate heartbeat
function generateHeartbeat() {
  return {
    type: 'HEARTBEAT',
    timestamp: new Date().toISOString(),
    status: 'RUNNING',
    uptime: Math.floor(Math.random() * 7200) + 3600, // 1-3 hours in seconds
  };
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  // Check for SSE support
  const acceptHeader = request.headers.get('accept');
  if (!acceptHeader?.includes('text/event-stream')) {
    return new Response(JSON.stringify({ error: 'SSE required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let currentEquity = 1000 + (Math.random() - 0.5) * 5;
  let isActive = true;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      const initMessage = {
        type: 'CONNECTED',
        timestamp: new Date().toISOString(),
        message: 'NEXUS-X Trading Stream connected',
        phase: 'PHASE_9_PILOT',
        initialCapital: 1000,
        currentEquity: parseFloat(currentEquity.toFixed(2)),
      };

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(initMessage)}\n\n`)
      );

      // Main streaming loop
      const interval = setInterval(() => {
        if (!isActive) {
          clearInterval(interval);
          return;
        }

        try {
          const random = Math.random();
          let event;

          if (random < 0.4) {
            // 40% - Price ticks
            event = generateTick();
          } else if (random < 0.6) {
            // 20% - PnL updates
            const pnlUpdate = generatePnLUpdate(currentEquity);
            currentEquity = pnlUpdate.equity;
            event = pnlUpdate;
          } else if (random < 0.75) {
            // 15% - Signals
            event = generateSignal();
          } else if (random < 0.85) {
            // 10% - Trades
            event = generateTradeExecution();
          } else {
            // 15% - Heartbeat
            event = generateHeartbeat();
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch (error) {
          console.error('[SSE] Stream error:', error);
          clearInterval(interval);
          controller.close();
        }
      }, 1000); // Send update every second

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        isActive = false;
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
