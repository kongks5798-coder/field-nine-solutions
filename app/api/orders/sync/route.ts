import { createClient } from '@/src/utils/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '@/src/utils/logger';
import { decrypt } from '@/src/utils/security';

/**
 * 주문 동기화 API
 * Python 크롤러가 보낸 주문 JSON 데이터를 받아서 DB에 저장(Upsert)
 * 
 * POST /api/orders/sync
 * 
 * 인증:
 * - 방법 1: 세션 기반 (브라우저에서 호출)
 * - 방법 2: API Key 기반 (Python 서버에서 호출)
 *   Header: X-API-Key: {api_key}
 * 
 * Body: {
 *   orders: OrderData[],
 *   store_id?: string
 * }
 */

interface OrderItemData {
  product_sku: string; // 상품 SKU (products 테이블과 매칭)
  product_name: string; // 상품명 (스냅샷)
  quantity: number; // 주문 수량
  unit_price: number; // 주문 당시 단가 (스냅샷)
  unit_cost?: number; // 주문 당시 원가 (스냅샷, 순이익 계산용)
  option_name?: string; // 옵션명 (예: "색상: 빨강, 사이즈: L")
}

interface OrderData {
  market_order_id: string; // 마켓측 주문번호 (필수, unique)
  store_id?: string; // 스토어 ID (선택)
  order_date: string; // 주문 일시 (ISO 8601)
  customer_name: string; // 고객 이름
  total_amount: number; // 주문 총액
  status?: 'PAID' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'; // 주문 상태
  tracking_number?: string; // 송장번호
  items: OrderItemData[]; // 주문 상세 품목
}

/**
 * API Key 기반 인증
 */
async function authenticateByApiKey(
  request: NextRequest,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ userId: string; storeId?: string } | null> {
  const apiKey = request.headers.get('X-API-Key');
  
  if (!apiKey) {
    return null;
  }

  try {
    // stores 테이블에서 모든 활성 스토어 조회 (암호화된 키와 비교하기 위해)
    const { data: stores, error } = await supabase
      .from('stores')
      .select('id, user_id, is_active, api_key')
      .eq('is_active', true);

    if (error || !stores) {
      logger.warn('[Orders Sync] 스토어 조회 실패');
      return null;
    }

    // 암호화된 API Key와 비교
    let store = null;
    for (const s of stores) {
      if (s.api_key) {
        try {
          const decryptedKey = decrypt(s.api_key);
          if (decryptedKey === apiKey) {
            store = s;
            break;
          }
        } catch (err) {
          // 복호화 실패 시 다음 스토어로
          continue;
        }
      }
    }

    if (!store) {
      logger.warn('[Orders Sync] API Key 인증 실패:', { apiKey: apiKey.substring(0, 4) + '...' });
      return null;
    }

    return {
      userId: store.user_id,
      storeId: store.id,
    };
  } catch (error) {
    logger.error('[Orders Sync] API Key 인증 오류:', error as Error);
    return null;
  }
}

/**
 * 세션 기반 인증
 */
