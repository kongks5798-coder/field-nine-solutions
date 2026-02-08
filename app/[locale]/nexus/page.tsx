/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 65: NEXUS ROOT - REDIRECT TO ENERGY DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Core Energy Triad 진입점
 * 모든 /nexus 접근을 /nexus/energy로 리다이렉트
 */

import { redirect } from 'next/navigation';

export default function NexusPage() {
  redirect('/nexus/energy');
}
