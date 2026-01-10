/**
 * AI Forecasting Tests
 * 
 * 수요 예측 함수 단위 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { forecastDemand } from '../ai-forecasting'
import { prisma } from '../prisma'

// Prisma 모킹
vi.mock('../prisma', () => ({
  prisma: {
    mallInventory: {
      findMany: vi.fn(),
    },
  },
}))

describe('AI Forecasting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should forecast demand with sufficient history', async () => {
    // Mock 데이터
    const mockHistory = [
      { mallName: '쿠팡', stock: 50, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
      { mallName: '네이버', stock: 30, createdAt: new Date('2024-01-02'), updatedAt: new Date('2024-01-02') },
      { mallName: '쿠팡', stock: 60, createdAt: new Date('2024-01-03'), updatedAt: new Date('2024-01-03') },
    ]

    vi.mocked(prisma.mallInventory.findMany).mockResolvedValue(mockHistory as any)

    const result = await forecastDemand('test-product', 'weekly')

    expect(result.success).toBe(true)
    expect(result.forecast).toBeDefined()
    expect(result.forecast?.predictedDemand).toBeGreaterThanOrEqual(0)
    expect(result.forecast?.confidence).toBeGreaterThan(0)
    expect(result.forecast?.confidence).toBeLessThanOrEqual(1)
  })

  it('should return error when no history data', async () => {
    vi.mocked(prisma.mallInventory.findMany).mockResolvedValue([])

    const result = await forecastDemand('test-product', 'weekly')

    expect(result.success).toBe(false)
    expect(result.error).toContain('히스토리 데이터')
  })

  it('should handle errors gracefully', async () => {
    vi.mocked(prisma.mallInventory.findMany).mockRejectedValue(new Error('DB 오류'))

    const result = await forecastDemand('test-product', 'weekly')

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})
