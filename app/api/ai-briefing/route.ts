/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * EXECUTIVE AI BRIEFING API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 28: The Grand Finale - Complete Revenue Intelligence
 *
 * Real-time market analysis using live data + OpenAI GPT-4
 * Includes KEPCO SMP revenue and Tesla V2G earnings
 *
 * Endpoints:
 * - GET /api/ai-briefing → Daily executive briefing
 * - GET /api/ai-briefing?type=market → Market analysis
 * - GET /api/ai-briefing?type=roi → ROI forecast analysis
 * - GET /api/ai-briefing?type=revenue → Complete daily revenue report
 */

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  getLiveSMP,
  getLiveTeslaData,
  getLiveExchangeData,
  getLiveTVL,
  getLiveDataStatus,
} from '@/lib/partnerships/live-data-service';
import { getEmpireStats, calculateROIForecast } from '@/lib/partnerships/empire-roi-forecast';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Lazy initialize OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

interface BriefingResponse {
  success: boolean;
  timestamp: string;
  type: 'executive' | 'market' | 'roi' | 'revenue';
  briefing: {
    summary: string;
    insights: string[];
    recommendations: string[];
    riskFactors: string[];
    confidenceScore: number;
  };
  revenueDetails?: {
    kepcoRevenue: { daily: number; source: string; smpPrice: number };
    teslaRevenue: { daily: number; source: string; vehicles: number };
    exchangeRevenue: { daily: number; source: string };
    stakingRevenue: { daily: number; source: string };
    totalDaily: number;
  };
  dataQuality: {
    livePercentage: number;
    sources: string[];
  };
  badge: 'VERIFIED_BY_REALTIME_API' | 'PARTIAL_DATA' | 'AI_GENERATED';
}

