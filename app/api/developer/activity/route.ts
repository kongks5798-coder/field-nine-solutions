/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DEVELOPER API ACTIVITY ENDPOINT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Returns recent API call activity for the developer dashboard.
 * Fetches real data from API logs.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// GET - Fetch recent API activity
export async function GET() {
  try {
    const { data: logs, error } = await supabase
      .from('api_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !logs?.length) {
      // No logs available - return empty array
      return NextResponse.json({ calls: [] });
    }

    return NextResponse.json({
      calls: logs.map((log) => ({
        id: log.id,
        endpoint: log.endpoint || '/api/unknown',
        method: log.method || 'GET',
        status: log.status_code || 200,
        latency: log.latency_ms || 0,
        timestamp: log.created_at,
      })),
    });
  } catch {
    // Return empty on any error - graceful degradation
    return NextResponse.json({ calls: [] });
  }
}
