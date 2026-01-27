/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 58: ANALYTICS DASHBOARD API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Real-time analytics aggregation for enterprise dashboard
 * - Daily/Weekly/Monthly metrics
 * - Revenue analytics
 * - User engagement
 * - Referral performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// ============================================
// Types
// ============================================

interface DailyMetrics {
  date: string;
  newUsers: number;
  activeUsers: number;
  totalRevenue: number;
  paymentCount: number;
  averageOrderValue: number;
  newReferrals: number;
  vibeAnalyses: number;
  viralShares: number;
}

interface AnalyticsSummary {
  today: DailyMetrics;
  yesterday: DailyMetrics;
  thisWeek: {
    totalUsers: number;
    totalRevenue: number;
    totalPayments: number;
    totalReferrals: number;
  };
  thisMonth: {
    totalUsers: number;
    totalRevenue: number;
    totalPayments: number;
    totalReferrals: number;
    avgDailyRevenue: number;
  };
  trends: {
    userGrowth: number; // percentage
    revenueGrowth: number; // percentage
    referralGrowth: number; // percentage
  };
}

// ============================================
// Admin Check Helper
// ============================================

async function isAdmin(request: NextRequest): Promise<{ isAdmin: boolean; userId?: string }> {
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isAdmin: false };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const admin = profile?.role === 'admin' || profile?.role === 'super_admin';
    return { isAdmin: admin, userId: user.id };
  } catch {
    return { isAdmin: false };
  }
}

