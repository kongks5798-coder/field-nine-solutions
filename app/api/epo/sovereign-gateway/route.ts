/**
 * EPO SOVEREIGN GATEWAY API
 *
 * Unified API for:
 * - Regulatory Enforcement
 * - Banking & Insurance Risk Analysis
 * - M2M Zero-Click Payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { regulatoryEnforcement, REGULATORY_AUTHORITIES } from '@/lib/epo/regulatory-enforcement';
import { bankingRiskAPI } from '@/lib/epo/banking-risk-api';
import { m2mAutopilot } from '@/lib/epo/m2m-autopilot';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const module = searchParams.get('module');
  const action = searchParams.get('action');

  // REGULATORY MODULE
  if (module === 'regulatory') {
    switch (action) {
      case 'authorities': {
        const country = searchParams.get('country');
        const authorities = country
          ? regulatoryEnforcement.getAuthoritiesForCountry(country)
          : regulatoryEnforcement.getAllAuthorities();

        return NextResponse.json({
          authorities,
          total: authorities.length,
          countries: [...new Set(authorities.map(a => a.country))],
        });
      }

      case 'enforcement-stats': {
        const stats = regulatoryEnforcement.getEnforcementStats();

        return NextResponse.json({
          stats,
          status: 'HARD_ENFORCEMENT_ACTIVE',
          message: 'No Compliance Proof = No Settlement',
        });
      }

      case 'active-enforcements': {
        const enforcements = regulatoryEnforcement.getActiveEnforcements();

        return NextResponse.json({
          enforcements,
          total: enforcements.length,
          frozenCount: enforcements.filter(e => e.actionType === 'freeze').length,
        });
      }

      case 'check-proof': {
        const proofId = searchParams.get('proofId');

        if (!proofId) {
          return NextResponse.json({ error: 'Proof ID required' }, { status: 400 });
        }

        const result = regulatoryEnforcement.canProceedWithSettlement(proofId);

        return NextResponse.json({
          proofId,
          ...result,
          timestamp: new Date().toISOString(),
        });
      }

      case 'subsidy-calculation': {
        const nodeId = searchParams.get('nodeId') || 'YEONGDONG-001';
        const country = searchParams.get('country') || 'KR';
        const kwh = parseFloat(searchParams.get('kwh') || '10000');
        const source = searchParams.get('source') || 'solar';

        const calculation = regulatoryEnforcement.calculateSubsidy(nodeId, country, kwh, source);

        return NextResponse.json({
          calculation,
          parameters: { nodeId, country, kwh, source },
        });
      }
    }
  }

  // BANKING MODULE
  if (module === 'banking') {
    switch (action) {
      case 'quick-grade': {
        const nodeId = searchParams.get('nodeId');

        if (!nodeId) {
          return NextResponse.json({ error: 'Node ID required' }, { status: 400 });
        }

        const grade = await bankingRiskAPI.getLendingGrade(nodeId);

        return NextResponse.json({
          grade,
          gradeScale: 'AAA (highest) to D (default)',
        });
      }

      case 'grade-distribution': {
        const distribution = bankingRiskAPI.getGradeDistribution();

        return NextResponse.json({
          distribution,
          investmentGrade: ['AAA', 'AA', 'A', 'BBB'],
          speculativeGrade: ['BB', 'B', 'CCC', 'CC', 'C', 'D'],
        });
      }
    }
  }

  // M2M MODULE
  if (module === 'm2m') {
    switch (action) {
      case 'stats': {
        const stats = m2mAutopilot.getStats();

        return NextResponse.json({
          stats,
          paymentMode: 'ZERO_CLICK_ACTIVE',
          supportedDevices: ['electric_vehicle', 'autonomous_robot', 'delivery_drone', 'industrial_robot'],
        });
      }

      case 'devices': {
        const limit = parseInt(searchParams.get('limit') || '50');
        const devices = m2mAutopilot.getAllDevices().slice(0, limit);

        return NextResponse.json({
          devices,
          total: m2mAutopilot.getAllDevices().length,
        });
      }

      case 'active-sessions': {
        const sessions = m2mAutopilot.getActiveSessions();

        return NextResponse.json({
          sessions,
          total: sessions.length,
        });
      }

      case 'completed-sessions': {
        const limit = parseInt(searchParams.get('limit') || '100');
        const sessions = m2mAutopilot.getCompletedSessions(limit);

        return NextResponse.json({
          sessions,
          total: sessions.length,
        });
      }

      case 'v2g-sessions': {
        const sessions = m2mAutopilot.getV2GSessions();

        return NextResponse.json({
          sessions,
          total: sessions.length,
          totalCompensation: sessions.reduce((sum, s) => sum + s.totalCompensation, 0),
        });
      }
    }
  }

  // Default: API overview
  return NextResponse.json({
    api: 'Sovereign Energy Gateway API',
    version: '1.0',
    description: 'The global standard for energy trading - No transaction without Field Nine',
    modules: {
      regulatory: {
        description: 'Hard-Enforcement Regulatory Compliance',
        endpoints: [
          'GET ?module=regulatory&action=authorities',
          'GET ?module=regulatory&action=enforcement-stats',
          'GET ?module=regulatory&action=active-enforcements',
          'GET ?module=regulatory&action=check-proof&proofId=...',
          'GET ?module=regulatory&action=subsidy-calculation',
          'POST (generate-proof) - Generate Compliance Proof',
        ],
      },
      banking: {
        description: 'Banking & Insurance Risk Analysis',
        endpoints: [
          'GET ?module=banking&action=quick-grade&nodeId=...',
          'GET ?module=banking&action=grade-distribution',
          'POST (credit-report) - Generate full credit report',
          'POST (portfolio-analysis) - Analyze portfolio risk',
        ],
      },
      m2m: {
        description: 'M2M Zero-Click Payments',
        endpoints: [
          'GET ?module=m2m&action=stats',
          'GET ?module=m2m&action=devices',
          'GET ?module=m2m&action=active-sessions',
          'GET ?module=m2m&action=completed-sessions',
          'GET ?module=m2m&action=v2g-sessions',
          'POST (register-device) - Register M2M device',
          'POST (zero-click) - Execute Zero-Click payment',
          'POST (v2g) - Start V2G session',
          'POST (simulation) - Run M2M simulation',
        ],
      },
    },
    hardEnforcement: {
      status: 'ACTIVE',
      rule: 'NO COMPLIANCE PROOF = NO SETTLEMENT',
      coverage: '100% of transactions',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { module, action } = body;

    // Validate API key
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!apiKey || !apiKey.startsWith('fn_epo_')) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    // REGULATORY MODULE
    if (module === 'regulatory') {
      switch (action) {
        case 'generate-proof': {
          const { nodeId, countryCode, transactionType, kwhAmount, nxusdValue, sourceType } = body;

          if (!nodeId || !transactionType || !kwhAmount) {
            return NextResponse.json(
              { error: 'Missing required fields: nodeId, transactionType, kwhAmount' },
              { status: 400 }
            );
          }

          const proof = await regulatoryEnforcement.generateComplianceProof({
            nodeId,
            countryCode: countryCode || 'KR',
            transactionType,
            kwhAmount,
            nxusdValue: nxusdValue || kwhAmount * 0.08,
            sourceType: sourceType || 'solar',
          });

          return NextResponse.json({
            success: proof.settlementAuthorization.authorized,
            proof,
            message: proof.settlementAuthorization.authorized
              ? 'Settlement authorized'
              : `SETTLEMENT FROZEN: ${proof.settlementAuthorization.freezeReason}`,
          });
        }
      }
    }

    // BANKING MODULE
    if (module === 'banking') {
      switch (action) {
        case 'credit-report': {
          const { nodeId, analysisType, requesterId, requesterType } = body;

          if (!nodeId) {
            return NextResponse.json(
              { error: 'Missing required field: nodeId' },
              { status: 400 }
            );
          }

          const report = await bankingRiskAPI.generateCreditReport({
            nodeId,
            analysisType: analysisType || 'full',
            requesterId: requesterId || apiKey,
            requesterType: requesterType || 'bank',
          });

          return NextResponse.json({
            success: true,
            report,
            summary: {
              grade: report.overallGrade,
              score: report.gradeScore,
              outlook: report.gradeOutlook,
              maxLoan: report.lendingAssessment.maxLoanAmount,
              insurability: report.insuranceAssessment.insurabilityGrade,
            },
          });
        }

        case 'portfolio-analysis': {
          const { nodeIds, portfolioId } = body;

          if (!nodeIds || !Array.isArray(nodeIds)) {
            return NextResponse.json(
              { error: 'Missing required field: nodeIds (array)' },
              { status: 400 }
            );
          }

          const analysis = await bankingRiskAPI.analyzePortfolio(
            nodeIds,
            portfolioId || `PORTFOLIO-${Date.now()}`
          );

          return NextResponse.json({
            success: true,
            analysis,
          });
        }
      }
    }

    // M2M MODULE
    if (module === 'm2m') {
      switch (action) {
        case 'register-device': {
          const { deviceType, manufacturer, model, publicKey, walletAddress, batteryCapacity, maxChargingRate, initialBalance } = body;

          if (!deviceType || !manufacturer || !model) {
            return NextResponse.json(
              { error: 'Missing required fields: deviceType, manufacturer, model' },
              { status: 400 }
            );
          }

          const device = m2mAutopilot.registerDevice({
            deviceType,
            manufacturer,
            model,
            publicKey: publicKey || `0x${Date.now().toString(16)}`,
            walletAddress: walletAddress || `0x${Date.now().toString(16)}`,
            batteryCapacity: batteryCapacity || 75,
            maxChargingRate: maxChargingRate || 150,
            initialBalance: initialBalance || 100,
          });

          return NextResponse.json({
            success: true,
            device,
            message: `Device registered: ${device.deviceId}`,
          });
        }

        case 'zero-click': {
          const { deviceId, nodeId, requestedKwh, authSignature } = body;

          if (!deviceId || !nodeId || !requestedKwh) {
            return NextResponse.json(
              { error: 'Missing required fields: deviceId, nodeId, requestedKwh' },
              { status: 400 }
            );
          }

          const result = await m2mAutopilot.executeZeroClickPayment({
            deviceId,
            nodeId,
            requestedKwh,
            authSignature: authSignature || 'auto',
          });

          return NextResponse.json({
            success: result.success,
            result,
            message: `Zero-Click Payment settled in ${result.totalProcessingTime}ms`,
          });
        }

        case 'v2g': {
          const { deviceId, nodeId, kwhToSell, gridService } = body;

          if (!deviceId || !nodeId || !kwhToSell) {
            return NextResponse.json(
              { error: 'Missing required fields: deviceId, nodeId, kwhToSell' },
              { status: 400 }
            );
          }

          const session = await m2mAutopilot.startV2GSession({
            deviceId,
            nodeId,
            kwhToSell,
            gridService,
          });

          return NextResponse.json({
            success: true,
            session,
            message: `V2G session started: ${session.energyTransferred} kWh → $${session.totalCompensation.toFixed(4)} compensation`,
          });
        }

        case 'simulation': {
          const { deviceCount, sessionsPerDevice, avgKwhPerSession } = body;

          const result = await m2mAutopilot.runSimulation({
            deviceCount: deviceCount || 10,
            sessionsPerDevice: sessionsPerDevice || 5,
            avgKwhPerSession: avgKwhPerSession || 30,
          });

          return NextResponse.json({
            success: true,
            simulation: result,
          });
        }
      }
    }

    return NextResponse.json(
      { error: 'Unknown module/action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Sovereign Gateway Error]', error);
    return NextResponse.json(
      { error: 'Operation failed', details: String(error) },
      { status: 500 }
    );
  }
}
