/**
 * EPO UNIVERSAL COMPLIANCE ORACLE API
 *
 * Automatic regulatory compliance validation across
 * RE100, CBAM, ESG, GHG Protocol, and SBTi frameworks.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  complianceOracle,
  COUNTRY_REGULATIONS,
  CARBON_INTENSITY,
} from '@/lib/epo/compliance-oracle';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'frameworks': {
      return NextResponse.json({
        frameworks: [
          {
            id: 'RE100',
            name: 'RE100 Initiative',
            description: '100% renewable electricity commitment',
            version: '2024',
            requirements: ['100% renewable energy', 'Annual reporting', 'Third-party verification'],
          },
          {
            id: 'CBAM',
            name: 'Carbon Border Adjustment Mechanism',
            description: 'EU carbon pricing for imports',
            version: 'EU-2026',
            requirements: ['Carbon intensity reporting', 'Verified producer', 'Origin declaration'],
          },
          {
            id: 'ESG',
            name: 'Environmental, Social, Governance',
            description: 'Comprehensive sustainability scoring',
            version: 'GRI-2024',
            requirements: ['Environmental metrics', 'Social standards', 'Governance transparency'],
          },
          {
            id: 'GHG',
            name: 'GHG Protocol',
            description: 'Greenhouse gas accounting standard',
            version: 'Corporate Standard v2',
            requirements: ['Scope 1, 2, 3 reporting', 'Baseline year', 'Reduction targets'],
          },
          {
            id: 'SBTi',
            name: 'Science Based Targets initiative',
            description: 'Climate targets aligned with Paris Agreement',
            version: '2.0',
            requirements: ['1.5°C alignment', 'Near-term targets', 'Long-term targets'],
          },
        ],
        totalFrameworks: 5,
        lastUpdated: new Date().toISOString(),
      });
    }

    case 'countries': {
      const countries = Object.entries(COUNTRY_REGULATIONS).map(([code, reg]) => ({
        code,
        name: reg.name,
        frameworks: reg.frameworks,
        carbonPrice: reg.carbonPrice,
        renewableMandate: reg.renewableMandate,
        reportingDeadline: reg.reportingDeadline,
      }));

      return NextResponse.json({
        countries,
        totalCountries: countries.length,
        highestCarbonPrice: Math.max(...countries.map(c => c.carbonPrice)),
        lowestCarbonPrice: Math.min(...countries.map(c => c.carbonPrice)),
      });
    }

    case 'carbon-factors': {
      return NextResponse.json({
        carbonIntensity: CARBON_INTENSITY,
        unit: 'gCO2/kWh',
        note: 'Zero for renewable sources (solar, wind, hydro)',
      });
    }

    case 'check-country': {
      const country = searchParams.get('country') || 'KR';
      const sourceType = searchParams.get('source') || 'solar';
      const amount = parseFloat(searchParams.get('amount') || '1000');

      const result = complianceOracle.checkCountryCompliance(country, sourceType, amount);

      return NextResponse.json({
        compliance: result,
        energyDetails: {
          sourceType,
          amount,
          unit: 'kWh',
        },
      });
    }

    case 'verify': {
      const certificationId = searchParams.get('id');

      if (!certificationId) {
        return NextResponse.json(
          { error: 'Certification ID required' },
          { status: 400 }
        );
      }

      const result = complianceOracle.verifyCertification(certificationId);

      return NextResponse.json({
        verification: result,
        timestamp: new Date().toISOString(),
      });
    }

    case 'stats': {
      const stats = complianceOracle.getComplianceStats();

      return NextResponse.json({
        stats,
        supportedFrameworks: 5,
        supportedCountries: Object.keys(COUNTRY_REGULATIONS).length,
        timestamp: new Date().toISOString(),
      });
    }

    case 'certifications': {
      const certifications = complianceOracle.getAllCertifications();

      return NextResponse.json({
        certifications: certifications.slice(0, 50),
        total: certifications.length,
        timestamp: new Date().toISOString(),
      });
    }

    default:
      return NextResponse.json({
        api: 'Universal Compliance Oracle API',
        version: '1.0',
        description: 'Automatic regulatory compliance validation',
        frameworks: ['RE100', 'CBAM', 'ESG', 'GHG Protocol', 'SBTi'],
        endpoints: {
          'GET ?action=frameworks': 'List all compliance frameworks',
          'GET ?action=countries': 'List country-specific regulations',
          'GET ?action=carbon-factors': 'Get carbon intensity factors',
          'GET ?action=check-country': 'Check country compliance (params: country, source, amount)',
          'GET ?action=verify': 'Verify certification (params: id)',
          'GET ?action=stats': 'Get compliance statistics',
          'GET ?action=certifications': 'List all certifications',
          'POST (validate)': 'Run full compliance validation',
          'POST (certify)': 'Generate Sovereign Certification',
        },
      });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Validate API key
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!apiKey || !apiKey.startsWith('fn_epo_')) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'validate': {
        const { sourceType, kwhAmount, nodeId, countryCode } = body;

        if (!sourceType || !kwhAmount) {
          return NextResponse.json(
            { error: 'Missing required fields: sourceType, kwhAmount' },
            { status: 400 }
          );
        }

        // Run all compliance checks
        const re100 = complianceOracle.validateRE100(sourceType, kwhAmount, nodeId || 'UNKNOWN');
        const cbam = complianceOracle.validateCBAM(sourceType, kwhAmount, countryCode || 'KR');
        const esg = complianceOracle.validateESG(sourceType, kwhAmount, nodeId || 'UNKNOWN');
        const ghgProtocol = complianceOracle.validateGHGProtocol(sourceType, kwhAmount);
        const sbti = complianceOracle.validateSBTi(sourceType, kwhAmount);

        const countryCompliance = complianceOracle.checkCountryCompliance(
          countryCode || 'KR',
          sourceType,
          kwhAmount
        );

        const isFullyCompliant =
          re100.status === 'compliant' &&
          (cbam.status === 'exempt' || cbam.status === 'verified') &&
          esg.rating !== 'CCC' &&
          ghgProtocol.status !== 'behind' &&
          sbti.validationStatus !== 'committed';

        return NextResponse.json({
          success: true,
          validation: {
            energy: {
              sourceType,
              kwhAmount,
              nodeId: nodeId || 'UNKNOWN',
              countryCode: countryCode || 'KR',
            },
            compliance: {
              re100,
              cbam,
              esg,
              ghgProtocol,
              sbti,
            },
            countrySpecific: countryCompliance,
            summary: {
              isFullyCompliant,
              overallRating: isFullyCompliant ? 'SOVEREIGN_CERTIFIED' : 'PARTIAL_COMPLIANCE',
              recommendations: isFullyCompliant
                ? []
                : ['Consider switching to 100% renewable energy sources for full compliance'],
            },
          },
          timestamp: new Date().toISOString(),
        });
      }

      case 'certify': {
        const {
          nodeId,
          sourceType,
          kwhAmount,
          countryCode,
          gridInjectionProof,
          watermarkId,
          attestationHash,
        } = body;

        if (!nodeId || !sourceType || !kwhAmount) {
          return NextResponse.json(
            { error: 'Missing required fields: nodeId, sourceType, kwhAmount' },
            { status: 400 }
          );
        }

        const certification = await complianceOracle.generateSovereignCertification(
          nodeId,
          sourceType,
          kwhAmount,
          countryCode || 'KR',
          gridInjectionProof || `GIP-${Date.now()}`,
          watermarkId || `EPO-${nodeId}-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
          attestationHash || `0x${Math.random().toString(16).slice(2, 66)}`
        );

        return NextResponse.json({
          success: true,
          certification: {
            certificationId: certification.certificationId,
            certificationHash: certification.certificationHash,
            timestamp: certification.timestamp,
            expiresAt: certification.expiresAt,
            validityPeriod: '1 year',
          },
          energySource: certification.energySource,
          complianceSummary: {
            re100: certification.compliance.re100.status,
            cbam: certification.compliance.cbam.status,
            esgRating: certification.compliance.esg.rating,
            ghgProtocol: certification.compliance.ghgProtocol.status,
            sbti: certification.compliance.sbti.validationStatus,
          },
          permanentRecord: certification.permanentRecord,
          message: `Sovereign Certification issued: ${certification.certificationId}`,
        });
      }

      case 'batch-certify': {
        const { items } = body;

        if (!items || !Array.isArray(items)) {
          return NextResponse.json(
            { error: 'Missing required field: items (array)' },
            { status: 400 }
          );
        }

        if (items.length > 100) {
          return NextResponse.json(
            { error: 'Batch size limited to 100 items' },
            { status: 400 }
          );
        }

        const certifications = await Promise.all(
          items.map(async (item: {
            nodeId: string;
            sourceType: string;
            kwhAmount: number;
            countryCode?: string;
          }) => {
            const certification = await complianceOracle.generateSovereignCertification(
              item.nodeId,
              item.sourceType,
              item.kwhAmount,
              item.countryCode || 'KR',
              `GIP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              `EPO-${item.nodeId}-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
              `0x${Math.random().toString(16).slice(2, 66)}`
            );

            return {
              certificationId: certification.certificationId,
              nodeId: item.nodeId,
              kwhAmount: item.kwhAmount,
              esgRating: certification.compliance.esg.rating,
              status: certification.compliance.re100.status,
            };
          })
        );

        const passCount = certifications.filter(c => c.status === 'compliant').length;

        return NextResponse.json({
          success: true,
          batch: {
            total: certifications.length,
            passed: passCount,
            failed: certifications.length - passCount,
            passRate: `${((passCount / certifications.length) * 100).toFixed(1)}%`,
          },
          certifications,
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action. Use: validate, certify, batch-certify' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Compliance Oracle Error]', error);
    return NextResponse.json(
      { error: 'Compliance operation failed', details: String(error) },
      { status: 500 }
    );
  }
}
