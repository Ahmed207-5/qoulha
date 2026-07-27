import Script from 'next/script';
import { GA_MEASUREMENT_ID } from '@/lib/gtag';

/**
 * Loads gtag.js and initializes GA4. Renders nothing (and loads nothing) if
 * NEXT_PUBLIC_GA_MEASUREMENT_ID isn't set, so local/dev/preview builds are
 * unaffected.
 *
 * `send_page_view: false` here is intentional: the initial config call
 * would otherwise fire its own page_view for the first URL, and
 * <GoogleAnalyticsPageView /> (mounted alongside this) also fires one on
 * mount — every route (including the first) is tracked from one place
 * instead of double-counting the landing page.
 */
export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
