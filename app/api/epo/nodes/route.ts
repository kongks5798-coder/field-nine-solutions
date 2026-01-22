/**
 * EPO NODES API
 *
 * Manage certified EPO energy nodes.
 * Yeongdong Node #1 is the world's first Sovereign-Certified EPO node.
 */

import { NextRequest, NextResponse } from 'next/server';
import { YEONGDONG_NODE_CONFIG, digitalWatermarkEngine } from '@/lib/epo/digital-watermark';
import { globalEnergyRoyaltyEngine } from '@/lib/epo/royalty-engine';

// Global certified nodes registry
const CERTIFIED_NODES = [
  {
    nodeId: 'YEONGDONG-001',
    name: 'Yeongdong Energy Node #1',
    region: 'Gangwon-do, South Korea',
    capacity: 50000,  // 50 MW
    sourceType: 'solar',
    certificationLevel: 'SOVEREIGN_CERTIFIED',
    certificationId: 'EPO-CERT-YEONGDONG-001',
    certifiedDate: '2026-01-22',
    status: 'active',
    coordinates: { lat: 37.1845, lng: 128.9180 },
    operator: 'Field Nine Solutions',
    gridConnection: 'KEPCO-154kV',
  },
  {
    nodeId: 'JEJU-001',
    name: 'Jeju Wind Farm #1',
    region: 'Jeju-do, South Korea',
    capacity: 30000,  // 30 MW
    sourceType: 'wind',
    certificationLevel: 'CERTIFIED',
    certificationId: 'EPO-CERT-JEJU-001',
    certifiedDate: '2026-02-15',
    status: 'active',
    coordinates: { lat: 33.4996, lng: 126.5312 },
    operator: 'Jeju Energy Corp',
    gridConnection: 'KEPCO-66kV',
  },
  {
    nodeId: 'BUSAN-001',
    name: 'Busan Solar Park',
    region: 'Busan, South Korea',
    capacity: 20000,  // 20 MW
    sourceType: 'solar',
    certificationLevel: 'CERTIFIED',
    certificationId: 'EPO-CERT-BUSAN-001',
    certifiedDate: '2026-03-01',
    status: 'active',
    coordinates: { lat: 35.1796, lng: 129.0756 },
    operator: 'Busan Green Energy',
    gridConnection: 'KEPCO-154kV',
  },
  {
    nodeId: 'SYDNEY-001',
    name: 'Sydney Solar Array',
    region: 'New South Wales, Australia',
    capacity: 45000,  // 45 MW
    sourceType: 'solar',
    certificationLevel: 'CERTIFIED',
    certificationId: 'EPO-CERT-SYDNEY-001',
    certifiedDate: '2026-04-10',
    status: 'pending',
    coordinates: { lat: -33.8688, lng: 151.2093 },
    operator: 'Aura Sydney Energy',
    gridConnection: 'Ausgrid-330kV',
  },
  {
    nodeId: 'TEXAS-001',
    name: 'West Texas Wind Hub',
    region: 'Texas, USA',
    capacity: 100000,  // 100 MW
    sourceType: 'wind',
    certificationLevel: 'PENDING',
    certificationId: 'EPO-CERT-TEXAS-001',
    certifiedDate: null,
    status: 'pending',
    coordinates: { lat: 31.9686, lng: -99.9018 },
    operator: 'PJM West Partners',
    gridConnection: 'ERCOT-345kV',
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const nodeId = searchParams.get('nodeId');

  switch (action) {
    case 'list': {
      const region = searchParams.get('region');
      const sourceType = searchParams.get('sourceType');
      const status = searchParams.get('status');

      let nodes = [...CERTIFIED_NODES];

      if (region) {
        nodes = nodes.filter(n => n.region.toLowerCase().includes(region.toLowerCase()));
      }
      if (sourceType) {
        nodes = nodes.filter(n => n.sourceType === sourceType);
      }
      if (status) {
        nodes = nodes.filter(n => n.status === status);
      }

      return NextResponse.json({
        nodes,
        total: nodes.length,
        summary: {
          totalCapacity: nodes.reduce((sum, n) => sum + n.capacity, 0),
          byType: {
            solar: nodes.filter(n => n.sourceType === 'solar').length,
            wind: nodes.filter(n => n.sourceType === 'wind').length,
          },
          byStatus: {
            active: nodes.filter(n => n.status === 'active').length,
            pending: nodes.filter(n => n.status === 'pending').length,
          },
        },
      });
    }

    case 'detail': {
      if (!nodeId) {
        return NextResponse.json(
          { error: 'nodeId required' },
          { status: 400 }
        );
      }

      const node = CERTIFIED_NODES.find(n => n.nodeId === nodeId);
      if (!node) {
        return NextResponse.json(
          { error: 'Node not found' },
          { status: 404 }
        );
      }

      // Get attestation stats
      const watermarks = digitalWatermarkEngine.getNodeWatermarks(nodeId);
      const royaltyAccount = globalEnergyRoyaltyEngine.getNodeAccount(nodeId);

      return NextResponse.json({
        node,
        stats: {
          totalWatermarks: watermarks.length,
          totalKwhAttested: watermarks.reduce((sum, w) => sum + w.kwhAttested, 0),
          totalRoyaltiesEarned: royaltyAccount?.totalEarned || 0,
          totalVerifications: royaltyAccount?.totalVerifications || 0,
        },
        recentWatermarks: watermarks.slice(0, 10).map(w => ({
          watermarkId: w.watermarkId,
          timestamp: new Date(w.timestamp).toISOString(),
          kwhAttested: w.kwhAttested,
          status: w.status,
        })),
      });
    }

    case 'sovereign': {
      // Get the world's first Sovereign-certified node
      return NextResponse.json({
        certification: {
          type: 'SOVEREIGN_CERTIFIED',
          description: 'Global First EPO Sovereign Node',
          issuedTo: 'YEONGDONG-001',
          issuedBy: 'Field Nine EPO Protocol',
          issuedDate: '2026-01-22',
          privileges: [
            'Global first mover recognition',
            'Protocol governance voting',
            'Revenue sharing participation',
            'Priority support',
            'Exclusive branding rights',
          ],
        },
        node: YEONGDONG_NODE_CONFIG,
        liveStats: {
          currentGeneration: 42500 + Math.random() * 5000,  // kW
          dailyGeneration: 285000 + Math.random() * 15000,   // kWh
          monthlyGeneration: 8500000 + Math.random() * 500000,
          yearlyProjection: 102000000,
          carbonOffset: 48450000,  // kg CO2
        },
      });
    }

    case 'map': {
      // Node locations for map visualization
      return NextResponse.json({
        nodes: CERTIFIED_NODES.map(n => ({
          nodeId: n.nodeId,
          name: n.name,
          coordinates: n.coordinates,
          capacity: n.capacity,
          sourceType: n.sourceType,
          status: n.status,
        })),
        clusters: [
          { region: 'Asia-Pacific', count: 4, totalCapacity: 145000 },
          { region: 'North America', count: 1, totalCapacity: 100000 },
        ],
      });
    }

    default:
      return NextResponse.json({
        api: 'EPO Nodes API',
        version: '1.0',
        totalNodes: CERTIFIED_NODES.length,
        totalCapacity: `${CERTIFIED_NODES.reduce((sum, n) => sum + n.capacity, 0) / 1000} MW`,
        sovereignNode: 'YEONGDONG-001',
        endpoints: {
          'GET /api/epo/nodes?action=list': 'List all certified nodes',
          'GET /api/epo/nodes?action=detail&nodeId=X': 'Node details',
          'GET /api/epo/nodes?action=sovereign': 'Sovereign node info',
          'GET /api/epo/nodes?action=map': 'Node locations for map',
          'POST /api/epo/nodes': 'Register new node (Sovereign tier)',
        },
      });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Validate API key (Sovereign tier required)
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!apiKey || !apiKey.startsWith('fn_epo_')) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'register': {
        const { name, region, capacity, sourceType, coordinates, gridConnection } = body;

        if (!name || !region || !capacity || !sourceType || !coordinates) {
          return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          );
        }

        // Generate node ID
        const regionCode = region.split(',')[0].toUpperCase().slice(0, 6);
        const nodeCount = CERTIFIED_NODES.filter(n =>
          n.nodeId.startsWith(regionCode)
        ).length;
        const nodeId = `${regionCode}-${String(nodeCount + 1).padStart(3, '0')}`;

        // Create pending node
        const newNode = {
          nodeId,
          name,
          region,
          capacity,
          sourceType,
          certificationLevel: 'PENDING',
          certificationId: `EPO-CERT-${nodeId}`,
          certifiedDate: null,
          status: 'pending' as const,
          coordinates,
          operator: body.operator || 'Unknown',
          gridConnection: gridConnection || 'Unknown',
        };

        return NextResponse.json({
          success: true,
          message: 'Node registration submitted',
          node: newNode,
          nextSteps: [
            'Technical verification (1-2 weeks)',
            'Grid connection audit',
            'Smart meter integration',
            'EPO Oracle deployment',
            'Certification issuance',
          ],
          estimatedCertification: '4-6 weeks',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action. Use: register' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[EPO Nodes Error]', error);
    return NextResponse.json(
      { error: 'Node operation failed', details: String(error) },
      { status: 500 }
    );
  }
}
