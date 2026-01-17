/**
 * NOMAD - eSIM API Integration
 * Celitech / eSIM Go API Client
 */

// ============================================
// Configuration
// ============================================

const ESIM_API_KEY = process.env.ESIM_API_KEY;
const ESIM_API_URL = process.env.ESIM_API_URL || 'https://api.celitech.net/v1';

export function validateEsimConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!ESIM_API_KEY) errors.push('ESIM_API_KEY is not set');
  return { valid: errors.length === 0, errors };
}

// ============================================
// Types
// ============================================

export interface EsimPackage {
  id: string;
  name: string;
  destination: string;
  destinationCode: string;
  dataGB: number;
  validityDays: number;
  price: number;
  currency: string;
  type: 'local' | 'regional' | 'global';
}

export interface EsimPurchase {
  id: string;
  packageId: string;
  qrCode: string;
  qrCodeUrl: string;
  activationCode: string;
  smdpAddress: string;
  status: 'pending' | 'active' | 'expired' | 'depleted';
  dataUsedMB: number;
  dataLimitMB: number;
  expiresAt: Date;
  createdAt: Date;
}

export interface EsimUsage {
  esimId: string;
  dataUsedMB: number;
  dataLimitMB: number;
  percentUsed: number;
  status: 'active' | 'low_data' | 'depleted';
  lastUpdated: Date;
}

export interface DestinationInfo {
  code: string;
  name: string;
  flag: string;
  packages: EsimPackage[];
  networks: string[];
  coverage: 'excellent' | 'good' | 'moderate';
}

// ============================================
// Package Data (Fallback/Mock for Development)
// ============================================

const ESIM_PACKAGES: EsimPackage[] = [
  // Global
  { id: 'global-1gb-7d', name: 'Global 1GB', destination: 'Global', destinationCode: 'GLOBAL', dataGB: 1, validityDays: 7, price: 9.99, currency: 'USD', type: 'global' },
  { id: 'global-3gb-30d', name: 'Global 3GB', destination: 'Global', destinationCode: 'GLOBAL', dataGB: 3, validityDays: 30, price: 24.99, currency: 'USD', type: 'global' },
  { id: 'global-5gb-30d', name: 'Global 5GB', destination: 'Global', destinationCode: 'GLOBAL', dataGB: 5, validityDays: 30, price: 39.99, currency: 'USD', type: 'global' },
  { id: 'global-10gb-30d', name: 'Global 10GB', destination: 'Global', destinationCode: 'GLOBAL', dataGB: 10, validityDays: 30, price: 69.99, currency: 'USD', type: 'global' },

  // Japan
  { id: 'jp-1gb-7d', name: 'Japan 1GB', destination: 'Japan', destinationCode: 'JP', dataGB: 1, validityDays: 7, price: 4.99, currency: 'USD', type: 'local' },
  { id: 'jp-3gb-15d', name: 'Japan 3GB', destination: 'Japan', destinationCode: 'JP', dataGB: 3, validityDays: 15, price: 11.99, currency: 'USD', type: 'local' },
  { id: 'jp-5gb-30d', name: 'Japan 5GB', destination: 'Japan', destinationCode: 'JP', dataGB: 5, validityDays: 30, price: 17.99, currency: 'USD', type: 'local' },
  { id: 'jp-10gb-30d', name: 'Japan 10GB', destination: 'Japan', destinationCode: 'JP', dataGB: 10, validityDays: 30, price: 29.99, currency: 'USD', type: 'local' },
  { id: 'jp-unlimited-7d', name: 'Japan Unlimited', destination: 'Japan', destinationCode: 'JP', dataGB: -1, validityDays: 7, price: 24.99, currency: 'USD', type: 'local' },

  // South Korea
  { id: 'kr-1gb-7d', name: 'Korea 1GB', destination: 'South Korea', destinationCode: 'KR', dataGB: 1, validityDays: 7, price: 4.99, currency: 'USD', type: 'local' },
  { id: 'kr-3gb-15d', name: 'Korea 3GB', destination: 'South Korea', destinationCode: 'KR', dataGB: 3, validityDays: 15, price: 10.99, currency: 'USD', type: 'local' },
  { id: 'kr-5gb-30d', name: 'Korea 5GB', destination: 'South Korea', destinationCode: 'KR', dataGB: 5, validityDays: 30, price: 15.99, currency: 'USD', type: 'local' },
  { id: 'kr-unlimited-7d', name: 'Korea Unlimited', destination: 'South Korea', destinationCode: 'KR', dataGB: -1, validityDays: 7, price: 19.99, currency: 'USD', type: 'local' },

  // Thailand
  { id: 'th-1gb-7d', name: 'Thailand 1GB', destination: 'Thailand', destinationCode: 'TH', dataGB: 1, validityDays: 7, price: 3.99, currency: 'USD', type: 'local' },
  { id: 'th-3gb-15d', name: 'Thailand 3GB', destination: 'Thailand', destinationCode: 'TH', dataGB: 3, validityDays: 15, price: 8.99, currency: 'USD', type: 'local' },
  { id: 'th-5gb-30d', name: 'Thailand 5GB', destination: 'Thailand', destinationCode: 'TH', dataGB: 5, validityDays: 30, price: 12.99, currency: 'USD', type: 'local' },

  // Europe (Regional)
  { id: 'eu-1gb-7d', name: 'Europe 1GB', destination: 'Europe', destinationCode: 'EU', dataGB: 1, validityDays: 7, price: 5.99, currency: 'USD', type: 'regional' },
  { id: 'eu-3gb-15d', name: 'Europe 3GB', destination: 'Europe', destinationCode: 'EU', dataGB: 3, validityDays: 15, price: 13.99, currency: 'USD', type: 'regional' },
  { id: 'eu-5gb-30d', name: 'Europe 5GB', destination: 'Europe', destinationCode: 'EU', dataGB: 5, validityDays: 30, price: 19.99, currency: 'USD', type: 'regional' },
  { id: 'eu-10gb-30d', name: 'Europe 10GB', destination: 'Europe', destinationCode: 'EU', dataGB: 10, validityDays: 30, price: 34.99, currency: 'USD', type: 'regional' },

  // USA
  { id: 'us-1gb-7d', name: 'USA 1GB', destination: 'United States', destinationCode: 'US', dataGB: 1, validityDays: 7, price: 4.99, currency: 'USD', type: 'local' },
  { id: 'us-3gb-15d', name: 'USA 3GB', destination: 'United States', destinationCode: 'US', dataGB: 3, validityDays: 15, price: 11.99, currency: 'USD', type: 'local' },
  { id: 'us-5gb-30d', name: 'USA 5GB', destination: 'United States', destinationCode: 'US', dataGB: 5, validityDays: 30, price: 17.99, currency: 'USD', type: 'local' },
  { id: 'us-10gb-30d', name: 'USA 10GB', destination: 'United States', destinationCode: 'US', dataGB: 10, validityDays: 30, price: 29.99, currency: 'USD', type: 'local' },
];

