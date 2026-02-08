/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 61: API DOCUMENTATION PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import SwaggerUI from '@/components/docs/SwaggerUI';

export const metadata = {
  title: 'API Documentation | Field Nine Solutions',
  description: 'Interactive API documentation for Field Nine Solutions platform',
};

export default function APIDocsPage() {
  return <SwaggerUI />;
}
