/**
 * NOMAD - eSIM API
 * Purchase and manage eSIMs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';
import {
  getPackages,
  getDestinations,
  purchaseEsim,
  getEsimUsage,
  getUserEsims,
} from '@/lib/esim/client';

export const runtime = 'nodejs';

/**
 * GET /api/esim
 * Get eSIM packages or user's eSIMs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'packages';
    const destination = searchParams.get('destination');

    // Public endpoints (no auth required)
    if (action === 'packages') {
      const packages = await getPackages(destination || undefined);
      return NextResponse.json({
        success: true,
        packages,
      });
    }

    if (action === 'destinations') {
      const destinations = await getDestinations();
      return NextResponse.json({
        success: true,
        destinations,
      });
    }

    // Protected endpoints (auth required)
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

    if (action === 'my-esims') {
      // Get from database
      const { data: esims, error } = await supabaseAdmin
        .from('esim_purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return NextResponse.json({
        success: true,
        esims: esims || [],
      });
    }

    if (action === 'usage') {
      const esimId = searchParams.get('esimId');
      if (!esimId) {
        return NextResponse.json(
          { error: 'eSIM ID required' },
          { status: 400 }
        );
      }

      const usage = await getEsimUsage(esimId);
      return NextResponse.json({
        success: true,
        usage,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[eSIM API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get eSIM data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/esim
 * Purchase eSIM
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
    const { packageId, useSubscription } = body;

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID required' },
        { status: 400 }
      );
    }

    // Get package details
    const packages = await getPackages();
    const pkg = packages.find((p) => p.id === packageId);

    if (!pkg) {
      return NextResponse.json(
        { error: 'Invalid package' },
        { status: 400 }
      );
    }

    // Check subscription if using subscription data
    if (useSubscription) {
      const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!subscription || subscription.plan_id === 'free') {
        return NextResponse.json(
          { error: 'Active subscription required' },
          { status: 403 }
        );
      }

      // Check data limits
      const dataLimitMB = subscription.esim_data_limit_mb;
      const dataUsedMB = subscription.esim_data_used_mb;
      const packageDataMB = pkg.dataGB * 1024;

      if (dataLimitMB !== -1 && (dataUsedMB + packageDataMB) > dataLimitMB) {
        return NextResponse.json(
          { error: 'Subscription data limit reached' },
          { status: 403 }
        );
      }
    }

    // Purchase eSIM
    const purchase = await purchaseEsim(packageId, user.id, user.email!);

    if (!purchase) {
      return NextResponse.json(
        { error: 'Failed to purchase eSIM' },
        { status: 500 }
      );
    }

    // Save to database
    const { error: insertError } = await supabaseAdmin
      .from('esim_purchases')
      .insert({
        user_id: user.id,
        package_id: packageId,
        package_name: pkg.name,
        destination: pkg.destination,
        destination_code: pkg.destinationCode,
        data_limit_mb: pkg.dataGB === -1 ? -1 : pkg.dataGB * 1024,
        validity_days: pkg.validityDays,
        price: useSubscription ? 0 : pkg.price,
        currency: pkg.currency,
        qr_code: purchase.qrCode,
        qr_code_url: purchase.qrCodeUrl,
        activation_code: purchase.activationCode,
        smdp_address: purchase.smdpAddress,
        status: 'pending',
        expires_at: purchase.expiresAt,
      });

    if (insertError) {
      console.error('[eSIM API] Insert error:', insertError);
    }

    // Update subscription usage if using subscription
    if (useSubscription) {
      await supabaseAdmin
        .from('subscriptions')
        .update({
          esim_data_used_mb: supabaseAdmin.rpc('increment', {
            x: pkg.dataGB * 1024,
          }),
        })
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      success: true,
      esim: {
        id: purchase.id,
        packageName: pkg.name,
        destination: pkg.destination,
        qrCodeUrl: purchase.qrCodeUrl,
        activationCode: purchase.activationCode,
        expiresAt: purchase.expiresAt,
      },
    });
  } catch (error) {
    console.error('[eSIM API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to purchase eSIM' },
      { status: 500 }
    );
  }
}
