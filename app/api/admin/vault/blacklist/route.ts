/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 83: IMPERIAL GUARD - IP BLACKLIST API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Security endpoint for managing vault access blacklist
 * - Records failed authentication attempts
 * - Automatically blacklists IPs after 3 failures
 * - Sends alert to Emperor via Telegram
 * - SHA-256 audit trail for all security events
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

interface BlacklistEntry {
  ip: string;
  reason: string;
  failedAttempts: number;
  firstAttempt: string;
  lastAttempt: string;
  blacklistedAt?: string;
  userAgent?: string;
  signature: string;
}

const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// In-memory store (in production, use Redis or database)
const failedAttempts: Map<string, {
  count: number;
  firstAttempt: Date;
  lastAttempt: Date;
  userAgent?: string;
}> = new Map();

const blacklist: Map<string, BlacklistEntry> = new Map();

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

function generateSecuritySignature(data: object): string {
  const payload = JSON.stringify(data);
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (cfConnectingIP) return cfConnectingIP;
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  if (realIP) return realIP;

  return 'unknown';
}

async function sendEmperorAlert(entry: BlacklistEntry): Promise<void> {
  // Telegram notification to Emperor
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const emperorChatId = process.env.TELEGRAM_EMPEROR_CHAT_ID;

  if (!telegramBotToken || !emperorChatId) {
    console.log('[Imperial Guard] Telegram not configured, skipping alert');
    return;
  }

  const message = `
🚨 *IMPERIAL GUARD ALERT*

*Security Breach Attempt Detected*

IP: \`${entry.ip}\`
Failed Attempts: ${entry.failedAttempts}
First Attempt: ${entry.firstAttempt}
Last Attempt: ${entry.lastAttempt}
User Agent: ${entry.userAgent || 'Unknown'}

Signature: \`${entry.signature.slice(0, 16)}...\`

The IP has been added to the blacklist.
  `.trim();

  try {
    await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: emperorChatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
    console.log('[Imperial Guard] Alert sent to Emperor');
  } catch (error) {
    console.error('[Imperial Guard] Failed to send alert:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST: Record Failed Attempt
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || undefined;
  const now = new Date();

  try {
    const body = await request.json().catch(() => ({}));
    const { type, email } = body;

    // Check if already blacklisted
    const existingEntry = blacklist.get(ip);
    if (existingEntry) {
      const blacklistedTime = new Date(existingEntry.blacklistedAt!).getTime();
      const elapsed = Date.now() - blacklistedTime;

      if (elapsed < LOCKOUT_DURATION_MS) {
        return NextResponse.json({
          success: false,
          blocked: true,
          remainingMs: LOCKOUT_DURATION_MS - elapsed,
          message: 'IP is blacklisted',
        }, { status: 403 });
      } else {
        // Lockout expired, remove from blacklist
        blacklist.delete(ip);
        failedAttempts.delete(ip);
      }
    }

    // Record failed attempt
    const current = failedAttempts.get(ip) || {
      count: 0,
      firstAttempt: now,
      lastAttempt: now,
      userAgent,
    };

    current.count++;
    current.lastAttempt = now;
    failedAttempts.set(ip, current);

    console.log(`[Imperial Guard] Failed attempt #${current.count} from ${ip}`);

    // Check if should blacklist
    if (current.count >= MAX_FAILED_ATTEMPTS) {
      const entry: BlacklistEntry = {
        ip,
        reason: type === 'keypad' ? 'Failed keypad authentication' : 'Failed authentication',
        failedAttempts: current.count,
        firstAttempt: current.firstAttempt.toISOString(),
        lastAttempt: current.lastAttempt.toISOString(),
        blacklistedAt: now.toISOString(),
        userAgent,
        signature: generateSecuritySignature({
          ip,
          count: current.count,
          timestamp: now.toISOString(),
          userAgent,
        }),
      };

      blacklist.set(ip, entry);

      // Log to database if available
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from('security_events').insert({
            event_type: 'IP_BLACKLISTED',
            ip_address: ip,
            user_agent: userAgent,
            details: entry,
            created_at: now.toISOString(),
          });
        } catch (dbError) {
          console.error('[Imperial Guard] DB log error:', dbError);
        }
      }

      // Send alert to Emperor
      await sendEmperorAlert(entry);

      return NextResponse.json({
        success: false,
        blocked: true,
        message: 'IP has been blacklisted due to multiple failed attempts',
        signature: entry.signature,
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      attemptsRemaining: MAX_FAILED_ATTEMPTS - current.count,
      message: `${MAX_FAILED_ATTEMPTS - current.count} attempts remaining before lockout`,
    });

  } catch (error) {
    console.error('[Imperial Guard] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal error',
    }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET: Check Blacklist Status
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);

  const entry = blacklist.get(ip);
  if (entry) {
    const blacklistedTime = new Date(entry.blacklistedAt!).getTime();
    const elapsed = Date.now() - blacklistedTime;

    if (elapsed < LOCKOUT_DURATION_MS) {
      return NextResponse.json({
        blocked: true,
        remainingMs: LOCKOUT_DURATION_MS - elapsed,
        reason: entry.reason,
      });
    } else {
      // Lockout expired
      blacklist.delete(ip);
      failedAttempts.delete(ip);
    }
  }

  const attempts = failedAttempts.get(ip);

  return NextResponse.json({
    blocked: false,
    attemptsUsed: attempts?.count || 0,
    attemptsRemaining: MAX_FAILED_ATTEMPTS - (attempts?.count || 0),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE: Clear Blacklist Entry (Emperor only)
// ═══════════════════════════════════════════════════════════════════════════════

export async function DELETE(request: NextRequest) {
  // This should be protected by auth middleware in production
  const { searchParams } = new URL(request.url);
  const ipToClear = searchParams.get('ip');

  if (!ipToClear) {
    return NextResponse.json({
      success: false,
      error: 'IP parameter required',
    }, { status: 400 });
  }

  blacklist.delete(ipToClear);
  failedAttempts.delete(ipToClear);

  console.log(`[Imperial Guard] Cleared blacklist entry for ${ipToClear}`);

  return NextResponse.json({
    success: true,
    message: `Blacklist entry cleared for ${ipToClear}`,
  });
}
