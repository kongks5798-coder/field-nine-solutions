/**
 * AI Pricing Optimization API Route
 * 
 * 가격 최적화 API 엔드포인트
 * POST /api/ai/optimize-pricing
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server'
import { optimizePricing, PricingStrategy } from '@/lib/ai-pricing'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/src/utils/logger'

export async function POST(request: NextRequest) {
  try {
    // 인증 체크
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }
    const body = await request.json()
    const { productId, strategy } = body

    if (!productId || !strategy) {
      return NextResponse.json(
        { success: false, error: 'productId와 strategy가 필요합니다.' },
        { status: 400 }
      )
    }

    const result = await optimizePricing(productId, strategy as PricingStrategy)

    if (!result) {
      return NextResponse.json(
        { success: false, error: '가격 최적화에 실패했습니다.' },
        { status: 400 }
      )
    }

    logger.info('가격 최적화 완료', { 
      productId, 
      suggestedPrice: result.suggestedPrice,
      priceChangePercent: result.priceChangePercent 
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    logger.error('가격 최적화 API 오류', error as Error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
