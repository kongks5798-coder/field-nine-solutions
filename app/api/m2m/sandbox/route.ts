/**
 * M2M SIMULATION API SANDBOX
 *
 * Phase 20: Partnership & Compliance Weapons
 * Machine-to-Machine Energy Settlement Simulation API
 *
 * For Tesla, Amazon, and other global partners to test integration
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================
// TYPES
// ============================================

type DeviceType = 'POWERWALL' | 'MEGAPACK' | 'SUPERCHARGER' | 'EV' | 'SOLAR' | 'GENERIC';
type OfferType = 'SELL' | 'BUY';
type SettlementStatus = 'PENDING' | 'MATCHED' | 'COMPLETED' | 'FAILED';
type GridService = 'FREQUENCY_RESPONSE' | 'VOLTAGE_SUPPORT' | 'SPINNING_RESERVE' | 'DEMAND_RESPONSE';

interface Device {
  deviceId: string;
  deviceType: DeviceType;
  capacityKwh: number;
  maxPowerKw: number;
  location: { latitude: number; longitude: number; gridZone: string };
  capabilities: string[];
  ownerWallet: string;
  registeredAt: string;
}

interface MarketOffer {
  offerId: string;
  deviceId: string;
  offerType: OfferType;
  energyKwh: number;
  minPriceUsd: number;
  maxPriceUsd: number;
  availableFrom: string;
  availableUntil: string;
  autoAccept: boolean;
  status: 'ACTIVE' | 'MATCHED' | 'EXPIRED' | 'CANCELLED';
  matchedBuyers?: number;
  estimatedRevenueUsd?: number;
  estimatedRevenueKaus?: number;
  carbonCreditsPending?: number;
  createdAt: string;
}

interface Settlement {
  settlementId: string;
  offerId: string;
  sellerDeviceId: string;
  buyerDeviceId: string;
  energyKwh: number;
  pricePerKwh: number;
  totalUsd: number;
  totalKaus: number;
  carbonCredits: number;
  transactionHash: string;
  status: SettlementStatus;
  settledAt: string;
}

// ============================================
// MOCK DATA STORE
// ============================================

const devices: Map<string, Device> = new Map();
const offers: Map<string, MarketOffer> = new Map();
const settlements: Map<string, Settlement> = new Map();

// Initialize with sample data
function initializeSampleData() {
  // Sample Tesla Powerwall
  devices.set('PW-US-CA-DEMO-001', {
    deviceId: 'PW-US-CA-DEMO-001',
    deviceType: 'POWERWALL',
    capacityKwh: 13.5,
    maxPowerKw: 7.0,
    location: { latitude: 37.7749, longitude: -122.4194, gridZone: 'CAISO' },
    capabilities: ['DISCHARGE', 'CHARGE', 'FREQUENCY_RESPONSE'],
    ownerWallet: '0xDEMO...1234',
    registeredAt: new Date().toISOString(),
  });

  // Sample Megapack
  devices.set('MP-US-TX-DEMO-001', {
    deviceId: 'MP-US-TX-DEMO-001',
    deviceType: 'MEGAPACK',
    capacityKwh: 3900,
    maxPowerKw: 1500,
    location: { latitude: 29.7604, longitude: -95.3698, gridZone: 'ERCOT' },
    capabilities: ['DISCHARGE', 'CHARGE', 'FREQUENCY_RESPONSE', 'SPINNING_RESERVE'],
    ownerWallet: '0xDEMO...5678',
    registeredAt: new Date().toISOString(),
  });

  // Sample Supercharger
  devices.set('SC-US-CA-DEMO-001', {
    deviceId: 'SC-US-CA-DEMO-001',
    deviceType: 'SUPERCHARGER',
    capacityKwh: 0,
    maxPowerKw: 250,
    location: { latitude: 34.0522, longitude: -118.2437, gridZone: 'CAISO' },
    capabilities: ['CHARGE', 'DEMAND_RESPONSE'],
    ownerWallet: '0xDEMO...9ABC',
    registeredAt: new Date().toISOString(),
  });
}

initializeSampleData();

// ============================================
// HELPER FUNCTIONS
// ============================================

const KAUS_PRICE = 2.47;

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
}

function calculateCarbonCredits(energyKwh: number, gridZone: string): number {
  // Carbon intensity varies by grid zone (kg CO2/kWh)
  const carbonIntensity: Record<string, number> = {
    CAISO: 0.21,
    ERCOT: 0.41,
    PJM: 0.38,
    NEM: 0.65,
    DEFAULT: 0.40,
  };
  const intensity = carbonIntensity[gridZone] || carbonIntensity.DEFAULT;
  return (energyKwh * intensity) / 1000; // Convert to tCO2
}

function simulateMarketPrice(gridZone: string): number {
  // Simulated real-time market prices (USD/kWh)
  const basePrices: Record<string, number> = {
    CAISO: 0.18,
    ERCOT: 0.12,
    PJM: 0.15,
    NEM: 0.22,
    DEFAULT: 0.15,
  };
  const base = basePrices[gridZone] || basePrices.DEFAULT;
  // Add some volatility
  return base * (0.8 + Math.random() * 0.4);
}

// ============================================
// API HANDLERS
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    // ============================================
    // DEVICE ENDPOINTS
    // ============================================
    case 'devices': {
      const deviceId = searchParams.get('deviceId');
      if (deviceId) {
        const device = devices.get(deviceId);
        if (!device) {
          return NextResponse.json({ error: 'Device not found' }, { status: 404 });
        }
        return NextResponse.json({ device });
      }
      return NextResponse.json({
        devices: Array.from(devices.values()),
        count: devices.size,
      });
    }

    // ============================================
    // MARKET ENDPOINTS
    // ============================================
    case 'offers': {
      const deviceId = searchParams.get('deviceId');
      const status = searchParams.get('status');

      let offerList = Array.from(offers.values());

      if (deviceId) {
        offerList = offerList.filter((o) => o.deviceId === deviceId);
      }
      if (status) {
        offerList = offerList.filter((o) => o.status === status);
      }

      return NextResponse.json({
        offers: offerList,
        count: offerList.length,
      });
    }

    case 'market-price': {
      const gridZone = searchParams.get('gridZone') || 'CAISO';
      const price = simulateMarketPrice(gridZone);

      return NextResponse.json({
        gridZone,
        currentPriceUsd: price,
        priceKaus: price / KAUS_PRICE,
        timestamp: new Date().toISOString(),
        carbonIntensity: calculateCarbonCredits(1, gridZone) * 1000, // g/kWh
      });
    }

    // ============================================
    // SETTLEMENT ENDPOINTS
    // ============================================
    case 'settlements': {
      const deviceId = searchParams.get('deviceId');
      let settlementList = Array.from(settlements.values());

      if (deviceId) {
        settlementList = settlementList.filter(
          (s) => s.sellerDeviceId === deviceId || s.buyerDeviceId === deviceId
        );
      }

      return NextResponse.json({
        settlements: settlementList,
        count: settlementList.length,
      });
    }

    // ============================================
    // CARBON CREDITS
    // ============================================
    case 'carbon-credits': {
      const deviceId = searchParams.get('deviceId');
      const device = devices.get(deviceId || '');

      if (!device) {
        return NextResponse.json({ error: 'Device not found' }, { status: 404 });
      }

      const deviceSettlements = Array.from(settlements.values()).filter(
        (s) => s.sellerDeviceId === deviceId && s.status === 'COMPLETED'
      );

      const totalCredits = deviceSettlements.reduce((sum, s) => sum + s.carbonCredits, 0);

      return NextResponse.json({
        deviceId,
        totalCreditsTco2: totalCredits,
        verified: true,
        verificationStandard: 'ISO-14064-2',
        certificates: deviceSettlements.map((s) => ({
          id: `CC-${s.settlementId}`,
          amountTco2: s.carbonCredits,
          issuedAt: s.settledAt,
          registry: 'VERRA',
        })),
        marketValueUsd: totalCredits * 30, // ~$30/tCO2
      });
    }

    // ============================================
    // GRID SERVICES
    // ============================================
    case 'grid-services': {
      const gridZone = searchParams.get('gridZone') || 'CAISO';

      return NextResponse.json({
        gridZone,
        availableServices: [
          {
            type: 'FREQUENCY_RESPONSE',
            pricePerKwUsd: 0.05,
            demand: 'HIGH',
            minCapacityKw: 1,
          },
          {
            type: 'SPINNING_RESERVE',
            pricePerKwUsd: 0.03,
            demand: 'MEDIUM',
            minCapacityKw: 100,
          },
          {
            type: 'DEMAND_RESPONSE',
            pricePerKwUsd: 0.08,
            demand: 'LOW',
            minCapacityKw: 10,
          },
        ],
        timestamp: new Date().toISOString(),
      });
    }

    // ============================================
    // API INFO
    // ============================================
    default:
      return NextResponse.json({
        api: 'Field Nine M2M Simulation Sandbox',
        version: '1.0',
        description: 'Machine-to-Machine Energy Settlement API for Partner Integration Testing',
        documentation: 'https://docs.fieldnine.io/m2m',
        endpoints: {
          devices: {
            GET: '/api/m2m/sandbox?action=devices',
            POST: '/api/m2m/sandbox (action: register-device)',
          },
          market: {
            GET: '/api/m2m/sandbox?action=offers',
            GET_PRICE: '/api/m2m/sandbox?action=market-price&gridZone={zone}',
            POST: '/api/m2m/sandbox (action: create-offer)',
          },
          settlement: {
            GET: '/api/m2m/sandbox?action=settlements',
            POST: '/api/m2m/sandbox (action: execute-settlement)',
          },
          carbon: {
            GET: '/api/m2m/sandbox?action=carbon-credits&deviceId={id}',
          },
          grid: {
            GET: '/api/m2m/sandbox?action=grid-services&gridZone={zone}',
            POST: '/api/m2m/sandbox (action: participate-grid-service)',
          },
        },
        sampleDevices: Array.from(devices.keys()),
        supportedGridZones: ['CAISO', 'ERCOT', 'PJM', 'NEM', 'EPEX'],
      });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      // ============================================
      // REGISTER DEVICE
      // ============================================
      case 'register-device': {
        const { deviceId, deviceType, capacityKwh, maxPowerKw, location, capabilities, ownerWallet } = body;

        if (!deviceId || !deviceType) {
          return NextResponse.json(
            { error: 'deviceId and deviceType are required' },
            { status: 400 }
          );
        }

        const device: Device = {
          deviceId,
          deviceType,
          capacityKwh: capacityKwh || 0,
          maxPowerKw: maxPowerKw || 0,
          location: location || { latitude: 0, longitude: 0, gridZone: 'DEFAULT' },
          capabilities: capabilities || [],
          ownerWallet: ownerWallet || '0x0000...0000',
          registeredAt: new Date().toISOString(),
        };

        devices.set(deviceId, device);

        return NextResponse.json({
          success: true,
          device,
          message: `Device ${deviceId} registered successfully`,
        });
      }

      // ============================================
      // CREATE OFFER
      // ============================================
      case 'create-offer': {
        const {
          deviceId,
          offerType,
          energyKwh,
          minPriceUsd,
          maxPriceUsd,
          availableFrom,
          availableUntil,
          autoAccept,
        } = body;

        const device = devices.get(deviceId);
        if (!device) {
          return NextResponse.json({ error: 'Device not found' }, { status: 404 });
        }

        if (!energyKwh || energyKwh <= 0) {
          return NextResponse.json({ error: 'Valid energyKwh required' }, { status: 400 });
        }

        const offerId = generateId('OFF');
        const marketPrice = simulateMarketPrice(device.location.gridZone);
        const estimatedRevenue = energyKwh * marketPrice;
        const carbonCredits = calculateCarbonCredits(energyKwh, device.location.gridZone);

        const offer: MarketOffer = {
          offerId,
          deviceId,
          offerType: offerType || 'SELL',
          energyKwh,
          minPriceUsd: minPriceUsd || marketPrice * 0.9,
          maxPriceUsd: maxPriceUsd || marketPrice * 1.2,
          availableFrom: availableFrom || new Date().toISOString(),
          availableUntil: availableUntil || new Date(Date.now() + 4 * 3600000).toISOString(),
          autoAccept: autoAccept ?? true,
          status: 'ACTIVE',
          matchedBuyers: Math.floor(Math.random() * 5) + 1,
          estimatedRevenueUsd: estimatedRevenue,
          estimatedRevenueKaus: estimatedRevenue / KAUS_PRICE,
          carbonCreditsPending: carbonCredits,
          createdAt: new Date().toISOString(),
        };

        offers.set(offerId, offer);

        return NextResponse.json({
          success: true,
          offer,
          message: `Offer ${offerId} created successfully`,
        });
      }

      // ============================================
      // EXECUTE SETTLEMENT
      // ============================================
      case 'execute-settlement': {
        const { offerId, buyerDeviceId, energyDeliveredKwh, meteredAt, meterSignature } = body;

        const offer = offers.get(offerId);
        if (!offer) {
          return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
        }

        if (offer.status !== 'ACTIVE') {
          return NextResponse.json({ error: 'Offer is not active' }, { status: 400 });
        }

        const sellerDevice = devices.get(offer.deviceId);
        if (!sellerDevice) {
          return NextResponse.json({ error: 'Seller device not found' }, { status: 404 });
        }

        const energyKwh = energyDeliveredKwh || offer.energyKwh;
        const pricePerKwh = simulateMarketPrice(sellerDevice.location.gridZone);
        const totalUsd = energyKwh * pricePerKwh;
        const totalKaus = totalUsd / KAUS_PRICE;
        const carbonCredits = calculateCarbonCredits(energyKwh, sellerDevice.location.gridZone);

        const settlementId = generateId('SET');
        const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;

        const settlement: Settlement = {
          settlementId,
          offerId,
          sellerDeviceId: offer.deviceId,
          buyerDeviceId: buyerDeviceId || 'GRID',
          energyKwh,
          pricePerKwh,
          totalUsd,
          totalKaus,
          carbonCredits,
          transactionHash,
          status: 'COMPLETED',
          settledAt: new Date().toISOString(),
        };

        settlements.set(settlementId, settlement);
        offer.status = 'MATCHED';

        return NextResponse.json({
          success: true,
          settlement,
          message: `Settlement completed in ${(Math.random() * 2 + 1).toFixed(2)} seconds`,
          carbonCertificateId: `CC-${settlementId}`,
        });
      }

      // ============================================
      // PARTICIPATE IN GRID SERVICE
      // ============================================
      case 'participate-grid-service': {
        const { deviceId, serviceType, capacityKw, responsTimeMs, durationMinutes, pricePerKwUsd } = body;

        const device = devices.get(deviceId);
        if (!device) {
          return NextResponse.json({ error: 'Device not found' }, { status: 404 });
        }

        if (!device.capabilities.includes(serviceType)) {
          return NextResponse.json(
            { error: `Device does not support ${serviceType}` },
            { status: 400 }
          );
        }

        const participationId = generateId('GRID');
        const estimatedRevenue = (capacityKw || device.maxPowerKw * 0.5) * (pricePerKwUsd || 0.05) * ((durationMinutes || 60) / 60);

        return NextResponse.json({
          success: true,
          participationId,
          deviceId,
          serviceType,
          capacityKw: capacityKw || device.maxPowerKw * 0.5,
          durationMinutes: durationMinutes || 60,
          estimatedRevenueUsd: estimatedRevenue,
          estimatedRevenueKaus: estimatedRevenue / KAUS_PRICE,
          status: 'ENROLLED',
          startTime: new Date().toISOString(),
          message: `Device enrolled in ${serviceType}`,
        });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[M2M Sandbox Error]', error);
    return NextResponse.json(
      { error: 'Operation failed', details: String(error) },
      { status: 500 }
    );
  }
}
