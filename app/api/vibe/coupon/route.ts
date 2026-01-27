/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 55: VIBE-ID COUPON API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 셀피 분석 → 퍼스널 할인 쿠폰 자동 생성
 *
 * GET  /api/vibe/coupon - Get user's coupons
 * POST /api/vibe/coupon - Generate/validate/use coupon
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  vibeCouponEngine,
  generateVibeDiscount,
  validateVibeDiscount,
  applyVibeDiscount,
  VibeCoupon,
} from '@/lib/nexus/vibe-coupon-engine';
import { VibeArchetype, VIBE_ARCHETYPES, VIBE_METADATA } from '@/lib/vibe/types';

export const dynamic = 'force-dynamic';

// ============================================
// Authentication Helper
// ============================================

async function getCurrentUser(request: NextRequest): Promise<{ id: string; email?: string } | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) return null;

    const supabase = createClient(url, key, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}

/**
 * GET - Get user's available coupons
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeExpired = searchParams.get('expired') === 'true';
    const vibeFilter = searchParams.get('vibe') as VibeArchetype | null;

    // Get user's coupons
    let coupons = await vibeCouponEngine.getUserCoupons(user.id);

    // Filter by vibe type if specified
    if (vibeFilter && VIBE_ARCHETYPES.includes(vibeFilter)) {
      coupons = coupons.filter(c => c.vibeType === vibeFilter);
    }

    // Enrich with metadata
    const enrichedCoupons = coupons.map(coupon => ({
      ...coupon,
      vibeMetadata: VIBE_METADATA[coupon.vibeType],
      daysRemaining: Math.ceil(
        (new Date(coupon.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
      isExpiringSoon: new Date(coupon.expiresAt).getTime() - Date.now() < 48 * 60 * 60 * 1000,
    }));

    return NextResponse.json({
      success: true,
      coupons: enrichedCoupons,
      count: enrichedCoupons.length,
      summary: {
        totalCoupons: enrichedCoupons.length,
        byVibe: VIBE_ARCHETYPES.reduce((acc, vibe) => {
          acc[vibe] = enrichedCoupons.filter(c => c.vibeType === vibe).length;
          return acc;
        }, {} as Record<VibeArchetype, number>),
        expiringSoon: enrichedCoupons.filter(c => c.isExpiringSoon).length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Vibe Coupon API] GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

/**
 * POST - Generate, validate, or use coupon
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();
    const { action } = body;

    switch (action) {
      // ========================================
      // Generate coupon from VIBE-ID analysis
      // ========================================
      case 'generate': {
        const { vibeType, confidence, userId: providedUserId } = body;

        // Allow either authenticated user or provided userId
        const targetUserId = user?.id || providedUserId;
        if (!targetUserId) {
          return NextResponse.json(
            { success: false, error: 'User ID required' },
            { status: 400 }
          );
        }

        // Validate vibe type
        if (!vibeType || !VIBE_ARCHETYPES.includes(vibeType)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid vibe type',
              validTypes: VIBE_ARCHETYPES,
            },
            { status: 400 }
          );
        }

        // Generate coupon
        const result = await generateVibeDiscount(
          targetUserId,
          vibeType as VibeArchetype,
          confidence || 0.8
        );

        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          coupon: result.coupon,
          recommendations: result.recommendations,
          potentialSavings: {
            amount: result.totalPotentialSavings,
            currency: 'KRW',
            formatted: `₩${result.totalPotentialSavings.toLocaleString()}`,
          },
          message: result.message,
          vibeMetadata: VIBE_METADATA[vibeType as VibeArchetype],
          timestamp: new Date().toISOString(),
        });
      }

      // ========================================
      // Validate coupon at checkout
      // ========================================
      case 'validate': {
        if (!user) {
          return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { status: 401 }
          );
        }

        const { code, cartItems, cartTotal } = body;

        if (!code) {
          return NextResponse.json(
            { success: false, error: 'Coupon code required' },
            { status: 400 }
          );
        }

        if (!cartItems || !Array.isArray(cartItems) || cartTotal === undefined) {
          return NextResponse.json(
            { success: false, error: 'Cart items and total required' },
            { status: 400 }
          );
        }

        const result = await validateVibeDiscount(
          code,
          user.id,
          cartItems,
          cartTotal
        );

        return NextResponse.json({
          success: result.valid,
          discount: result.discount,
          discountFormatted: `₩${result.discount.toLocaleString()}`,
          message: result.message,
          coupon: result.coupon ? {
            code: result.coupon.code,
            vibeType: result.coupon.vibeType,
            discountValue: result.coupon.discountValue,
            expiresAt: result.coupon.expiresAt,
            vibeMetadata: VIBE_METADATA[result.coupon.vibeType],
          } : undefined,
          finalTotal: cartTotal - result.discount,
          finalTotalFormatted: `₩${(cartTotal - result.discount).toLocaleString()}`,
          timestamp: new Date().toISOString(),
        });
      }

      // ========================================
      // Apply coupon after payment
      // ========================================
      case 'apply': {
        if (!user) {
          return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { status: 401 }
          );
        }

        const { code, orderId } = body;

        if (!code || !orderId) {
          return NextResponse.json(
            { success: false, error: 'Coupon code and order ID required' },
            { status: 400 }
          );
        }

        const applied = await applyVibeDiscount(code, orderId);

        return NextResponse.json({
          success: applied,
          message: applied
            ? '쿠폰이 성공적으로 적용되었습니다.'
            : '쿠폰 적용에 실패했습니다.',
          timestamp: new Date().toISOString(),
        });
      }

      // ========================================
      // Get vibe-specific recommendations
      // ========================================
      case 'recommendations': {
        const { vibeType } = body;

        if (!vibeType || !VIBE_ARCHETYPES.includes(vibeType)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid vibe type',
              validTypes: VIBE_ARCHETYPES,
            },
            { status: 400 }
          );
        }

        // Generate temporary result to get recommendations
        const tempResult = await generateVibeDiscount(
          'temp_user',
          vibeType as VibeArchetype,
          0.8
        );

        return NextResponse.json({
          success: true,
          vibeType,
          vibeMetadata: VIBE_METADATA[vibeType as VibeArchetype],
          recommendations: tempResult.recommendations,
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
            validActions: ['generate', 'validate', 'apply', 'recommendations'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Vibe Coupon API] POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
