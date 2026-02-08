/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TESLA FLEET API - VEHICLE COMMAND INTERFACE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 36: Real Tesla Vehicle Control
 *
 * Actual Tesla Fleet API integration for:
 * - Start/Stop Charging
 * - Wake Vehicle
 * - Get Vehicle State
 * - Set Charge Limit
 *
 * API Documentation: https://developer.tesla.com/docs/fleet-api
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface TeslaCommandResult {
  success: boolean;
  vehicleId: string;
  command: string;
  response?: {
    reason?: string;
    result?: boolean;
  };
  error?: string;
  timestamp: string;
}

export interface TeslaVehicleState {
  vehicleId: string;
  vin: string;
  displayName: string;
  state: 'online' | 'asleep' | 'offline';
  chargeState: {
    batteryLevel: number;
    batteryRange: number;
    chargerPower: number;
    chargingState: string;
    chargeCurrentRequest: number;
    chargeCurrentRequestMax: number;
    chargerVoltage: number;
    chargePortDoorOpen: boolean;
    chargePortLatch: string;
    minutesToFullCharge: number;
    usableBatteryLevel: number;
    chargeEnergyAdded: number;
    chargeAmps: number;
    scheduledChargingMode: string;
    scheduledChargingStartTime: number | null;
  };
  driveState: {
    latitude: number;
    longitude: number;
    heading: number;
    speed: number | null;
    power: number;
    shiftState: string | null;
  };
  vehicleConfig: {
    carType: string;
    trimBadging: string;
    wheelType: string;
  };
  lastSeen: string;
}

export interface ChargeSchedule {
  enabled: boolean;
  startTime: number; // Minutes from midnight
  endTime: number;   // Minutes from midnight
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const TESLA_CONFIG = {
  FLEET_API_URL: 'https://fleet-api.prd.na.vn.cloud.tesla.com',
  COMMAND_TIMEOUT: 30000, // 30 seconds
  WAKE_RETRY_COUNT: 5,
  WAKE_RETRY_DELAY: 3000, // 3 seconds between retries
};

// ═══════════════════════════════════════════════════════════════════════════════
// TESLA COMMAND SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class TeslaCommandService {
  private accessToken: string;
  private commandHistory: TeslaCommandResult[] = [];

  constructor() {
    this.accessToken = process.env.TESLA_ACCESS_TOKEN || '';

    if (!this.accessToken) {
      console.warn('[TESLA CMD] ⚠️ TESLA_ACCESS_TOKEN not configured');
      console.warn('[TESLA CMD] Vehicle commands will not work until token is set');
    } else {
      console.log('[TESLA CMD] ✅ Tesla Command Service initialized');
    }
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return !!this.accessToken;
  }

