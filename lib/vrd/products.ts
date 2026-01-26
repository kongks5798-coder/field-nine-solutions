/**
 * VRD 26SS - Product Catalog & Pricing
 * Production-Grade E-commerce Configuration
 */

// ============================================
// Product Types
// ============================================

export type ProductCategory = 'bottom' | 'top' | 'outerwear' | 'accessory';
export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'FREE';
export type BundleType = 'single' | 'couple' | 'crew' | 'full_collection';

export interface ProductColor {
  name: string;
  code: string;
  tcx: string; // Pantone TCX Code
  stock: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  nameKo: string;
  category: ProductCategory;
  description: string;
  descriptionKo: string;
  basePrice: number; // KRW
  priceUSD: number;
  colors: ProductColor[];
  sizes: ProductSize[];
  images: string[];
  usp: string; // Unique Selling Point
  designPoint: string;
  isLimitedEdition: boolean;
  stock: number;
  weight: number; // grams
  releaseDate: string;
}

export interface BundleConfig {
  type: BundleType;
  name: string;
  nameKo: string;
  description: string;
  discountPercent: number;
  minItems: number;
  maxItems: number;
  requiredCategories?: ProductCategory[];
}

export interface CartItem {
  productId: string;
  color: string;
  size: ProductSize;
  quantity: number;
}

export interface OrderSummary {
  items: CartItem[];
  subtotal: number;
  bundleDiscount: number;
  bundleType: BundleType;
  shippingCost: number;
  tax: number;
  total: number;
  currency: 'KRW' | 'USD';
}

// ============================================
// VRD 26SS Product Catalog
// ============================================

