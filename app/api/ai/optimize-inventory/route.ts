/**
 * AI Inventory Optimization API Route
 * 
 * 재고 최적화 API 엔드포인트
 * POST /api/ai/optimize-inventory
 */

import { NextRequest, NextResponse } from 'next/server'
import { optimizeInventoryDistribution, applyOptimalDistribution } from '@/lib/ai-optimization'
import { auth } from '@/lib/auth'
import { logger } from '@/src/utils/logger'

export async function POST(request: NextRequest) {
  try {
    // 인증 체크
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }
    const body = await request.json()
    const { productId, targetDistribution, autoApply = false } = body

    if (!productId || !targetDistribution) {
      return NextResponse.json(
        { success: false, error: 'productId와 targetDistribution이 필요합니다.' },
        { status: 400 }
      )
    }

    // 최적화 계산
    const suggestion = await optimizeInventoryDistribution(productId, targetDistribution)

    // 자동 적용 옵션
    if (autoApply && suggestion.canApply) {
      const applied = await applyOptimalDistribution(
        productId,
        suggestion.suggested.map(s => ({ mallName: s.mallName, stock: s.suggestedStock }))
      )

      logger.info('재고 최적화 자동 적용', { productId, applied })

      return NextResponse.json({
        success: true,
        suggestion,
        applied,
      })
    }

    logger.info('재고 최적화 계산 완료', { productId, canApply: suggestion.canApply })

    return NextResponse.json({
      success: true,
      suggestion,
    })
  } catch (error) {
    logger.error('재고 최적화 API 오류', error as Error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
