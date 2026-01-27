/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 56: REFERRAL ADMIN API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Admin endpoints for referral management
 * - Global stats
 * - Fraud detection
 * - User management
 * - Campaign management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { referralDB } from '@/lib/referral/referral-db';

export const dynamic = 'force-dynamic';

// ============================================
// Admin Check Helper
// ============================================

async function isAdmin(request: NextRequest): Promise<boolean> {
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
    if (!user) return false;

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    return profile?.role === 'admin' || profile?.role === 'super_admin';
  } catch {
    return false;
  }
}

/**
 * GET - Admin dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin(request)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'stats';

    switch (action) {
      // ========================================
      // Global Statistics
      // ========================================
      case 'stats': {
        const stats = await referralDB.getGlobalStats();

        return NextResponse.json({
          success: true,
          stats,
          timestamp: new Date().toISOString(),
        });
      }

      // ========================================
      // Fraud Detection Report
      // ========================================
      case 'fraud-report': {
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

        // Get suspicious referrals
        const { data: suspicious } = await supabase
          .from('referral_relations')
          .select(`
            *,
            referrer:referrer_id(full_name, email),
            referee:referee_id(full_name, email, created_at)
          `)
          .eq('status', 'fraudulent')
          .order('created_at', { ascending: false })
          .limit(50);

        // Get high-velocity referrers (>10 referrals in 24h)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: highVelocity } = await supabase
          .from('referral_relations')
          .select('referrer_id')
          .gte('created_at', oneDayAgo)
          .eq('status', 'active');

        // Count by referrer
        const velocityCounts = new Map<string, number>();
        for (const ref of highVelocity || []) {
          velocityCounts.set(ref.referrer_id, (velocityCounts.get(ref.referrer_id) || 0) + 1);
        }

        const suspiciousReferrers = Array.from(velocityCounts.entries())
          .filter(([, count]) => count > 10)
          .map(([userId, count]) => ({ userId, referralsIn24h: count }));

        return NextResponse.json({
          success: true,
          report: {
            fraudulentReferrals: suspicious || [],
            suspiciousReferrers,
            totalFraudulent: suspicious?.length || 0,
            totalHighVelocity: suspiciousReferrers.length,
          },
          timestamp: new Date().toISOString(),
        });
      }

      // ========================================
      // Top Referrers
      // ========================================
      case 'top-referrers': {
        const limit = parseInt(searchParams.get('limit') || '50');
        const period = searchParams.get('period') as 'all' | 'monthly' | 'weekly' || 'all';

        const leaderboard = await referralDB.getLeaderboard(period, limit);

        return NextResponse.json({
          success: true,
          referrers: leaderboard,
          period,
          timestamp: new Date().toISOString(),
        });
      }

      // ========================================
      // Recent Activity
      // ========================================
      case 'activity': {
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

        const { data: recentReferrals } = await supabase
          .from('referral_relations')
          .select(`
            *,
            referrer:referrer_id(full_name),
            referee:referee_id(full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(100);

        const { data: recentRewards } = await supabase
          .from('referral_rewards')
          .select('*')
          .order('earned_at', { ascending: false })
          .limit(100);

        return NextResponse.json({
          success: true,
          activity: {
            recentReferrals: recentReferrals || [],
            recentRewards: recentRewards || [],
          },
          timestamp: new Date().toISOString(),
        });
      }

      // ========================================
      // Campaign List
      // ========================================
      case 'campaigns': {
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

        const { data: campaigns } = await supabase
          .from('referral_campaigns')
          .select('*')
          .order('created_at', { ascending: false });

        return NextResponse.json({
          success: true,
          campaigns: campaigns || [],
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
            validActions: ['stats', 'fraud-report', 'top-referrers', 'activity', 'campaigns'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Admin Referral API] GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Admin actions
 */
export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin(request)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

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

    switch (action) {
      // ========================================
      // Mark Referral as Fraudulent
      // ========================================
      case 'mark-fraudulent': {
        const { relationId, reason } = body;

        if (!relationId) {
          return NextResponse.json(
            { success: false, error: 'Relation ID required' },
            { status: 400 }
          );
        }

        const success = await referralDB.markFraudulent(relationId, reason || 'Admin flagged');

        return NextResponse.json({
          success,
          message: success ? 'Marked as fraudulent' : 'Failed to update',
          timestamp: new Date().toISOString(),
        });
      }

      // ========================================
      // Restore Referral
      // ========================================
      case 'restore-referral': {
        const { relationId } = body;

        if (!relationId) {
          return NextResponse.json(
            { success: false, error: 'Relation ID required' },
            { status: 400 }
          );
        }

        const { error } = await supabase
          .from('referral_relations')
          .update({ status: 'active' })
          .eq('id', relationId);

        return NextResponse.json({
          success: !error,
          message: !error ? 'Referral restored' : 'Failed to restore',
          timestamp: new Date().toISOString(),
        });
      }

      // ========================================
      // Create Campaign
      // ========================================
      case 'create-campaign': {
        const { name, nameKo, description, descriptionKo, bonusMultiplier, startDate, endDate, requirements } = body;

        if (!name || !startDate || !endDate) {
          return NextResponse.json(
            { success: false, error: 'Name, startDate, and endDate required' },
            { status: 400 }
          );
        }

        const { data, error } = await supabase
          .from('referral_campaigns')
          .insert({
            name,
            name_ko: nameKo || name,
            description,
            description_ko: descriptionKo || description,
            bonus_multiplier: bonusMultiplier || 1.0,
            start_date: startDate,
            end_date: endDate,
            requirements: requirements || [],
            is_active: true,
          })
          .select()
          .single();

        return NextResponse.json({
          success: !error,
          campaign: data,
          error: error?.message,
          timestamp: new Date().toISOString(),
        });
      }

      // ========================================
      // Toggle Campaign Status
      // ========================================
      case 'toggle-campaign': {
        const { campaignId, isActive } = body;

        if (!campaignId) {
          return NextResponse.json(
            { success: false, error: 'Campaign ID required' },
            { status: 400 }
          );
        }

        const { error } = await supabase
          .from('referral_campaigns')
          .update({ is_active: isActive })
          .eq('id', campaignId);

        return NextResponse.json({
          success: !error,
          message: !error ? `Campaign ${isActive ? 'activated' : 'deactivated'}` : 'Failed to update',
          timestamp: new Date().toISOString(),
        });
      }

      // ========================================
      // Bulk Award Rewards
      // ========================================
      case 'bulk-award': {
        const { userIds, amount, type, description, descriptionKo } = body;

        if (!userIds || !Array.isArray(userIds) || !amount) {
          return NextResponse.json(
            { success: false, error: 'userIds array and amount required' },
            { status: 400 }
          );
        }

        const rewards = userIds.map((userId: string) => ({
          user_id: userId,
          type: type || 'MILESTONE',
          amount,
          currency: 'KAUS',
          description: description || 'Admin reward',
          description_ko: descriptionKo || '관리자 보상',
          status: 'claimable',
          earned_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }));

        const { error } = await supabase
          .from('referral_rewards')
          .insert(rewards);

        return NextResponse.json({
          success: !error,
          message: !error ? `Awarded ${amount} KAUS to ${userIds.length} users` : 'Failed to award',
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
            validActions: ['mark-fraudulent', 'restore-referral', 'create-campaign', 'toggle-campaign', 'bulk-award'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Admin Referral API] POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
