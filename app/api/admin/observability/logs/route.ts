/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 60: LOGS API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Structured logs endpoint with filtering and search
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In-memory log buffer (in production, this would come from a log aggregator)
interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  service: string;
  message: string;
  context?: Record<string, unknown>;
  traceId?: string;
}

// Simulated log buffer for demo (in production, use ELK, Datadog, etc.)
const logBuffer: LogEntry[] = [];
const MAX_BUFFER_SIZE = 1000;

// Log collector function (can be called from logger module)
export function collectLog(entry: Omit<LogEntry, 'id'>) {
  const logEntry: LogEntry = {
    ...entry,
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };

  logBuffer.unshift(logEntry);
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.pop();
  }
}

// Generate sample logs for demonstration
function generateSampleLogs(): LogEntry[] {
  const services = ['api', 'auth', 'payment', 'cache', 'database', 'blockchain'];
  const levels: LogEntry['level'][] = ['debug', 'info', 'warn', 'error'];
  const messages = {
    api: ['Request received', 'Response sent', 'Rate limit applied', 'Endpoint called'],
    auth: ['User logged in', 'Token validated', 'Session created', 'Permission checked'],
    payment: ['Payment initiated', 'Transaction completed', 'Refund processed', 'Webhook received'],
    cache: ['Cache hit', 'Cache miss', 'Cache invalidated', 'TTL expired'],
    database: ['Query executed', 'Connection established', 'Transaction committed', 'Index used'],
    blockchain: ['Block synced', 'Transaction broadcast', 'Contract called', 'Gas estimated'],
  };

  const sampleLogs: LogEntry[] = [];
  const now = Date.now();

  for (let i = 0; i < 50; i++) {
    const service = services[Math.floor(Math.random() * services.length)];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const serviceMessages = messages[service as keyof typeof messages];
    const message = serviceMessages[Math.floor(Math.random() * serviceMessages.length)];

    sampleLogs.push({
      id: `log-${now - i * 1000}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(now - i * Math.random() * 60000).toISOString(),
      level,
      service,
      message,
      context: {
        requestId: `req-${Math.random().toString(36).substr(2, 9)}`,
        duration: Math.floor(Math.random() * 500),
        ...(level === 'error' && { errorCode: `ERR_${Math.floor(Math.random() * 1000)}` }),
      },
      traceId: `trace-${Math.random().toString(36).substr(2, 16)}`,
    });
  }

  return sampleLogs;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const level = searchParams.get('level');
    const service = searchParams.get('service');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get logs (use buffer + sample for demo)
    let logs = logBuffer.length > 0 ? [...logBuffer] : generateSampleLogs();

    // Apply filters
    if (level && level !== 'all') {
      logs = logs.filter((log) => log.level === level);
    }

    if (service && service !== 'all') {
      logs = logs.filter((log) => log.service === service);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      logs = logs.filter(
        (log) =>
          log.message.toLowerCase().includes(searchLower) ||
          log.service.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.context).toLowerCase().includes(searchLower)
      );
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Paginate
    const totalCount = logs.length;
    const paginatedLogs = logs.slice(offset, offset + limit);

    // Get unique services for filter dropdown
    const uniqueServices = [...new Set(logs.map((log) => log.service))];

    // Count by level
    const levelCounts = {
      debug: logs.filter((l) => l.level === 'debug').length,
      info: logs.filter((l) => l.level === 'info').length,
      warn: logs.filter((l) => l.level === 'warn').length,
      error: logs.filter((l) => l.level === 'error').length,
      fatal: logs.filter((l) => l.level === 'fatal').length,
    };

    return NextResponse.json({
      logs: paginatedLogs,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      filters: {
        services: uniqueServices,
        levels: ['debug', 'info', 'warn', 'error', 'fatal'],
      },
      stats: {
        levelCounts,
        totalLogs: totalCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Logs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
