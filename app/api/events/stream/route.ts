/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 82: SERVER-SENT EVENTS (SSE) ENDPOINT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Real-time event streaming for:
 * - Central Bank operations → Jarvis proactive briefings
 * - Reserve metrics updates → Dashboard real-time charts
 * - System alerts → User notifications
 *
 * Protocol: EventSource (SSE) for one-way server → client streaming
 */

import { NextRequest } from 'next/server';
import { subscribeToEvents, getRecentEvents, getCurrentMetrics, generateJarvisBriefing } from '@/lib/system-events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  // Create readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const connectionMessage = {
        type: 'connected',
        timestamp: new Date().toISOString(),
        metrics: getCurrentMetrics(),
        recentEvents: getRecentEvents(10),
      };
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(connectionMessage)}\n\n`)
      );

      // Subscribe to system events
      const unsubscribe = subscribeToEvents((event) => {
        try {
          // Generate Jarvis briefing for this event
          const briefing = generateJarvisBriefing(event);

          const eventMessage = {
            type: 'system_event',
            event,
            briefing,
            metrics: getCurrentMetrics(),
            timestamp: new Date().toISOString(),
          };

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(eventMessage)}\n\n`)
          );
        } catch (error) {
          console.error('[SSE] Error sending event:', error);
        }
      });

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = {
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
            metrics: getCurrentMetrics(),
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(heartbeat)}\n\n`)
          );
        } catch (error) {
          // Connection likely closed
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        clearInterval(heartbeatInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
