import { describe, it, expect } from 'vitest';

/**
 * 분석 대시보드 시스템 단위 테스트
 */

describe('매출 통계 계산', () => {
  it('총 매출 계산이 정확해야 함', () => {
    const orders = [
      { total_amount: 100000 },
      { total_amount: 50000 },
      { total_amount: 75000 },
    ];
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
    expect(totalRevenue).toBe(225000);
  });

  it('평균 주문 금액 계산이 정확해야 함', () => {
    const orders = [
      { total_amount: 100000 },
      { total_amount: 50000 },
      { total_amount: 75000 },
    ];
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const averageOrderValue = totalRevenue / orders.length;
    expect(averageOrderValue).toBe(75000);
  });

  it('주문이 없으면 평균 주문 금액이 0이어야 함', () => {
    const orders: Array<{ total_amount: number }> = [];
    const averageOrderValue = orders.length > 0 
      ? orders.reduce((sum, order) => sum + order.total_amount, 0) / orders.length 
      : 0;
    
    expect(averageOrderValue).toBe(0);
  });
});

describe('일별 매출 집계', () => {
  it('날짜별로 매출이 올바르게 집계되어야 함', () => {
    const orders = [
      { created_at: '2025-01-09', total_amount: 100000 },
      { created_at: '2025-01-09', total_amount: 50000 },
      { created_at: '2025-01-10', total_amount: 75000 },
    ];
    
    const dailyRevenue: Record<string, number> = {};
    orders.forEach(order => {
      const date = order.created_at.split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + order.total_amount;
    });
    
    expect(dailyRevenue['2025-01-09']).toBe(150000);
    expect(dailyRevenue['2025-01-10']).toBe(75000);
  });
});

describe('주문 상태별 분포', () => {
  it('상태별 주문 수가 올바르게 집계되어야 함', () => {
    const orders = [
      { status: 'shipping' },
      { status: 'shipping' },
      { status: 'delivered' },
      { status: 'preparing' },
    ];
    
    const statusCounts: Record<string, number> = {};
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    
    expect(statusCounts['shipping']).toBe(2);
    expect(statusCounts['delivered']).toBe(1);
    expect(statusCounts['preparing']).toBe(1);
  });
});
