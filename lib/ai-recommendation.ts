/**
 * AI Recommendation System
 * 
 * RTX 5090 로컬 AI 환경에서 실행되는 추천 시스템
 * 사용자 예산과 기록을 기반으로 기능 추천
 */

import { prisma } from './prisma'
import { getFeatureDataForRecommendation, getActiveFeaturePatterns } from './ai-data-access'

// ============================================
// 추천 시스템 타입 정의
// ============================================

export interface FeatureRecommendation {
  featureId: string
  featureName: string
  monthlyFee: number
  score: number // 0-100 점수
  reason: string // 추천 이유
  priority: 'high' | 'medium' | 'low'
}

export interface RecommendationResult {
  userId?: string
  monthlyBudget: number
  recommendations: FeatureRecommendation[]
  totalCost: number
  remainingBudget: number
  confidence: number
}

// ============================================
// 추천 시스템 함수
// ============================================

/**
 * 기능 추천 엔진
 * 
 * 사용자 예산과 기록을 기반으로 최적의 기능 조합 추천
 * RTX 5090 AI를 사용하여 패턴 분석
 * 
 * @example
 * const result = await recommendFeatures(100000, 'user-id')
 * // { recommendations: [...], totalCost: 80000, ... }
 */
export async function recommendFeatures(
  monthlyBudget: number,
  userId?: string
): Promise<RecommendationResult> {
  try {
    // 1. 모든 기능 데이터 가져오기
    const allFeatures = await getFeatureDataForRecommendation()

    // 2. 활성화된 기능 패턴 분석
    const patterns = await getActiveFeaturePatterns()

    // 3. 사용자별 추천 점수 계산
    const scoredFeatures: FeatureRecommendation[] = allFeatures.map((feature: any) => {
      const score = calculateFeatureScore(feature, patterns, monthlyBudget, userId)
      return {
        ...feature,
        score,
        reason: generateRecommendationReason(feature, score, monthlyBudget),
        priority: (score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      }
    })

    // 4. 예산 내에서 최적 조합 선택
    const recommendations = selectOptimalFeatures(scoredFeatures, monthlyBudget)

    // 5. 총 비용 계산
    const totalCost = recommendations.reduce((sum, r) => sum + r.monthlyFee, 0)

    return {
      userId,
      monthlyBudget,
      recommendations,
      totalCost,
      remainingBudget: monthlyBudget - totalCost,
      confidence: calculateConfidence(recommendations, allFeatures),
    }
  } catch (error) {
    console.error('추천 시스템 오류:', error)
    return {
      monthlyBudget,
      recommendations: [],
      totalCost: 0,
      remainingBudget: monthlyBudget,
      confidence: 0,
    }
  }
}

/**
 * 기능 점수 계산
 */
function calculateFeatureScore(
  feature: { featureId: string; featureName: string; monthlyFee: number; isActive: boolean },
  patterns: Awaited<ReturnType<typeof getActiveFeaturePatterns>>,
  monthlyBudget: number,
  userId?: string
): number {
  let score = 50 // 기본 점수

  // 1. 가격 대비 가치 (예산 내에 있으면 점수 증가)
  if (feature.monthlyFee <= monthlyBudget * 0.3) {
    score += 20
  } else if (feature.monthlyFee <= monthlyBudget * 0.5) {
    score += 10
  }

  // 2. 이미 활성화된 기능은 점수 감소 (중복 방지)
  if (feature.isActive) {
    score -= 30
  }

  // 3. 패턴 분석 (다른 사용자들이 많이 사용하는 기능)
  const popularFeature = patterns.features.find((f: any) => f.featureId === feature.featureId)
  if (popularFeature) {
    score += 15
  }

  // 4. 기능 이름 기반 추천 (AI 관련 기능 우선)
  if (feature.featureName.toLowerCase().includes('ai') || 
      feature.featureName.toLowerCase().includes('자동')) {
    score += 10
  }

  // 5. RTX 5090 최적화 기능 우선
  if (feature.featureId.includes('forecast') || 
      feature.featureId.includes('optimization')) {
    score += 15
  }

  return Math.min(100, Math.max(0, score))
}

/**
 * 추천 이유 생성
 */
function generateRecommendationReason(
  feature: { featureName: string; monthlyFee: number },
  score: number,
  monthlyBudget: number
): string {
  const reasons: string[] = []

  if (score >= 70) {
    reasons.push('높은 추천 점수')
  }

  if (feature.monthlyFee <= monthlyBudget * 0.3) {
    reasons.push('예산 대비 합리적 가격')
  }

  if (feature.featureName.toLowerCase().includes('ai')) {
    reasons.push('RTX 5090 AI 최적화 기능')
  }

  return reasons.length > 0 
    ? reasons.join(', ')
    : '기본 추천 기능'
}

/**
 * 최적 기능 조합 선택 (그리디 알고리즘)
 */
function selectOptimalFeatures(
  scoredFeatures: FeatureRecommendation[],
  monthlyBudget: number
): FeatureRecommendation[] {
  // 점수 순으로 정렬
  const sorted = [...scoredFeatures].sort((a, b) => b.score - a.score)

  const selected: FeatureRecommendation[] = []
  let totalCost = 0

  for (const feature of sorted) {
    // 이미 활성화된 기능은 제외
    if (feature.priority === 'low') continue

    if (totalCost + feature.monthlyFee <= monthlyBudget) {
      selected.push(feature)
      totalCost += feature.monthlyFee
    }
  }

  return selected
}

/**
 * 신뢰도 계산
 */
function calculateConfidence(
  recommendations: FeatureRecommendation[],
  allFeatures: Awaited<ReturnType<typeof getFeatureDataForRecommendation>>
): number {
  if (recommendations.length === 0) return 0

  const avgScore = recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length
  const coverage = recommendations.length / allFeatures.length

  return Math.min(1.0, (avgScore / 100) * 0.7 + coverage * 0.3)
}
