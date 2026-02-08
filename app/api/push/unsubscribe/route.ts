/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 61: PUSH UNSUBSCRIPTION API
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy init Supabase client
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'Endpoint required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    if (supabase) {
      // Remove subscription from Supabase
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint);

      if (error) {
        console.error('[Push] Unsubscription error:', error);
        // Continue even if deletion fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription removed',
    });

  } catch (error) {
    console.error('[Push] Unsubscribe error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}
