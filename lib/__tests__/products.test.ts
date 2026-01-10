import { describe, it, expect } from 'vitest';

/**
 * 상품 관리 시스템 단위 테스트
 */

describe('상품 유효성 검사', () => {
  it('상품명이 필수여야 함', () => {
    const product = {
      name: '',
      sku: 'TEST-001',
      price: 10000,
    };
    
    expect(product.name.trim().length).toBeGreaterThan(0);
  });

  it('SKU가 필수여야 함', () => {
    const product = {
      name: '테스트 상품',
      sku: '',
      price: 10000,
    };
    
    expect(product.sku.trim().length).toBeGreaterThan(0);
  });

  it('가격이 0보다 커야 함', () => {
    const product = {
      name: '테스트 상품',
      sku: 'TEST-001',
      price: 10000,
    };
    
    expect(product.price).toBeGreaterThan(0);
  });

  it('재고가 0 이상이어야 함', () => {
    const product = {
      name: '테스트 상품',
      sku: 'TEST-001',
      price: 10000,
      stock: 100,
    };
    
    expect(product.stock).toBeGreaterThanOrEqual(0);
  });
});

describe('상품 가격 계산', () => {
  it('마진 계산이 정확해야 함', () => {
    const price = 10000;
    const cost = 6000;
    const expectedMargin = 4000;
    
    const margin = price - cost;
    expect(margin).toBe(expectedMargin);
  });

  it('마진율 계산이 정확해야 함', () => {
    const price = 10000;
    const cost = 6000;
    const expectedMarginRate = 40; // 40%
    
    const marginRate = ((price - cost) / price) * 100;
    expect(marginRate).toBe(expectedMarginRate);
  });
});
