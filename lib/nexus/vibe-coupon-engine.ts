/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 55: VIBE-ID SYNERGY - PERSONAL DISCOUNT COUPON ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 사용자 셀피 분석 → VIBE-ID 결과 → VRD 결제 시 퍼스널 할인 쿠폰 자동 생성
 */

import { VibeArchetype, VIBE_METADATA } from '@/lib/vibe/types';
import { VRD_PRODUCTS, Product, ProductCategory } from '@/lib/vrd/products';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export interface VibeCoupon {
  id: string;
  userId: string;
  code: string;
  vibeType: VibeArchetype;
  discountType: 'percentage' | 'fixed' | 'free_item';
  discountValue: number;
  maxDiscount?: number;
  minPurchase: number;
  applicableProducts: string[];
  applicableCategories: ProductCategory[];
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
  isActive: boolean;
  personalMessage: string;
  personalMessageKo: string;
}

export interface VibeProductMatch {
  product: Product;
  matchScore: number;
  reason: string;
  reasonKo: string;
  specialOffer?: {
    type: 'early_access' | 'exclusive_color' | 'bundle_bonus';
    description: string;
  };
}

export interface CouponGenerationResult {
  success: boolean;
  coupon?: VibeCoupon;
  recommendations: VibeProductMatch[];
  totalPotentialSavings: number;
  message: string;
}

// ============================================
// Vibe-to-Product Mapping
// ============================================

const VIBE_PRODUCT_AFFINITIES: Record<VibeArchetype, {
  preferredCategories: ProductCategory[];
  colorPreferences: string[];
  styleKeywords: string[];
  discountTier: number; // 1-5, affects base discount
}> = {
  'silent-luxury': {
    preferredCategories: ['outerwear', 'bottom'],
    colorPreferences: ['Jet Black', 'Deep Charcoal'],
    styleKeywords: ['premium', 'refined', 'minimal'],
    discountTier: 5,
  },
  'urban-explorer': {
    preferredCategories: ['top', 'accessory'],
    colorPreferences: ['Jet Black', 'Steel Blue'],
    styleKeywords: ['dynamic', 'versatile', 'street'],
    discountTier: 4,
  },
  'nature-seeker': {
    preferredCategories: ['outerwear', 'bottom'],
    colorPreferences: ['Deep Charcoal', 'Sand Ivory'],
    styleKeywords: ['technical', 'durable', 'functional'],
    discountTier: 4,
  },
  'culture-lover': {
    preferredCategories: ['top', 'accessory'],
    colorPreferences: ['Sand Ivory', 'Light Gray'],
    styleKeywords: ['classic', 'thoughtful', 'timeless'],
    discountTier: 3,
  },
  'beach-soul': {
    preferredCategories: ['top', 'bottom'],
    colorPreferences: ['Sand Ivory', 'Steel Blue'],
    styleKeywords: ['relaxed', 'breathable', 'light'],
    discountTier: 3,
  },
  'adventure-spirit': {
    preferredCategories: ['outerwear', 'bottom'],
    colorPreferences: ['Steel Blue', 'Jet Black'],
    styleKeywords: ['technical', 'performance', 'bold'],
    discountTier: 5,
  },
  'foodie-wanderer': {
    preferredCategories: ['top', 'accessory'],
    colorPreferences: ['Sand Ivory', 'Deep Charcoal'],
    styleKeywords: ['comfortable', 'versatile', 'casual'],
    discountTier: 3,
  },
  'minimalist': {
    preferredCategories: ['top', 'bottom'],
    colorPreferences: ['Jet Black', 'Sand Ivory'],
    styleKeywords: ['clean', 'essential', 'simple'],
    discountTier: 4,
  },
  'romantic-dreamer': {
    preferredCategories: ['top', 'outerwear'],
    colorPreferences: ['Sand Ivory', 'Light Gray'],
    styleKeywords: ['soft', 'elegant', 'dreamy'],
    discountTier: 3,
  },
};

// ============================================
// Discount Calculation
// ============================================

