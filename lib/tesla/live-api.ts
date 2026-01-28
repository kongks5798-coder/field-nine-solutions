/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 73: TESLA FLEET API - LIVE DATA WITH AUTO-REFRESH
 * ═══════════════════════════════════════════════════════════════════════════════
 * 사이버트럭 실제 배터리 잔량 및 V2G 용량 실시간 매핑
 * 토큰 자동 갱신 기능 포함
 */

import { createClient } from '@supabase/supabase-js';

// Cache configuration (<100ms latency)
const CACHE_TTL = 30000; // 30 seconds
let cachedData: TeslaLiveData | null = null;
let cacheTimestamp = 0;

// Token refresh configuration
const TESLA_AUTH_URL = 'https://auth.tesla.com/oauth2/v3/token';
let isRefreshing = false;

export interface TeslaLiveData {
  batteryLevel: number;
  batteryRange: number;
  energyStored: number; // kWh
  maxCapacity: number; // kWh (Cybertruck: 105 or 123)
  v2gAvailable: number; // kWh available for V2G
  v2gStatus: 'ACTIVE' | 'CHARGING' | 'STANDBY' | 'DISCHARGING';
  chargingState: string;
  location: { lat: number; lng: number } | null;
  lastUpdated: string;
  isLive: boolean;
}

// Get Supabase client
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Fetch Tesla tokens from database
async function getTeslaTokens(): Promise<{ accessToken: string; refreshToken: string; expiresAt?: string } | null> {
  const supabase = getSupabase();
  if (!supabase) {
    // Fallback to env
    const accessToken = process.env.TESLA_ACCESS_TOKEN;
    if (accessToken) {
      return { accessToken, refreshToken: process.env.TESLA_REFRESH_TOKEN || '' };
    }
    return null;
  }

  const { data } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', 'tesla_tokens')
    .single();

  if (data?.value?.access_token) {
    return {
      accessToken: data.value.access_token,
      refreshToken: data.value.refresh_token || '',
      expiresAt: data.value.expires_at,
    };
  }

  return null;
}

// Auto-refresh Tesla tokens
async function refreshTeslaTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  if (isRefreshing || !refreshToken) return null;

  isRefreshing = true;
  console.log('[Tesla API] Attempting token refresh...');

  try {
    const response = await fetch(TESLA_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.TESLA_CLIENT_ID || '',
        client_secret: process.env.TESLA_CLIENT_SECRET || '',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      console.error('[Tesla API] Token refresh failed:', response.status);
      isRefreshing = false;
      return null;
    }

    const tokens = await response.json();
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Save to database
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('system_config').upsert({
        key: 'tesla_tokens',
        value: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

      console.log('[Tesla API] ✅ Token refreshed and saved');
    }

    isRefreshing = false;
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    };
  } catch (error) {
    console.error('[Tesla API] Token refresh error:', error);
    isRefreshing = false;
    return null;
  }
}

