/**
 * AI Feature Recommendation API Route
 * 
 * 기능 추천 API 엔드포인트
 * POST /api/ai/recommend-features
 */

import { NextRequest, NextResponse } from 'next/server'
import { recommendFeatures } from '@/lib/ai-recommendation'
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
    const { monthlyBudget, userId } = body

    if (!monthlyBudget || monthlyBudget <= 0) {
      return NextResponse.json(
        { success: false, error: '유효한 monthlyBudget이 필요합니다.' },
        { status: 400 }
      )
    }

    const result = await recommendFeatures(monthlyBudget, userId)

    logger.info('기능 추천 완료', { 
      userId, 
      monthlyBudget, 
      recommendationsCount: result.recommendations.length 
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    logger.error('기능 추천 API 오류', error as Error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
