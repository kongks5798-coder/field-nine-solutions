/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 62: A/B TESTING API
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { abTesting } from '@/lib/features';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const includeResults = searchParams.get('results') === 'true';

    if (id) {
      // Get specific experiment
      const experiments = abTesting.getAllExperiments();
      const experiment = experiments.find((e) => e.id === id);

      if (!experiment) {
        return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
      }

      const response: Record<string, unknown> = { experiment };
      if (includeResults) {
        response.results = abTesting.getResults(id);
      }

      return NextResponse.json(response);
    }

    // Get all experiments
    const experiments = abTesting.getAllExperiments();

    // Include results for running experiments
    const experimentsWithResults = experiments.map((exp) => ({
      ...exp,
      results: includeResults && exp.status === 'running' ? abTesting.getResults(exp.id) : undefined,
    }));

    return NextResponse.json({
      experiments: experimentsWithResults,
      count: experiments.length,
      summary: {
        total: experiments.length,
        running: experiments.filter((e) => e.status === 'running').length,
        draft: experiments.filter((e) => e.status === 'draft').length,
        completed: experiments.filter((e) => e.status === 'completed').length,
        paused: experiments.filter((e) => e.status === 'paused').length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Experiments API error:', error);
    return NextResponse.json({ error: 'Failed to fetch experiments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, ...data } = body;

    switch (action) {
      case 'create': {
        const experiment = abTesting.createExperiment({
          id: data.id || `exp_${Date.now()}`,
          name: data.name,
          description: data.description,
          status: 'draft',
          variants: data.variants || [
            { id: 'control', name: 'Control', weight: 50, isControl: true },
            { id: 'treatment', name: 'Treatment', weight: 50, isControl: false },
          ],
          metrics: data.metrics || [],
          targetAudience: data.targetAudience,
          trafficAllocation: data.trafficAllocation ?? 100,
        });
        return NextResponse.json({ success: true, experiment });
      }

      case 'start': {
        const experiment = abTesting.updateStatus(id, 'running');
        if (!experiment) {
          return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, experiment });
      }

      case 'pause': {
        const experiment = abTesting.updateStatus(id, 'paused');
        if (!experiment) {
          return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, experiment });
      }

      case 'complete': {
        const experiment = abTesting.updateStatus(id, 'completed');
        if (!experiment) {
          return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, experiment });
      }

      case 'get-variant': {
        const variant = await abTesting.getVariant(id, {
          userId: data.userId,
          sessionId: data.sessionId,
          attributes: data.attributes,
        });
        return NextResponse.json({ success: true, variant });
      }

      case 'track-event': {
        const tracked = await abTesting.trackEvent(
          id,
          data.metricId,
          { userId: data.userId, sessionId: data.sessionId, attributes: data.attributes },
          data.value ?? 1,
          data.metadata
        );
        return NextResponse.json({ success: tracked });
      }

      case 'get-results': {
        const results = abTesting.getResults(id);
        if (!results) {
          return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, results });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Experiments API error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
