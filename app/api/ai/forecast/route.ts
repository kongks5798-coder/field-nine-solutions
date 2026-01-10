/**
 * AI Forecast API Route
 * 
 * 수요 예측 API 엔드포인트
 * GET /api/ai/forecast?productId=xxx&timeframe=weekly
 */

import { NextRequest, NextResponse } from 'next/server'
import { forecastDemand } from '@/lib/ai-forecasting'
import { auth } from '@/lib/auth'
import { logger } from '@/src/utils/logger'

export async function GET(request: NextRequest) {
  try {
    // 인증 체크
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('productId')
    const timeframe = (searchParams.get('timeframe') || 'weekly') as 'daily' | 'weekly' | 'monthly'

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'productId가 필요합니다.' },
        { status: 400 }
      )
    }

    const result = await forecastDemand(productId, timeframe)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    logger.info('수요 예측 완료', { productId, timeframe, predictedDemand: result.forecast?.predictedDemand })

    return NextResponse.json(result)
  } catch (error) {
    logger.error('수요 예측 API 오류', error as Error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
