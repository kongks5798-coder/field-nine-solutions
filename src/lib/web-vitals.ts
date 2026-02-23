/**
 * Web Vitals reporting — sends CWV metrics to PostHog or /api/error-report
 */

type Metric = {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  id: string;
};

export function reportWebVitals(metric: Metric) {
  // Send to analytics endpoint (PostHog or custom)
  if (typeof window !== "undefined") {
    // PostHog custom event (if available)
    const posthog = (window as unknown as Record<string, unknown>).posthog as { capture?: (event: string, props: Record<string, unknown>) => void } | undefined;
    if (posthog?.capture) {
      posthog.capture("web_vitals", {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_rating: metric.rating,
        metric_id: metric.id,
        page_url: window.location.href,
      });
    }

    // Also log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(1)} (${metric.rating})`);
    }
  }
}
