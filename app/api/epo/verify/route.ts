/**
 * EPO VERIFICATION API
 *
 * Verify energy watermarks and trigger royalty payments.
 * Each verification call charges a micro-royalty in NXUSD.
 */

import { NextRequest, NextResponse } from 'next/server';
import { digitalWatermarkEngine } from '@/lib/epo/digital-watermark';
import { globalEnergyRoyaltyEngine, ROYALTY_TIERS } from '@/lib/epo/royalty-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { watermarkId, watermarkIds } = body;

    // Validate API key
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!apiKey || !apiKey.startsWith('fn_epo_')) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    // Batch verification
    if (watermarkIds && Array.isArray(watermarkIds)) {
      if (watermarkIds.length > 100) {
        return NextResponse.json(
          { error: 'Batch size limited to 100 watermarks' },
          { status: 400 }
        );
      }

      const results = [];
      let totalRoyalty = 0;

      for (const wId of watermarkIds) {
        const result = await digitalWatermarkEngine.verifyWatermark(wId, apiKey);
        if (result.valid && result.watermark) {
          globalEnergyRoyaltyEngine.processVerificationRoyalty(
            wId,
            result.watermark.nodeId,
            apiKey
          );
        }
        results.push({
          watermarkId: wId,
          valid: result.valid,
          kwhAttested: result.watermark?.kwhAttested || 0,
          sourceType: result.watermark?.sourceType || 'unknown',
        });
        totalRoyalty += result.royaltyCharged;
      }

      return NextResponse.json({
        success: true,
        batch: true,
        results,
        totalValid: results.filter(r => r.valid).length,
        totalInvalid: results.filter(r => !r.valid).length,
        totalRoyaltyCharged: totalRoyalty,
        batchId: `BATCH-${Date.now()}`,
      });
    }

    // Single verification
    if (!watermarkId) {
      return NextResponse.json(
        { error: 'Missing watermarkId' },
        { status: 400 }
      );
    }

    const result = await digitalWatermarkEngine.verifyWatermark(watermarkId, apiKey);

    if (!result.valid) {
      return NextResponse.json({
        valid: false,
        watermarkId,
        error: 'Watermark not found or invalid',
      });
    }

    // Process royalty
    const royaltyTx = globalEnergyRoyaltyEngine.processVerificationRoyalty(
      watermarkId,
      result.watermark!.nodeId,
      apiKey
    );

    // Calculate carbon offset
    const carbonOffset = result.watermark!.kwhAttested * 0.475;

    return NextResponse.json({
      valid: true,
      watermarkId,
      nodeId: result.watermark!.nodeId,
      sourceType: result.watermark!.sourceType,
      kwhAttested: result.watermark!.kwhAttested,
      attestationTime: new Date(result.watermark!.timestamp).toISOString(),
      polygonTxHash: result.watermark!.polygonTxHash || 'pending',
      royaltyCharged: result.royaltyCharged,
      verificationProof: result.verificationProof,
      metadata: {
        region: 'Gangwon-do, South Korea',
        certificationLevel: 'SOVEREIGN_CERTIFIED',
        carbonOffset: Math.round(carbonOffset * 100) / 100,
      },
      royaltyTransaction: royaltyTx ? {
        transactionId: royaltyTx.transactionId,
        amount: royaltyTx.amount,
        currency: 'NXUSD',
      } : null,
    });
  } catch (error) {
    console.error('[EPO Verify Error]', error);
    return NextResponse.json(
      { error: 'Verification failed', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'tiers': {
      return NextResponse.json({
        tiers: ROYALTY_TIERS,
        description: 'Verification pricing tiers',
      });
    }

    case 'stats': {
      const stats = digitalWatermarkEngine.getAttestationStats();
      return NextResponse.json({
        totalVerifications: stats.totalWatermarks,
        totalKwhVerified: stats.totalKwhAttested,
        totalRoyaltiesCollected: stats.totalRoyaltiesEarned,
      });
    }

    default:
      return NextResponse.json({
        api: 'EPO Verification API',
        version: '1.0',
        endpoints: {
          'POST /api/epo/verify': 'Verify watermark (charges royalty)',
          'POST /api/epo/verify (batch)': 'Verify multiple watermarks',
          'GET /api/epo/verify?action=tiers': 'Pricing tiers',
          'GET /api/epo/verify?action=stats': 'Verification statistics',
        },
        example: {
          request: {
            watermarkId: 'EPO-YEONGDONG-001-1706000000-A1B2C3D4',
          },
          response: {
            valid: true,
            kwhAttested: 42.5,
            royaltyCharged: 0.001,
          },
        },
      });
  }
}
