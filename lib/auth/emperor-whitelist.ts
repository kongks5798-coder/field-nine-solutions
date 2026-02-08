/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 84: UNIFIED MASTER AUTHORITY - EMPEROR WHITELIST
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Single source of truth for Emperor identification
 * - Email-based identification regardless of OAuth provider (Google/Kakao)
 * - Auto-upgrade to admin role in Supabase profiles
 * - Centralized authority configuration
 */

// The one and only Emperor email - works with ANY OAuth provider
export const EMPEROR_EMAIL = 'kongks5798@gmail.com';

// Alternative Emperor identifiers (for future expansion)
export const EMPEROR_EMAILS = [
  'kongks5798@gmail.com',
];

// Check if email belongs to Emperor
export function isEmperor(email: string | null | undefined): boolean {
  if (!email) return false;
  return EMPEROR_EMAILS.includes(email.toLowerCase());
}

// Role types
export type UserRole = 'EMPEROR' | 'ADMIN' | 'CITIZEN';

// Get role from email
export function getRoleFromEmail(email: string | null | undefined): UserRole {
  if (isEmperor(email)) return 'EMPEROR';
  return 'CITIZEN';
}

// Check if user has admin access (Emperor or Admin)
export function hasAdminAccess(role: UserRole | string | null | undefined): boolean {
  if (!role) return false;
  const upperRole = role.toUpperCase();
  return upperRole === 'EMPEROR' || upperRole === 'ADMIN';
}
