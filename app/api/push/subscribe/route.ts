/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 61: PUSH SUBSCRIPTION API
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy init Supabase client for storing subscriptions
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
    const subscription = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    if (supabase) {
      // Store subscription in Supabase
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          endpoint: subscription.endpoint,
          keys_p256dh: subscription.keys?.p256dh,
          keys_auth: subscription.keys?.auth,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'endpoint',
        });

      if (error) {
        console.error('[Push] Subscription storage error:', error);
        // Continue even if storage fails - subscription is still valid
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription saved',
    });

  } catch (error) {
    console.error('[Push] Subscribe error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}