// ============================================
// API Functions
// ============================================

/**
 * Get available eSIM packages for a destination
 */
export async function getPackages(destinationCode?: string): Promise<EsimPackage[]> {
  // If API is configured, fetch from API
  if (ESIM_API_KEY) {
    try {
      const url = destinationCode
        ? `${ESIM_API_URL}/packages?destination=${destinationCode}`
        : `${ESIM_API_URL}/packages`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${ESIM_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.packages || [];
      }
    } catch (error) {
      console.error('[eSIM] Get packages error:', error);
    }
  }

  // Fallback to mock data
  if (destinationCode) {
    return ESIM_PACKAGES.filter(
      (p) => p.destinationCode === destinationCode || p.destinationCode === 'GLOBAL'
    );
  }
  return ESIM_PACKAGES;
}

/**
 * Get destination information
 */
export async function getDestinations(): Promise<DestinationInfo[]> {
  const destinations: DestinationInfo[] = [
    {
      code: 'JP',
      name: 'Japan',
      flag: '🇯🇵',
      packages: ESIM_PACKAGES.filter((p) => p.destinationCode === 'JP'),
      networks: ['NTT Docomo', 'SoftBank', 'KDDI'],
      coverage: 'excellent',
    },
    {
      code: 'KR',
      name: 'South Korea',
      flag: '🇰🇷',
      packages: ESIM_PACKAGES.filter((p) => p.destinationCode === 'KR'),
      networks: ['SK Telecom', 'KT', 'LG U+'],
      coverage: 'excellent',
    },
    {
      code: 'TH',
      name: 'Thailand',
      flag: '🇹🇭',
      packages: ESIM_PACKAGES.filter((p) => p.destinationCode === 'TH'),
      networks: ['AIS', 'DTAC', 'TrueMove'],
      coverage: 'excellent',
    },
    {
      code: 'US',
      name: 'United States',
      flag: '🇺🇸',
      packages: ESIM_PACKAGES.filter((p) => p.destinationCode === 'US'),
      networks: ['T-Mobile', 'AT&T'],
      coverage: 'excellent',
    },
    {
      code: 'EU',
      name: 'Europe',
      flag: '🇪🇺',
      packages: ESIM_PACKAGES.filter((p) => p.destinationCode === 'EU'),
      networks: ['Multiple carriers in 45 countries'],
      coverage: 'excellent',
    },
    {
      code: 'GLOBAL',
      name: 'Global',
      flag: '🌍',
      packages: ESIM_PACKAGES.filter((p) => p.destinationCode === 'GLOBAL'),
      networks: ['190+ countries'],
      coverage: 'good',
    },
  ];

  return destinations;
}

