'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { GA_MEASUREMENT_ID, pageview } from '@/lib/gtag';

/**
 * The App Router has no router "route change" event the way the Pages
 * Router did, so the standard pattern is to watch the resolved
 * pathname + search params and treat any change (including the very
 * first render) as a page view.
 *
 * useSearchParams() opts this into client-side rendering for whatever
 * subtree it's in, which is why it's split into its own tiny component
 * wrapped in <Suspense> — it does not force the rest of the page (or the
 * root layout it's mounted in) to de-opt from static rendering.
 */
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;
    const query = searchParams.toString();
    pageview(query ? `${pathname}?${query}` : pathname);
  }, [pathname, searchParams]);

  return null;
}

export function GoogleAnalyticsPageView() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  );
}
