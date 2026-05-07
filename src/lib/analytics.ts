"use client";

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(event: string, properties: AnalyticsProperties = {}) {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({
    event,
    properties,
    path: window.location.pathname,
    ts: new Date().toISOString(),
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", new Blob([payload], { type: "application/json" }));
    return;
  }

  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Analytics must never interrupt the product flow.
  });
}
