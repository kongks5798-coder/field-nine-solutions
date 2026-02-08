/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 82: NEXUS LAYOUT - ECONOMIC BRAIN INTEGRATION
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Global layout for all Nexus pages
 * - JarvisBriefingToast for real-time proactive briefings
 * - Economic Brain SSE connection
 * - System event notifications
 */

import { JarvisBriefingToast } from '@/components/nexus/jarvis-briefing-toast';

interface NexusLayoutProps {
  children: React.ReactNode;
}

export default function NexusLayout({ children }: NexusLayoutProps) {
  return (
    <>
      {children}
      <JarvisBriefingToast position="top-right" autoDismissMs={8000} />
    </>
  );
}
