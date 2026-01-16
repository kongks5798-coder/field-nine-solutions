/**
 * Panopticon Sales Alerts API
 * 매출 알림 조회, 관리, 설정
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkSalesAlerts,
  getAlerts,
  markAlertRead,
  markAllAlertsRead,
  deleteAlert,
  clearAlerts,
  getThresholds,
  updateThresholds,
  getWebhooks,
  addWebhook,
  removeWebhook,
  generateDailySummary,
  getAlertStats,
} from '@/lib/notifications/sales-alerts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================
// GET: 알림 조회
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';

    switch (action) {
      case 'check': {
        // 새 알림 체크 및 생성
        const newAlerts = await checkSalesAlerts();
        return NextResponse.json({
          success: true,
          newAlerts,
          newCount: newAlerts.length,
        });
      }

      case 'stats': {
        // 알림 통계
        const stats = getAlertStats();
        return NextResponse.json({
          success: true,
          stats,
        });
      }

      case 'thresholds': {
        // 임계값 설정 조회
        const thresholds = getThresholds();
        return NextResponse.json({
          success: true,
          thresholds,
        });
      }

      case 'webhooks': {
        // 웹훅 설정 조회
        const webhooks = getWebhooks();
        return NextResponse.json({
          success: true,
          webhooks,
        });
      }

      case 'summary': {
        // 일일 요약 생성
        const summary = await generateDailySummary();
        return NextResponse.json({
          success: true,
          summary,
        });
      }

      case 'list':
      default: {
        // 알림 목록 조회
        const unreadOnly = searchParams.get('unreadOnly') === 'true';
        const type = searchParams.get('type') as any;
        const priority = searchParams.get('priority') as any;
        const limit = parseInt(searchParams.get('limit') || '50');

        const alerts = getAlerts({ unreadOnly, type, priority, limit });
        const stats = getAlertStats();

        return NextResponse.json({
          success: true,
          alerts,
          total: stats.total,
          unread: stats.unread,
        });
      }
    }
  } catch (error) {
    console.error('[Alerts API] GET Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알림 조회 실패',
      },
      { status: 500 }
    );
  }
}

// ============================================
// POST: 알림 생성 및 설정 변경
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'markRead': {
        // 알림 읽음 처리
        if (body.alertId) {
          const result = markAlertRead(body.alertId);
          return NextResponse.json({
            success: result,
            message: result ? '알림을 읽음 처리했습니다' : '알림을 찾을 수 없습니다',
          });
        }
        break;
      }

      case 'markAllRead': {
        // 모든 알림 읽음 처리
        const count = markAllAlertsRead();
        return NextResponse.json({
          success: true,
          message: `${count}개의 알림을 읽음 처리했습니다`,
          count,
        });
      }

      case 'delete': {
        // 알림 삭제
        if (body.alertId) {
          const result = deleteAlert(body.alertId);
          return NextResponse.json({
            success: result,
            message: result ? '알림이 삭제되었습니다' : '알림을 찾을 수 없습니다',
          });
        }
        break;
      }

      case 'clearAll': {
        // 모든 알림 삭제
        const count = clearAlerts();
        return NextResponse.json({
          success: true,
          message: `${count}개의 알림이 삭제되었습니다`,
          count,
        });
      }

      case 'updateThresholds': {
        // 임계값 업데이트
        if (body.thresholds) {
          const updated = updateThresholds(body.thresholds);
          return NextResponse.json({
            success: true,
            message: '임계값이 업데이트되었습니다',
            thresholds: updated,
          });
        }
        break;
      }

      case 'addWebhook': {
        // 웹훅 추가
        if (body.webhook) {
          const webhook = addWebhook(body.webhook);
          return NextResponse.json({
            success: true,
            message: '웹훅이 추가되었습니다',
            webhook,
          });
        }
        break;
      }

      case 'removeWebhook': {
        // 웹훅 제거
        if (body.webhookUrl) {
          const result = removeWebhook(body.webhookUrl);
          return NextResponse.json({
            success: result,
            message: result ? '웹훅이 제거되었습니다' : '웹훅을 찾을 수 없습니다',
          });
        }
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: '알 수 없는 액션입니다' },
          { status: 400 }
        );
    }

    return NextResponse.json(
      { success: false, error: '필수 파라미터가 누락되었습니다' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Alerts API] POST Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '작업 실패',
      },
      { status: 500 }
    );
  }
}
