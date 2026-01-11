/**
 * AI Data Access Layer
 * 
 * 목적: RTX 5090 로컬 AI 환경에서 Prisma를 직접 읽을 수 있도록 설계
 * 원칙: SaaS 종속성 제거, 로컬 우선, 미래 AI 기능 대비
 * 
 * 사용 예시:
 * - AI 수요 예측: getProductHistoryForForecast()
 * - 재고 최적화: getInventoryDataForOptimization()
 * - 추천 시스템: getProductFeaturesForRecommendation()
 */

import { prisma } from './prisma'

// ============================================
// AI Forecasting (수요 예측) 데이터 접근
// ============================================

/**
 * 수요 예측을 위한 상품 히스토리 데이터
 * 
 * RTX 5090에서 시계열 분석에 사용
 * 반환: 상품별 재고 변화, 쇼핑몰별 판매 패턴
 */
export async function getProductHistoryForForecast(productId: string) {
  // MallInventory의 히스토리 (createdAt, updatedAt 기반)
  const inventoryHistory = await prisma.mallInventory.findMany({
    where: { productId },
    select: {
      mallName: true,
      stock: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  return {
    productId,
    inventoryHistory,
    // 추후 orders 테이블과 조인하여 실제 판매 데이터 추가 가능
  }
}

/**
 * 모든 상품의 재고 분배 현황 (배치 처리용)
 * 
 * RTX 5090에서 전체 재고 최적화에 사용
 */
export async function getAllInventoryDistribution() {
  return prisma.mallInventory.findMany({
    select: {
      id: true,
      productId: true,
      mallName: true,
      stock: true,
      updatedAt: true,
    },
    orderBy: [
      { productId: 'asc' },
      { mallName: 'asc' },
    ],
  })
}

// ============================================
// AI Optimization (최적화) 데이터 접근
// ============================================

/**
 * 재고 최적화를 위한 데이터
 * 
 * RTX 5090에서 최적 재고 분배 계산에 사용
 * 반환: 쇼핑몰별 재고, 총 재고, 분배 비율
 */
export async function getInventoryDataForOptimization(productId: string) {
  const mallStocks = await prisma.mallInventory.findMany({
    where: { productId },
    select: {
      mallName: true,
      stock: true,
    },
  })

  type MallStockItem = typeof mallStocks[0];
  const totalStock = mallStocks.reduce((sum: number, item: MallStockItem) => sum + item.stock, 0)
  const distribution = mallStocks.map((item: MallStockItem) => ({
    mallName: item.mallName,
    stock: item.stock,
    percentage: totalStock > 0 ? (item.stock / totalStock) * 100 : 0,
  }))

  return {
    productId,
    totalStock,
    distribution,
    mallStocks,
  }
}

/**
 * 모든 상품의 재고 최적화 데이터 (배치 처리)
 */
export async function getAllProductsForOptimization() {
  const allInventory = await getAllInventoryDistribution()
  
  // productId별로 그룹화
  type InventoryItem = typeof allInventory[0];
  const grouped = allInventory.reduce((acc: Record<string, InventoryItem[]>, item: InventoryItem) => {
    if (!acc[item.productId]) {
      acc[item.productId] = []
    }
    acc[item.productId].push(item)
    return acc
  }, {} as Record<string, InventoryItem[]>)

  return (Object.entries(grouped) as [string, InventoryItem[]][]).map(([productId, stocks]) => {
    const totalStock = stocks.reduce((sum: number, s: InventoryItem) => sum + s.stock, 0)
    return {
      productId,
      totalStock,
      mallStocks: stocks,
      distribution: stocks.map(s => ({
        mallName: s.mallName,
        stock: s.stock,
        percentage: totalStock > 0 ? (s.stock / totalStock) * 100 : 0,
      })),
    }
  })
}

// ============================================
// AI Recommendation (추천 시스템) 데이터 접근
// ============================================

/**
 * 추천 시스템을 위한 기능 구독 데이터
 * 
 * RTX 5090에서 사용자별 기능 추천에 사용
 */
export async function getFeatureDataForRecommendation() {
  return prisma.featureSubscription.findMany({
    select: {
      featureId: true,
      featureName: true,
      isActive: true,
      monthlyFee: true,
    },
    orderBy: { monthlyFee: 'asc' },
  })
}

/**
 * 활성화된 기능 패턴 분석
 * 
 * 어떤 기능들이 함께 활성화되는지 패턴 분석에 사용
 */
export async function getActiveFeaturePatterns() {
  const activeFeatures = await prisma.featureSubscription.findMany({
    where: { isActive: true },
    select: {
      featureId: true,
      featureName: true,
      monthlyFee: true,
    },
  })

  type FeatureItem = typeof activeFeatures[0];
  return {
    activeCount: activeFeatures.length,
    totalMonthlyFee: activeFeatures.reduce((sum: number, f: FeatureItem) => sum + f.monthlyFee, 0),
    features: activeFeatures,
    // 추후 사용자별 구독 데이터와 조인하여 패턴 분석 가능
  }
}

// ============================================
// 데이터 Export (SaaS 탈출 경로)
// ============================================

/**
 * 모든 데이터를 JSON으로 Export
 * 
 * 목적: SaaS 종속성 제거, 로컬 백업, 다른 DB로 마이그레이션
 */
export async function exportAllDataForAI() {
  const [mallInventory, featureSubscriptions] = await Promise.all([
    prisma.mallInventory.findMany(),
    prisma.featureSubscription.findMany(),
  ])

  return {
    exportedAt: new Date().toISOString(),
    mallInventory,
    featureSubscriptions,
    // 추후 orders, products 등도 추가 가능
  }
}

/**
 * 배치 데이터 로딩 (AI 학습용)
 * 
 * RTX 5090에서 대량 데이터 처리 시 사용
 */
export async function loadBatchDataForTraining(batchSize: number = 1000) {
  const batches = []
  let skip = 0

  while (true) {
    const batch = await prisma.mallInventory.findMany({
      take: batchSize,
      skip,
      orderBy: { createdAt: 'asc' },
    })

    if (batch.length === 0) break

    batches.push(batch)
    skip += batchSize

    // 메모리 관리: 너무 많은 배치를 한 번에 로드하지 않음
    if (batches.length > 10) {
      break
    }
  }

  return batches
}
