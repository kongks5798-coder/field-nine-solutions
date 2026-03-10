// analytics.ts — PostHog event tracking utility
// All key business events in one place for easy management

import posthog from "posthog-js";

// Type-safe event names
export type AnalyticsEvent =
  | "ai_generate_start"
  | "ai_generate_complete"
  | "ai_generate_error"
  | "app_published"
  | "app_forked"
  | "app_viewed"
  | "explain_opened"
  | "autocomplete_accepted"
  | "template_selected"
  | "workspace_opened"
  | "upgrade_modal_shown"
  | "pricing_page_viewed"
  | "payment_started"
  | "payment_complete"
  | "collab_started"
  | "plan_downgrade_scheduled"
  | "plan_upgrade_started";

export function track(
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean | null>
) {
  try {
    if (typeof window === "undefined") return;
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    posthog.capture(event, properties ?? {});
  } catch {
    // Never throw from analytics
  }
}
