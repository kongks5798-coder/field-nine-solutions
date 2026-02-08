/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 61: OPENAPI SPECIFICATION ENDPOINT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Serves the OpenAPI 3.1 specification in JSON format
 */

import { NextResponse } from 'next/server';
import { generateOpenAPISchema } from '@/lib/api-docs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const schema = generateOpenAPISchema();

    return NextResponse.json(schema, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('OpenAPI schema generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate OpenAPI schema' },
      { status: 500 }
    );
  }
}
