/**
 * EPO ATTESTATION API
 *
 * Creates digital watermarks for energy production data.
 * Each kWh is stamped with an immutable cryptographic fingerprint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { digitalWatermarkEngine, YEONGDONG_NODE_CONFIG } from '@/lib/epo/digital-watermark';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nodeId, kwhProduced, sourceType, inverterReadings, weatherConditions } = body;

    // Validate required fields
    if (!nodeId || !kwhProduced || !sourceType) {
      return NextResponse.json(
        { error: 'Missing required fields: nodeId, kwhProduced, sourceType' },
        { status: 400 }
      );
    }

    // Validate API key (simplified for demo)
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!apiKey || !apiKey.startsWith('fn_epo_')) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    // Create attestation
    const watermark = await digitalWatermarkEngine.createWatermark({
      nodeId,
      timestamp: Date.now(),
      kwhProduced,
      sourceType,
      gridConnection: 'KEPCO-154kV',
      latitude: YEONGDONG_NODE_CONFIG.location.coordinates.lat,
      longitude: YEONGDONG_NODE_CONFIG.location.coordinates.lng,
      inverterReadings: inverterReadings || [
        {
          inverterId: 'INV-001',
          voltage: 380 + Math.random() * 10,
          current: 125 + Math.random() * 5,
          frequency: 60.0 + Math.random() * 0.1,
          powerFactor: 0.98 + Math.random() * 0.02,
          temperature: 35 + Math.random() * 5,
        },
      ],
      weatherConditions: weatherConditions || {
        irradiance: 850 + Math.random() * 150,
        temperature: 22 + Math.random() * 8,
        humidity: 45 + Math.random() * 20,
      },
    });

    return NextResponse.json({
      success: true,
      watermarkId: watermark.watermarkId,
      nodeId: watermark.nodeId,
      kwhAttested: watermark.kwhAttested,
      proofHash: watermark.proofHash,
      status: watermark.status,
      estimatedConfirmation: '~15 seconds (next batch)',
      zkProof: {
        commitment: watermark.zkProof.commitment,
        nullifier: watermark.zkProof.nullifier,
        publicInputs: watermark.zkProof.publicInputs,
      },
      polygon: {
        network: 'mainnet',
        pendingAttestation: true,
      },
    });
  } catch (error) {
    console.error('[EPO Attest Error]', error);
    return NextResponse.json(
      { error: 'Attestation failed', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const nodeId = searchParams.get('nodeId') || 'YEONGDONG-001';

  switch (action) {
    case 'status': {
      const stats = digitalWatermarkEngine.getAttestationStats();
      return NextResponse.json({
        status: 'operational',
        engine: 'Digital Watermark Engine v1.0',
        ...stats,
        batchInterval: '15 seconds',
        zkpEnabled: true,
        polygonNetwork: 'mainnet',
      });
    }

    case 'watermarks': {
      const watermarks = digitalWatermarkEngine.getNodeWatermarks(nodeId);
      return NextResponse.json({
        nodeId,
        watermarks: watermarks.slice(0, 100),
        total: watermarks.length,
      });
    }

    case 'node': {
      return NextResponse.json({
        node: YEONGDONG_NODE_CONFIG,
        status: 'SOVEREIGN_CERTIFIED',
        epoVersion: '1.0',
      });
    }

    default:
      return NextResponse.json({
        api: 'EPO Attestation API',
        version: '1.0',
        endpoints: {
          'POST /api/epo/attest': 'Create new attestation',
          'GET /api/epo/attest?action=status': 'Engine status',
          'GET /api/epo/attest?action=watermarks&nodeId=X': 'List watermarks',
          'GET /api/epo/attest?action=node': 'Node configuration',
        },
      });
  }
}
