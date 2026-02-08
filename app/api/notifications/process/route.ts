/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 58: NOTIFICATION QUEUE PROCESSOR API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Cron-friendly endpoint for processing pending notifications
 * - Called by Vercel Cron or external scheduler
 * - Secured with API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/notifications/notification-service';
import { logAuditEvent } from '@/lib/audit/audit-logger';

export const runtime = 'nodejs';
export const maxDuration = 60;

// ============================================
// POST: Process Notification Queue
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify cron secret or admin API key
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const adminKey = process.env.ADMIN_API_KEY;

    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` ||
      authHeader === `Bearer ${adminKey}` ||
      request.headers.get('x-vercel-cron') === '1';

    if (!isAuthorized && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const limit = body.limit || 100;

    // Process queue
    const result = await notificationService.processQueue(limit);

    // Log audit event
    await logAuditEvent({
      eventType: 'SYSTEM',
      actorType: 'system',
      action: 'Process notification queue',
      status: 'success',
      details: {
        processed: result.processed,
        failed: result.failed,
        limit,
      },
    });

    return NextResponse.json({
      success: true,
      processed: result.processed,
      failed: result.failed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Notification Processor] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Processing failed' },
      { status: 500 }
    );
  }
}

// ============================================
// GET: Queue Status
// ============================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Simple auth check
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY;

    if (authHeader !== `Bearer ${adminKey}` && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get queue stats from database
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [pending, sending, failed, sent] = await Promise.all([
      supabase.from('notification_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('notification_queue').select('*', { count: 'exact', head: true }).eq('status', 'sending'),
      supabase.from('notification_queue').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
      supabase.from('notification_queue').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        pending: pending.count || 0,
        sending: sending.count || 0,
        failed: failed.count || 0,
        sent: sent.count || 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Notification Processor] Status Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
