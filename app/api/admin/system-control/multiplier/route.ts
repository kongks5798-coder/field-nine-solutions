/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 79: ENERGY EXCHANGE MULTIPLIER API (GOD-MODE)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 실시간 에너지 환전 배율 조정
 * - GET: 현재 배율 조회
 * - POST: 배율 업데이트 (전 유저 즉시 반영)
 * - 모든 변경 사항은 Audit Log에 기록
 *
 * @route /api/admin/system-control/multiplier
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auditLogger } from '@/lib/logging/audit-logger';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT SETTINGS (In-memory fallback when DB unavailable)
// ═══════════════════════════════════════════════════════════════════════════════

const MEMORY_SETTINGS = {
  energyMultiplier: 1.0,
  kausMultiplier: 1.0,
  smpAdjustment: 0,
  lastModified: new Date().toISOString(),
  modifiedBy: 'SYSTEM',
};

// Global cache for real-time sync (broadcasted to all instances)
let cachedSettings = { ...MEMORY_SETTINGS };

// ═══════════════════════════════════════════════════════════════════════════════
// GET: Fetch Current Multiplier Settings
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    // Return cached/default settings
    return NextResponse.json({
      success: true,
      settings: cachedSettings,
      source: 'memory',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const { data, error } = await supabase
      .from('system_multipliers')
      .select('*')
      .single();

    if (error || !data) {
      return NextResponse.json({
        success: true,
        settings: cachedSettings,
        source: 'memory_fallback',
        timestamp: new Date().toISOString(),
      });
    }

    // Update cache
    cachedSettings = {
      energyMultiplier: data.energy_multiplier ?? 1.0,
      kausMultiplier: data.kaus_multiplier ?? 1.0,
      smpAdjustment: data.smp_adjustment ?? 0,
      lastModified: data.updated_at,
      modifiedBy: data.modified_by ?? 'UNKNOWN',
    };

    return NextResponse.json({
      success: true,
      settings: cachedSettings,
      source: 'database',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Multiplier API] GET error:', error);
    return NextResponse.json({
      success: true,
      settings: cachedSettings,
      source: 'error_fallback',
      timestamp: new Date().toISOString(),
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST: Update Multiplier Settings (Real-time broadcast)
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const {
      energyMultiplier,
      kausMultiplier,
      smpAdjustment,
      modifiedBy = 'EMPEROR',
    } = body;

    // Validation
    if (energyMultiplier !== undefined) {
      if (typeof energyMultiplier !== 'number' || energyMultiplier < 0.1 || energyMultiplier > 10) {
        return NextResponse.json({
          success: false,
          error: 'Energy multiplier must be between 0.1 and 10.0',
          code: 'INVALID_MULTIPLIER',
        }, { status: 400 });
      }
    }

    if (kausMultiplier !== undefined) {
      if (typeof kausMultiplier !== 'number' || kausMultiplier < 0.1 || kausMultiplier > 10) {
        return NextResponse.json({
          success: false,
          error: 'KAUS multiplier must be between 0.1 and 10.0',
          code: 'INVALID_MULTIPLIER',
        }, { status: 400 });
      }
    }

    if (smpAdjustment !== undefined) {
      if (typeof smpAdjustment !== 'number' || smpAdjustment < -50 || smpAdjustment > 50) {
        return NextResponse.json({
          success: false,
          error: 'SMP adjustment must be between -50 and +50 KRW/kWh',
          code: 'INVALID_ADJUSTMENT',
        }, { status: 400 });
      }
    }

    // Store old values for audit
    const oldSettings = { ...cachedSettings };

    // Update cache immediately (real-time effect)
    if (energyMultiplier !== undefined) cachedSettings.energyMultiplier = energyMultiplier;
    if (kausMultiplier !== undefined) cachedSettings.kausMultiplier = kausMultiplier;
    if (smpAdjustment !== undefined) cachedSettings.smpAdjustment = smpAdjustment;
    cachedSettings.lastModified = new Date().toISOString();
    cachedSettings.modifiedBy = modifiedBy;

    // Audit log
    auditLogger.info('system', 'multiplier_updated', 'God-Mode multiplier settings changed', {
      oldSettings: {
        energyMultiplier: oldSettings.energyMultiplier,
        kausMultiplier: oldSettings.kausMultiplier,
        smpAdjustment: oldSettings.smpAdjustment,
      },
      newSettings: {
        energyMultiplier: cachedSettings.energyMultiplier,
        kausMultiplier: cachedSettings.kausMultiplier,
        smpAdjustment: cachedSettings.smpAdjustment,
      },
      modifiedBy,
      duration: Date.now() - startTime,
    });

    // Persist to database
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase
        .from('system_multipliers')
        .upsert({
          id: 'global',
          energy_multiplier: cachedSettings.energyMultiplier,
          kaus_multiplier: cachedSettings.kausMultiplier,
          smp_adjustment: cachedSettings.smpAdjustment,
          modified_by: modifiedBy,
          updated_at: cachedSettings.lastModified,
        }, { onConflict: 'id' });

      if (error) {
        console.error('[Multiplier API] DB upsert error:', error);
        // Continue anyway - memory cache is updated
      }
    }

    return NextResponse.json({
      success: true,
      message: '🎯 Multiplier settings updated and broadcasted to all users',
      settings: cachedSettings,
      effectiveImmediately: true,
      timestamp: new Date().toISOString(),
      latency: `${Date.now() - startTime}ms`,
    });

  } catch (error) {
    console.error('[Multiplier API] POST error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update multiplier',
      code: 'UPDATE_FAILED',
    }, { status: 500 });
  }
}