  /**
   * Make authenticated API request to Tesla Fleet API
   */
  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: Record<string, unknown>
  ): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
    if (!this.accessToken) {
      throw new Error('Tesla API not configured - TESLA_ACCESS_TOKEN missing');
    }

    const url = `${TESLA_CONFIG.FLEET_API_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      return {
        ok: response.ok,
        status: response.status,
        data,
      };
    } catch (error) {
      console.error('[TESLA CMD] Request failed:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VEHICLE WAKE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Wake up vehicle (required before sending commands)
   */
  async wakeVehicle(vehicleId: string): Promise<TeslaCommandResult> {
    console.log(`[TESLA CMD] 🔔 Waking vehicle ${vehicleId}...`);

    const result: TeslaCommandResult = {
      success: false,
      vehicleId,
      command: 'wake_up',
      timestamp: new Date().toISOString(),
    };

    try {
      for (let attempt = 1; attempt <= TESLA_CONFIG.WAKE_RETRY_COUNT; attempt++) {
        const response = await this.makeRequest(
          `/api/1/vehicles/${vehicleId}/wake_up`
        );

        if (response.ok) {
          const vehicleState = (response.data as { response?: { state?: string } })?.response?.state;

          if (vehicleState === 'online') {
            result.success = true;
            result.response = { result: true, reason: 'Vehicle is now online' };
            console.log(`[TESLA CMD] ✅ Vehicle woke up after ${attempt} attempt(s)`);
            this.logCommand(result);
            return result;
          }
        }

        if (attempt < TESLA_CONFIG.WAKE_RETRY_COUNT) {
          console.log(`[TESLA CMD] Attempt ${attempt}/${TESLA_CONFIG.WAKE_RETRY_COUNT} - waiting...`);
          await this.delay(TESLA_CONFIG.WAKE_RETRY_DELAY);
        }
      }

      result.error = 'Vehicle did not wake up after maximum retries';
      console.warn(`[TESLA CMD] ⚠️ ${result.error}`);
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('[TESLA CMD] Wake failed:', result.error);
    }

    this.logCommand(result);
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHARGING COMMANDS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Start charging the vehicle
   */
  async startCharging(vehicleId: string): Promise<TeslaCommandResult> {
    console.log(`[TESLA CMD] ⚡ Starting charge for vehicle ${vehicleId}...`);

    const result: TeslaCommandResult = {
      success: false,
      vehicleId,
      command: 'charge_start',
      timestamp: new Date().toISOString(),
    };

    try {
      // Ensure vehicle is awake first
      const wakeResult = await this.wakeVehicle(vehicleId);
      if (!wakeResult.success) {
        result.error = 'Failed to wake vehicle';
        this.logCommand(result);
        return result;
      }

      // Send charge start command
      const response = await this.makeRequest(
        `/api/1/vehicles/${vehicleId}/command/charge_start`
      );

      if (response.ok && (response.data as { response?: { result?: boolean } })?.response?.result) {
        result.success = true;
        result.response = (response.data as { response?: { result?: boolean; reason?: string } })?.response;
        console.log('[TESLA CMD] ✅ Charging started successfully');
      } else {
        result.error = (response.data as { response?: { reason?: string } })?.response?.reason || 'Charge start failed';
        console.warn(`[TESLA CMD] ⚠️ ${result.error}`);
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('[TESLA CMD] Charge start failed:', result.error);
    }

    this.logCommand(result);
    return result;
  }

  /**
   * Stop charging the vehicle
   */
  async stopCharging(vehicleId: string): Promise<TeslaCommandResult> {
    console.log(`[TESLA CMD] 🛑 Stopping charge for vehicle ${vehicleId}...`);

    const result: TeslaCommandResult = {
      success: false,
      vehicleId,
      command: 'charge_stop',
      timestamp: new Date().toISOString(),
    };

    try {
      // Ensure vehicle is awake first
      const wakeResult = await this.wakeVehicle(vehicleId);
      if (!wakeResult.success) {
        result.error = 'Failed to wake vehicle';
        this.logCommand(result);
        return result;
      }

      // Send charge stop command
      const response = await this.makeRequest(
        `/api/1/vehicles/${vehicleId}/command/charge_stop`
      );

      if (response.ok && (response.data as { response?: { result?: boolean } })?.response?.result) {
        result.success = true;
        result.response = (response.data as { response?: { result?: boolean; reason?: string } })?.response;
        console.log('[TESLA CMD] ✅ Charging stopped successfully');
      } else {
        result.error = (response.data as { response?: { reason?: string } })?.response?.reason || 'Charge stop failed';
        console.warn(`[TESLA CMD] ⚠️ ${result.error}`);
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('[TESLA CMD] Charge stop failed:', result.error);
    }

    this.logCommand(result);
    return result;
  }

  /**
   * Set charge limit (percentage)
   */
  async setChargeLimit(vehicleId: string, percent: number): Promise<TeslaCommandResult> {
    console.log(`[TESLA CMD] 🔋 Setting charge limit to ${percent}% for vehicle ${vehicleId}...`);

    // Validate percentage
    const clampedPercent = Math.max(50, Math.min(100, percent));

    const result: TeslaCommandResult = {
      success: false,
      vehicleId,
      command: `set_charge_limit:${clampedPercent}`,
      timestamp: new Date().toISOString(),
    };

    try {
      // Ensure vehicle is awake first
      const wakeResult = await this.wakeVehicle(vehicleId);
      if (!wakeResult.success) {
        result.error = 'Failed to wake vehicle';
        this.logCommand(result);
        return result;
      }

      // Send set charge limit command
      const response = await this.makeRequest(
        `/api/1/vehicles/${vehicleId}/command/set_charge_limit`,
        'POST',
        { percent: clampedPercent }
      );

      if (response.ok && (response.data as { response?: { result?: boolean } })?.response?.result) {
        result.success = true;
        result.response = (response.data as { response?: { result?: boolean; reason?: string } })?.response;
        console.log(`[TESLA CMD] ✅ Charge limit set to ${clampedPercent}%`);
      } else {
        result.error = (response.data as { response?: { reason?: string } })?.response?.reason || 'Set charge limit failed';
        console.warn(`[TESLA CMD] ⚠️ ${result.error}`);
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('[TESLA CMD] Set charge limit failed:', result.error);
    }

    this.logCommand(result);
    return result;
  }

  /**
   * Open charge port door
   */
  async openChargePort(vehicleId: string): Promise<TeslaCommandResult> {
    console.log(`[TESLA CMD] 🔌 Opening charge port for vehicle ${vehicleId}...`);

    const result: TeslaCommandResult = {
      success: false,
      vehicleId,
      command: 'charge_port_door_open',
      timestamp: new Date().toISOString(),
    };

    try {
      const wakeResult = await this.wakeVehicle(vehicleId);
      if (!wakeResult.success) {
        result.error = 'Failed to wake vehicle';
        this.logCommand(result);
        return result;
      }

      const response = await this.makeRequest(
        `/api/1/vehicles/${vehicleId}/command/charge_port_door_open`
      );

      if (response.ok && (response.data as { response?: { result?: boolean } })?.response?.result) {
        result.success = true;
        result.response = (response.data as { response?: { result?: boolean; reason?: string } })?.response;
        console.log('[TESLA CMD] ✅ Charge port opened');
      } else {
        result.error = (response.data as { response?: { reason?: string } })?.response?.reason || 'Open charge port failed';
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
    }

    this.logCommand(result);
    return result;
  }

  /**
   * Close charge port door
   */
  async closeChargePort(vehicleId: string): Promise<TeslaCommandResult> {
    console.log(`[TESLA CMD] 🔌 Closing charge port for vehicle ${vehicleId}...`);

    const result: TeslaCommandResult = {
      success: false,
      vehicleId,
      command: 'charge_port_door_close',
      timestamp: new Date().toISOString(),
    };

    try {
      const wakeResult = await this.wakeVehicle(vehicleId);
      if (!wakeResult.success) {
        result.error = 'Failed to wake vehicle';
        this.logCommand(result);
        return result;
      }

      const response = await this.makeRequest(
        `/api/1/vehicles/${vehicleId}/command/charge_port_door_close`
      );

      if (response.ok && (response.data as { response?: { result?: boolean } })?.response?.result) {
        result.success = true;
        result.response = (response.data as { response?: { result?: boolean; reason?: string } })?.response;
        console.log('[TESLA CMD] ✅ Charge port closed');
      } else {
        result.error = (response.data as { response?: { reason?: string } })?.response?.reason || 'Close charge port failed';
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
    }

    this.logCommand(result);
    return result;
  }

  /**
   * Set scheduled charging
   */
  async setScheduledCharging(
    vehicleId: string,
    enable: boolean,
    startTime?: number // Minutes from midnight (e.g., 120 = 2:00 AM)
  ): Promise<TeslaCommandResult> {
    console.log(`[TESLA CMD] 📅 ${enable ? 'Enabling' : 'Disabling'} scheduled charging for vehicle ${vehicleId}...`);

    const result: TeslaCommandResult = {
      success: false,
      vehicleId,
      command: `scheduled_charging:${enable ? 'on' : 'off'}`,
      timestamp: new Date().toISOString(),
    };

    try {
      const wakeResult = await this.wakeVehicle(vehicleId);
      if (!wakeResult.success) {
        result.error = 'Failed to wake vehicle';
        this.logCommand(result);
        return result;
      }

      const response = await this.makeRequest(
        `/api/1/vehicles/${vehicleId}/command/set_scheduled_charging`,
        'POST',
        {
          enable,
          time: startTime || 120, // Default to 2:00 AM
        }
      );

      if (response.ok && (response.data as { response?: { result?: boolean } })?.response?.result) {
        result.success = true;
        result.response = (response.data as { response?: { result?: boolean; reason?: string } })?.response;
        console.log(`[TESLA CMD] ✅ Scheduled charging ${enable ? 'enabled' : 'disabled'}`);
      } else {
        result.error = (response.data as { response?: { reason?: string } })?.response?.reason || 'Set scheduled charging failed';
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
    }

    this.logCommand(result);
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VEHICLE STATE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get detailed vehicle state
   */
  async getVehicleState(vehicleId: string): Promise<TeslaVehicleState | null> {
    console.log(`[TESLA CMD] 📊 Getting state for vehicle ${vehicleId}...`);

    try {
      const response = await this.makeRequest(
        `/api/1/vehicles/${vehicleId}/vehicle_data?endpoints=charge_state;drive_state;vehicle_config`,
        'GET'
      );

      if (!response.ok) {
        console.warn('[TESLA CMD] ⚠️ Failed to get vehicle state');
        return null;
      }

      const data = response.data as {
        response?: {
          id?: number;
          vehicle_id?: number;
          vin?: string;
          display_name?: string;
          state?: string;
          charge_state?: {
            battery_level?: number;
            battery_range?: number;
            charger_power?: number;
            charging_state?: string;
            charge_current_request?: number;
            charge_current_request_max?: number;
            charger_voltage?: number;
            charge_port_door_open?: boolean;
            charge_port_latch?: string;
            minutes_to_full_charge?: number;
            usable_battery_level?: number;
            charge_energy_added?: number;
            charge_amps?: number;
            scheduled_charging_mode?: string;
            scheduled_charging_start_time?: number | null;
          };
          drive_state?: {
            latitude?: number;
            longitude?: number;
            heading?: number;
            speed?: number | null;
            power?: number;
            shift_state?: string | null;
          };
          vehicle_config?: {
            car_type?: string;
            trim_badging?: string;
            wheel_type?: string;
          };
        };
      };
      const vehicleData = data.response;

      if (!vehicleData) {
        return null;
      }

      const state: TeslaVehicleState = {
        vehicleId: String(vehicleData.id || vehicleData.vehicle_id || vehicleId),
        vin: vehicleData.vin || '',
        displayName: vehicleData.display_name || 'Tesla Vehicle',
        state: (vehicleData.state as 'online' | 'asleep' | 'offline') || 'offline',
        chargeState: {
          batteryLevel: vehicleData.charge_state?.battery_level || 0,
          batteryRange: (vehicleData.charge_state?.battery_range || 0) * 1.60934, // miles to km
          chargerPower: vehicleData.charge_state?.charger_power || 0,
          chargingState: vehicleData.charge_state?.charging_state || 'Unknown',
          chargeCurrentRequest: vehicleData.charge_state?.charge_current_request || 0,
          chargeCurrentRequestMax: vehicleData.charge_state?.charge_current_request_max || 0,
          chargerVoltage: vehicleData.charge_state?.charger_voltage || 0,
          chargePortDoorOpen: vehicleData.charge_state?.charge_port_door_open || false,
          chargePortLatch: vehicleData.charge_state?.charge_port_latch || 'Unknown',
          minutesToFullCharge: vehicleData.charge_state?.minutes_to_full_charge || 0,
          usableBatteryLevel: vehicleData.charge_state?.usable_battery_level || 0,
          chargeEnergyAdded: vehicleData.charge_state?.charge_energy_added || 0,
          chargeAmps: vehicleData.charge_state?.charge_amps || 0,
          scheduledChargingMode: vehicleData.charge_state?.scheduled_charging_mode || 'Off',
          scheduledChargingStartTime: vehicleData.charge_state?.scheduled_charging_start_time || null,
        },
        driveState: {
          latitude: vehicleData.drive_state?.latitude || 0,
          longitude: vehicleData.drive_state?.longitude || 0,
          heading: vehicleData.drive_state?.heading || 0,
          speed: vehicleData.drive_state?.speed || null,
          power: vehicleData.drive_state?.power || 0,
          shiftState: vehicleData.drive_state?.shift_state || null,
        },
        vehicleConfig: {
          carType: vehicleData.vehicle_config?.car_type || 'Unknown',
          trimBadging: vehicleData.vehicle_config?.trim_badging || '',
          wheelType: vehicleData.vehicle_config?.wheel_type || '',
        },
        lastSeen: new Date().toISOString(),
      };

      console.log(`[TESLA CMD] ✅ Vehicle state retrieved - SoC: ${state.chargeState.batteryLevel}%`);
      return state;
    } catch (error) {
      console.error('[TESLA CMD] Get vehicle state failed:', error);
      return null;
    }
  }

  /**
   * Get list of all vehicles
   */
  async listVehicles(): Promise<{ id: string; vin: string; displayName: string; state: string }[]> {
    console.log('[TESLA CMD] 🚗 Listing vehicles...');

    try {
      const response = await this.makeRequest('/api/1/vehicles', 'GET');

      if (!response.ok) {
        console.warn('[TESLA CMD] ⚠️ Failed to list vehicles');
        return [];
      }

      const vehicles = ((response.data as { response?: { id?: number; vin?: string; display_name?: string; state?: string }[] })?.response || []).map((v) => ({
        id: String(v.id),
        vin: v.vin || '',
        displayName: v.display_name || 'Tesla Vehicle',
        state: v.state || 'unknown',
      }));

      console.log(`[TESLA CMD] ✅ Found ${vehicles.length} vehicle(s)`);
      return vehicles;
    } catch (error) {
      console.error('[TESLA CMD] List vehicles failed:', error);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Log command to history
   */
  private logCommand(result: TeslaCommandResult): void {
    this.commandHistory.unshift(result);
    // Keep only last 100 commands
    if (this.commandHistory.length > 100) {
      this.commandHistory.pop();
    }
  }

  /**
   * Get command history
   */
  getCommandHistory(): TeslaCommandResult[] {
    return [...this.commandHistory];
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update access token (for token refresh)
   */
  updateAccessToken(newToken: string): void {
    this.accessToken = newToken;
    console.log('[TESLA CMD] ✅ Access token updated');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

export const teslaCommandService = new TeslaCommandService();

// ═══════════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function startTeslaCharging(vehicleId: string): Promise<TeslaCommandResult> {
  return teslaCommandService.startCharging(vehicleId);
}

export async function stopTeslaCharging(vehicleId: string): Promise<TeslaCommandResult> {
  return teslaCommandService.stopCharging(vehicleId);
}

export async function setTeslaChargeLimit(vehicleId: string, percent: number): Promise<TeslaCommandResult> {
  return teslaCommandService.setChargeLimit(vehicleId, percent);
}

export async function wakeTeslaVehicle(vehicleId: string): Promise<TeslaCommandResult> {
  return teslaCommandService.wakeVehicle(vehicleId);
}

export async function getTeslaVehicleState(vehicleId: string): Promise<TeslaVehicleState | null> {
  return teslaCommandService.getVehicleState(vehicleId);
}

export async function listTeslaVehicles(): Promise<{ id: string; vin: string; displayName: string; state: string }[]> {
  return teslaCommandService.listVehicles();
}

export function isTeslaConfigured(): boolean {
  return teslaCommandService.isConfigured();
}

export function getTeslaCommandHistory(): TeslaCommandResult[] {
  return teslaCommandService.getCommandHistory();
}
