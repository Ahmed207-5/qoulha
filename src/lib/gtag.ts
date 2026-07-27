/**
 * Google Analytics 4 (gtag.js) helpers.
 *
 * GA is fully optional: every function here is a no-op if
 * NEXT_PUBLIC_GA_MEASUREMENT_ID is unset (local dev, PR previews, etc.) or
 * if window.gtag hasn't loaded yet, so nothing here can ever throw or block
 * rendering.
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Sends a page_view event for the given path (+ query string, if any). */
export function pageview(url: string): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('config', GA_MEASUREMENT_ID, { page_path: url });
}

/** Sends a custom GA4 event. Not required by the current pageview tracking,
 * but kept here so future features (e.g. "message sent", "share clicked")
 * have one consistent place to report events from instead of each
 * reaching into window.gtag directly. */
export function event(params: {
  action: string;
  category?: string;
  label?: string;
  value?: number;
}): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', params.action, {
    event_category: params.category,
    event_label: params.label,
    value: params.value,
  });
}
