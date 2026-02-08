/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 59: NOTIFICATIONS API
 * ═══════════════════════════════════════════════════════════════════════════════
 * 사용자 알림 조회 및 관리
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type NotificationType =
  | 'PURCHASE_SUCCESS'
  | 'WITHDRAWAL_PENDING'
  | 'WITHDRAWAL_APPROVED'
  | 'WITHDRAWAL_REJECTED'
  | 'STAKING_STARTED'
  | 'STAKING_INTEREST'
  | 'STAKING_COMPLETED'
  | 'REFERRAL_BONUS'
  | 'SYSTEM_ALERT'
  | 'PRICE_ALERT';

interface NotificationConfig {
  icon: string;
  color: string;
  title: string;
}

const NOTIFICATION_CONFIG: Record<NotificationType, NotificationConfig> = {
  PURCHASE_SUCCESS: { icon: '💳', color: 'emerald', title: 'KAUS 구매 완료' },
  WITHDRAWAL_PENDING: { icon: '⏳', color: 'amber', title: '출금 신청 접수' },
  WITHDRAWAL_APPROVED: { icon: '✅', color: 'emerald', title: '출금 승인됨' },
  WITHDRAWAL_REJECTED: { icon: '❌', color: 'red', title: '출금 거절됨' },
  STAKING_STARTED: { icon: '📈', color: 'cyan', title: '스테이킹 시작' },
  STAKING_INTEREST: { icon: '💰', color: 'amber', title: '이자 지급' },
  STAKING_COMPLETED: { icon: '🎉', color: 'emerald', title: '스테이킹 완료' },
  REFERRAL_BONUS: { icon: '🎁', color: 'purple', title: '추천 보너스' },
  SYSTEM_ALERT: { icon: '🔔', color: 'blue', title: '시스템 알림' },
  PRICE_ALERT: { icon: '📊', color: 'orange', title: '가격 알림' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET: List Notifications
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const unreadOnly = searchParams.get('unread') === 'true';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

  if (!userId) {
    return NextResponse.json({
      success: true,
      name: 'KAUS Notifications API',
      version: '1.0.0',
      phase: 59,
      types: Object.keys(NOTIFICATION_CONFIG),
      endpoints: {
        list: 'GET /api/notifications?userId=xxx',
        markRead: 'POST /api/notifications { action: "markRead", notificationId }',
        markAllRead: 'POST /api/notifications { action: "markAllRead", userId }',
      },
    });
  }

  try {
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      // Return mock data for development
      const mockNotifications = [
        {
          id: 'notif-001',
          type: 'PURCHASE_SUCCESS' as NotificationType,
          message: '1,000 KAUS 구매가 완료되었습니다.',
          data: { amount: 1000, txId: 'TX-001' },
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'notif-002',
          type: 'STAKING_STARTED' as NotificationType,
          message: '500 KAUS 스테이킹이 시작되었습니다. APY 12%',
          data: { amount: 500, planId: '90days', apy: 12 },
          read: true,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ];

      return NextResponse.json({
        success: true,
        notifications: mockNotifications.map(n => ({
          ...n,
          config: NOTIFICATION_CONFIG[n.type],
        })),
        unreadCount: mockNotifications.filter(n => !n.read).length,
        source: 'mock',
      });
    }

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('[Notifications] Query error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch notifications',
      }, { status: 500 });
    }

    // Get unread count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: unreadCount } = await (supabase as any)
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    // Format notifications
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedNotifications = (notifications || []).map((n: any) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      data: n.data,
      read: n.read,
      createdAt: n.created_at,
      config: NOTIFICATION_CONFIG[n.type as NotificationType] || NOTIFICATION_CONFIG.SYSTEM_ALERT,
    }));

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      unreadCount: unreadCount || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Notifications] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST: Manage Notifications
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, notificationId, type, message, data } = body;

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        message: 'Operation simulated (no database)',
      });
    }

    switch (action) {
      case 'markRead': {
        if (!notificationId) {
          return NextResponse.json({ success: false, error: 'notificationId required' }, { status: 400 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('notifications')
          .update({ read: true, updated_at: new Date().toISOString() })
          .eq('id', notificationId);

        return NextResponse.json({ success: true, message: 'Notification marked as read' });
      }

      case 'markAllRead': {
        if (!userId) {
          return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('notifications')
          .update({ read: true, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('read', false);

        return NextResponse.json({ success: true, message: 'All notifications marked as read' });
      }

      case 'create': {
        if (!userId || !type || !message) {
          return NextResponse.json({
            success: false,
            error: 'userId, type, and message are required',
          }, { status: 400 });
        }

        const notifId = `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('notifications')
          .insert({
            id: notifId,
            user_id: userId,
            type,
            message,
            data: data || {},
            read: false,
            created_at: new Date().toISOString(),
          });

        return NextResponse.json({
          success: true,
          notificationId: notifId,
          message: 'Notification created',
        });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('[Notifications] POST Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
