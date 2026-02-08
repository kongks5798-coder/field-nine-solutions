/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 50: UNIVERSAL ENERGY CONNECTOR
 * ═══════════════════════════════════════════════════════════════════════════════
 * 모든 에너지원을 하나의 표준 인터페이스로 통합
 * Sandbox Mode for API Testing
 * Enterprise-grade scalability
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export type EnergySourceType = 'SOLAR' | 'WIND' | 'HYDRO' | 'NUCLEAR' | 'EV_BATTERY' | 'ESS' | 'GRID';
export type APICategory = 'V2G' | 'GRID' | 'ESG' | 'TRADING' | 'ANALYTICS' | 'IOT';
export type SubscriptionTier = 'FREE' | 'PRO' | 'ENTERPRISE';
export type SandboxMode = 'LIVE' | 'SANDBOX';

export interface APIEndpoint {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  category: APICategory;
  version: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  // Pricing
  pricePerCall: number;      // KAUS per call
  monthlyFreeQuota: number;  // Free calls per month
  // Rate limits
  rateLimit: {
    free: number;      // calls per minute
    pro: number;
    enterprise: number;
  };
  // Requirements
  requiredTier: SubscriptionTier;
  requiresAuth: boolean;
  // Documentation
  requestSchema: Record<string, unknown>;
  responseSchema: Record<string, unknown>;
  exampleRequest: Record<string, unknown>;
  exampleResponse: Record<string, unknown>;
  // Status
  status: 'ACTIVE' | 'BETA' | 'DEPRECATED';
  latencyMs: number;
  uptime: number; // percentage
}

export interface UnifiedEnergyData {
  sourceType: EnergySourceType;
  sourceId: string;
  timestamp: string;
  // Power metrics
  currentOutputKW: number;
  maxCapacityKW: number;
  utilizationPercent: number;
  // Energy metrics
  totalEnergyKWh: number;
  todayEnergyKWh: number;
  // Efficiency
  efficiency: number;
  carbonIntensity: number; // gCO2/kWh
  // Status
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR';
  healthScore: number;
  // Location
  location?: {
    lat: number;
    lng: number;
    region: string;
  };
  // Metadata
  metadata?: Record<string, unknown>;
}

export interface APISubscription {
  tier: SubscriptionTier;
  name: string;
  nameKo: string;
  priceKAUS: number;        // Monthly price
  priceKRW: number;
  features: string[];
  featuresKo: string[];
  apiCallsPerMonth: number;
  supportLevel: string;
  sla: number;              // % uptime guarantee
  dedicatedSupport: boolean;
  customIntegration: boolean;
}

