import { prisma } from '@/lib/prisma'
import { Box, ShoppingCart, Cpu, CheckCircle2, AlertCircle } from 'lucide-react'

// 동적 렌더링 강제 (Prisma 사용)
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // [DB 연동] 실제 데이터베이스에서 정보를 가져옵니다.
  // 주의: Product 모델은 참조용이므로, 실제 상품 데이터는 Supabase에서 가져와야 합니다.
  // 여기서는 MallInventory만 표시합니다.
  const allInventory = await prisma.mallInventory.findMany({
    orderBy: [{ productId: 'asc' }, { mallName: 'asc' }],
  });
  const subscriptions = await prisma.featureSubscription.findMany();

  // productId별로 그룹화
  type InventoryItem = typeof allInventory[0];
  const inventoryByProduct = allInventory.reduce((acc: Record<string, InventoryItem[]>, item: InventoryItem) => {
    if (!acc[item.productId]) {
      acc[item.productId] = [];
    }
    acc[item.productId].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Field Nine OS 보고서</h1>
        <p className="text-slate-500 text-lg">보스, DB 연동이 완료되어 실시간 데이터를 불러왔습니다.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. 재고 현황 보고 (DB 데이터) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Box className="text-blue-600" /> 실시간 재고 현황
          </h2>
          <div className="space-y-4">
            {(Object.entries(inventoryByProduct) as [string, InventoryItem[]][]).map(([productId, stocks]) => {
              const totalStock = stocks.reduce((sum, s) => sum + s.stock, 0);
              return (
                <div key={productId} className="p-4 border rounded-xl">
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-lg">상품 ID: {productId.substring(0, 8)}...</span>
                    <span className="text-blue-600 font-mono font-bold">{totalStock}개</span>
                  </div>
                  <div className="flex gap-2">
                    {stocks.map((ms) => (
                      <span key={ms.id} className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                        {ms.mallName}: {ms.stock}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. 구독 기능 관리 (DB 데이터) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="text-green-600" /> 활성화된 기능 (100+)
          </h2>
          <div className="space-y-3">
            {subscriptions.map((sub: typeof subscriptions[0]) => (
              <div key={sub.id} className={`flex justify-between items-center p-4 rounded-xl border ${sub.isActive ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                <div>
                  <p className="font-semibold">{sub.featureName}</p>
                  <p className="text-sm text-slate-500">월 ₩{sub.monthlyFee.toLocaleString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${sub.isActive ? 'bg-green-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
                  {sub.isActive ? '활성' : '비활성'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}