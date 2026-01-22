/**
 * PERSONAL AI BANKER (PAB) API
 *
 * Phase 19: 통합 AI 뱅커 API 엔드포인트
 * - Yield Strategy Engine
 * - PAB Intelligence
 * - Auto-Settlement
 * - Background Harvest
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  yieldStrategyEngine,
  getMarketAnalysis,
  getStrategy,
  getPortfolio,
  setRiskProfile,
  generateRebalanceRecommendation,
  getRecentDecisions,
  getPerformance,
  simulateCompoundGrowth,
  RiskProfile,
} from '@/lib/pab/yield-strategy-engine';
import {
  pabIntelligence,
  getPABStatus,
  getActivities,
  getLatestBriefing,
  markActivityAsRead,
  generateVoiceBriefing,
  performMarketScan,
  getPreferences,
  updatePreferences,
  UserPreferences,
} from '@/lib/pab/intelligence-core';
import {
  autoSettlementEngine,
  getAutoSettlementConfig,
  updateAutoSettlementConfig,
  calculateOptimalSettlement,
  executeSettlement,
  getSettlementHistory,
  getPaymentPatterns,
  getSpendingAnalytics,
  predictNextPayment,
  getSettlementBalances,
  MerchantCategory,
  AutoSettlementConfig,
} from '@/lib/pab/auto-settlement';
import {
  backgroundHarvestEngine,
  getDeviceConfigs,
  updateDeviceConfig,
  getActiveSessions,
  getSessionHistory,
  getDailySummary,
  projectEarnings,
  getNetworkTier,
  startHarvestSession,
  stopHarvestSession,
  getTotalHarvestEarnings,
  DeviceHarvestConfig,
} from '@/lib/pab/background-harvest';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const module = searchParams.get('module');
  const action = searchParams.get('action');
  const userId = searchParams.get('userId') || 'USER-BOSS';

  // ============================================
  // YIELD STRATEGY MODULE
  // ============================================
  if (module === 'yield') {
    switch (action) {
      case 'market': {
        const analysis = getMarketAnalysis();
        return NextResponse.json({
          market: analysis,
          recommendation: analysis.opportunity.bestTarget,
        });
      }

      case 'strategy': {
        const profile = searchParams.get('profile') as RiskProfile || 'GROWTH';
        const strategy = getStrategy(profile);
        return NextResponse.json({ strategy });
      }

      case 'portfolio': {
        const portfolio = getPortfolio(userId);
        return NextResponse.json({ portfolio });
      }

      case 'rebalance': {
        const recommendation = generateRebalanceRecommendation(userId);
        return NextResponse.json({ recommendation });
      }

      case 'decisions': {
        const limit = parseInt(searchParams.get('limit') || '20');
        const decisions = getRecentDecisions(userId, limit);
        return NextResponse.json({ decisions, count: decisions.length });
      }

      case 'performance': {
        const performance = getPerformance(userId);
        return NextResponse.json({ performance });
      }

      case 'simulate': {
        const amount = parseFloat(searchParams.get('amount') || '100000');
        const profile = searchParams.get('profile') as RiskProfile || 'GROWTH';
        const years = parseInt(searchParams.get('years') || '10');
        const simulation = simulateCompoundGrowth(amount, profile, years);
        return NextResponse.json({ simulation, params: { amount, profile, years } });
      }
    }
  }

  // ============================================
  // PAB INTELLIGENCE MODULE
  // ============================================
  if (module === 'intelligence') {
    switch (action) {
      case 'status': {
        const status = getPABStatus();
        return NextResponse.json({ status });
      }

      case 'activities': {
        const limit = parseInt(searchParams.get('limit') || '20');
        const unreadOnly = searchParams.get('unreadOnly') === 'true';
        const activities = getActivities(limit, unreadOnly);
        return NextResponse.json({ activities, count: activities.length });
      }

      case 'briefing': {
        const briefing = getLatestBriefing();
        return NextResponse.json({ briefing });
      }

      case 'voice-briefing': {
        const text = generateVoiceBriefing(userId);
        return NextResponse.json({ text });
      }

      case 'preferences': {
        const prefs = getPreferences(userId);
        return NextResponse.json({ preferences: prefs });
      }

      case 'scan': {
        const activity = performMarketScan();
        return NextResponse.json({ activity, message: '시장 스캔 완료' });
      }
    }
  }

  // ============================================
  // AUTO-SETTLEMENT MODULE
  // ============================================
  if (module === 'settlement') {
    switch (action) {
      case 'config': {
        const config = getAutoSettlementConfig(userId);
        return NextResponse.json({ config });
      }

      case 'balances': {
        const balances = getSettlementBalances(userId);
        return NextResponse.json({ balances });
      }

      case 'history': {
        const limit = parseInt(searchParams.get('limit') || '20');
        const history = getSettlementHistory(userId, limit);
        return NextResponse.json({ history, count: history.length });
      }

      case 'patterns': {
        const patterns = getPaymentPatterns(userId);
        return NextResponse.json({ patterns });
      }

      case 'analytics': {
        const analytics = getSpendingAnalytics(userId);
        return NextResponse.json({ analytics });
      }

      case 'predict': {
        const prediction = predictNextPayment(userId);
        return NextResponse.json({ prediction });
      }

      case 'calculate': {
        const amount = parseFloat(searchParams.get('amount') || '100');
        const category = searchParams.get('category') as MerchantCategory || 'GENERAL';
        const optimal = calculateOptimalSettlement(userId, amount, category);
        return NextResponse.json({ optimal });
      }
    }
  }

  // ============================================
  // BACKGROUND HARVEST MODULE
  // ============================================
  if (module === 'harvest') {
    switch (action) {
      case 'devices': {
        const devices = getDeviceConfigs(userId);
        return NextResponse.json({ devices, count: devices.length });
      }

      case 'active': {
        const sessions = getActiveSessions(userId);
        return NextResponse.json({ sessions, count: sessions.length });
      }

      case 'history': {
        const limit = parseInt(searchParams.get('limit') || '50');
        const deviceId = searchParams.get('deviceId') || undefined;
        const history = getSessionHistory(userId, { limit, deviceId });
        return NextResponse.json({ history, count: history.length });
      }

      case 'daily': {
        const dateStr = searchParams.get('date');
        const date = dateStr ? new Date(dateStr) : new Date();
        const summary = getDailySummary(userId, date);
        return NextResponse.json({ summary });
      }

      case 'projection': {
        const hours = parseFloat(searchParams.get('hours') || '8');
        const projection = projectEarnings(userId, hours);
        return NextResponse.json({ projection });
      }

      case 'network-tier': {
        const tier = getNetworkTier(userId);
        return NextResponse.json({ tier });
      }

      case 'total-earnings': {
        const earnings = getTotalHarvestEarnings(userId);
        return NextResponse.json({ earnings });
      }
    }
  }

  // ============================================
  // DEFAULT: API OVERVIEW
  // ============================================
  return NextResponse.json({
    api: 'Personal AI Banker (PAB) API',
    version: '1.0',
    description: 'Field Nine Autonomous Wealth Management',
    tagline: '이제 필드나인은 도구를 넘어 동반자가 된다',
    modules: {
      yield: {
        description: 'Autonomous Yield Strategy Engine',
        endpoints: [
          'GET ?module=yield&action=market',
          'GET ?module=yield&action=strategy&profile={CONSERVATIVE|GROWTH|MAX_ALPHA}',
          'GET ?module=yield&action=portfolio',
          'GET ?module=yield&action=rebalance',
          'GET ?module=yield&action=decisions',
          'GET ?module=yield&action=performance',
          'GET ?module=yield&action=simulate&amount={n}&profile={profile}&years={n}',
        ],
      },
      intelligence: {
        description: 'PAB Intelligence - Real-time Activity & Briefings',
        endpoints: [
          'GET ?module=intelligence&action=status',
          'GET ?module=intelligence&action=activities',
          'GET ?module=intelligence&action=briefing',
          'GET ?module=intelligence&action=voice-briefing',
          'GET ?module=intelligence&action=preferences',
          'GET ?module=intelligence&action=scan',
        ],
      },
      settlement: {
        description: 'Auto-Settlement Black Card System',
        endpoints: [
          'GET ?module=settlement&action=config',
          'GET ?module=settlement&action=balances',
          'GET ?module=settlement&action=history',
          'GET ?module=settlement&action=patterns',
          'GET ?module=settlement&action=analytics',
          'GET ?module=settlement&action=predict',
          'GET ?module=settlement&action=calculate&amount={n}&category={cat}',
        ],
      },
      harvest: {
        description: 'Background Harvest Protocol',
        endpoints: [
          'GET ?module=harvest&action=devices',
          'GET ?module=harvest&action=active',
          'GET ?module=harvest&action=history',
          'GET ?module=harvest&action=daily',
          'GET ?module=harvest&action=projection&hours={n}',
          'GET ?module=harvest&action=network-tier',
          'GET ?module=harvest&action=total-earnings',
        ],
      },
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { module, action } = body;
    const userId = body.userId || 'USER-BOSS';

    // ============================================
    // YIELD STRATEGY MODULE
    // ============================================
    if (module === 'yield') {
      switch (action) {
        case 'set-profile': {
          const { profile } = body;
          if (!profile) {
            return NextResponse.json({ error: 'profile required' }, { status: 400 });
          }
          setRiskProfile(userId, profile as RiskProfile);
          return NextResponse.json({
            success: true,
            message: `Risk profile updated to ${profile}`,
          });
        }
      }
    }

    // ============================================
    // PAB INTELLIGENCE MODULE
    // ============================================
    if (module === 'intelligence') {
      switch (action) {
        case 'mark-read': {
          const { activityId } = body;
          if (!activityId) {
            return NextResponse.json({ error: 'activityId required' }, { status: 400 });
          }
          markActivityAsRead(activityId);
          return NextResponse.json({ success: true });
        }

        case 'update-preferences': {
          const { preferences } = body;
          if (!preferences) {
            return NextResponse.json({ error: 'preferences required' }, { status: 400 });
          }
          updatePreferences(userId, preferences as Partial<UserPreferences>);
          return NextResponse.json({
            success: true,
            message: 'Preferences updated',
          });
        }
      }
    }

    // ============================================
    // AUTO-SETTLEMENT MODULE
    // ============================================
    if (module === 'settlement') {
      switch (action) {
        case 'execute': {
          const { merchantName, merchantCategory, amount } = body;
          if (!merchantName || !amount) {
            return NextResponse.json(
              { error: 'merchantName and amount required' },
              { status: 400 }
            );
          }
          const decision = executeSettlement(
            userId,
            merchantName,
            merchantCategory || 'GENERAL',
            amount
          );
          return NextResponse.json({
            success: true,
            decision,
            message: `Settlement executed via ${decision.selectedSource}`,
          });
        }

        case 'update-config': {
          const { config } = body;
          if (!config) {
            return NextResponse.json({ error: 'config required' }, { status: 400 });
          }
          updateAutoSettlementConfig(userId, config as Partial<AutoSettlementConfig>);
          return NextResponse.json({
            success: true,
            message: 'Settlement config updated',
          });
        }
      }
    }

    // ============================================
    // BACKGROUND HARVEST MODULE
    // ============================================
    if (module === 'harvest') {
      switch (action) {
        case 'start': {
          const { deviceId } = body;
          if (!deviceId) {
            return NextResponse.json({ error: 'deviceId required' }, { status: 400 });
          }
          const session = startHarvestSession(userId, deviceId);
          if (!session) {
            return NextResponse.json(
              { error: 'Failed to start session' },
              { status: 400 }
            );
          }
          return NextResponse.json({
            success: true,
            session,
            message: `Harvest started on ${deviceId}`,
          });
        }

        case 'stop': {
          const { deviceId } = body;
          if (!deviceId) {
            return NextResponse.json({ error: 'deviceId required' }, { status: 400 });
          }
          const session = stopHarvestSession(userId, deviceId);
          return NextResponse.json({
            success: true,
            session,
            message: session
              ? `Harvest stopped - Earned ${session.earnings.totalKaus.toFixed(4)} K-AUS`
              : 'No active session',
          });
        }

        case 'update-device': {
          const { deviceId, config } = body;
          if (!deviceId || !config) {
            return NextResponse.json(
              { error: 'deviceId and config required' },
              { status: 400 }
            );
          }
          updateDeviceConfig(userId, deviceId, config as Partial<DeviceHarvestConfig>);
          return NextResponse.json({
            success: true,
            message: `Device ${deviceId} config updated`,
          });
        }
      }
    }

    return NextResponse.json({ error: 'Unknown module/action' }, { status: 400 });
  } catch (error) {
    console.error('[PAB API Error]', error);
    return NextResponse.json(
      { error: 'Operation failed', details: String(error) },
      { status: 500 }
    );
  }
}