export const VRD_PRODUCTS: Product[] = [
  {
    id: 'vrd-armor-leggings',
    sku: 'VRD-26SS-BTM-001',
    name: 'Armor-Compression Leggings',
    nameKo: '아머 컴프레션 레깅스',
    category: 'bottom',
    description: 'Advanced compression technology with 4-way stretch fabric. Military-grade durability meets athletic performance.',
    descriptionKo: '4방향 스트레치 원단을 적용한 첨단 압축 기술. 군사급 내구성과 운동 성능의 만남.',
    basePrice: 89000,
    priceUSD: 69,
    colors: [
      { name: 'Jet Black', code: '#1a1a1a', tcx: '19-0303 TCX', stock: 150 },
      { name: 'Deep Charcoal', code: '#33363a', tcx: '19-4008 TCX', stock: 120 },
      { name: 'Steel Blue', code: '#5d7d9a', tcx: '18-4214 TCX', stock: 80 },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    images: ['/products/vrd-leggings-1.jpg', '/products/vrd-leggings-2.jpg'],
    usp: '군사급 내구성 + 프리미엄 착압감',
    designPoint: '인체공학적 패널 구성, 무봉제 허리밴드',
    isLimitedEdition: false,
    stock: 350,
    weight: 280,
    releaseDate: '2026-03-01',
  },
  {
    id: 'vrd-signature-top',
    sku: 'VRD-26SS-TOP-001',
    name: 'Signature Support Sports Top',
    nameKo: '시그니처 서포트 스포츠 탑',
    category: 'top',
    description: 'Engineered support structure with breathable mesh panels. Designed for high-intensity training.',
    descriptionKo: '통기성 메쉬 패널이 적용된 엔지니어드 서포트 구조. 고강도 트레이닝을 위한 설계.',
    basePrice: 79000,
    priceUSD: 59,
    colors: [
      { name: 'Sand Ivory', code: '#ece7e0', tcx: '11-0105 TCX', stock: 200 },
      { name: 'Jet Black', code: '#1a1a1a', tcx: '19-0303 TCX', stock: 180 },
      { name: 'Light Gray', code: '#c0c8cf', tcx: '14-4102 TCX', stock: 100 },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    images: ['/products/vrd-top-1.jpg', '/products/vrd-top-2.jpg'],
    usp: '스튜디오-스트릿 겸용 디자인',
    designPoint: '전략적 메쉬 배치, Y형 백 디테일',
    isLimitedEdition: false,
    stock: 480,
    weight: 180,
    releaseDate: '2026-03-01',
  },
  {
    id: 'vrd-vtaper-sweat',
    sku: 'VRD-26SS-TOP-002',
    name: 'V-Taper Crop Sweat',
    nameKo: 'V-테이퍼 크롭 스웻',
    category: 'top',
    description: 'Premium French terry with a V-taper silhouette. Cropped length for a modern athletic look.',
    descriptionKo: 'V-테이퍼 실루엣의 프리미엄 프렌치 테리. 모던 애슬레틱 룩을 위한 크롭 기장.',
    basePrice: 119000,
    priceUSD: 89,
    colors: [
      { name: 'Jet Black', code: '#1a1a1a', tcx: '19-0303 TCX', stock: 100 },
      { name: 'Sand Ivory', code: '#ece7e0', tcx: '11-0105 TCX', stock: 100 },
      { name: 'Steel Blue', code: '#5d7d9a', tcx: '18-4214 TCX', stock: 60 },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    images: ['/products/vrd-sweat-1.jpg', '/products/vrd-sweat-2.jpg'],
    usp: '바디라인을 살리는 V-테이퍼 실루엣',
    designPoint: '드롭숄더, 리브 밑단, 레귤러 핏',
    isLimitedEdition: false,
    stock: 260,
    weight: 420,
    releaseDate: '2026-03-01',
  },
  {
    id: 'vrd-giant-tee',
    sku: 'VRD-26SS-TOP-003',
    name: 'Giant Overfit Tee',
    nameKo: '자이언트 오버핏 티',
    category: 'top',
    description: 'Heavyweight 300gsm cotton with dramatic oversized silhouette. The statement piece for street style.',
    descriptionKo: '드라마틱한 오버사이즈 실루엣의 헤비웨이트 300gsm 코튼. 스트릿 스타일의 스테이트먼트 피스.',
    basePrice: 69000,
    priceUSD: 49,
    colors: [
      { name: 'Sand Ivory', code: '#ece7e0', tcx: '11-0105 TCX', stock: 300 },
      { name: 'Jet Black', code: '#1a1a1a', tcx: '19-0303 TCX', stock: 280 },
    ],
    sizes: ['M', 'L', 'XL', 'XXL'],
    images: ['/products/vrd-tee-1.jpg', '/products/vrd-tee-2.jpg'],
    usp: '300gsm 프리미엄 헤비코튼',
    designPoint: '박스핏, 드롭숄더 +10cm, 사이드 슬릿',
    isLimitedEdition: false,
    stock: 580,
    weight: 380,
    releaseDate: '2026-03-01',
  },
  {
    id: 'vrd-ethereal-windbreaker',
    sku: 'VRD-26SS-OUT-001',
    name: 'Technical Ethereal Windbreaker',
    nameKo: '테크니컬 에테리얼 윈드브레이커',
    category: 'outerwear',
    description: 'Ultralight ripstop fabric with laser-cut ventilation. Water-resistant DWR coating.',
    descriptionKo: '레이저컷 통기구가 적용된 초경량 립스탑 원단. 발수 DWR 코팅.',
    basePrice: 189000,
    priceUSD: 149,
    colors: [
      { name: 'Deep Charcoal', code: '#33363a', tcx: '19-4008 TCX', stock: 80 },
      { name: 'Sand Ivory', code: '#ece7e0', tcx: '11-0105 TCX', stock: 60 },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    images: ['/products/vrd-windbreaker-1.jpg', '/products/vrd-windbreaker-2.jpg'],
    usp: 'DWR 발수 코팅 + 초경량 95g',
    designPoint: '레이저컷 벤틸레이션, 팩커블 디자인',
    isLimitedEdition: true,
    stock: 140,
    weight: 95,
    releaseDate: '2026-03-01',
  },
  {
    id: 'vrd-aura-cap',
    sku: 'VRD-26SS-ACC-001',
    name: 'Aura Finisher Ballcap',
    nameKo: '아우라 피니셔 볼캡',
    category: 'accessory',
    description: 'Premium curved brim cap with embroidered VRD logo. Adjustable strap for perfect fit.',
    descriptionKo: 'VRD 자수 로고가 새겨진 프리미엄 커브드 브림 캡. 완벽한 핏을 위한 조절 스트랩.',
    basePrice: 49000,
    priceUSD: 39,
    colors: [
      { name: 'Jet Black', code: '#1a1a1a', tcx: '19-0303 TCX', stock: 200 },
      { name: 'Sand Ivory', code: '#ece7e0', tcx: '11-0105 TCX', stock: 150 },
      { name: 'Deep Charcoal', code: '#33363a', tcx: '19-4008 TCX', stock: 100 },
    ],
    sizes: ['FREE'],
    images: ['/products/vrd-cap-1.jpg', '/products/vrd-cap-2.jpg'],
    usp: '프리미엄 3D 자수 로고',
    designPoint: '6패널 구조, 구리 버클, 피그먼트 워싱',
    isLimitedEdition: false,
    stock: 450,
    weight: 80,
    releaseDate: '2026-03-01',
  },
];

// ============================================
// Bundle Configurations
// ============================================

export const BUNDLE_CONFIGS: BundleConfig[] = [
  {
    type: 'single',
    name: 'Single Item',
    nameKo: '단품 구매',
    description: 'Purchase individual items',
    discountPercent: 0,
    minItems: 1,
    maxItems: 1,
  },
  {
    type: 'couple',
    name: 'Couple Bundle',
    nameKo: '커플 번들',
    description: 'Buy 2, save 25%',
    discountPercent: 25,
    minItems: 2,
    maxItems: 2,
  },
  {
    type: 'crew',
    name: 'Crew Bundle',
    nameKo: '크루 번들',
    description: 'Buy 3-4, save 30%',
    discountPercent: 30,
    minItems: 3,
    maxItems: 4,
  },
  {
    type: 'full_collection',
    name: 'Full Collection',
    nameKo: '풀 컬렉션',
    description: 'Buy 5+, save 35%',
    discountPercent: 35,
    minItems: 5,
    maxItems: 999,
  },
];

// ============================================
// Shipping Configuration
// ============================================

export const SHIPPING_CONFIG = {
  domestic: {
    standard: { price: 3000, days: '2-3', name: '일반배송' },
    express: { price: 5000, days: '1', name: '익일배송' },
    freeThreshold: 100000, // Free shipping over 100,000 KRW
  },
  international: {
    standard: { price: 25000, days: '7-14', name: 'Standard Shipping' },
    express: { price: 45000, days: '3-5', name: 'Express Shipping' },
    freeThreshold: 300000,
  },
};

// ============================================
// Tax Configuration
// ============================================

export const TAX_CONFIG = {
  korea: {
    vat: 0.1, // 10% VAT (already included in price)
    vatIncluded: true,
  },
  international: {
    vat: 0, // No VAT for exports
    vatIncluded: false,
  },
};

// ============================================
// Helper Functions
// ============================================

export function getProductById(id: string): Product | undefined {
  return VRD_PRODUCTS.find(p => p.id === id);
}

export function getProductsByCategory(category: ProductCategory): Product[] {
  return VRD_PRODUCTS.filter(p => p.category === category);
}

export function getBundleConfig(itemCount: number): BundleConfig {
  return (
    BUNDLE_CONFIGS.find(
      b => itemCount >= b.minItems && itemCount <= b.maxItems
    ) || BUNDLE_CONFIGS[0]
  );
}

export function calculateBundlePrice(
  items: CartItem[],
  currency: 'KRW' | 'USD' = 'KRW'
): OrderSummary {
  // Calculate subtotal
  let subtotal = 0;
  for (const item of items) {
    const product = getProductById(item.productId);
    if (product) {
      const price = currency === 'KRW' ? product.basePrice : product.priceUSD;
      subtotal += price * item.quantity;
    }
  }

  // Determine bundle type based on total quantity
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const bundle = getBundleConfig(totalQuantity);

  // Calculate bundle discount
  const bundleDiscount = Math.round(subtotal * (bundle.discountPercent / 100));

  // Calculate shipping
  const isInternational = currency === 'USD';
  const shippingConfig = isInternational
    ? SHIPPING_CONFIG.international
    : SHIPPING_CONFIG.domestic;
  const freeThreshold = shippingConfig.freeThreshold;
  const discountedSubtotal = subtotal - bundleDiscount;
  const shippingCost =
    discountedSubtotal >= freeThreshold ? 0 : shippingConfig.standard.price;

  // Tax (for Korea, VAT is already included)
  const taxConfig = isInternational ? TAX_CONFIG.international : TAX_CONFIG.korea;
  const tax = taxConfig.vatIncluded ? 0 : Math.round(discountedSubtotal * taxConfig.vat);

  // Total
  const total = discountedSubtotal + shippingCost + tax;

  return {
    items,
    subtotal,
    bundleDiscount,
    bundleType: bundle.type,
    shippingCost,
    tax,
    total,
    currency,
  };
}

export function formatPrice(amount: number, currency: 'KRW' | 'USD'): string {
  if (currency === 'KRW') {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function isInStock(productId: string, color: string, size: ProductSize): boolean {
  const product = getProductById(productId);
  if (!product) return false;

  const colorOption = product.colors.find(c => c.name === color);
  if (!colorOption || colorOption.stock <= 0) return false;

  return product.sizes.includes(size);
}
