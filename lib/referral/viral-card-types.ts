/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 57: VIRAL CARD TYPES
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { VibeAnalysis, VibeArchetype } from '@/lib/vibe/types';

// ============================================
// Aura Card Data
// ============================================

export interface AuraCardData {
  // User info
  userId: string;
  sovereignNumber: number;
  referralCode: string;

  // VIBE-ID Analysis
  analysis: VibeAnalysis;

  // Optional user image
  userImageBase64?: string;

  // Card metadata
  generatedAt: string;
  cardId: string;
}

// ============================================
// Aura Type Visual Config
// ============================================

export interface AuraTypeConfig {
  gradient: string[];
  accentColor: string;
  glowColor: string;
  badge: string;
  auraEffect: 'radial' | 'linear' | 'conic';
}

export const AURA_TYPE_CONFIG: Record<VibeArchetype, AuraTypeConfig> = {
  'silent-luxury': {
    gradient: ['#1a1a2e', '#2C3E50', '#34495E'],
    accentColor: '#C9B037',
    glowColor: 'rgba(201, 176, 55, 0.3)',
    badge: '👑',
    auraEffect: 'radial',
  },
  'urban-explorer': {
    gradient: ['#1A1A2E', '#16213E', '#0F3460'],
    accentColor: '#FF6B6B',
    glowColor: 'rgba(255, 107, 107, 0.3)',
    badge: '🏙️',
    auraEffect: 'linear',
  },
  'nature-seeker': {
    gradient: ['#1B4332', '#2D5016', '#40916C'],
    accentColor: '#95D5B2',
    glowColor: 'rgba(149, 213, 178, 0.3)',
    badge: '🌿',
    auraEffect: 'radial',
  },
  'culture-lover': {
    gradient: ['#3D1308', '#6B3F1E', '#8B4513'],
    accentColor: '#DDA15E',
    glowColor: 'rgba(221, 161, 94, 0.3)',
    badge: '🎭',
    auraEffect: 'conic',
  },
  'beach-soul': {
    gradient: ['#006D77', '#00CED1', '#83C5BE'],
    accentColor: '#FFEAA7',
    glowColor: 'rgba(255, 234, 167, 0.3)',
    badge: '🏖️',
    auraEffect: 'linear',
  },
  'adventure-spirit': {
    gradient: ['#641220', '#85182A', '#E74C3C'],
    accentColor: '#F4A261',
    glowColor: 'rgba(244, 162, 97, 0.3)',
    badge: '🗻',
    auraEffect: 'radial',
  },
  'foodie-wanderer': {
    gradient: ['#7C2D12', '#D35400', '#E67E22'],
    accentColor: '#FDEBD0',
    glowColor: 'rgba(253, 235, 208, 0.3)',
    badge: '🍜',
    auraEffect: 'conic',
  },
  'minimalist': {
    gradient: ['#F9F9F7', '#EDEDED', '#E5E5E5'],
    accentColor: '#171717',
    glowColor: 'rgba(23, 23, 23, 0.1)',
    badge: '◻️',
    auraEffect: 'linear',
  },
  'romantic-dreamer': {
    gradient: ['#4A1942', '#9B59B6', '#BB8FCE'],
    accentColor: '#FADBD8',
    glowColor: 'rgba(250, 219, 216, 0.3)',
    badge: '💫',
    auraEffect: 'radial',
  },
};

// ============================================
// Card Generation Options
// ============================================

export interface CardGenerationOptions {
  format: 'instagram-story' | 'instagram-square' | 'twitter' | 'general';
  quality: 'low' | 'medium' | 'high';
  includeQR: boolean;
  includeReferralCode: boolean;
  theme: 'dark' | 'light' | 'auto';
}

export const CARD_DIMENSIONS: Record<CardGenerationOptions['format'], { width: number; height: number }> = {
  'instagram-story': { width: 1080, height: 1920 },
  'instagram-square': { width: 1080, height: 1080 },
  'twitter': { width: 1200, height: 675 },
  'general': { width: 800, height: 1000 },
};

// ============================================
// Share Config
// ============================================

export interface ShareConfig {
  platform: 'instagram' | 'twitter' | 'native' | 'clipboard';
  cardDataUrl: string;
  shareText: string;
  shareTextKo: string;
  referralLink: string;
}
