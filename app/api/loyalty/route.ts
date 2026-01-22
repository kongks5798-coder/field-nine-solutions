/**
 * Field Nine Unified Loyalty API
 * @version 1.0.0 - Phase 11 Ecosystem Integration
 *
 * Cross-Platform Loyalty Program
 * NEXUS-X + K-Universal Benefits
 */

import { NextRequest, NextResponse } from 'next/server';
import { loyaltyManager, TIER_CONFIG, POINT_RULES, LoyaltyTier } from '@/lib/loyalty/unified-loyalty';

// ============================================
// API Handler
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'overview';

  try {
    switch (action) {
      case 'overview':
        const stats = loyaltyManager.getProgramStats();
        return NextResponse.json({
          success: true,
          data: {
            program: 'FIELD_NINE_LOYALTY',
            version: '1.0.0',
            phase: 'PHASE_11_ECOSYSTEM',
            ...stats,
            tiers: Object.keys(TIER_CONFIG),
            benefits: {
              trading: 'Up to 30% fee discount',
              accommodation: 'Up to 25% discount',
              rwa: 'Up to 20% allocation bonus',
              exclusive: 'Lounge access, Concierge service',
            },
          },
          timestamp: new Date().toISOString(),
        });

      case 'tiers':
        return NextResponse.json({
          success: true,
          data: {
            tiers: TIER_CONFIG,
            progression: {
              BRONZE: '0 points',
              SILVER: '1,000 points',
              GOLD: '5,000 points',
              PLATINUM: '20,000 points',
              DIAMOND: '100,000 points',
            },
          },
          timestamp: new Date().toISOString(),
        });

      case 'rules':
        return NextResponse.json({
          success: true,
          data: {
            earnRules: POINT_RULES,
            categories: ['TRADING', 'TRAVEL', 'RWA', 'REFERRAL'],
            notes: {
              multiplier: 'Points are multiplied by tier (1x Bronze to 2x Diamond)',
              expiry: 'Points expire after 12 months',
              referral: 'Earn 500 points per referral + bonus when they tier up',
            },
          },
          timestamp: new Date().toISOString(),
        });

      case 'member':
        const userId = searchParams.get('userId');
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'User ID required' },
            { status: 400 }
          );
        }

        const member = loyaltyManager.getMember(userId);
        if (!member) {
          return NextResponse.json(
            { success: false, error: 'Member not found' },
            { status: 404 }
          );
        }

        const transactions = loyaltyManager.getMemberTransactions(userId, 20);

        return NextResponse.json({
          success: true,
          data: {
            member,
            recentTransactions: transactions,
            nextTier: getNextTier(member.tier),
            pointsToNextTier: getPointsToNextTier(member.lifetimePoints, member.tier),
          },
          timestamp: new Date().toISOString(),
        });

      case 'rewards':
        const tier = (searchParams.get('tier') || 'BRONZE') as LoyaltyTier;
        const rewards = loyaltyManager.getAvailableRewards(tier);

        return NextResponse.json({
          success: true,
          data: {
            rewards,
            tier,
            totalAvailable: rewards.length,
          },
          timestamp: new Date().toISOString(),
        });

      case 'calculate_discount':
        const discountUserId = searchParams.get('userId');
        const price = parseFloat(searchParams.get('price') || '0');
        const type = searchParams.get('type') as 'TRADING_FEE' | 'ACCOMMODATION' | 'FLIGHT';

        if (!discountUserId || !price || !type) {
          return NextResponse.json(
            { success: false, error: 'Missing required parameters: userId, price, type' },
            { status: 400 }
          );
        }

        const discount = loyaltyManager.calculateDiscountedPrice(discountUserId, price, type);

        return NextResponse.json({
          success: true,
          data: {
            originalPrice: price,
            ...discount,
            type,
          },
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Loyalty API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Service unavailable' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'register':
        const { userId, referralCode } = body;
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'User ID required' },
            { status: 400 }
          );
        }

        // Check if already registered
        if (loyaltyManager.getMember(userId)) {
          return NextResponse.json(
            { success: false, error: 'User already registered' },
            { status: 400 }
          );
        }

        const member = loyaltyManager.registerMember(userId, referralCode);

        return NextResponse.json({
          success: true,
          data: {
            member,
            message: referralCode
              ? `Welcome! You received ${POINT_RULES.REFERRAL.refereeBonus} bonus points from referral.`
              : 'Welcome to Field Nine Loyalty Program!',
          },
          timestamp: new Date().toISOString(),
        });

      case 'earn_points':
        const { userId: earnUserId, points, source, description, metadata } = body;
        if (!earnUserId || !points || !source) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields: userId, points, source' },
            { status: 400 }
          );
        }

        const transaction = loyaltyManager.earnPoints(
          earnUserId,
          points,
          source,
          description || `Earned from ${source}`,
          metadata
        );

        if (!transaction) {
          return NextResponse.json(
            { success: false, error: 'Member not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            transaction,
            updatedMember: loyaltyManager.getMember(earnUserId),
          },
          timestamp: new Date().toISOString(),
        });

      case 'redeem':
        const { userId: redeemUserId, rewardId } = body;
        if (!redeemUserId || !rewardId) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields: userId, rewardId' },
            { status: 400 }
          );
        }

        const redeemResult = loyaltyManager.redeemReward(redeemUserId, rewardId);

        if (!redeemResult.success) {
          return NextResponse.json(
            { success: false, error: redeemResult.error },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            transaction: redeemResult.transaction,
            updatedMember: loyaltyManager.getMember(redeemUserId),
          },
          timestamp: new Date().toISOString(),
        });

      case 'record_trading':
        const { userId: tradeUserId, volume, profitable } = body;
        if (!tradeUserId || volume === undefined) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields: userId, volume' },
            { status: 400 }
          );
        }

        loyaltyManager.recordTradingActivity(tradeUserId, volume, profitable ?? false);

        return NextResponse.json({
          success: true,
          data: {
            message: `Recorded trading activity: $${volume}`,
            updatedMember: loyaltyManager.getMember(tradeUserId),
          },
          timestamp: new Date().toISOString(),
        });

      case 'record_travel':
        const { userId: travelUserId, amount, bookingType } = body;
        if (!travelUserId || !amount || !bookingType) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields: userId, amount, bookingType' },
            { status: 400 }
          );
        }

        loyaltyManager.recordTravelBooking(travelUserId, amount, bookingType);

        return NextResponse.json({
          success: true,
          data: {
            message: `Recorded ${bookingType} booking: $${amount}`,
            updatedMember: loyaltyManager.getMember(travelUserId),
          },
          timestamp: new Date().toISOString(),
        });

      case 'record_rwa':
        const { userId: rwaUserId, amount: rwaAmount, isFirst } = body;
        if (!rwaUserId || !rwaAmount) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields: userId, amount' },
            { status: 400 }
          );
        }

        loyaltyManager.recordRWAInvestment(rwaUserId, rwaAmount, isFirst ?? false);

        return NextResponse.json({
          success: true,
          data: {
            message: `Recorded RWA investment: $${rwaAmount}`,
            updatedMember: loyaltyManager.getMember(rwaUserId),
          },
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Loyalty API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

// Helper functions
function getNextTier(currentTier: LoyaltyTier): LoyaltyTier | null {
  const tiers: LoyaltyTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
  const idx = tiers.indexOf(currentTier);
  return idx < tiers.length - 1 ? tiers[idx + 1] : null;
}

function getPointsToNextTier(lifetimePoints: number, currentTier: LoyaltyTier): number | null {
  const nextTier = getNextTier(currentTier);
  if (!nextTier) return null;
  return Math.max(0, TIER_CONFIG[nextTier].minPoints - lifetimePoints);
}
