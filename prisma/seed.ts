import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

/**
 * Prisma Seed Script
 * 
 * 주의: 실제 products는 Supabase에서 관리하므로
 * 여기서는 mall_inventory와 feature_subscriptions만 시드합니다.
 * 
 * 실행: npx prisma db seed
 */

async function main() {
  console.log('🌱 Prisma 시드 데이터 생성 시작...')

  // 1. 기능 구독 샘플 데이터 (실제 products 없이도 독립적으로 작동)
  await prisma.featureSubscription.createMany({
    data: [
      { 
        featureId: 'inventory-sync', 
        featureName: '실시간 재고 동기화', 
        monthlyFee: 19000, 
        isActive: true 
      },
      { 
        featureId: 'ai-forecast', 
        featureName: 'RTX 5090 AI 수요 예측', 
        monthlyFee: 59000, 
        isActive: false 
      },
      { 
        featureId: 'auto-cs', 
        featureName: 'AI 고객 응대 봇', 
        monthlyFee: 29000, 
        isActive: false 
      },
    ],
    skipDuplicates: true, // 이미 있으면 건너뛰기
  })

  console.log('✅ 기능 구독 데이터 생성 완료')
  console.log('📝 참고: mall_inventory는 실제 Supabase products와 연결 후 사용하세요.')
  console.log('   예: updateMallStock("product-uuid-from-supabase", "쿠팡", 50)')
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())