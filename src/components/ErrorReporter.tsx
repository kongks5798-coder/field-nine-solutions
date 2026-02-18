"use client";
import { useEffect } from "react";

export function ErrorReporter() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    type Payload = { message: string; stack?: string; url?: string; component?: string };
    const send = (payload: Payload) => {
      try {
        fetch("/api/system/error-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {}
    };
    const onError = (event: ErrorEvent) => {
      send({
        message: event.message || "Unknown error",
        stack: event.error?.stack,
        url: window.location.href,
      });
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason as { message?: string; stack?: string } | string;
      send({
        message: typeof reason === "string" ? reason : String(reason?.message || "Unhandled rejection"),
        stack: typeof reason === "string" ? undefined : reason?.stack,
        url: window.location.href,
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
