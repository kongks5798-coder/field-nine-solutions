/**
 * NEXUS-X RWA Investment API
 * @version 1.0.0 - Phase 11 RWA Launchpad
 *
 * Fractional Energy Asset Investment
 * NXUSD Dividend Distribution
 */

import { NextRequest, NextResponse } from 'next/server';
import { rwaInvestmentManager } from '@/lib/rwa/rwa-investment';

// ============================================
// API Handler
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'listings';

  try {
    switch (action) {
      case 'listings':
        const listings = rwaInvestmentManager.getProductListings();
        return NextResponse.json({
          success: true,
          data: {
            listings,
            totalProducts: listings.length,
            totalFundraisingTarget: listings.reduce((sum, l) => sum + l.fundraising.targetAmount, 0),
            avgProjectedYield: listings.reduce((sum, l) => sum + l.projections.annualYield, 0) / listings.length,
          },
          timestamp: new Date().toISOString(),
        });

      case 'stats':
        return NextResponse.json({
          success: true,
          data: {
            platform: 'FIELD_NINE_RWA',
            version: '1.0.0',
            ...rwaInvestmentManager.getPlatformStats(),
          },
          timestamp: new Date().toISOString(),
        });

      case 'tokens':
        const tokens = rwaInvestmentManager.getAllTokens();
        return NextResponse.json({
          success: true,
          data: {
            tokens,
            totalSupply: tokens.reduce((sum, t) => sum + t.totalSupply, 0),
            totalCirculating: tokens.reduce((sum, t) => sum + t.circulatingSupply, 0),
          },
          timestamp: new Date().toISOString(),
        });

      case 'token':
        const tokenId = searchParams.get('id');
        if (!tokenId) {
          return NextResponse.json(
            { success: false, error: 'Token ID required' },
            { status: 400 }
          );
        }

        const token = rwaInvestmentManager.getToken(tokenId);
        if (!token) {
          return NextResponse.json(
            { success: false, error: 'Token not found' },
            { status: 404 }
          );
        }

        const dividendHistory = rwaInvestmentManager.getDividendHistory(tokenId);

        return NextResponse.json({
          success: true,
          data: {
            token,
            dividendHistory,
            totalDividendsPaid: dividendHistory.reduce((sum, d) => sum + d.totalAmount, 0),
          },
          timestamp: new Date().toISOString(),
        });

      case 'portfolio':
        const userId = searchParams.get('userId');
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'User ID required' },
            { status: 400 }
          );
        }

        const portfolio = rwaInvestmentManager.getUserPortfolio(userId);

        return NextResponse.json({
          success: true,
          data: portfolio,
          timestamp: new Date().toISOString(),
        });

      case 'dividends':
        const divTokenId = searchParams.get('tokenId') || undefined;
        return NextResponse.json({
          success: true,
          data: {
            dividends: rwaInvestmentManager.getDividendHistory(divTokenId),
            filter: { tokenId: divTokenId },
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
    console.error('[RWA Investment API] Error:', error);
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
      case 'invest':
        const { userId, tokenId, amount } = body;
        if (!userId || !tokenId || !amount) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields: userId, tokenId, amount' },
            { status: 400 }
          );
        }

        const result = rwaInvestmentManager.invest(userId, tokenId, amount);

        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            investment: result.investment,
            message: `Successfully invested $${amount} in ${tokenId}`,
          },
          timestamp: new Date().toISOString(),
        });

      case 'distribute_dividends':
        const { tokenId: divTokenId } = body;
        if (!divTokenId) {
          return NextResponse.json(
            { success: false, error: 'Token ID required' },
            { status: 400 }
          );
        }

        const distribution = rwaInvestmentManager.distributeDividends(divTokenId);

        if (!distribution) {
          return NextResponse.json(
            { success: false, error: 'Distribution failed - no holders or invalid token' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            distribution,
            message: `Distributed $${distribution.totalAmount} to ${distribution.eligibleHolders} holders`,
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
    console.error('[RWA Investment API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
