import { NextRequest, NextResponse } from 'next/server';
import {
  getDashboardData,
  checkLocalServerConnection,
  formatKRW,
  calculatePercentChange,
  calculateDDay,
} from '@/lib/panopticon';

/**
 * GET /api/panopticon/dashboard
 * 대시보드 전체 데이터 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 데이터 수집 (병렬 처리)
    const [dashboardData, serverConnection] = await Promise.all([
      getDashboardData(),
      checkLocalServerConnection(),
    ]);

    // 프론트엔드용 데이터 가공
    const response = {
      success: true,
      data: {
        // 재무 섹션
        financial: {
          monthlyRevenue: {
            value: formatKRW(dashboardData.financial.monthlyRevenue),
            raw: dashboardData.financial.monthlyRevenue,
            change: calculatePercentChange(
              dashboardData.financial.monthlyRevenue,
              dashboardData.financial.previousMonthRevenue
            ),
            targetAchievement: Math.round(
              (dashboardData.financial.monthlyRevenue /
                dashboardData.financial.targetRevenue) *
                100
            ),
          },
          operatingMargin: {
            value: `${dashboardData.financial.operatingMargin}%`,
            raw: dashboardData.financial.operatingMargin,
          },
          fixedExpenses: {
            value: formatKRW(
              Object.values(dashboardData.financial.fixedExpenses).reduce(
                (a, b) => a + b,
                0
              )
            ),
            breakdown: dashboardData.financial.fixedExpenses,
          },
        },

        // 무신사 섹션
        musinsa: {
          ranking: {
            overall: dashboardData.musinsa.ranking.overallRank,
            category: dashboardData.musinsa.ranking.categoryRank,
            categoryName: dashboardData.musinsa.ranking.category,
            change: dashboardData.musinsa.ranking.change,
            changeAmount: dashboardData.musinsa.ranking.changeAmount,
          },
          sales: {
            total: formatKRW(dashboardData.musinsa.sales.totalSales),
            today: formatKRW(dashboardData.musinsa.sales.todaySales),
            settlement: formatKRW(dashboardData.musinsa.sales.settlementAmount),
            pending: formatKRW(dashboardData.musinsa.sales.pendingSettlement),
          },
        },

        // CS 섹션
        cs: {
          total: dashboardData.cs.totalCases,
          pending: dashboardData.cs.pendingCases,
          urgent: dashboardData.cs.urgentCases,
          today: dashboardData.cs.todayCases,
          categories: dashboardData.cs.categories,
          status:
            dashboardData.cs.urgentCases > 5
              ? 'critical'
              : dashboardData.cs.urgentCases > 0
              ? 'warning'
              : 'normal',
        },

        // 서버 상태
        server: {
          name: dashboardData.server.name,
          status: dashboardData.server.status,
          cpu: dashboardData.server.cpuUsage,
          memory: dashboardData.server.memoryUsage,
          gpu: dashboardData.server.gpuUsage,
          temperature: dashboardData.server.temperature,
          uptime: Math.floor(dashboardData.server.uptime / 86400), // days
        },

        // 생산 현황
        production: dashboardData.production.map((item) => ({
          brand: item.brand,
          item: item.item,
          status: item.status,
          progress: item.progress,
          quantity: item.quantity,
          dDay: calculateDDay(item.dueDate),
          notes: item.notes,
        })),
      },

      // 메타 정보
      meta: {
        isLive: dashboardData.isLive,
        serverConnected: serverConnection.connected,
        serverLatency: serverConnection.latency,
        lastUpdated: dashboardData.lastUpdated.toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Dashboard API] 데이터 조회 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '데이터 조회 중 오류가 발생했습니다.',
        data: null,
        meta: {
          isLive: false,
          serverConnected: false,
          lastUpdated: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