/**
 * Purchase eSIM
 */
export async function purchaseEsim(
  packageId: string,
  userId: string,
  email: string
): Promise<EsimPurchase | null> {
  if (!ESIM_API_KEY) {
    // Return mock purchase for development
    const pkg = ESIM_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) return null;

    const mockPurchase: EsimPurchase = {
      id: `esim_${Date.now()}`,
      packageId,
      qrCode: generateMockQRCode(),
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=LPA:1$mock.smdp.com$${Date.now()}`,
      activationCode: `LPA:1$mock.smdp.com$${generateActivationCode()}`,
      smdpAddress: 'mock.smdp.com',
      status: 'pending',
      dataUsedMB: 0,
      dataLimitMB: pkg.dataGB === -1 ? -1 : pkg.dataGB * 1024,
      expiresAt: new Date(Date.now() + pkg.validityDays * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };

    return mockPurchase;
  }

  try {
    const response = await fetch(`${ESIM_API_URL}/esim/purchase`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ESIM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        packageId,
        customerId: userId,
        email,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to purchase eSIM');
    }

    const data = await response.json();
    return {
      id: data.id,
      packageId: data.packageId,
      qrCode: data.qrCode,
      qrCodeUrl: data.qrCodeUrl,
      activationCode: data.activationCode,
      smdpAddress: data.smdpAddress,
      status: data.status,
      dataUsedMB: 0,
      dataLimitMB: data.dataLimitMB,
      expiresAt: new Date(data.expiresAt),
      createdAt: new Date(data.createdAt),
    };
  } catch (error) {
    console.error('[eSIM] Purchase error:', error);
    return null;
  }
}

/**
 * Get eSIM usage
 */
export async function getEsimUsage(esimId: string): Promise<EsimUsage | null> {
  if (!ESIM_API_KEY) {
    // Return mock usage
    return {
      esimId,
      dataUsedMB: Math.floor(Math.random() * 500),
      dataLimitMB: 3072, // 3GB
      percentUsed: Math.floor(Math.random() * 50),
      status: 'active',
      lastUpdated: new Date(),
    };
  }

  try {
    const response = await fetch(`${ESIM_API_URL}/esim/${esimId}/usage`, {
      headers: {
        'Authorization': `Bearer ${ESIM_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get eSIM usage');
    }

    const data = await response.json();
    return {
      esimId: data.esimId,
      dataUsedMB: data.dataUsedMB,
      dataLimitMB: data.dataLimitMB,
      percentUsed: data.dataLimitMB > 0 ? Math.round((data.dataUsedMB / data.dataLimitMB) * 100) : 0,
      status: data.status,
      lastUpdated: new Date(data.lastUpdated),
    };
  } catch (error) {
    console.error('[eSIM] Get usage error:', error);
    return null;
  }
}

/**
 * Get user's eSIM history
 */
export async function getUserEsims(userId: string): Promise<EsimPurchase[]> {
  if (!ESIM_API_KEY) {
    // Return empty for development
    return [];
  }

  try {
    const response = await fetch(`${ESIM_API_URL}/customers/${userId}/esims`, {
      headers: {
        'Authorization': `Bearer ${ESIM_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user eSIMs');
    }

    const data = await response.json();
    return data.esims || [];
  } catch (error) {
    console.error('[eSIM] Get user eSIMs error:', error);
    return [];
  }
}

// ============================================
// Utility Functions
// ============================================

function generateMockQRCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateActivationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatDataSize(mb: number): string {
  if (mb === -1) return 'Unlimited';
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
}

export function getPackagePrice(pkg: EsimPackage, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(pkg.price);
}
