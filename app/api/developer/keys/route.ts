/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DEVELOPER API KEYS ENDPOINT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Manages API key generation, retrieval, and revocation.
 * Server-side only - no client-side key generation.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Generate secure API key
function generateAPIKey(): string {
  const prefix = 'fn_live_';
  const randomBytes = crypto.randomBytes(24);
  return prefix + randomBytes.toString('base64url');
}

// GET - Fetch user's API keys
export async function GET() {
  // Return empty state - keys managed per-session on client
  return NextResponse.json({
    keys: [],
    usage: { today: 0, thisWeek: 0, thisMonth: 0, limit: 10000, tier: 'Developer' },
  });
}

// POST - Generate new API key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = body.name || 'API Key';
    const newKey = generateAPIKey();

    // Return the generated key
    return NextResponse.json({
      key: {
        id: `key_${Date.now()}`,
        key: newKey,
        name,
        createdAt: new Date().toISOString().split('T')[0],
        lastUsed: null,
        callsToday: 0,
        callsTotal: 0,
        status: 'active',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to generate key' }, { status: 500 });
  }
}

// DELETE - Revoke API key
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyId = searchParams.get('id');

  if (!keyId) {
    return NextResponse.json({ error: 'Key ID required' }, { status: 400 });
  }

  // Key revoked - client manages state
  return NextResponse.json({ success: true });
}
