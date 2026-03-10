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
  | "plan_upgrade_started"
  // Onboarding A/B test
  | "onboarding_shown"
  | "onboarding_completed"
  | "onboarding_example_picked"
  | "onboarding_skipped"
  | "onboarding_variant_a_template_selected"
  | "onboarding_variant_b_template_selected"
  | "onboarding_variant_b_blank_start"
  | "onboarding_variant_b_skipped"
  // Generation funnel
  | "generation_started"
  | "generation_completed"
  // Deploy & code funnel
  | "deploy_clicked"
  | "code_copied"
  | "app_shared"
  | "react_export"
  | "file_download"
  // Edit mode
  | "edit_mode_applied";

// Get A/B variant from PostHog feature flag
export function getAbVariant(flagKey: string, fallback: "A" | "B" = "A"): "A" | "B" {
  if (typeof window === "undefined") return fallback;
  try {
    // @ts-expect-error posthog global
    const ph = window.posthog;
    if (!ph) return fallback;
    const variant = ph.getFeatureFlag(flagKey) as unknown;
    return variant === "B" ? "B" : "A";
  } catch { return fallback; }
}

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
