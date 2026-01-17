/**
 * NOMAD - Subscription API
 * Manage user subscriptions (LemonSqueezy)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';
import {
  createCheckoutUrl,
  getVariantId,
  getCustomerPortalUrl,
  getPlanById,
} from '@/lib/lemonsqueezy/client';
import { SUBSCRIPTION_PLANS, PlanId } from '@/lib/config/brand';

export const runtime = 'nodejs';

/**
 * GET /api/subscription
 * Get current user's subscription
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get subscription from database
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      throw subError;
    }

    // If no subscription, return free plan
    if (!subscription) {
      const freePlan = SUBSCRIPTION_PLANS.free;
      return NextResponse.json({
        success: true,
        subscription: {
          planId: 'free',
          plan: freePlan,
          status: 'active',
          usage: {
            aiChatsUsed: 0,
            aiChatsLimit: freePlan.features.aiChats,
            esimDataUsedMB: 0,
            esimDataLimitMB: 0,
          },
        },
      });
    }

    const plan = getPlanById(subscription.plan_id as PlanId);

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        planId: subscription.plan_id,
        plan,
        status: subscription.status,
        billingCycle: subscription.billing_cycle,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        usage: {
          aiChatsUsed: subscription.ai_chats_used,
          aiChatsLimit: subscription.ai_chats_limit,
          esimDataUsedMB: subscription.esim_data_used_mb,
          esimDataLimitMB: subscription.esim_data_limit_mb,
        },
      },
    });
  } catch (error) {
    console.error('[Subscription API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscription
 * Create checkout session for new subscription (LemonSqueezy)
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId, isYearly } = body;

    if (!planId || planId === 'free') {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Get variant ID for the plan
    const variantId = getVariantId(planId as PlanId, isYearly);

    if (!variantId) {
      console.error('[Subscription API] Variant ID not found for plan:', planId, isYearly ? 'yearly' : 'monthly');
      return NextResponse.json(
        { error: 'Plan not available. Please configure LemonSqueezy variant IDs.' },
        { status: 400 }
      );
    }

    // Ensure user has a subscription record
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!existingSub) {
      // Create initial subscription record
      await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_id: 'free',
          status: 'active',
        });
    }

    // Create LemonSqueezy checkout URL
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL;
    const checkout = await createCheckoutUrl(variantId, {
      email: user.email,
      name: user.user_metadata?.full_name,
      userId: user.id,
      successUrl: `${origin}/subscription/success`,
      cancelUrl: `${origin}/pricing`,
    });

    if (!checkout) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: checkout.url,
    });
  } catch (error) {
    console.error('[Subscription API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/subscription
 * Manage subscription (cancel, portal)
 */
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // Get subscription
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('lemonsqueezy_customer_id')
      .eq('user_id', user.id)
      .single();

    if (action === 'portal') {
      if (!subscription?.lemonsqueezy_customer_id) {
        // No customer portal available for free users
        return NextResponse.json({
          success: true,
          portalUrl: null,
          message: 'No active subscription to manage',
        });
      }

      const portalUrl = await getCustomerPortalUrl(subscription.lemonsqueezy_customer_id);

      if (!portalUrl) {
        return NextResponse.json(
          { error: 'Failed to get customer portal URL' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        portalUrl,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Subscription API] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to manage subscription' },
      { status: 500 }
    );
  }
}
