import { Suspense, lazy } from "react";
import { ClientOnly } from "@tanstack/react-router";
import type { PeakList } from "@/data/peak-lists";

/**
 * Leaflet reads `window` on import, which crashed the server render of the
 * challenge lists page. Keep it client-only and lazily loaded.
 */
const ListMap = lazy(() => import("@/components/community/ListMap"));

const MapFallback = () => (
  <div className="h-[380px] w-full animate-pulse rounded-lg border border-border bg-muted/40" />
);

interface Props {
  list: PeakList;
  climbedKeys: Set<string>;
}

const LazyListMap = (props: Props) => (
  <ClientOnly fallback={<MapFallback />}>
    <Suspense fallback={<MapFallback />}>
      <ListMap {...props} />
    </Suspense>
  </ClientOnly>
);

export default LazyListMap;