// Fetch live vehicle data from Tesla Fleet API
export async function fetchTeslaLiveData(): Promise<TeslaLiveData> {
  // Check cache first (<100ms latency)
  const now = Date.now();
  if (cachedData && now - cacheTimestamp < CACHE_TTL) {
    return cachedData;
  }

  try {
    let tokens = await getTeslaTokens();
    if (!tokens) {
      return getSimulatedData(false);
    }

    // Check if token is expired or about to expire (5 min buffer)
    if (tokens.expiresAt) {
      const expiresAt = new Date(tokens.expiresAt).getTime();
      const buffer = 5 * 60 * 1000; // 5 minutes
      if (Date.now() >= expiresAt - buffer) {
        console.log('[Tesla API] Token expired or expiring soon, refreshing...');
        const refreshed = await refreshTeslaTokens(tokens.refreshToken);
        if (refreshed) {
          tokens = { ...tokens, ...refreshed };
        } else {
          return getSimulatedData(false);
        }
      }
    }

    // Tesla Fleet API - Vehicle Data
    let vehicleResponse = await fetch('https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles', {
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // If 401, try token refresh once
    if (vehicleResponse.status === 401 && tokens.refreshToken) {
      console.log('[Tesla API] Got 401, attempting token refresh...');
      const refreshed = await refreshTeslaTokens(tokens.refreshToken);
      if (refreshed) {
        vehicleResponse = await fetch('https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles', {
          headers: {
            'Authorization': `Bearer ${refreshed.accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        tokens = { ...tokens, ...refreshed };
      }
    }

    if (!vehicleResponse.ok) {
      console.log('[Tesla API] Auth failed after refresh attempt, using simulated data');
      return getSimulatedData(false);
    }

    const vehicles = await vehicleResponse.json();
    const vehicle = vehicles.response?.[0];

    if (!vehicle) {
      return getSimulatedData(false);
    }

    // Get vehicle state
    const stateResponse = await fetch(
      `https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles/${vehicle.id}/vehicle_data`,
      {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!stateResponse.ok) {
      return getSimulatedData(false);
    }

    const stateData = await stateResponse.json();
    const chargeState = stateData.response?.charge_state;
    const driveState = stateData.response?.drive_state;

    const batteryLevel = chargeState?.battery_level || 0;
    const maxCapacity = 105; // Cybertruck Foundation Series
    const energyStored = (batteryLevel / 100) * maxCapacity;
    const v2gReserve = 20; // 20% minimum reserve
    const v2gAvailable = Math.max(0, energyStored - (maxCapacity * v2gReserve / 100));

    const liveData: TeslaLiveData = {
      batteryLevel,
      batteryRange: chargeState?.battery_range || 0,
      energyStored,
      maxCapacity,
      v2gAvailable,
      v2gStatus: getV2GStatus(chargeState),
      chargingState: chargeState?.charging_state || 'Unknown',
      location: driveState ? { lat: driveState.latitude, lng: driveState.longitude } : null,
      lastUpdated: new Date().toISOString(),
      isLive: true,
    };

    // Update cache
    cachedData = liveData;
    cacheTimestamp = now;

    return liveData;

  } catch (error) {
    console.error('[Tesla API] Error:', error);
    return getSimulatedData(false);
  }
}

// Determine V2G status from charge state
function getV2GStatus(chargeState: any): TeslaLiveData['v2gStatus'] {
  if (!chargeState) return 'STANDBY';

  const chargingState = chargeState.charging_state;
  const batteryLevel = chargeState.battery_level || 0;

  if (chargingState === 'Charging') return 'CHARGING';
  if (chargingState === 'Disconnected' && batteryLevel > 30) return 'ACTIVE';
  if (batteryLevel < 20) return 'STANDBY';

  return 'ACTIVE';
}

// Simulated data fallback (with realistic fluctuation)
function getSimulatedData(isLive: boolean): TeslaLiveData {
  const hour = new Date().getHours();
  const baseLevel = 60 + Math.floor(Math.random() * 30);

  // Peak hours simulation (V2G discharge)
  const isPeakHour = (hour >= 10 && hour <= 12) || (hour >= 18 && hour <= 21);
  const v2gStatus: TeslaLiveData['v2gStatus'] = isPeakHour ? 'DISCHARGING' :
    hour >= 0 && hour <= 6 ? 'CHARGING' : 'ACTIVE';

  const maxCapacity = 105;
  const energyStored = (baseLevel / 100) * maxCapacity;
  const v2gAvailable = Math.max(0, energyStored - 21); // 20% reserve

  return {
    batteryLevel: baseLevel,
    batteryRange: Math.round(baseLevel * 3.2),
    energyStored,
    maxCapacity,
    v2gAvailable,
    v2gStatus,
    chargingState: v2gStatus === 'CHARGING' ? 'Charging' : 'Complete',
    location: { lat: 37.5665, lng: 126.9780 },
    lastUpdated: new Date().toISOString(),
    isLive,
  };
}

// Calculate V2G earnings potential
export function calculateV2GEarnings(data: TeslaLiveData, smpPrice: number): {
  hourlyEarnings: number;
  dailyEarnings: number;
  monthlyEarnings: number;
} {
  const dischargeEfficiency = 0.92; // 92% round-trip efficiency
  const peakHoursPerDay = 6; // Average peak hours for V2G

  const effectiveEnergy = data.v2gAvailable * dischargeEfficiency;
  const hourlyEarnings = effectiveEnergy * smpPrice;
  const dailyEarnings = hourlyEarnings * peakHoursPerDay;
  const monthlyEarnings = dailyEarnings * 30;

  return {
    hourlyEarnings: Math.round(hourlyEarnings),
    dailyEarnings: Math.round(dailyEarnings),
    monthlyEarnings: Math.round(monthlyEarnings),
  };
}
