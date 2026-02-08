/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 61: VAPID PUBLIC KEY API
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // VAPID public key for Web Push
  // In production, generate your own keys using: npx web-push generate-vapid-keys
  const publicKey = process.env.VAPID_PUBLIC_KEY || 'BFake_PUBLIC_KEY_FOR_DEVELOPMENT_ONLY_Replace_In_Production_12345678901234567890';

  return NextResponse.json({
    publicKey,
    // Include environment indicator for client
    isConfigured: !!process.env.VAPID_PUBLIC_KEY,
  });
}
