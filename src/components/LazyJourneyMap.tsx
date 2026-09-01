import { Suspense, lazy } from "react";
import { ClientOnly } from "@tanstack/react-router";

/**
 * Leaflet touches `window` at import time, so the real map must never be part
 * of the server render graph. Loading it lazily behind ClientOnly keeps SSR
 * working instead of falling back to full client rendering.
 */
const JourneyMap = lazy(() => import("@/components/JourneyMap"));

const MapFallback = () => (
  <div className="mx-auto max-w-5xl px-4 py-6">
    <div className="h-[420px] w-full animate-pulse rounded-xl border border-border bg-muted/40" />
  </div>
);

const LazyJourneyMap = () => (
  <ClientOnly fallback={<MapFallback />}>
    <Suspense fallback={<MapFallback />}>
      <JourneyMap />
    </Suspense>
  </ClientOnly>
);

export default LazyJourneyMap;
