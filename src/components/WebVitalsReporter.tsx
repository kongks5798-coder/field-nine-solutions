"use client";

import { useEffect } from "react";
import { reportWebVitals } from "@/lib/web-vitals";

export function WebVitalsReporter() {
  useEffect(() => {
    // Dynamic import to avoid bundling web-vitals for users who don't need it
    import("web-vitals").then(({ onCLS, onLCP, onFCP, onTTFB, onINP }) => {
      onCLS(reportWebVitals);
      onLCP(reportWebVitals);
      onFCP(reportWebVitals);
      onTTFB(reportWebVitals);
      onINP(reportWebVitals);
    }).catch(() => {}); // silently fail if web-vitals not installed
  }, []);

  return null;
}
