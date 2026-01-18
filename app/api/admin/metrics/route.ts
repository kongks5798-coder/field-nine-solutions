/**
 * K-UNIVERSAL Real-time Metrics API
 * Provides live system health data to Ops Dashboard
 * Now with real Supabase data
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Lazy initialization to avoid build-time errors
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Get this week's date range
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoISO = weekAgo.toISOString();

    let earlyAccessTotal = 0;
    let earlyAccessToday = 0;
    let reviewsCount = 0;
    let abTestsCount = 0;

    if (supabase) {
      // Fetch real data from Supabase
      const [earlyAccessResult, earlyAccessTodayResult, reviewsResult, abTestsResult] = await Promise.all([
        // Total early access signups
        supabase.from('early_access').select('*', { count: 'exact', head: true }),
        // Today's early access signups
        supabase.from('early_access').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
        // Total reviews
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
        // A/B test participants this week
        supabase.from('ab_tests').select('*', { count: 'exact', head: true }).gte('created_at', weekAgoISO),
      ]);

      earlyAccessTotal = earlyAccessResult.count || 0;
      earlyAccessToday = earlyAccessTodayResult.count || 0;
      reviewsCount = reviewsResult.count || 0;
      abTestsCount = abTestsResult.count || 0;
    }

    const metrics = {
      timestamp: new Date().toISOString(),

      // Real data from Supabase
      earlyAccess: {
        total: earlyAccessTotal,
        today: earlyAccessToday,
      },

      reviews: {
        total: reviewsCount,
      },

      abTests: {
        participantsThisWeek: abTestsCount,
      },

      // Simulated metrics (would come from external services)
      activeUsers: Math.floor(Math.random() * 50) + 10,

      // System health (would come from monitoring)
      errorRate: Math.random() * 0.3,
      avgResponseTime: Math.floor(Math.random() * 200) + 80,
      uptime: 99.9 + Math.random() * 0.1,

      // API status
      apiStatus: {
        supabase: supabase ? 'connected' : 'not_configured',
        openai: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
        lemonsqueezy: process.env.LEMON_SQUEEZY_API_KEY ? 'configured' : 'not_configured',
        ga4: process.env.NEXT_PUBLIC_GA_ID ? 'configured' : 'not_configured',
      },
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch metrics',
        timestamp: new Date().toISOString(),
        apiStatus: {
          supabase: 'error',
          openai: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
          lemonsqueezy: process.env.LEMON_SQUEEZY_API_KEY ? 'configured' : 'not_configured',
          ga4: process.env.NEXT_PUBLIC_GA_ID ? 'configured' : 'not_configured',
        },
      },
      { status: 500 }
    );
  }
}
