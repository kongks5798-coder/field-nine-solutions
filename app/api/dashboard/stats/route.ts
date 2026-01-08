import { createClient } from '@/src/utils/supabase/server';
import { NextResponse } from 'next/server';
import { logger } from '@/src/utils/logger';
import type { DashboardStatsData } from '@/src/types';

/**
 * 대시보드 통계 API
 * SQL 집계를 사용하여 정확한 통계 데이터 반환
 * 
 * GET /api/dashboard/stats?start_date=2024-01-01&end_date=2024-01-31&store_id=uuid
 * 
 * 반환 데이터: DashboardStatsData 타입
 */

/**
 * 플랫폼별 수수료율 (하드코딩, 추후 설정 가능하게 구조화)
 * TODO: stores 테이블에 commission_rate 컬럼 추가하여 유저별 설정 가능하게
 */
const PLATFORM_COMMISSION_RATES: Record<string, number> = {
  naver: 0.05,    // 네이버 5%
  coupang: 0.10,  // 쿠팡 10%
  '11st': 0.08,   // 11번가 8%
  gmarket: 0.08, // 지마켓 8%
  auction: 0.08, // 옥션 8%
  shopify: 0.02,  // 쇼피파이 2%
  woocommerce: 0.00, // 우커머스 0% (자체 플랫폼)
  custom: 0.00, // 커스텀 0%
};

/**
 * 주문의 순수익 계산
 * 순수익 = 매출 - (원가 + 마켓수수료 + 배송비)
 * 
 * @param totalAmount 주문 총액
 * @param totalCost 원가
 * @param platform 플랫폼 (naver, coupang 등)
 * @param shippingFee 배송비 (기본값 0)
 * @returns 순수익
 */