async function authenticateBySession(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ userId: string } | null> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (!session || sessionError) {
    if (sessionError) {
      logger.error('[Orders Sync] 세션 인증 오류:', sessionError as Error);
    }
    return null;
  }

  return {
    userId: session.user.id,
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증: API Key 우선, 없으면 세션
    let authResult = await authenticateByApiKey(request, supabase);
    if (!authResult) {
      authResult = await authenticateBySession(supabase);
    }

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. API Key or session required.' },
        { status: 401 }
      );
    }

    const { userId, storeId: defaultStoreId } = authResult;

    // 요청 본문 파싱
    const body = await request.json();
    const { orders, store_id } = body;

    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: orders array is required and must not be empty' },
        { status: 400 }
      );
    }

    // 스토어 확인 (store_id가 제공된 경우)
    const finalStoreId = store_id || defaultStoreId;
    if (finalStoreId) {
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id, user_id')
        .eq('id', finalStoreId)
        .eq('user_id', userId)
        .single();

      if (storeError || !store) {
        logger.error('[Orders Sync] 스토어 확인 오류:', storeError);
        return NextResponse.json(
          { success: false, error: 'Store not found or access denied' },
          { status: 404 }
        );
      }
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // 각 주문을 Upsert
    for (const orderData of orders) {
      try {
        // 1. 주문 Upsert (market_order_id가 같으면 업데이트)
        const orderPayload: any = {
          user_id: userId,
          market_order_id: orderData.market_order_id,
          order_date: orderData.order_date || new Date().toISOString(),
          customer_name: orderData.customer_name,
          total_amount: orderData.total_amount,
          total_cost: 0, // order_items 처리 후 업데이트됨
          status: orderData.status || 'PAID',
          tracking_number: orderData.tracking_number || null,
        };

        if (finalStoreId) {
          orderPayload.store_id = finalStoreId;
        }

        // Upsert 주문 (user_id + market_order_id가 unique)
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .upsert(orderPayload, {
            onConflict: 'user_id,market_order_id',
            ignoreDuplicates: false,
          })
          .select()
          .single();

        if (orderError) {
          throw new Error(`Order upsert failed: ${orderError.message}`);
        }

        if (!order) {
          throw new Error('Order upsert returned no data');
        }

        // 2. 주문 상세 품목 처리
        if (orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0) {
          // 기존 주문 상세 삭제 (전체 교체 방식)
          await supabase
            .from('order_items')
            .delete()
            .eq('order_id', order.id);

          // 상품 정보 조회 (SKU로 매칭)
          const skus = orderData.items
            .map((item: OrderItemData) => item.product_sku)
            .filter(Boolean);

          let productMap = new Map<string, { id: string }>();

          if (skus.length > 0) {
            const { data: products } = await supabase
              .from('products')
              .select('id, sku')
              .eq('user_id', userId)
              .in('sku', skus);

            productMap = new Map(
              products?.map((p) => [p.sku, { id: p.id }]) || []
            );
          }

          // 주문 상세 품목 생성 및 total_cost 계산
          let orderTotalCost = 0;
          const orderItems = orderData.items.map((item: OrderItemData) => {
            const product = productMap.get(item.product_sku);
            
            // unit_cost 계산: 상품이 있으면 products 테이블에서 가져오고, 없으면 0
            let unitCost = 0;
            if (product?.id) {
              // products 테이블에서 cost_price 조회
              // (실제로는 별도 쿼리 필요하지만, 성능을 위해 여기서는 0으로 설정)
              // 추후 개선: products 테이블 조회 추가
            }
            // unit_cost가 OrderItemData에 있으면 사용
            if (item.unit_cost !== undefined) {
              unitCost = item.unit_cost;
            }
            
            const itemTotalCost = unitCost * item.quantity;
            orderTotalCost += itemTotalCost;

            return {
              order_id: order.id,
              product_id: product?.id || null, // 상품이 없어도 주문 기록은 유지
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              option_name: item.option_name || null,
            };
          });
          
          // orders 테이블의 total_cost 업데이트
          await supabase
            .from('orders')
            .update({ total_cost: orderTotalCost })
            .eq('id', order.id);

          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

          if (itemsError) {
            throw new Error(`Order items insert failed: ${itemsError.message}`);
          }
        }

        results.success++;
        logger.info('[Orders Sync] 주문 동기화 성공:', {
          order_id: order.id,
          market_order_id: orderData.market_order_id,
        });
      } catch (error: unknown) {
        const err = error as { message?: string };
        results.failed++;
        const errorMessage = err.message || 'Unknown error';
        results.errors.push(`${orderData.market_order_id}: ${errorMessage}`);
        logger.error('[Orders Sync] 주문 동기화 실패:', err as Error);
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        total: orders.length,
        success: results.success,
        failed: results.failed,
        errors: results.errors,
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    logger.error('[Orders Sync] 예상치 못한 오류:', err as Error);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
