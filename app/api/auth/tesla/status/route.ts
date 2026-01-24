/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TESLA AUTH STATUS - FIELD NINE NEXUS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Returns Tesla authentication and vehicle status
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TESLA_API_URL = 'https://fleet-api.prd.na.vn.cloud.tesla.com';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Step 1: Check Supabase for tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'tesla_tokens')
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({
        success: false,
        status: 'NOT_AUTHENTICATED',
        error: 'No Tesla tokens found in database',
        action: 'Visit /api/auth/tesla/login to authenticate',
      });
    }

    const tokens = tokenData.value as {
      access_token: string;
      refresh_token: string;
      expires_at: string;
      updated_at: string;
    };

    const expiresAt = new Date(tokens.expires_at);
    const isExpired = Date.now() >= expiresAt.getTime();

    if (isExpired) {
      return NextResponse.json({
        success: false,
        status: 'TOKEN_EXPIRED',
        expiresAt: tokens.expires_at,
        action: 'Token refresh required',
      });
    }

    // Step 2: Test Tesla API with token
    console.log('[TESLA STATUS] Testing Fleet API connection...');

    const vehiclesResponse = await fetch(`${TESLA_API_URL}/api/1/vehicles`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!vehiclesResponse.ok) {
      const errorData = await vehiclesResponse.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        status: 'API_ERROR',
        httpStatus: vehiclesResponse.status,
        error: errorData,
        tokenValid: true,
        expiresAt: tokens.expires_at,
      });
    }

    const vehiclesData = await vehiclesResponse.json();
    const vehicles = vehiclesData.response || [];

    // Step 3: Get vehicle details if available
    const vehicleDetails = await Promise.all(
      vehicles.map(async (v: { id: number; vin: string; display_name: string; state: string }) => {
        const detail: {
          id: number;
          vin: string;
          name: string;
          state: string;
          batteryLevel?: number;
          chargingState?: string;
          location?: { lat: number; lng: number };
        } = {
          id: v.id,
          vin: v.vin,
          name: v.display_name || 'Tesla Vehicle',
          state: v.state,
        };

        // If online, fetch charge state
        if (v.state === 'online') {
          try {
            const stateResponse = await fetch(
              `${TESLA_API_URL}/api/1/vehicles/${v.id}/vehicle_data?endpoints=charge_state;drive_state`,
              {
                headers: {
                  Authorization: `Bearer ${tokens.access_token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (stateResponse.ok) {
              const stateData = await stateResponse.json();
              const chargeState = stateData.response?.charge_state;
              const driveState = stateData.response?.drive_state;

              detail.batteryLevel = chargeState?.battery_level;
              detail.chargingState = chargeState?.charging_state;

              if (driveState?.latitude && driveState?.longitude) {
                detail.location = {
                  lat: driveState.latitude,
                  lng: driveState.longitude,
                };
              }
            }
          } catch (e) {
            console.warn('[TESLA STATUS] Failed to get vehicle details:', e);
          }
        }

        return detail;
      })
    );

    return NextResponse.json({
      success: true,
      status: 'LIVE',
      statusCode: 'LIVE',
      tokenValid: true,
      expiresAt: tokens.expires_at,
      lastUpdate: tokens.updated_at,
      vehicles: vehicleDetails,
      totalVehicles: vehicles.length,
      timestamp: new Date().toISOString(),
      mode: 'PLATINUM',
    });
  } catch (error) {
    console.error('[TESLA STATUS] Error:', error);
    return NextResponse.json({
      success: false,
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
