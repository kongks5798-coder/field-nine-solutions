/**
 * Prisma Helper Functions
 * 
 * KISS 원칙: 간단하고 명시적인 유틸리티 함수들
 * 보스님이 쉽게 사용할 수 있도록 최소한의 추상화
 */

import { prisma } from './prisma'

// ============================================
// Mall Inventory Helpers (쇼핑몰별 재고 분배)
// ============================================

/**
 * 상품의 쇼핑몰별 재고 조회
 * 
 * @example
 * const stocks = await getMallStocks('product-uuid-here')
 * // [{ mallName: '쿠팡', stock: 50 }, { mallName: '네이버', stock: 30 }]
 */
export async function getMallStocks(productId: string) {
  return prisma.mallInventory.findMany({
    where: { productId },
    select: {
      id: true,
      mallName: true,
      stock: true,
      updatedAt: true,
    },
    orderBy: { mallName: 'asc' },
  })
}

/**
 * 쇼핑몰별 재고 업데이트 (없으면 생성)
 * 
 * @example
 * await updateMallStock('product-uuid', '쿠팡', 50)
 */
export async function updateMallStock(
  productId: string,
  mallName: string,
  stock: number
) {
  return prisma.mallInventory.upsert({
    where: {
      productId_mallName: {
        productId,
        mallName,
      },
    },
    update: { stock },
    create: {
      productId,
      mallName,
      stock,
    },
  })
}

/**
 * 전체 재고 합계 계산 (모든 쇼핑몰 합계)
 * 
 * @example
 * const total = await getTotalMallStock('product-uuid')
 * // 80 (쿠팡 50 + 네이버 30)
 */
export async function getTotalMallStock(productId: string): Promise<number> {
  const result = await prisma.mallInventory.aggregate({
    where: { productId },
    _sum: { stock: true },
  })
  return result._sum.stock || 0
}

// ============================================
// Feature Subscription Helpers (기능 구독)
// ============================================

/**
 * 활성화된 기능 목록 조회
 * 
 * @example
 * const activeFeatures = await getActiveFeatures()
 * // [{ featureId: 'ai-forecast', featureName: 'AI 수요예측', monthlyFee: 59000 }]
 */
export async function getActiveFeatures() {
  return prisma.featureSubscription.findMany({
    where: { isActive: true },
    select: {
      featureId: true,
      featureName: true,
      monthlyFee: true,
    },
    orderBy: { featureName: 'asc' },
  })
}

/**
 * 기능 활성화/비활성화 토글
 * 
 * @example
 * await toggleFeature('ai-forecast', true) // 활성화
 * await toggleFeature('ai-forecast', false) // 비활성화
 */
export async function toggleFeature(featureId: string, isActive: boolean) {
  return prisma.featureSubscription.update({
    where: { featureId },
    data: { isActive },
  })
}

/**
 * 월 구독료 총액 계산 (활성화된 기능만)
 * 
 * @example
 * const total = await getTotalMonthlyFee()
 * // 118000 (여러 기능의 합계)
 */
export async function getTotalMonthlyFee(): Promise<number> {
  const result = await prisma.featureSubscription.aggregate({
    where: { isActive: true },
    _sum: { monthlyFee: true },
  })
  return result._sum.monthlyFee || 0
}
