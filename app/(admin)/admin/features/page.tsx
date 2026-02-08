/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 62: FEATURE MANAGEMENT PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import FeatureManagement from '@/components/admin/FeatureManagement';

export const metadata = {
  title: 'Feature Management | Admin',
  description: 'Manage feature flags and A/B experiments',
};

export default function FeaturesPage() {
  return <FeatureManagement />;
}
