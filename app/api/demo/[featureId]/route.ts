import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Demo API - Interactive Feature Demos
 * Mock data for 8 core features
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ featureId: string }> }
) {
  try {
    const { featureId } = await params;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const demos: Record<string, any> = {
      inventory: {
        success: true,
        feature: '재고 자동 관리',
        featureEn: 'Automated Inventory',
        data: {
          currentStock: 1250,
          predictedDemand: 1800,
          accuracy: '98%',
          lowStockAlerts: 3,
          autoRestock: true,
          timeSaved: '90%',
        },
        message: '재고 예측 완료: 다음 주 수요 1,800개 예상',
        messageEn: 'Inventory forecast complete: 1,800 units expected next week',
      },
      orders: {
        success: true,
        feature: '주문 자동 처리',
        featureEn: 'Automated Orders',
        data: {
          totalOrders: 1250,
          processed: 1250,
          syncTime: '0.1s',
          platforms: ['쿠팡', '네이버쇼핑', '11번가'],
          platformsEn: ['Coupang', 'Naver Shopping', '11st'],
          automationRate: '100%',
        },
        message: '모든 주문이 0.1초 내 동기화되었습니다',
        messageEn: 'All orders synced within 0.1 seconds',
      },
      revenue: {
        success: true,
        feature: '수익 최적화',
        featureEn: 'Revenue Optimization',
        data: {
          currentRevenue: 12500000,
          optimizedRevenue: 15375000,
          increase: '23%',
          priceAdjustments: 45,
          feeSavings: 125000,
        },
        message: 'AI 가격 조정으로 수익이 23% 증가했습니다',
        messageEn: 'Revenue increased by 23% with AI price adjustments',
      },
      cost: {
        success: true,
        feature: '비용 절감',
        featureEn: 'Cost Reduction',
        data: {
          previousCost: 10000,
          currentCost: 200,
          reduction: '98%',
          rtx5090Enabled: true,
          localAIProcessing: true,
          monthlySavings: 9800,
        },
        message: 'RTX 5090 로컬 AI로 월 비용이 $10,000에서 $200으로 감소',
        messageEn: 'Monthly costs reduced from $10,000 to $200 with RTX 5090 local AI',
      },
      security: {
        success: true,
        feature: '엔터프라이즈 보안',
        featureEn: 'Enterprise Security',
        data: {
          uptime: '99.9%',
          encryption: 'End-to-end',
          rlsEnabled: true,
          autoBackup: true,
          lastBackup: new Date().toISOString(),
          securityScore: 98,
        },
        message: '모든 보안 시스템이 정상 작동 중입니다',
        messageEn: 'All security systems operational',
      },
      analytics: {
        success: true,
        feature: '실시간 분석',
        featureEn: 'Real-time Analytics',
        data: {
          realTimeUpdates: true,
          dataPoints: 125000,
          chartsGenerated: 12,
          customReports: 5,
          lastUpdate: new Date().toISOString(),
        },
        message: '125,000개 데이터 포인트가 실시간으로 분석 중',
        messageEn: '125,000 data points being analyzed in real-time',
      },
      ai: {
        success: true,
        feature: 'AI 자동화',
        featureEn: 'AI Automation',
        data: {
          accuracy: '98%',
          predictionsMade: 1250,
          optimizationsApplied: 45,
          trendsDetected: 8,
          automationRate: '100%',
        },
        message: 'AI가 1,250개의 예측을 수행하고 45개의 최적화를 적용했습니다',
        messageEn: 'AI performed 1,250 predictions and applied 45 optimizations',
      },
      integration: {
        success: true,
        feature: '멀티채널 통합',
        featureEn: 'Multi-channel Integration',
        data: {
          connectedChannels: ['쿠팡', '11번가', '네이버쇼핑', '스마트스토어'],
          connectedChannelsEn: ['Coupang', '11st', 'Naver Shopping', 'SmartStore'],
          syncStatus: 'Active',
          apiCalls: 12500,
          successRate: '99.9%',
        },
        message: '4개 채널이 실시간으로 동기화 중입니다',
        messageEn: '4 channels syncing in real-time',
      },
    };

    const demo = demos[featureId];

    if (!demo) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Feature not found',
          errorKo: '기능을 찾을 수 없습니다'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(demo, { status: 200 });
  } catch (error) {
    console.error('[Demo API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        errorKo: '서버 오류가 발생했습니다'
      },
      { status: 500 }
    );
  }
}
