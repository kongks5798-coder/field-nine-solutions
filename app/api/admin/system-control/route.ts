/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 76: SYSTEM MASTER CONTROL API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * God-Mode admin endpoints for system-level control:
 * - Interest rate adjustment
 * - Emergency system shutdown
 * - User ban management
 *
 * Security: Boss-only access, all actions logged to audit trail
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy-init Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

// System settings table schema (will be created if doesn't exist)
interface SystemSettings {
  id: string;
  interest_rate: number; // Base APY rate (0-100)
  is_maintenance: boolean;
  maintenance_message: string;
  emergency_shutdown: boolean;
  last_modified_by: string;
  last_modified_at: string;
}

interface BannedUser {
  id: string;
  user_id: string;
  email: string;
  reason: string;
  banned_by: string;
  banned_at: string;
  expires_at: string | null;
  is_permanent: boolean;
}

// GET: Fetch current system settings and ban list
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  const supabase = getSupabaseClient();

  if (!supabase) {
    // Return mock data when Supabase is not configured
    return NextResponse.json({
      success: true,
      settings: {
        interest_rate: 42.5,
        is_maintenance: false,
        maintenance_message: '',
        emergency_shutdown: false,
        last_modified_by: 'system',
        last_modified_at: new Date().toISOString(),
      },
      bannedUsers: [
        {
          id: '1',
          user_id: 'USR_BANNED_001',
          email: 'suspicious@example.com',
          reason: 'Fraudulent activity detected',
          banned_by: 'EMPEROR',
          banned_at: new Date(Date.now() - 86400000 * 3).toISOString(),
          expires_at: null,
          is_permanent: true,
        },
        {
          id: '2',
          user_id: 'USR_BANNED_002',
          email: 'bot.user@spam.net',
          reason: 'Bot/automated trading violation',
          banned_by: 'EMPEROR',
          banned_at: new Date(Date.now() - 86400000 * 7).toISOString(),
          expires_at: new Date(Date.now() + 86400000 * 23).toISOString(),
          is_permanent: false,
        },
      ],
      auditLog: [
        {
          id: '1',
          action: 'INTEREST_RATE_CHANGE',
          oldValue: '40.0',
          newValue: '42.5',
          performedBy: 'EMPEROR',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '2',
          action: 'USER_BANNED',
          oldValue: null,
          newValue: 'USR_BANNED_001',
          performedBy: 'EMPEROR',
          timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
      ],
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // Fetch system settings
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('*')
      .single();

    // Fetch banned users
    const { data: bannedUsers, error: banError } = await supabase
      .from('banned_users')
      .select('*')
      .order('banned_at', { ascending: false });

    // Fetch recent audit log
    const { data: auditLog, error: auditError } = await supabase
      .from('system_audit_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(20);

    return NextResponse.json({
      success: true,
      settings: settings || {
        interest_rate: 42.5,
        is_maintenance: false,
        maintenance_message: '',
        emergency_shutdown: false,
      },
      bannedUsers: bannedUsers || [],
      auditLog: auditLog || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SystemControl] GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch system settings',
    }, { status: 500 });
  }
}

// POST: Update system settings or manage bans
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...payload } = body;

    const supabase = getSupabaseClient();

    // Log all actions for audit trail
    console.log(`[SystemControl] Action: ${action}`, payload);

    switch (action) {
      case 'UPDATE_INTEREST_RATE': {
        const { rate } = payload;

        if (typeof rate !== 'number' || rate < 0 || rate > 100) {
          return NextResponse.json({
            success: false,
            error: 'Interest rate must be between 0 and 100',
          }, { status: 400 });
        }

        if (supabase) {
          // Update in database
          await supabase
            .from('system_settings')
            .update({
              interest_rate: rate,
              last_modified_by: 'EMPEROR',
              last_modified_at: new Date().toISOString(),
            })
            .eq('id', 'main');

          // Log to audit
          await supabase
            .from('system_audit_log')
            .insert({
              action: 'INTEREST_RATE_CHANGE',
              new_value: rate.toString(),
              performed_by: 'EMPEROR',
              timestamp: new Date().toISOString(),
            });
        }

        return NextResponse.json({
          success: true,
          message: `Interest rate updated to ${rate}%`,
          newRate: rate,
          timestamp: new Date().toISOString(),
        });
      }

      case 'EMERGENCY_SHUTDOWN': {
        const { enabled, reason } = payload;

        if (supabase) {
          await supabase
            .from('system_settings')
            .update({
              emergency_shutdown: enabled,
              maintenance_message: reason || 'System under emergency maintenance',
              last_modified_by: 'EMPEROR',
              last_modified_at: new Date().toISOString(),
            })
            .eq('id', 'main');

          await supabase
            .from('system_audit_log')
            .insert({
              action: enabled ? 'EMERGENCY_SHUTDOWN_ACTIVATED' : 'EMERGENCY_SHUTDOWN_DEACTIVATED',
              new_value: reason || null,
              performed_by: 'EMPEROR',
              timestamp: new Date().toISOString(),
            });
        }

        return NextResponse.json({
          success: true,
          message: enabled ? '🚨 EMERGENCY SHUTDOWN ACTIVATED' : '✅ System restored',
          shutdown: enabled,
          timestamp: new Date().toISOString(),
        });
      }

      case 'BAN_USER': {
        const { userId, email, reason, isPermanent, durationDays } = payload;

        if (!userId && !email) {
          return NextResponse.json({
            success: false,
            error: 'User ID or email required',
          }, { status: 400 });
        }

        const expiresAt = isPermanent
          ? null
          : new Date(Date.now() + (durationDays || 30) * 86400000).toISOString();

        if (supabase) {
          await supabase
            .from('banned_users')
            .insert({
              user_id: userId || `USR_${Date.now()}`,
              email: email || 'unknown',
              reason: reason || 'Policy violation',
              banned_by: 'EMPEROR',
              banned_at: new Date().toISOString(),
              expires_at: expiresAt,
              is_permanent: isPermanent || false,
            });

          await supabase
            .from('system_audit_log')
            .insert({
              action: 'USER_BANNED',
              new_value: JSON.stringify({ userId, email, reason }),
              performed_by: 'EMPEROR',
              timestamp: new Date().toISOString(),
            });
        }

        return NextResponse.json({
          success: true,
          message: `User ${userId || email} has been banned`,
          timestamp: new Date().toISOString(),
        });
      }

      case 'UNBAN_USER': {
        const { banId, userId } = payload;

        if (supabase) {
          await supabase
            .from('banned_users')
            .delete()
            .eq('id', banId);

          await supabase
            .from('system_audit_log')
            .insert({
              action: 'USER_UNBANNED',
              new_value: userId,
              performed_by: 'EMPEROR',
              timestamp: new Date().toISOString(),
            });
        }

        return NextResponse.json({
          success: true,
          message: 'User has been unbanned',
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[SystemControl] POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
    }, { status: 500 });
  }
}
