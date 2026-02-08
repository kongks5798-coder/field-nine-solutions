/**
 * NEXUS-X Energy Oracle API
 * @version 1.0.0 - Phase 11 RWA Launchpad
 *
 * Real-World Energy Asset Data Oracle
 * On-chain yield verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { energyOracle } from '@/lib/rwa/energy-oracle';

// ============================================
// API Handler
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';

  try {
    switch (action) {
      case 'status':
        return NextResponse.json({
          success: true,
          data: {
            oracle: 'ENERGY_ORACLE',
            version: '1.0.0',
            phase: 'PHASE_11_RWA',
            ...energyOracle.getOracleStatus(),
            supportedAssets: ['SOLAR', 'ESS', 'WIND', 'HYDRO', 'BIOMASS'],
            networks: ['Polygon Mainnet'],
          },
          timestamp: new Date().toISOString(),
        });

      case 'assets':
        const assets = energyOracle.getAllAssets();
        return NextResponse.json({
          success: true,
          data: {
            assets,
            totalCapacity: assets.reduce((sum, a) => sum + a.capacity.installed, 0),
            totalInvestment: assets.reduce((sum, a) => sum + a.financials.totalInvestment, 0),
            byType: {
              SOLAR: assets.filter(a => a.type === 'SOLAR').length,
              ESS: assets.filter(a => a.type === 'ESS').length,
              WIND: assets.filter(a => a.type === 'WIND').length,
            },
          },
          timestamp: new Date().toISOString(),
        });

      case 'asset':
        const assetId = searchParams.get('id');
        if (!assetId) {
          return NextResponse.json(
            { success: false, error: 'Asset ID required' },
            { status: 400 }
          );
        }

        const asset = energyOracle.getAsset(assetId);
        if (!asset) {
          return NextResponse.json(
            { success: false, error: 'Asset not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            asset,
            recentData: energyOracle.getDataPoints(assetId, 10),
          },
          timestamp: new Date().toISOString(),
        });

      case 'data':
        const dataAssetId = searchParams.get('assetId');
        const limit = parseInt(searchParams.get('limit') || '100');

        if (!dataAssetId) {
          return NextResponse.json(
            { success: false, error: 'Asset ID required' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            assetId: dataAssetId,
            dataPoints: energyOracle.getDataPoints(dataAssetId, limit),
            limit,
          },
          timestamp: new Date().toISOString(),
        });

      case 'attestation':
        const attestAssetId = searchParams.get('assetId');
        const period = parseInt(searchParams.get('period') || '30');

        if (!attestAssetId) {
          return NextResponse.json(
            { success: false, error: 'Asset ID required' },
            { status: 400 }
          );
        }

        const attestation = energyOracle.createYieldAttestation(attestAssetId, period);
        if (!attestation) {
          return NextResponse.json(
            { success: false, error: 'Failed to create attestation' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: attestation,
          timestamp: new Date().toISOString(),
        });

      case 'attestations':
        const filterAssetId = searchParams.get('assetId') || undefined;
        return NextResponse.json({
          success: true,
          data: {
            attestations: energyOracle.getAttestations(filterAssetId),
            filter: { assetId: filterAssetId },
          },
          timestamp: new Date().toISOString(),
        });

      case 'feed':
        // Generate real-time data feed for all assets
        const allAssets = energyOracle.getAllAssets();
        const feed = allAssets.map(asset => ({
          asset: {
            id: asset.id,
            name: asset.name,
            type: asset.type,
          },
          latestData: energyOracle.generateDataPoint(asset.id),
        }));

        return NextResponse.json({
          success: true,
          data: {
            feed,
            generatedAt: new Date().toISOString(),
            assetsUpdated: feed.length,
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
    console.error('[Energy Oracle API] Error:', error);
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
      case 'register_asset':
        const { asset } = body;
        if (!asset || !asset.id || !asset.name || !asset.type) {
          return NextResponse.json(
            { success: false, error: 'Invalid asset data' },
            { status: 400 }
          );
        }

        energyOracle.registerAsset(asset);

        return NextResponse.json({
          success: true,
          data: {
            message: 'Asset registered successfully',
            assetId: asset.id,
          },
          timestamp: new Date().toISOString(),
        });

      case 'generate_data':
        const { assetId } = body;
        if (!assetId) {
          return NextResponse.json(
            { success: false, error: 'Asset ID required' },
            { status: 400 }
          );
        }

        const dataPoint = energyOracle.generateDataPoint(assetId);
        if (!dataPoint) {
          return NextResponse.json(
            { success: false, error: 'Asset not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: dataPoint,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Energy Oracle API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