export interface APIUsageStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalCostKAUS: number;
  avgLatencyMs: number;
  topEndpoints: { endpoint: string; calls: number }[];
  dailyUsage: { date: string; calls: number }[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// API CATALOG
// ═══════════════════════════════════════════════════════════════════════════════

export const API_CATALOG: APIEndpoint[] = [
  // V2G Fleet Control APIs
  {
    id: 'v2g-fleet-status',
    name: 'V2G Fleet Status',
    nameKo: 'V2G 차량 상태',
    description: 'Get real-time status of all V2G-enabled vehicles in fleet',
    descriptionKo: 'V2G 지원 차량 전체의 실시간 상태 조회',
    category: 'V2G',
    version: 'v2',
    endpoint: '/api/v2/fleet/status',
    method: 'GET',
    pricePerCall: 0.1,
    monthlyFreeQuota: 1000,
    rateLimit: { free: 10, pro: 100, enterprise: 1000 },
    requiredTier: 'FREE',
    requiresAuth: true,
    requestSchema: {
      fleetId: 'string (optional)',
      region: 'string (optional)',
    },
    responseSchema: {
      vehicles: 'Vehicle[]',
      totalCount: 'number',
      onlineCount: 'number',
      totalCapacityKWh: 'number',
    },
    exampleRequest: { fleetId: 'fleet-001', region: 'seoul' },
    exampleResponse: {
      vehicles: [{ id: 'EV-001', status: 'CHARGING', soc: 75, powerKW: 11 }],
      totalCount: 150,
      onlineCount: 142,
      totalCapacityKWh: 12500,
    },
    status: 'ACTIVE',
    latencyMs: 45,
    uptime: 99.97,
  },
  {
    id: 'v2g-discharge-control',
    name: 'V2G Discharge Control',
    nameKo: 'V2G 방전 제어',
    description: 'Command vehicle to discharge energy to grid',
    descriptionKo: '차량에서 그리드로 에너지 방전 명령',
    category: 'V2G',
    version: 'v2',
    endpoint: '/api/v2/fleet/discharge',
    method: 'POST',
    pricePerCall: 0.5,
    monthlyFreeQuota: 100,
    rateLimit: { free: 5, pro: 50, enterprise: 500 },
    requiredTier: 'PRO',
    requiresAuth: true,
    requestSchema: {
      vehicleId: 'string (required)',
      powerKW: 'number (required)',
      durationMinutes: 'number (required)',
      minSoC: 'number (optional, default: 20)',
    },
    responseSchema: {
      commandId: 'string',
      status: 'ACCEPTED | REJECTED',
      estimatedEnergyKWh: 'number',
      estimatedRevenueKAUS: 'number',
    },
    exampleRequest: { vehicleId: 'EV-001', powerKW: 7, durationMinutes: 60, minSoC: 30 },
    exampleResponse: {
      commandId: 'cmd-abc123',
      status: 'ACCEPTED',
      estimatedEnergyKWh: 7,
      estimatedRevenueKAUS: 8.4,
    },
    status: 'ACTIVE',
    latencyMs: 120,
    uptime: 99.95,
  },
  {
    id: 'v2g-smart-schedule',
    name: 'V2G Smart Scheduling',
    nameKo: 'V2G 스마트 스케줄링',
    description: 'AI-optimized charging/discharging schedule for maximum profit',
    descriptionKo: 'AI 최적화 충방전 스케줄로 수익 극대화',
    category: 'V2G',
    version: 'v2',
    endpoint: '/api/v2/fleet/schedule',
    method: 'POST',
    pricePerCall: 1.0,
    monthlyFreeQuota: 50,
    rateLimit: { free: 2, pro: 20, enterprise: 200 },
    requiredTier: 'PRO',
    requiresAuth: true,
    requestSchema: {
      vehicleIds: 'string[] (required)',
      optimizationGoal: 'PROFIT | CARBON | BALANCED',
      timeRangeHours: 'number (required)',
    },
    responseSchema: {
      schedule: 'ScheduleItem[]',
      projectedProfitKAUS: 'number',
      carbonSavedKg: 'number',
    },
    exampleRequest: { vehicleIds: ['EV-001', 'EV-002'], optimizationGoal: 'PROFIT', timeRangeHours: 24 },
    exampleResponse: {
      schedule: [
        { vehicleId: 'EV-001', action: 'CHARGE', startTime: '02:00', endTime: '06:00' },
        { vehicleId: 'EV-001', action: 'DISCHARGE', startTime: '18:00', endTime: '21:00' },
      ],
      projectedProfitKAUS: 125.5,
      carbonSavedKg: 45.2,
    },
    status: 'ACTIVE',
    latencyMs: 250,
    uptime: 99.9,
  },

  // Grid Load Predictor APIs
  {
    id: 'grid-load-forecast',
    name: 'Grid Load Forecast',
    nameKo: '그리드 부하 예측',
    description: 'AI-powered grid load prediction up to 72 hours',
    descriptionKo: 'AI 기반 최대 72시간 그리드 부하 예측',
    category: 'GRID',
    version: 'v2',
    endpoint: '/api/v2/grid/forecast',
    method: 'GET',
    pricePerCall: 0.3,
    monthlyFreeQuota: 500,
    rateLimit: { free: 20, pro: 200, enterprise: 2000 },
    requiredTier: 'FREE',
    requiresAuth: true,
    requestSchema: {
      region: 'string (required)',
      hoursAhead: 'number (1-72, default: 24)',
      granularity: '15min | 1hour | 1day',
    },
    responseSchema: {
      forecasts: 'ForecastPoint[]',
      confidence: 'number',
      modelVersion: 'string',
    },
    exampleRequest: { region: 'seoul', hoursAhead: 24, granularity: '1hour' },
    exampleResponse: {
      forecasts: [
        { timestamp: '2026-01-27T00:00:00Z', loadMW: 8500, priceKRW: 95 },
        { timestamp: '2026-01-27T01:00:00Z', loadMW: 7800, priceKRW: 88 },
      ],
      confidence: 0.94,
      modelVersion: 'prophet-v3.2',
    },
    status: 'ACTIVE',
    latencyMs: 180,
    uptime: 99.98,
  },
  {
    id: 'grid-realtime-price',
    name: 'Real-time Energy Price',
    nameKo: '실시간 에너지 가격',
    description: 'Live energy prices from KPX and regional markets',
    descriptionKo: 'KPX 및 지역 시장 실시간 에너지 가격',
    category: 'GRID',
    version: 'v2',
    endpoint: '/api/v2/grid/price',
    method: 'GET',
    pricePerCall: 0.05,
    monthlyFreeQuota: 5000,
    rateLimit: { free: 60, pro: 600, enterprise: 6000 },
    requiredTier: 'FREE',
    requiresAuth: true,
    requestSchema: {
      market: 'KPX | REGIONAL | ALL',
      includeHistory: 'boolean (optional)',
    },
    responseSchema: {
      currentPrice: 'number',
      currency: 'string',
      trend: 'UP | DOWN | STABLE',
      history24h: 'PricePoint[]',
    },
    exampleRequest: { market: 'KPX', includeHistory: true },
    exampleResponse: {
      currentPrice: 118.5,
      currency: 'KRW/kWh',
      trend: 'UP',
      history24h: [{ timestamp: '2026-01-26T00:00:00Z', price: 95.2 }],
    },
    status: 'ACTIVE',
    latencyMs: 25,
    uptime: 99.99,
  },
  {
    id: 'grid-congestion-map',
    name: 'Grid Congestion Map',
    nameKo: '그리드 혼잡도 맵',
    description: 'Real-time grid congestion levels by region',
    descriptionKo: '지역별 실시간 그리드 혼잡도',
    category: 'GRID',
    version: 'v2',
    endpoint: '/api/v2/grid/congestion',
    method: 'GET',
    pricePerCall: 0.2,
    monthlyFreeQuota: 1000,
    rateLimit: { free: 30, pro: 300, enterprise: 3000 },
    requiredTier: 'FREE',
    requiresAuth: true,
    requestSchema: {
      regions: 'string[] (optional)',
      includeSubstations: 'boolean (optional)',
    },
    responseSchema: {
      regions: 'RegionCongestion[]',
      overallHealth: 'number',
      criticalAreas: 'string[]',
    },
    exampleRequest: { regions: ['seoul', 'busan'], includeSubstations: true },
    exampleResponse: {
      regions: [{ id: 'seoul', congestionLevel: 0.72, status: 'MODERATE' }],
      overallHealth: 85,
      criticalAreas: ['gangnam-substation-3'],
    },
    status: 'ACTIVE',
    latencyMs: 90,
    uptime: 99.95,
  },

  // ESG Carbon Certifier APIs
  {
    id: 'esg-carbon-footprint',
    name: 'Carbon Footprint Calculator',
    nameKo: '탄소 발자국 계산',
    description: 'Calculate carbon emissions for energy consumption',
    descriptionKo: '에너지 소비에 따른 탄소 배출량 계산',
    category: 'ESG',
    version: 'v2',
    endpoint: '/api/v2/esg/carbon',
    method: 'POST',
    pricePerCall: 0.15,
    monthlyFreeQuota: 500,
    rateLimit: { free: 20, pro: 200, enterprise: 2000 },
    requiredTier: 'FREE',
    requiresAuth: true,
    requestSchema: {
      energyKWh: 'number (required)',
      sourceType: 'EnergySourceType',
      region: 'string',
      period: 'string (ISO date range)',
    },
    responseSchema: {
      carbonKg: 'number',
      carbonIntensity: 'number',
      equivalents: 'CarbonEquivalent[]',
      offsetCostKAUS: 'number',
    },
    exampleRequest: { energyKWh: 1000, sourceType: 'GRID', region: 'seoul', period: '2026-01' },
    exampleResponse: {
      carbonKg: 420.5,
      carbonIntensity: 420.5,
      equivalents: [{ type: 'trees', value: 19.1, description: 'Trees needed to absorb' }],
      offsetCostKAUS: 42.05,
    },
    status: 'ACTIVE',
    latencyMs: 75,
    uptime: 99.96,
  },
  {
    id: 'esg-rec-certificate',
    name: 'REC Certificate Issuance',
    nameKo: 'REC 인증서 발급',
    description: 'Issue Renewable Energy Certificates for green energy',
    descriptionKo: '재생에너지 인증서 발급',
    category: 'ESG',
    version: 'v2',
    endpoint: '/api/v2/esg/rec/issue',
    method: 'POST',
    pricePerCall: 5.0,
    monthlyFreeQuota: 10,
    rateLimit: { free: 1, pro: 10, enterprise: 100 },
    requiredTier: 'PRO',
    requiresAuth: true,
    requestSchema: {
      energyKWh: 'number (required)',
      sourceId: 'string (required)',
      sourceType: 'SOLAR | WIND | HYDRO',
      beneficiaryId: 'string (required)',
    },
    responseSchema: {
      certificateId: 'string',
      serialNumber: 'string',
      energyMWh: 'number',
      validUntil: 'string',
      blockchainTxHash: 'string',
    },
    exampleRequest: { energyKWh: 1000, sourceId: 'solar-001', sourceType: 'SOLAR', beneficiaryId: 'company-abc' },
    exampleResponse: {
      certificateId: 'REC-2026-001234',
      serialNumber: 'KR-REC-2026-0001234',
      energyMWh: 1,
      validUntil: '2027-01-26',
      blockchainTxHash: '0xabc123...',
    },
    status: 'ACTIVE',
    latencyMs: 350,
    uptime: 99.9,
  },
  {
    id: 'esg-compliance-report',
    name: 'ESG Compliance Report',
    nameKo: 'ESG 준수 보고서',
    description: 'Generate comprehensive ESG compliance report',
    descriptionKo: '종합 ESG 준수 보고서 생성',
    category: 'ESG',
    version: 'v2',
    endpoint: '/api/v2/esg/report',
    method: 'POST',
    pricePerCall: 10.0,
    monthlyFreeQuota: 5,
    rateLimit: { free: 1, pro: 5, enterprise: 50 },
    requiredTier: 'ENTERPRISE',
    requiresAuth: true,
    requestSchema: {
      companyId: 'string (required)',
      period: 'string (required)',
      frameworks: 'GRI | SASB | TCFD | CDP[]',
      includeAudit: 'boolean',
    },
    responseSchema: {
      reportId: 'string',
      status: 'COMPLETED',
      downloadUrl: 'string',
      metrics: 'ESGMetrics',
      grade: 'A+ | A | B | C | D',
    },
    exampleRequest: { companyId: 'company-abc', period: '2025', frameworks: ['GRI', 'TCFD'], includeAudit: true },
    exampleResponse: {
      reportId: 'RPT-2026-0001',
      status: 'COMPLETED',
      downloadUrl: 'https://api.fieldnine.io/reports/RPT-2026-0001.pdf',
      metrics: { carbonScore: 85, socialScore: 78, governanceScore: 92 },
      grade: 'A',
    },
    status: 'ACTIVE',
    latencyMs: 2500,
    uptime: 99.8,
  },

  // Trading APIs
  {
    id: 'trading-market-depth',
    name: 'Energy Market Depth',
    nameKo: '에너지 시장 깊이',
    description: 'Real-time order book for energy trading',
    descriptionKo: '에너지 거래 실시간 호가창',
    category: 'TRADING',
    version: 'v2',
    endpoint: '/api/v2/trading/depth',
    method: 'GET',
    pricePerCall: 0.02,
    monthlyFreeQuota: 10000,
    rateLimit: { free: 120, pro: 1200, enterprise: 12000 },
    requiredTier: 'FREE',
    requiresAuth: true,
    requestSchema: {
      market: 'string (required)',
      depth: 'number (1-100, default: 20)',
    },
    responseSchema: {
      bids: 'Order[]',
      asks: 'Order[]',
      spread: 'number',
      lastPrice: 'number',
      volume24h: 'number',
    },
    exampleRequest: { market: 'KAUS-KRW', depth: 10 },
    exampleResponse: {
      bids: [{ price: 119.5, quantity: 5000 }, { price: 119.0, quantity: 8000 }],
      asks: [{ price: 120.5, quantity: 3000 }, { price: 121.0, quantity: 6000 }],
      spread: 1.0,
      lastPrice: 120.0,
      volume24h: 1250000,
    },
    status: 'ACTIVE',
    latencyMs: 15,
    uptime: 99.99,
  },
  {
    id: 'trading-execute-order',
    name: 'Execute Trade Order',
    nameKo: '거래 주문 실행',
    description: 'Place buy/sell order on energy market',
    descriptionKo: '에너지 시장 매수/매도 주문',
    category: 'TRADING',
    version: 'v2',
    endpoint: '/api/v2/trading/order',
    method: 'POST',
    pricePerCall: 0.1,
    monthlyFreeQuota: 500,
    rateLimit: { free: 10, pro: 100, enterprise: 1000 },
    requiredTier: 'PRO',
    requiresAuth: true,
    requestSchema: {
      market: 'string (required)',
      side: 'BUY | SELL',
      type: 'MARKET | LIMIT',
      quantity: 'number (required)',
      price: 'number (required for LIMIT)',
    },
    responseSchema: {
      orderId: 'string',
      status: 'FILLED | PARTIAL | PENDING',
      filledQuantity: 'number',
      avgPrice: 'number',
      feeKAUS: 'number',
    },
    exampleRequest: { market: 'KAUS-KRW', side: 'BUY', type: 'LIMIT', quantity: 100, price: 120 },
    exampleResponse: {
      orderId: 'ORD-2026-abc123',
      status: 'FILLED',
      filledQuantity: 100,
      avgPrice: 119.8,
      feeKAUS: 0.12,
    },
    status: 'ACTIVE',
    latencyMs: 35,
    uptime: 99.98,
  },

  // Analytics APIs
  {
    id: 'analytics-energy-insights',
    name: 'Energy Consumption Insights',
    nameKo: '에너지 소비 인사이트',
    description: 'AI-powered energy consumption analysis and recommendations',
    descriptionKo: 'AI 기반 에너지 소비 분석 및 추천',
    category: 'ANALYTICS',
    version: 'v2',
    endpoint: '/api/v2/analytics/insights',
    method: 'POST',
    pricePerCall: 0.5,
    monthlyFreeQuota: 100,
    rateLimit: { free: 5, pro: 50, enterprise: 500 },
    requiredTier: 'PRO',
    requiresAuth: true,
    requestSchema: {
      entityId: 'string (required)',
      period: 'string (required)',
      includeRecommendations: 'boolean',
    },
    responseSchema: {
      totalConsumptionKWh: 'number',
      peakDemandKW: 'number',
      costKAUS: 'number',
      savingOpportunities: 'Opportunity[]',
      recommendations: 'Recommendation[]',
    },
    exampleRequest: { entityId: 'building-001', period: '2026-01', includeRecommendations: true },
    exampleResponse: {
      totalConsumptionKWh: 45000,
      peakDemandKW: 150,
      costKAUS: 3750,
      savingOpportunities: [{ type: 'PEAK_SHIFT', potentialSavingKAUS: 450 }],
      recommendations: [{ priority: 'HIGH', action: 'Shift EV charging to off-peak hours' }],
    },
    status: 'ACTIVE',
    latencyMs: 400,
    uptime: 99.9,
  },

  // IoT APIs
  {
    id: 'iot-device-register',
    name: 'IoT Device Registration',
    nameKo: 'IoT 기기 등록',
    description: 'Register energy monitoring devices to the platform',
    descriptionKo: '에너지 모니터링 기기 플랫폼 등록',
    category: 'IOT',
    version: 'v2',
    endpoint: '/api/v2/iot/devices',
    method: 'POST',
    pricePerCall: 1.0,
    monthlyFreeQuota: 50,
    rateLimit: { free: 5, pro: 50, enterprise: 500 },
    requiredTier: 'PRO',
    requiresAuth: true,
    requestSchema: {
      deviceType: 'METER | INVERTER | CHARGER | SENSOR',
      manufacturer: 'string',
      model: 'string',
      serialNumber: 'string (required)',
      location: 'Location',
    },
    responseSchema: {
      deviceId: 'string',
      apiKey: 'string',
      mqttTopic: 'string',
      status: 'REGISTERED',
    },
    exampleRequest: { deviceType: 'METER', manufacturer: 'Siemens', model: 'PAC3200', serialNumber: 'SN-12345' },
    exampleResponse: {
      deviceId: 'DEV-2026-001234',
      apiKey: 'fld9_dev_abc123xyz',
      mqttTopic: 'fieldnine/devices/DEV-2026-001234/telemetry',
      status: 'REGISTERED',
    },
    status: 'ACTIVE',
    latencyMs: 150,
    uptime: 99.95,
  },
  {
    id: 'iot-telemetry-stream',
    name: 'IoT Telemetry Stream',
    nameKo: 'IoT 텔레메트리 스트림',
    description: 'Real-time telemetry data from registered devices',
    descriptionKo: '등록된 기기의 실시간 텔레메트리 데이터',
    category: 'IOT',
    version: 'v2',
    endpoint: '/api/v2/iot/telemetry',
    method: 'GET',
    pricePerCall: 0.01,
    monthlyFreeQuota: 50000,
    rateLimit: { free: 100, pro: 1000, enterprise: 10000 },
    requiredTier: 'FREE',
    requiresAuth: true,
    requestSchema: {
      deviceIds: 'string[] (required)',
      metrics: 'string[] (optional)',
      startTime: 'string (ISO)',
      endTime: 'string (ISO)',
    },
    responseSchema: {
      data: 'TelemetryPoint[]',
      deviceCount: 'number',
      dataPoints: 'number',
    },
    exampleRequest: { deviceIds: ['DEV-001'], metrics: ['power', 'voltage'], startTime: '2026-01-26T00:00:00Z' },
    exampleResponse: {
      data: [{ deviceId: 'DEV-001', timestamp: '2026-01-26T12:00:00Z', power: 5.2, voltage: 380 }],
      deviceCount: 1,
      dataPoints: 288,
    },
    status: 'ACTIVE',
    latencyMs: 30,
    uptime: 99.97,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION TIERS
// ═══════════════════════════════════════════════════════════════════════════════

export const SUBSCRIPTION_TIERS: APISubscription[] = [
  {
    tier: 'FREE',
    name: 'Free',
    nameKo: '무료',
    priceKAUS: 0,
    priceKRW: 0,
    features: [
      'Basic API Access',
      '5,000 API calls/month',
      'Community Support',
      'Standard Rate Limits',
      'Sandbox Environment',
    ],
    featuresKo: [
      '기본 API 접근',
      '월 5,000회 API 호출',
      '커뮤니티 지원',
      '표준 속도 제한',
      '샌드박스 환경',
    ],
    apiCallsPerMonth: 5000,
    supportLevel: 'Community',
    sla: 99.0,
    dedicatedSupport: false,
    customIntegration: false,
  },
  {
    tier: 'PRO',
    name: 'Pro',
    nameKo: '프로',
    priceKAUS: 500,
    priceKRW: 60000,
    features: [
      'Full API Access',
      '100,000 API calls/month',
      'Email Support (24h response)',
      'Increased Rate Limits (10x)',
      'Production Environment',
      'Webhooks & Streaming',
      'Advanced Analytics',
    ],
    featuresKo: [
      '전체 API 접근',
      '월 100,000회 API 호출',
      '이메일 지원 (24시간 내 응답)',
      '속도 제한 10배 증가',
      '프로덕션 환경',
      '웹훅 & 스트리밍',
      '고급 분석',
    ],
    apiCallsPerMonth: 100000,
    supportLevel: 'Email',
    sla: 99.5,
    dedicatedSupport: false,
    customIntegration: false,
  },
  {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    nameKo: '엔터프라이즈',
    priceKAUS: 5000,
    priceKRW: 600000,
    features: [
      'Unlimited API Access',
      'Unlimited API calls',
      'Dedicated Account Manager',
      'Custom Rate Limits',
      'Private Infrastructure',
      'SLA 99.99% Guarantee',
      'Custom Integrations',
      'White-label Options',
      'On-premise Deployment',
    ],
    featuresKo: [
      '무제한 API 접근',
      '무제한 API 호출',
      '전담 어카운트 매니저',
      '맞춤 속도 제한',
      '프라이빗 인프라',
      'SLA 99.99% 보장',
      '맞춤형 통합',
      '화이트라벨 옵션',
      '온프레미스 배포',
    ],
    apiCallsPerMonth: -1, // Unlimited
    supportLevel: 'Dedicated',
    sla: 99.99,
    dedicatedSupport: true,
    customIntegration: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SANDBOX MODE - SIMULATED API RESPONSES
// ═══════════════════════════════════════════════════════════════════════════════

export interface SandboxConfig {
  mode: SandboxMode;
  apiKey: string;
  latencySimulation: boolean;
  errorRate: number; // 0-1, probability of simulated error
}

const defaultSandboxConfig: SandboxConfig = {
  mode: 'SANDBOX',
  apiKey: 'sandbox_test_key',
  latencySimulation: true,
  errorRate: 0.02,
};

export function generateSandboxResponse(
  endpoint: APIEndpoint,
  request: Record<string, unknown>,
  config: SandboxConfig = defaultSandboxConfig
): { success: boolean; data?: Record<string, unknown>; error?: string; latencyMs: number } {
  // Simulate error based on error rate
  if (Math.random() < config.errorRate) {
    return {
      success: false,
      error: 'Simulated API error for testing',
      latencyMs: Math.floor(endpoint.latencyMs * (0.5 + Math.random())),
    };
  }

  // Generate realistic mock data based on endpoint
  const mockData = generateMockData(endpoint, request);

  return {
    success: true,
    data: mockData,
    latencyMs: config.latencySimulation
      ? Math.floor(endpoint.latencyMs * (0.8 + Math.random() * 0.4))
      : 0,
  };
}

function generateMockData(endpoint: APIEndpoint, _request: Record<string, unknown>): Record<string, unknown> {
  const now = new Date().toISOString();

  switch (endpoint.id) {
    case 'v2g-fleet-status':
      return {
        vehicles: Array.from({ length: 10 }, (_, i) => ({
          id: `EV-${String(i + 1).padStart(3, '0')}`,
          status: ['IDLE', 'CHARGING', 'DISCHARGING', 'OFFLINE'][Math.floor(Math.random() * 4)],
          soc: Math.floor(20 + Math.random() * 80),
          powerKW: Math.floor(Math.random() * 11),
          location: { lat: 37.5 + Math.random() * 0.1, lng: 127 + Math.random() * 0.1 },
        })),
        totalCount: 150,
        onlineCount: 142,
        totalCapacityKWh: 12500,
        timestamp: now,
      };

    case 'grid-load-forecast':
      return {
        forecasts: Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(Date.now() + i * 3600000).toISOString(),
          loadMW: 7000 + Math.floor(Math.random() * 3000),
          priceKRW: 80 + Math.floor(Math.random() * 60),
          confidence: 0.85 + Math.random() * 0.1,
        })),
        confidence: 0.94,
        modelVersion: 'prophet-v3.2',
        generatedAt: now,
      };

    case 'grid-realtime-price':
      return {
        currentPrice: 100 + Math.floor(Math.random() * 40),
        currency: 'KRW/kWh',
        trend: ['UP', 'DOWN', 'STABLE'][Math.floor(Math.random() * 3)],
        change24h: (Math.random() - 0.5) * 10,
        history24h: Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
          price: 90 + Math.floor(Math.random() * 50),
        })),
        timestamp: now,
      };

    case 'trading-market-depth':
      return {
        bids: Array.from({ length: 10 }, (_, i) => ({
          price: 120 - i * 0.5,
          quantity: 1000 + Math.floor(Math.random() * 5000),
        })),
        asks: Array.from({ length: 10 }, (_, i) => ({
          price: 120.5 + i * 0.5,
          quantity: 1000 + Math.floor(Math.random() * 5000),
        })),
        spread: 0.5,
        lastPrice: 120,
        volume24h: 1250000 + Math.floor(Math.random() * 500000),
        timestamp: now,
      };

    default:
      return { ...endpoint.exampleResponse, timestamp: now };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED ENERGY CONNECTOR
// ═══════════════════════════════════════════════════════════════════════════════

export class NexusConnector {
  private apiKey: string;
  private sandboxConfig: SandboxConfig;
  private baseUrl: string;

  constructor(apiKey: string, mode: SandboxMode = 'SANDBOX') {
    this.apiKey = apiKey;
    this.sandboxConfig = {
      ...defaultSandboxConfig,
      mode,
      apiKey,
    };
    this.baseUrl = mode === 'LIVE'
      ? 'https://api.fieldnine.io'
      : 'https://sandbox.fieldnine.io';
  }

  async callAPI(
    endpointId: string,
    request: Record<string, unknown> = {}
  ): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string; latencyMs: number }> {
    const endpoint = API_CATALOG.find(e => e.id === endpointId);

    if (!endpoint) {
      return { success: false, error: `Endpoint not found: ${endpointId}`, latencyMs: 0 };
    }

    // In sandbox mode, return simulated response
    if (this.sandboxConfig.mode === 'SANDBOX') {
      const response = generateSandboxResponse(endpoint, request, this.sandboxConfig);

      // Simulate latency
      if (this.sandboxConfig.latencySimulation) {
        await new Promise(resolve => setTimeout(resolve, response.latencyMs));
      }

      return response;
    }

    // In live mode, make actual API call
    try {
      const startTime = Date.now();
      const response = await fetch(`${this.baseUrl}${endpoint.endpoint}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Version': endpoint.version,
        },
        body: endpoint.method !== 'GET' ? JSON.stringify(request) : undefined,
      });

      const data = await response.json();
      const latencyMs = Date.now() - startTime;

      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        error: !response.ok ? data.message : undefined,
        latencyMs,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latencyMs: 0,
      };
    }
  }

  // Unified energy data fetcher
  async getUnifiedEnergyData(sourceIds: string[]): Promise<UnifiedEnergyData[]> {
    const results: UnifiedEnergyData[] = [];

    for (const sourceId of sourceIds) {
      const sourceType = this.inferSourceType(sourceId);
      const data = await this.fetchSourceData(sourceId, sourceType);
      if (data) results.push(data);
    }

    return results;
  }

  private inferSourceType(sourceId: string): EnergySourceType {
    if (sourceId.startsWith('solar')) return 'SOLAR';
    if (sourceId.startsWith('wind')) return 'WIND';
    if (sourceId.startsWith('ev')) return 'EV_BATTERY';
    if (sourceId.startsWith('ess')) return 'ESS';
    if (sourceId.startsWith('hydro')) return 'HYDRO';
    if (sourceId.startsWith('nuclear')) return 'NUCLEAR';
    return 'GRID';
  }

  private async fetchSourceData(sourceId: string, sourceType: EnergySourceType): Promise<UnifiedEnergyData | null> {
    // Unified interface regardless of source type
    const baseOutput = 50 + Math.random() * 200;
    const maxCapacity = 500;

    return {
      sourceType,
      sourceId,
      timestamp: new Date().toISOString(),
      currentOutputKW: baseOutput,
      maxCapacityKW: maxCapacity,
      utilizationPercent: (baseOutput / maxCapacity) * 100,
      totalEnergyKWh: Math.floor(10000 + Math.random() * 50000),
      todayEnergyKWh: Math.floor(100 + Math.random() * 500),
      efficiency: 0.85 + Math.random() * 0.1,
      carbonIntensity: sourceType === 'GRID' ? 400 + Math.random() * 100 : 0,
      status: 'ONLINE',
      healthScore: 85 + Math.floor(Math.random() * 15),
      location: {
        lat: 37.5 + Math.random() * 0.5,
        lng: 127 + Math.random() * 0.5,
        region: 'Seoul',
      },
    };
  }

  // API usage tracking
  async getUsageStats(): Promise<APIUsageStats> {
    return {
      totalCalls: Math.floor(50000 + Math.random() * 50000),
      successfulCalls: Math.floor(48000 + Math.random() * 2000),
      failedCalls: Math.floor(100 + Math.random() * 500),
      totalCostKAUS: Math.floor(500 + Math.random() * 1500),
      avgLatencyMs: 50 + Math.floor(Math.random() * 100),
      topEndpoints: [
        { endpoint: 'grid-realtime-price', calls: 25000 },
        { endpoint: 'v2g-fleet-status', calls: 15000 },
        { endpoint: 'trading-market-depth', calls: 12000 },
      ],
      dailyUsage: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
        calls: 1000 + Math.floor(Math.random() * 2000),
      })),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getAPIsByCategory(category: APICategory): APIEndpoint[] {
  return API_CATALOG.filter(api => api.category === category);
}

export function getAPIsByTier(tier: SubscriptionTier): APIEndpoint[] {
  const tierOrder: Record<SubscriptionTier, number> = { FREE: 0, PRO: 1, ENTERPRISE: 2 };
  return API_CATALOG.filter(api => tierOrder[api.requiredTier] <= tierOrder[tier]);
}

export function calculateMonthlyCost(
  tier: SubscriptionTier,
  estimatedCalls: number,
  endpoints: string[]
): { baseCost: number; usageCost: number; totalCost: number } {
  const subscription = SUBSCRIPTION_TIERS.find(t => t.tier === tier)!;
  const baseCost = subscription.priceKAUS;

  let usageCost = 0;
  const callsPerEndpoint = estimatedCalls / endpoints.length;

  for (const endpointId of endpoints) {
    const endpoint = API_CATALOG.find(e => e.id === endpointId);
    if (!endpoint) continue;

    const billableCalls = Math.max(0, callsPerEndpoint - endpoint.monthlyFreeQuota);
    usageCost += billableCalls * endpoint.pricePerCall;
  }

  return {
    baseCost,
    usageCost: Math.round(usageCost * 100) / 100,
    totalCost: Math.round((baseCost + usageCost) * 100) / 100,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const NexusAPI = {
  catalog: API_CATALOG,
  tiers: SUBSCRIPTION_TIERS,
  Connector: NexusConnector,
  getAPIsByCategory,
  getAPIsByTier,
  calculateMonthlyCost,
  generateSandboxResponse,
};

export default NexusAPI;