export async function GET(request: Request): Promise<NextResponse<BriefingResponse | { success: false; error: string }>> {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'executive';

  try {
    // Fetch all live data
    const [smp, tesla, exchange, tvl, status, empireStats, roiForecast] = await Promise.all([
      getLiveSMP(),
      getLiveTeslaData(),
      getLiveExchangeData(),
      getLiveTVL(),
      getLiveDataStatus(),
      getEmpireStats(),
      calculateROIForecast('daily'),
    ]);

    // Prepare context for AI
    const marketContext = `
Current Market Data (${new Date().toISOString()}):

1. ENERGY MARKET (KEPCO/KPX):
   - SMP Price: ₩${smp.price}/kWh (${smp.source})
   - USD Equivalent: $${smp.priceUSD.toFixed(4)}/kWh
   - Daily Energy Revenue: $${roiForecast.energyTrading.revenue.toLocaleString()}
   - Live Status: ${smp.isLive ? 'LIVE' : 'FALLBACK'}

2. TESLA V2G FLEET:
   - Total Vehicles: ${tesla.totalVehicles}
   - Daily V2G Revenue: $${roiForecast.teslaV2G.revenue.toLocaleString()}
   - Source: ${tesla.source}
   - Live Status: ${tesla.isLive ? 'LIVE' : 'FALLBACK'}

3. K-AUS TOKEN EXCHANGE:
   - Price: $${exchange.kausPrice} USD
   - Price KRW: ₩${exchange.kausPriceKRW.toFixed(2)}
   - 24h Change: ${exchange.change24h.toFixed(2)}%
   - Source: ${exchange.source}
   - Live Status: ${exchange.isLive ? 'LIVE' : 'FALLBACK'}

4. TOTAL VALUE LOCKED (TVL):
   - Total TVL: $${tvl.totalTVL.toLocaleString()}
   - Vault: $${tvl.breakdown.vault.toLocaleString()}
   - Staking Revenue: $${roiForecast.staking.revenue.toLocaleString()}/day
   - Liquidity Revenue: $${roiForecast.liquidityPool.revenue.toLocaleString()}/day
   - Source: ${tvl.source}
   - Live Status: ${tvl.isLive ? 'LIVE' : 'FALLBACK'}

5. EMPIRE ROI STATISTICS:
   - Total Assets: $${empireStats.totalAssets.toLocaleString()}
   - Daily Revenue (TOTAL): $${roiForecast.totalRevenue.toLocaleString()}
   - Monthly Revenue: $${empireStats.monthlyRevenue.toLocaleString()}
   - 30-Day ROI: ${empireStats.roi30Day.toFixed(2)}%
   - 365-Day ROI: ${empireStats.roi365Day.toFixed(2)}%
   - Verified by API: ${empireStats.verifiedByAPI}

6. DATA INTEGRITY:
   - Live Data Percentage: ${100 - status.simulationPercentage}%
   - Overall Health: ${status.overallHealth}%
   - Strict Mode: ${status.strictMode ? 'ENABLED' : 'DISABLED'}
`;

    const prompt = type === 'market'
      ? `You are a senior market analyst for Field Nine, a Korean energy trading platform. Analyze the following market data and provide a concise market briefing in Korean. Focus on energy market trends, K-AUS token performance, and trading opportunities.`
      : type === 'roi'
        ? `You are a financial analyst for Field Nine. Analyze the ROI data and provide investment insights in Korean. Focus on revenue streams, growth potential, and risk assessment.`
        : type === 'revenue'
          ? `You are the CFO of Field Nine Empire. Generate a complete DAILY REVENUE REPORT in Korean based on the real-time data. Include: KEPCO SMP energy trading revenue, Tesla V2G fleet earnings, staking/LP revenue, and total empire earnings. Be precise with numbers.`
          : `You are the AI advisor for Field Nine's CEO. Provide an executive briefing in Korean based on the following real-time data. Be concise, professional, and actionable.`;

    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: marketContext + '\n\nProvide your analysis in the following JSON format:\n{\n  "summary": "1-2 sentence executive summary",\n  "insights": ["insight1", "insight2", "insight3"],\n  "recommendations": ["action1", "action2"],\n  "riskFactors": ["risk1", "risk2"],\n  "confidenceScore": 85\n}',
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');

    // Determine badge based on data quality
    const livePercentage = 100 - status.simulationPercentage;
    const badge = livePercentage >= 75
      ? 'VERIFIED_BY_REALTIME_API'
      : livePercentage > 0
        ? 'PARTIAL_DATA'
        : 'AI_GENERATED';

    // Build revenue details
    const revenueDetails = {
      kepcoRevenue: {
        daily: roiForecast.energyTrading.revenue,
        source: smp.source,
        smpPrice: smp.price,
      },
      teslaRevenue: {
        daily: roiForecast.teslaV2G.revenue,
        source: tesla.source,
        vehicles: tesla.totalVehicles,
      },
      exchangeRevenue: {
        daily: exchange.volume24h * 0.001, // 0.1% trading fee estimate
        source: exchange.source,
      },
      stakingRevenue: {
        daily: roiForecast.staking.revenue,
        source: tvl.source,
      },
      totalDaily: roiForecast.totalRevenue,
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      type: type as 'executive' | 'market' | 'roi' | 'revenue',
      briefing: {
        summary: aiResponse.summary || 'Analysis in progress...',
        insights: aiResponse.insights || [],
        recommendations: aiResponse.recommendations || [],
        riskFactors: aiResponse.riskFactors || [],
        confidenceScore: aiResponse.confidenceScore || 70,
      },
      revenueDetails: type === 'revenue' || type === 'executive' ? revenueDetails : undefined,
      dataQuality: {
        livePercentage,
        sources: [smp.source, tesla.source, exchange.source, tvl.source].filter(s => s !== 'FALLBACK'),
      },
      badge,
    });
  } catch (error) {
    console.error('[AI BRIEFING] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage.includes('OPENAI_API_KEY')
          ? 'AI service not configured'
          : 'Failed to generate briefing',
      },
      { status: 500 }
    );
  }
}