function calculateNetProfit(
  totalAmount: number,
  totalCost: number,
  platform: string | null,
  shippingFee: number = 0
): number {
  const commissionRate = platform ? (PLATFORM_COMMISSION_RATES[platform] || 0) : 0;
  const platformFee = totalAmount * commissionRate;
  return totalAmount - totalCost - platformFee - shippingFee;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 세션 확인
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (!session || sessionError) {
      if (sessionError) {
        logger.error('[Dashboard Stats] 인증 오류:', sessionError as Error);
      }
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');
    const storeId = searchParams.get('store_id');

    // 날짜 범위 설정 (기본값: 최근 7일)
    const end = endDateParam ? new Date(endDateParam) : new Date();
    const start = startDateParam ? new Date(startDateParam) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 오늘 날짜 설정
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // 1. 전체 주문 조회 (기간 내) - stores 테이블과 조인하여 platform 정보 가져오기
    // stores는 left join으로 처리 (store_id가 없어도 주문은 포함)
    let ordersQuery = supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        total_cost,
        status,
        order_date,
        store_id,
        stores(platform)
      `)
      .eq('user_id', userId)
      .gte('order_date', start.toISOString())
      .lte('order_date', end.toISOString());

    if (storeId) {
      ordersQuery = ordersQuery.eq('store_id', storeId);
    }

    const { data: orders, error: ordersError } = await ordersQuery;

    if (ordersError) {
      logger.error('[Dashboard Stats] 주문 조회 오류:', ordersError as Error);
      throw ordersError;
    }

    // 2. SQL 집계: 일별 매출 및 주문수 (PostgreSQL GROUP BY 사용)
    const { data: dailyStats, error: dailyStatsError } = await supabase.rpc('get_daily_stats', {
      p_user_id: userId,
      p_start_date: start.toISOString(),
      p_end_date: end.toISOString(),
      p_store_id: storeId || null,
    });

    // RPC 함수가 없으면 직접 계산
    let dailyStatsMap = new Map<string, { orders_count: number; revenue: number; profit: number }>();
    
    if (dailyStatsError || !dailyStats) {
      // RPC 함수가 없으면 클라이언트 측에서 집계
      logger.warn('[Dashboard Stats] RPC 함수 없음, 클라이언트 측 집계 사용');
      
      orders?.forEach((order: any) => {
        const orderDate = new Date(order.order_date).toISOString().split('T')[0];
        const dailyStat = dailyStatsMap.get(orderDate) || { orders_count: 0, revenue: 0, profit: 0 };
        dailyStat.orders_count++;
        const totalAmount = Number(order.total_amount) || 0;
        const totalCost = Number(order.total_cost) || 0;
        const platform = order.stores?.platform || null;
        const netProfit = calculateNetProfit(totalAmount, totalCost, platform);
        dailyStat.revenue += totalAmount;
        dailyStat.profit += netProfit;
        dailyStatsMap.set(orderDate, dailyStat);
      });
    } else {
      // RPC 함수 결과 사용
      dailyStats.forEach((stat: any) => {
        dailyStatsMap.set(stat.date, {
          orders_count: stat.orders_count || 0,
          revenue: Number(stat.revenue) || 0,
          profit: Number(stat.profit) || 0,
        });
      });
    }

    // 누락된 날짜 채우기
    const dailyStatsArray: Array<{ date: string; orders_count: number; revenue: number; profit: number }> = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      const stat = dailyStatsMap.get(dateString) || { orders_count: 0, revenue: 0, profit: 0 };
      dailyStatsArray.push({
        date: dateString,
        ...stat,
      });
    }

    // 3. 상태별 주문수 집계
    const statusCounts: DashboardStatsData['orders']['by_status'] = {
      PAID: 0,
      PREPARING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    orders?.forEach(order => {
      const status = order.status as keyof typeof statusCounts;
      if (status in statusCounts) {
        statusCounts[status]++;
      } else {
        // 다른 상태도 허용
        (statusCounts as Record<string, number>)[status] = ((statusCounts as Record<string, number>)[status] || 0) + 1;
      }
    });

    // 4. 전체 통계 계산 (순수익 포함)
    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum, o: any) => sum + (Number(o.total_amount) || 0), 0) || 0;
    const totalCost = orders?.reduce((sum, o: any) => sum + (Number(o.total_cost) || 0), 0) || 0;
    
    // 플랫폼별 수수료 계산
    let totalPlatformFee = 0;
    orders?.forEach((order: any) => {
      const platform = order.stores?.platform || null;
      const commissionRate = platform ? (PLATFORM_COMMISSION_RATES[platform] || 0) : 0;
      totalPlatformFee += (Number(order.total_amount) || 0) * commissionRate;
    });
    
    // 순수익 = 매출 - (원가 + 마켓수수료 + 배송비)
    // 배송비는 현재 orders 테이블에 없으므로 0으로 가정 (추후 추가 가능)
    const totalShippingFee = 0; // TODO: orders 테이블에 shipping_fee 컬럼 추가 시 사용
    const totalNetProfit = totalRevenue - totalCost - totalPlatformFee - totalShippingFee;
    const profitRate = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;

    // 5. 오늘 날짜 통계
    const todayOrders = orders?.filter(order => {
      const orderDate = new Date(order.order_date);
      return orderDate >= today && orderDate < tomorrow;
    }) || [];

    // 오늘의 순수익 계산
    let todayRevenue = 0;
    let todayProfit = 0;
    todayOrders.forEach((order: any) => {
      const totalAmount = Number(order.total_amount) || 0;
      const totalCost = Number(order.total_cost) || 0;
      const platform = order.stores?.platform || null;
      todayRevenue += totalAmount;
      todayProfit += calculateNetProfit(totalAmount, totalCost, platform);
    });

    const todayStats = {
      orders_count: todayOrders.length,
      revenue: todayRevenue,
      profit: todayProfit,
      preparing: todayOrders.filter((o: any) => o.status === 'PREPARING').length,
      cancelled: todayOrders.filter((o: any) => o.status === 'CANCELLED').length,
    };

    // 6. 예상 정산금 (배송 완료된 주문의 총액)
    const expectedSettlement = orders
      ?.filter((o: any) => o.status === 'DELIVERED')
      .reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0) || 0;

    // 7. 재고 부족 상품 조회 (10개 미만)
    const { data: lowStockProducts, error: lowStockError } = await supabase
      .from('products')
      .select('id, name, sku, stock_quantity')
      .eq('user_id', userId)
      .lt('stock_quantity', 10)
      .order('stock_quantity', { ascending: true })
      .limit(10);

    if (lowStockError) {
      logger.warn('[Dashboard Stats] 재고 부족 상품 조회 오류:', lowStockError as Error);
    }

    // 8. DashboardStatsData 형식으로 응답 구성 (타입 안정성 보장)
    const responseData: DashboardStatsData = {
      period: {
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
        days: Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1,
      },
      orders: {
        total: totalOrders,
        by_status: {
          PAID: statusCounts.PAID || 0,
          PREPARING: statusCounts.PREPARING || 0,
          SHIPPED: statusCounts.SHIPPED || 0,
          DELIVERED: statusCounts.DELIVERED || 0,
          CANCELLED: statusCounts.CANCELLED || 0,
        },
      },
      revenue: {
        total_amount: totalRevenue,
        total_cost: totalCost,
        platform_fee: totalPlatformFee,
        shipping_fee: totalShippingFee,
        net_profit: totalNetProfit,
        profit_rate: profitRate,
      },
      daily_stats: dailyStatsArray,
      today: todayStats,
      expected_settlement: expectedSettlement,
      low_stock_products: (lowStockProducts || []).map((p: any) => ({
        id: p.id,
        name: p.name || '알 수 없음',
        sku: p.sku || 'N/A',
        stock_quantity: p.stock_quantity || 0,
      })),
    };

    logger.info('[Dashboard Stats] 통계 데이터 로드 성공', { userId, period: responseData.period });
    return NextResponse.json({ success: true, data: responseData }, { status: 200 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    logger.error('[Dashboard Stats] API 처리 중 오류:', err as Error);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
