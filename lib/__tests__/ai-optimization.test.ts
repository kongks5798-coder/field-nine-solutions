/**
 * AI Optimization Tests
 * 
 * 재고 최적화 함수 단위 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { optimizeInventoryDistribution, applyOptimalDistribution } from '../ai-optimization'
import { prisma } from '../prisma'

vi.mock('../prisma', () => ({
  prisma: {
    mallInventory: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}))

describe('AI Optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should optimize inventory distribution', async () => {
    const mockStocks = [
      { mallName: '쿠팡', stock: 30 },
      { mallName: '네이버', stock: 70 },
    ]

    vi.mocked(prisma.mallInventory.findMany).mockResolvedValue(mockStocks as any)

    const result = await optimizeInventoryDistribution('test-product', {
      '쿠팡': 0.4,
      '네이버': 0.6,
    })

    expect(result.productId).toBe('test-product')
    expect(result.totalStock).toBe(100)
    expect(result.suggested).toHaveLength(2)
    expect(result.suggested[0].suggestedStock).toBe(40) // 100 * 0.4
    expect(result.suggested[1].suggestedStock).toBe(60) // 100 * 0.6
  })

  it('should apply optimal distribution', async () => {
    vi.mocked(prisma.mallInventory.upsert).mockResolvedValue({} as any)
    vi.mocked(prisma.mallInventory.findMany).mockResolvedValue([
      { mallName: '쿠팡', stock: 40 },
      { mallName: '네이버', stock: 60 },
    ] as any)

    const result = await applyOptimalDistribution('test-product', [
      { mallName: '쿠팡', stock: 40 },
      { mallName: '네이버', stock: 60 },
    ])

    expect(result.success).toBe(true)
    expect(result.updated).toBe(2)
  })
})