const DISCOUNT_TIERS: Record<number, {
  basePercent: number;
  maxPercent: number;
  fixedBonus: number;
}> = {
  1: { basePercent: 5, maxPercent: 10, fixedBonus: 3000 },
  2: { basePercent: 8, maxPercent: 12, fixedBonus: 5000 },
  3: { basePercent: 10, maxPercent: 15, fixedBonus: 8000 },
  4: { basePercent: 12, maxPercent: 18, fixedBonus: 10000 },
  5: { basePercent: 15, maxPercent: 22, fixedBonus: 15000 },
};

// ============================================
// Supabase Client (Lazy Initialization)
// ============================================

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('Supabase credentials not configured');
    }

    supabase = createClient(url, key);
  }
  return supabase;
}

// ============================================
// Vibe Coupon Engine
// ============================================

export class VibeCouponEngine {
  /**
   * Generate personalized coupon based on VIBE-ID analysis
   */
  async generateCoupon(
    userId: string,
    vibeType: VibeArchetype,
    confidence: number
  ): Promise<CouponGenerationResult> {
    try {
      const affinity = VIBE_PRODUCT_AFFINITIES[vibeType];
      const metadata = VIBE_METADATA[vibeType];

      // Calculate discount based on vibe tier and confidence
      const tier = DISCOUNT_TIERS[affinity.discountTier];
      const confidenceBonus = Math.floor((confidence - 0.7) * 20); // 0-6% bonus for high confidence
      const discountPercent = Math.min(
        tier.maxPercent,
        tier.basePercent + confidenceBonus
      );

      // Get applicable products
      const applicableProducts = this.getMatchingProducts(vibeType);

      // Generate unique coupon code
      const couponCode = this.generateCouponCode(vibeType);

      // Create coupon
      const coupon: VibeCoupon = {
        id: `vc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        code: couponCode,
        vibeType,
        discountType: 'percentage',
        discountValue: discountPercent,
        maxDiscount: tier.fixedBonus * 2,
        minPurchase: 50000, // 50,000 KRW minimum
        applicableProducts: applicableProducts.map(p => p.product.id),
        applicableCategories: affinity.preferredCategories,
        expiresAt: this.getExpirationDate(7), // 7 days validity
        createdAt: new Date().toISOString(),
        isActive: true,
        personalMessage: this.generatePersonalMessage(vibeType, discountPercent, 'en'),
        personalMessageKo: this.generatePersonalMessage(vibeType, discountPercent, 'ko'),
      };

      // Save to database
      await this.saveCoupon(coupon);

      // Calculate potential savings
      const totalPotentialSavings = this.calculatePotentialSavings(
        applicableProducts,
        discountPercent
      );

      return {
        success: true,
        coupon,
        recommendations: applicableProducts,
        totalPotentialSavings,
        message: `${metadata.emoji} ${metadata.nameKo} 스타일에 맞는 특별 쿠폰이 생성되었습니다!`,
      };
    } catch (error) {
      console.error('[VibeCouponEngine] Generation error:', error);
      return {
        success: false,
        recommendations: [],
        totalPotentialSavings: 0,
        message: '쿠폰 생성 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * Validate and apply coupon at checkout
   */
  async validateCoupon(
    couponCode: string,
    userId: string,
    cartItems: { productId: string; quantity: number }[],
    cartTotal: number
  ): Promise<{
    valid: boolean;
    discount: number;
    message: string;
    coupon?: VibeCoupon;
  }> {
    try {
      const db = getSupabase();

      const { data: couponData, error } = await db
        .from('vibe_coupons')
        .select('*')
        .eq('code', couponCode)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error || !couponData) {
        return {
          valid: false,
          discount: 0,
          message: '유효하지 않은 쿠폰입니다.',
        };
      }

      const coupon = this.mapDbToCoupon(couponData);

      // Check expiration
      if (new Date(coupon.expiresAt) < new Date()) {
        return {
          valid: false,
          discount: 0,
          message: '만료된 쿠폰입니다.',
        };
      }

      // Check if already used
      if (coupon.usedAt) {
        return {
          valid: false,
          discount: 0,
          message: '이미 사용된 쿠폰입니다.',
        };
      }

      // Check minimum purchase
      if (cartTotal < coupon.minPurchase) {
        return {
          valid: false,
          discount: 0,
          message: `최소 주문금액 ${coupon.minPurchase.toLocaleString()}원 이상 구매 시 사용 가능합니다.`,
        };
      }

      // Check applicable products
      const applicableTotal = this.calculateApplicableTotal(cartItems, coupon);

      // Calculate discount
      let discount = 0;
      if (coupon.discountType === 'percentage') {
        discount = Math.round(applicableTotal * (coupon.discountValue / 100));
        if (coupon.maxDiscount) {
          discount = Math.min(discount, coupon.maxDiscount);
        }
      } else if (coupon.discountType === 'fixed') {
        discount = coupon.discountValue;
      }

      return {
        valid: true,
        discount,
        message: `${coupon.vibeType} 스타일 쿠폰 적용: ${discount.toLocaleString()}원 할인`,
        coupon,
      };
    } catch (error) {
      console.error('[VibeCouponEngine] Validation error:', error);
      return {
        valid: false,
        discount: 0,
        message: '쿠폰 확인 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * Mark coupon as used after successful payment
   */
  async useCoupon(couponCode: string, orderId: string): Promise<boolean> {
    try {
      const db = getSupabase();

      const { error } = await db
        .from('vibe_coupons')
        .update({
          used_at: new Date().toISOString(),
          order_id: orderId,
          is_active: false,
        })
        .eq('code', couponCode);

      return !error;
    } catch (error) {
      console.error('[VibeCouponEngine] Use coupon error:', error);
      return false;
    }
  }

  /**
   * Get user's available coupons
   */
  async getUserCoupons(userId: string): Promise<VibeCoupon[]> {
    try {
      const db = getSupabase();

      const { data, error } = await db
        .from('vibe_coupons')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[VibeCouponEngine] Get coupons error:', error);
        return [];
      }

      return (data || []).map(this.mapDbToCoupon);
    } catch (error) {
      console.error('[VibeCouponEngine] Get coupons error:', error);
      return [];
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  private getMatchingProducts(vibeType: VibeArchetype): VibeProductMatch[] {
    const affinity = VIBE_PRODUCT_AFFINITIES[vibeType];
    const metadata = VIBE_METADATA[vibeType];

    return VRD_PRODUCTS.map(product => {
      let matchScore = 0;
      const reasons: string[] = [];
      const reasonsKo: string[] = [];

      // Category match
      if (affinity.preferredCategories.includes(product.category)) {
        matchScore += 40;
        reasons.push(`Perfect for ${metadata.name} style`);
        reasonsKo.push(`${metadata.nameKo} 스타일에 완벽`);
      }

      // Color match
      const matchingColors = product.colors.filter(c =>
        affinity.colorPreferences.includes(c.name)
      );
      if (matchingColors.length > 0) {
        matchScore += 30;
        reasons.push(`Available in your preferred colors`);
        reasonsKo.push(`선호 컬러 보유`);
      }

      // Style keyword match
      const productKeywords = product.usp.toLowerCase() + ' ' + product.designPoint.toLowerCase();
      const matchingKeywords = affinity.styleKeywords.filter(kw =>
        productKeywords.includes(kw)
      );
      if (matchingKeywords.length > 0) {
        matchScore += 20 * matchingKeywords.length;
        reasons.push(`Matches your ${matchingKeywords.join(', ')} preference`);
        reasonsKo.push(`${matchingKeywords.join(', ')} 스타일 매칭`);
      }

      // Limited edition bonus for high-tier vibes
      if (product.isLimitedEdition && affinity.discountTier >= 4) {
        matchScore += 10;
        reasons.push('Exclusive limited edition');
        reasonsKo.push('한정판 특별 추천');
      }

      return {
        product,
        matchScore: Math.min(100, matchScore),
        reason: reasons.join('. ') || 'Versatile choice for your style',
        reasonKo: reasonsKo.join('. ') || '다양한 스타일에 어울림',
        specialOffer: matchScore >= 80 ? {
          type: 'exclusive_color' as const,
          description: '이 상품은 당신의 스타일에 특별히 매칭됩니다',
        } : undefined,
      };
    })
    .filter(match => match.matchScore >= 30)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
  }

  private generateCouponCode(vibeType: VibeArchetype): string {
    const prefix = vibeType.split('-').map(w => w[0].toUpperCase()).join('');
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `VIBE-${prefix}-${timestamp}-${random}`;
  }

  private getExpirationDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
  }

  private generatePersonalMessage(
    vibeType: VibeArchetype,
    discountPercent: number,
    lang: 'en' | 'ko'
  ): string {
    const metadata = VIBE_METADATA[vibeType];

    if (lang === 'ko') {
      return `${metadata.emoji} ${metadata.nameKo} 스타일의 당신을 위한 특별 할인! VRD 26SS 컬렉션에서 ${discountPercent}% 할인을 받으세요. ${metadata.descriptionKo}`;
    }

    return `${metadata.emoji} Special offer for ${metadata.name} vibes! Enjoy ${discountPercent}% off on VRD 26SS collection. ${metadata.description}`;
  }

  private calculatePotentialSavings(
    matches: VibeProductMatch[],
    discountPercent: number
  ): number {
    const topMatch = matches[0];
    if (!topMatch) return 0;

    return Math.round(topMatch.product.basePrice * (discountPercent / 100));
  }

  private calculateApplicableTotal(
    cartItems: { productId: string; quantity: number }[],
    coupon: VibeCoupon
  ): number {
    let total = 0;

    for (const item of cartItems) {
      const product = VRD_PRODUCTS.find(p => p.id === item.productId);
      if (!product) continue;

      const isApplicable =
        coupon.applicableProducts.includes(product.id) ||
        coupon.applicableCategories.includes(product.category);

      if (isApplicable) {
        total += product.basePrice * item.quantity;
      }
    }

    return total;
  }

  private async saveCoupon(coupon: VibeCoupon): Promise<void> {
    try {
      const db = getSupabase();

      await db.from('vibe_coupons').insert({
        id: coupon.id,
        user_id: coupon.userId,
        code: coupon.code,
        vibe_type: coupon.vibeType,
        discount_type: coupon.discountType,
        discount_value: coupon.discountValue,
        max_discount: coupon.maxDiscount,
        min_purchase: coupon.minPurchase,
        applicable_products: coupon.applicableProducts,
        applicable_categories: coupon.applicableCategories,
        expires_at: coupon.expiresAt,
        created_at: coupon.createdAt,
        is_active: coupon.isActive,
        personal_message: coupon.personalMessage,
        personal_message_ko: coupon.personalMessageKo,
      });
    } catch (error) {
      console.error('[VibeCouponEngine] Save coupon error:', error);
    }
  }

  private mapDbToCoupon(data: Record<string, unknown>): VibeCoupon {
    return {
      id: data.id as string,
      userId: data.user_id as string,
      code: data.code as string,
      vibeType: data.vibe_type as VibeArchetype,
      discountType: data.discount_type as 'percentage' | 'fixed' | 'free_item',
      discountValue: data.discount_value as number,
      maxDiscount: data.max_discount as number | undefined,
      minPurchase: data.min_purchase as number,
      applicableProducts: data.applicable_products as string[],
      applicableCategories: data.applicable_categories as ProductCategory[],
      expiresAt: data.expires_at as string,
      createdAt: data.created_at as string,
      usedAt: data.used_at as string | undefined,
      isActive: data.is_active as boolean,
      personalMessage: data.personal_message as string,
      personalMessageKo: data.personal_message_ko as string,
    };
  }
}

// ============================================
// Singleton Instance
// ============================================

export const vibeCouponEngine = new VibeCouponEngine();

// ============================================
// Convenience Functions
// ============================================

export async function generateVibeDiscount(
  userId: string,
  vibeType: VibeArchetype,
  confidence: number
): Promise<CouponGenerationResult> {
  return vibeCouponEngine.generateCoupon(userId, vibeType, confidence);
}

export async function validateVibeDiscount(
  couponCode: string,
  userId: string,
  cartItems: { productId: string; quantity: number }[],
  cartTotal: number
) {
  return vibeCouponEngine.validateCoupon(couponCode, userId, cartItems, cartTotal);
}

export async function applyVibeDiscount(couponCode: string, orderId: string) {
  return vibeCouponEngine.useCoupon(couponCode, orderId);
}
