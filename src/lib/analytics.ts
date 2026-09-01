import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * GA4 (Google Analytics 4) measurement ID. Read from the Lovable Google
 * Analytics connector env var when present, or a manual VITE_GA_MEASUREMENT_ID.
 * Measurement IDs are publishable, so this is safe to expose client-side.
 */
const env = import.meta.env as Record<string, string | undefined>;
const GA_MEASUREMENT_ID =
  env['VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY'] || env['VITE_GA_MEASUREMENT_ID'] || "";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialised = false;

/** Inject the gtag.js snippet once, the first time a track call runs. */
function ensureInit() {
  if (initialised || typeof window === "undefined" || !GA_MEASUREMENT_ID) return;
  if (window.gtag) {
    initialised = true;
    return;
  }
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  // We fire page_view manually on route changes, so disable the auto one.
  window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });
  initialised = true;
}

export function isAnalyticsEnabled() {
  return Boolean(GA_MEASUREMENT_ID);
}

/** Fire a GA4 page_view for the given path. Safe to call on every route change. */
export function trackPageView(path: string) {
  if (typeof window === "undefined") return;
  ensureInit();
  if (!window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
  });
}

/** Fire a custom GA4 event (e.g. conversion). No-ops until a measurement ID is set. */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  ensureInit();
  if (!window.gtag) return;
  window.gtag("event", name, params);
}

/**
 * Mount once in the root layout. Fires a page_view on the initial load and on
 * every client-side navigation. Uses reactive router state so it re-runs on
 * path changes. SSR-safe: the effect only runs in the browser.
 */
export function useAnalyticsPageViews() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
}
