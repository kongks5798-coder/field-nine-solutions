/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 62: FEATURE FLAGS API
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { featureFlags } from '@/lib/features';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');
    const includeStats = searchParams.get('stats') === 'true';

    if (key) {
      // Get specific flag
      const flag = featureFlags.getFlag(key);
      if (!flag) {
        return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
      }

      const response: Record<string, unknown> = { flag };
      if (includeStats) {
        response.stats = featureFlags.getStats(key);
      }

      return NextResponse.json(response);
    }

    // Get all flags
    const flags = featureFlags.getAllFlags();
    const response: Record<string, unknown> = {
      flags,
      count: flags.length,
      timestamp: new Date().toISOString(),
    };

    if (includeStats) {
      response.stats = featureFlags.getAllStats();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Feature flags API error:', error);
    return NextResponse.json({ error: 'Failed to fetch feature flags' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, key, ...data } = body;

    switch (action) {
      case 'create':
      case 'update': {
        const flag = featureFlags.setFlag({
          key: data.key || key,
          name: data.name,
          description: data.description,
          enabled: data.enabled ?? true,
          rolloutPercentage: data.rolloutPercentage ?? 100,
          rules: data.rules,
          variants: data.variants,
          metadata: data.metadata,
        });
        return NextResponse.json({ success: true, flag });
      }

      case 'toggle': {
        const flag = featureFlags.toggleFlag(key);
        if (!flag) {
          return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, flag });
      }

      case 'rollout': {
        const flag = featureFlags.setRollout(key, data.percentage);
        if (!flag) {
          return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, flag });
      }

      case 'delete': {
        const deleted = featureFlags.deleteFlag(key);
        return NextResponse.json({ success: deleted });
      }

      case 'evaluate': {
        const result = await featureFlags.evaluate(key, data.context || {});
        return NextResponse.json({ success: true, result });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Feature flags API error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
