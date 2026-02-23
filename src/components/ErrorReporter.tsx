"use client";

import { useEffect, useRef } from "react";

export function ErrorReporter() {
  const lastReport = useRef(0);

  useEffect(() => {
    const report = (payload: Record<string, unknown>) => {
      const now = Date.now();
      if (now - lastReport.current < 5000) return; // throttle 5s
      lastReport.current = now;

      // Fire-and-forget POST
      fetch("/api/error-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {}); // silently fail
    };

    const onError = (e: ErrorEvent) => {
      report({
        type: "unhandled_error",
        message: e.message,
        stack: e.error?.stack,
        url: window.location.href,
        ua: navigator.userAgent,
        ts: new Date().toISOString(),
      });
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      report({
        type: "unhandled_rejection",
        message: String(e.reason),
        stack: e.reason?.stack,
        url: window.location.href,
        ua: navigator.userAgent,
        ts: new Date().toISOString(),
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