// ============================================
// GET: Fetch Analytics
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { isAdmin: admin } = await isAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'summary';
    const period = searchParams.get('period') || 'today';

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    switch (action) {
      // ========================================
      // Summary Dashboard
      // ========================================
      case 'summary': {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        const prevMonthStart = new Date(monthAgo);
        prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);

        // Today's metrics
        const todayStart = today.toISOString().split('T')[0];
        const yesterdayStart = yesterday.toISOString().split('T')[0];

        // Fetch today's users
        const { count: todayNewUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart);

        // Fetch yesterday's users
        const { count: yesterdayNewUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', yesterdayStart)
          .lt('created_at', todayStart);

        // Fetch this week's metrics
        const { count: weekUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString());

        // Fetch this month's metrics
        const { count: monthUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthAgo.toISOString());

        // Fetch previous month's metrics for trend
        const { count: prevMonthUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', prevMonthStart.toISOString())
          .lt('created_at', monthAgo.toISOString());

        // Fetch referral metrics
        const { count: todayReferrals } = await supabase
          .from('referral_relations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart);

        const { count: weekReferrals } = await supabase
          .from('referral_relations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString());

        const { count: monthReferrals } = await supabase
          .from('referral_relations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthAgo.toISOString());

        // Fetch VIBE-ID metrics
        const { count: todayVibeAnalyses } = await supabase
          .from('vibe_analyses')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart);

        // Fetch share events
        const { count: todayShares } = await supabase
          .from('share_events')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart);

        // Calculate trends
        const userGrowth = prevMonthUsers
          ? (((monthUsers || 0) - prevMonthUsers) / prevMonthUsers) * 100
          : 0;

        const summary: AnalyticsSummary = {
          today: {
            date: todayStart,
            newUsers: todayNewUsers || 0,
            activeUsers: 0, // Would need session tracking
            totalRevenue: 0, // Would need payments table
            paymentCount: 0,
            averageOrderValue: 0,
            newReferrals: todayReferrals || 0,
            vibeAnalyses: todayVibeAnalyses || 0,
            viralShares: todayShares || 0,
          },
          yesterday: {
            date: yesterdayStart,
            newUsers: yesterdayNewUsers || 0,
            activeUsers: 0,
            totalRevenue: 0,
            paymentCount: 0,
            averageOrderValue: 0,
            newReferrals: 0,
            vibeAnalyses: 0,
            viralShares: 0,
          },
          thisWeek: {
            totalUsers: weekUsers || 0,
            totalRevenue: 0,
            totalPayments: 0,
            totalReferrals: weekReferrals || 0,
          },
          thisMonth: {
            totalUsers: monthUsers || 0,
            totalRevenue: 0,
            totalPayments: 0,
            totalReferrals: monthReferrals || 0,
            avgDailyRevenue: 0,
          },
          trends: {
            userGrowth: Math.round(userGrowth * 10) / 10,
            revenueGrowth: 0,
            referralGrowth: 0,
          },
        };

        return NextResponse.json({
          success: true,
          summary,
          timestamp: new Date().toISOString(),
        });
      }

      // ========================================
      // Daily Breakdown
      // ========================================
      case 'daily': {
        const days = parseInt(searchParams.get('days') || '30');
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Fetch from analytics_daily if available
        const { data: dailyData } = await supabase
          .from('analytics_daily')
          .select('*')
          .gte('date', startDate.toISOString().split('T')[0])
          .order('date', { ascending: false });

        return NextResponse.json({
          success: true,
          daily: dailyData || [],
          period: `${days} days`,
          timestamp: new Date().toISOString(),
        });
      }

      // ========================================
      // User Analytics
      // ========================================
      case 'users': {
        // User cohort analysis
        const { data: usersByMonth } = await supabase.rpc('get_users_by_cohort');

        // Active users (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        // Total user count
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Users by tier
        const { data: usersByTier } = await supabase
          .from('profiles')
          .select('tier')
          .not('tier', 'is', null);

        const tierDistribution = (usersByTier || []).reduce((acc: Record<string, number>, u) => {
          acc[u.tier] = (acc[u.tier] || 0) + 1;
          return acc;
        }, {});

        return NextResponse.json({
          success: true,
          users: {
            total: totalUsers || 0,
            byTier: tierDistribution,
            byCohort: usersByMonth || [],
          },
          timestamp: new Date().toISOString(),
        });
      }

      // ========================================
      // Referral Analytics
      // ========================================
      case 'referrals': {
        // Total referrals
        const { count: totalReferrals } = await supabase
          .from('referral_relations')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Total rewards distributed
        const { data: rewardsSum } = await supabase
          .from('referral_rewards')
          .select('amount')
          .eq('status', 'claimed');

        const totalRewards = (rewardsSum || []).reduce((sum, r) => sum + (r.amount || 0), 0);

        // Top referrers
        const { data: topReferrers } = await supabase
          .from('referral_codes')
          .select(`
            code,
            user_id,
            total_uses,
            total_earnings,
            profiles!inner(full_name)
          `)
          .order('total_uses', { ascending: false })
          .limit(10);

        return NextResponse.json({
          success: true,
          referrals: {
            total: totalReferrals || 0,
            totalRewardsDistributed: totalRewards,
            topReferrers: topReferrers || [],
          },
          timestamp: new Date().toISOString(),
        });
      }

      // ========================================
      // VIBE-ID Analytics
      // ========================================
      case 'vibe': {
        // Total analyses
        const { count: totalAnalyses } = await supabase
          .from('vibe_analyses')
          .select('*', { count: 'exact', head: true });

        // By vibe type
        const { data: byType } = await supabase
          .from('vibe_analyses')
          .select('vibe_type');

        const vibeDistribution = (byType || []).reduce((acc: Record<string, number>, v) => {
          acc[v.vibe_type] = (acc[v.vibe_type] || 0) + 1;
          return acc;
        }, {});

        // Total shares
        const { count: totalShares } = await supabase
          .from('share_events')
          .select('*', { count: 'exact', head: true });

        // Shares by platform
        const { data: sharesByPlatform } = await supabase
          .from('share_events')
          .select('platform');

        const platformDistribution = (sharesByPlatform || []).reduce((acc: Record<string, number>, s) => {
          acc[s.platform] = (acc[s.platform] || 0) + 1;
          return acc;
        }, {});

        return NextResponse.json({
          success: true,
          vibe: {
            totalAnalyses: totalAnalyses || 0,
            byType: vibeDistribution,
            totalShares: totalShares || 0,
            sharesByPlatform: platformDistribution,
          },
          timestamp: new Date().toISOString(),
        });
      }

      // ========================================
      // System Health
      // ========================================
      case 'health': {
        // Recent errors from audit logs
        const { data: recentErrors } = await supabase
          .from('audit_logs')
          .select('event_type, action, severity, created_at')
          .in('severity', ['ERROR', 'CRITICAL'])
          .order('created_at', { ascending: false })
          .limit(10);

        // API request counts (last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const { count: apiRequests } = await supabase
          .from('audit_logs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', yesterday.toISOString());

        return NextResponse.json({
          success: true,
          health: {
            recentErrors: recentErrors || [],
            apiRequestsLast24h: apiRequests || 0,
            status: (recentErrors?.length || 0) > 5 ? 'degraded' : 'healthy',
          },
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
            validActions: ['summary', 'daily', 'users', 'referrals', 'vibe', 'health'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST: Trigger Aggregation
// ============================================

export async function POST(request: NextRequest) {
  try {
    const { isAdmin: admin } = await isAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, date } = body;

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    switch (action) {
      case 'aggregate': {
        const targetDate = date || new Date().toISOString().split('T')[0];

        // Call aggregation function
        const { error } = await supabase.rpc('aggregate_daily_analytics', {
          p_date: targetDate,
        });

        if (error) {
          console.error('[Analytics API] Aggregation error:', error);
          return NextResponse.json(
            { success: false, error: 'Aggregation failed' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `Analytics aggregated for ${targetDate}`,
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Analytics API] POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
