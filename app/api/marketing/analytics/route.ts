import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Field Nine: 통합 마케팅 분석 API
 * 
 * ClickHouse에서 집계된 데이터를 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (!session || sessionError) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();
    const platform = searchParams.get('platform'); // optional filter

    // TODO: ClickHouse 쿼리
    // const query = `
    //   SELECT
    //     platform,
    //     sum(impressions) as impressions,
    //     sum(clicks) as clicks,
    //     sum(spend) as spend,
    //     sum(conversions) as conversions,
    //     sum(revenue) as revenue,
    //     sum(revenue) / sum(spend) as roas
    //   FROM fieldnine_analytics.marketing_facts_daily
    //   WHERE tenant_id = {tenantId:UUID}
    //     AND date >= {startDate:Date}
    //     AND date <= {endDate:Date}
    //     ${platform ? `AND platform = '${platform}'` : ''}
    //   GROUP BY platform
    //   ORDER BY spend DESC
    // `;

    // 임시: Mock 데이터
    const mockData = {
      summary: {
        totalImpressions: 1250000,
        totalClicks: 12500,
        totalSpend: 1250000,
        totalConversions: 1250,
        totalRevenue: 2500000,
        overallROAS: 2.0,
      },
      byPlatform: [
        {
          platform: 'meta',
          impressions: 500000,
          clicks: 5000,
          spend: 500000,
          conversions: 500,
          revenue: 1000000,
          roas: 2.0,
        },
        {
          platform: 'google',
          impressions: 400000,
          clicks: 4000,
          spend: 400000,
          conversions: 400,
          revenue: 800000,
          roas: 2.0,
        },
        {
          platform: 'naver',
          impressions: 300000,
          clicks: 3000,
          spend: 300000,
          conversions: 300,
          revenue: 600000,
          roas: 2.0,
        },
        {
          platform: 'cafe24',
          impressions: 50000,
          clicks: 500,
          spend: 50000,
          conversions: 50,
          revenue: 100000,
          roas: 2.0,
        },
      ],
      trends: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        impressions: Math.floor(Math.random() * 50000) + 30000,
        clicks: Math.floor(Math.random() * 500) + 300,
        spend: Math.floor(Math.random() * 50000) + 30000,
        revenue: Math.floor(Math.random() * 100000) + 60000,
      })),
    };

    return NextResponse.json({
      success: true,
      data: mockData,
    });
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: '분석 데이터 조회 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
