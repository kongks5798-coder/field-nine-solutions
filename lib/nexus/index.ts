/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 55: NEXUS MODULE EXPORTS
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Real-Data Sync
export {
  nexusRealDataSync,
  dynamicOrderbook,
  getLiveEnergyData,
  getEnergyOrderbook,
  syncEnergyData,
  NexusRealDataSync,
  DynamicOrderbook,
} from './real-data-sync';

export type {
  SolarGenerationData,
  EnergyOrderbook,
  OrderbookEntry,
  MarketCondition,
} from './real-data-sync';

// VIBE Coupon Engine removed - Energy focus only
