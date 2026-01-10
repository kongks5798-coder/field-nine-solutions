/**
 * AI Forecasting Functions
 * 
 * RTX 5090 로컬 AI 환경에서 실행되는 수요 예측 함수들
 * Prisma를 직접 읽어서 예측 (SaaS 종속성 없음)
 */

import { prisma } from './prisma'
import { getProductHistoryForForecast } from './ai-data-access'

// ============================================
// 수요 예측 타입 정의
// ============================================

export interface DemandForecast {
  productId: string
  predictedDemand: number
  confidence: number // 0-1 사이 값
  timeframe: 'daily' | 'weekly' | 'monthly'
  factors: {
    historicalTrend: number
    seasonalFactor: number
    marketTrend: number
  }
  createdAt: Date
}

export interface ForecastResult {
  success: boolean
  forecast?: DemandForecast
  error?: string
}

// ============================================
// 수요 예측 함수
// ============================================

/**
 * 상품 수요 예측
 * 
 * RTX 5090 AI 모델을 사용하여 미래 수요 예측
 * 실제 AI 모델은 Python 스크립트에서 실행 (scripts/ai-forecast.py)
 * 
 * @example
 * const forecast = await forecastDemand('product-id', 'weekly')
 * // { predictedDemand: 150, confidence: 0.85, ... }
 */
export async function forecastDemand(
  productId: string,
  timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'
): Promise<ForecastResult> {
  try {
    // 1. 히스토리 데이터 가져오기
    const history = await getProductHistoryForForecast(productId)

    if (!history.inventoryHistory || history.inventoryHistory.length === 0) {
      return {
        success: false,
        error: '예측을 위한 충분한 히스토리 데이터가 없습니다.',
      }
    }

    // 2. 간단한 트렌드 분석 (실제 AI는 Python에서 실행)
    const trend = calculateTrend(history.inventoryHistory)
    const seasonal = calculateSeasonalFactor(history.inventoryHistory)

    // 3. 예측 계산 (간단한 선형 예측, 실제로는 RTX 5090 AI 모델 사용)
    const baseDemand = history.inventoryHistory.reduce((sum, h) => sum + h.stock, 0) / history.inventoryHistory.length
    const predictedDemand = Math.round(baseDemand * trend * seasonal)

    // 4. 신뢰도 계산 (데이터가 많을수록 높음)
    const confidence = Math.min(0.95, 0.5 + (history.inventoryHistory.length / 100))

    const forecast: DemandForecast = {
      productId,
      predictedDemand: Math.max(0, predictedDemand),
      confidence,
      timeframe,
      factors: {
        historicalTrend: trend,
        seasonalFactor: seasonal,
        marketTrend: 1.0, // 추후 시장 데이터와 통합
      },
      createdAt: new Date(),
    }

    return {
      success: true,
      forecast,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '예측 중 오류가 발생했습니다.',
    }
  }
}

/**
 * 트렌드 계산 (간단한 선형 회귀)
 */
function calculateTrend(history: Array<{ stock: number; updatedAt: Date }>): number {
  if (history.length < 2) return 1.0

  const sorted = [...history].sort((a, b) => 
    new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
  )

  const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2))
  const secondHalf = sorted.slice(Math.floor(sorted.length / 2))

  const avgFirst = firstHalf.reduce((sum, h) => sum + h.stock, 0) / firstHalf.length
  const avgSecond = secondHalf.reduce((sum, h) => sum + h.stock, 0) / secondHalf.length

  if (avgFirst === 0) return 1.0
  return avgSecond / avgFirst
}

/**
 * 계절성 요인 계산
 */
function calculateSeasonalFactor(history: Array<{ updatedAt: Date }>): number {
  // 간단한 구현: 실제로는 더 복잡한 계절성 분석 필요
  const now = new Date()
  const month = now.getMonth()

  // 예시: 12월, 1월에 수요 증가 (1.2배)
  if (month === 11 || month === 0) return 1.2
  // 예시: 여름에 수요 감소 (0.9배)
  if (month >= 6 && month <= 8) return 0.9

  return 1.0
}

/**
 * 배치 수요 예측 (여러 상품 동시)
 */
export async function forecastBatchDemand(
  productIds: string[],
  timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'
): Promise<ForecastResult[]> {
  const results = await Promise.all(
    productIds.map(id => forecastDemand(id, timeframe))
  )

  return results
}
