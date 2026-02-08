/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * THE PROPHET AI API - INTELLIGENCE LAYER
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 37: THE FINAL CONVERGENCE
 *
 * Endpoints:
 * GET  /api/energy/prophet              - Get current advice
 * GET  /api/energy/prophet?type=state   - Get Prophet state
 * GET  /api/energy/prophet?type=greeting - Get greeting message
 * POST /api/energy/prophet              - Execute action
 *
 * @version 37.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import {
  getProphetAdvice,
  getProphetState,
  getProphetGreeting,
  executeProphetAction,
} from '@/lib/energy/prophet-ai';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ═══════════════════════════════════════════════════════════════════════════════
// GET - Retrieve Prophet intelligence
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'advice';

  try {
    switch (type) {
      case 'state': {
        const state = await getProphetState();
        return NextResponse.json({
          success: true,
          data: state,
          timestamp: new Date().toISOString(),
        });
      }

      case 'greeting': {
        const greeting = getProphetGreeting();
        return NextResponse.json({
          success: true,
          data: { greeting },
          timestamp: new Date().toISOString(),
        });
      }

      case 'advice':
      default: {
        const advice = await getProphetAdvice();
        return NextResponse.json({
          success: true,
          data: advice,
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('[PROPHET API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Prophet API error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST - Execute Prophet action
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { actionType, params } = body;

    if (!actionType) {
      return NextResponse.json({
        success: false,
        error: 'Action type is required',
      }, { status: 400 });
    }

    const result = await executeProphetAction(actionType, params);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[PROPHET API] POST Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Action execution failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
