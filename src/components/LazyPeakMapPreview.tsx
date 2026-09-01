import { Suspense, lazy } from "react";
import { ClientOnly } from "@tanstack/react-router";

/** Leaflet touches `window` on import — keep the preview client-only. */
const PeakMapPreview = lazy(() => import("@/components/PeakMapPreview"));

const MapFallback = () => (
  <div className="h-[360px] w-full animate-pulse rounded-lg border border-border bg-muted/40" />
);

interface Props {
  lat: number;
  lng: number;
  label: string;
  zoom?: number;
  className?: string;
}

const LazyPeakMapPreview = (props: Props) => (
  <ClientOnly fallback={<MapFallback />}>
    <Suspense fallback={<MapFallback />}>
      <PeakMapPreview {...props} />
    </Suspense>
  </ClientOnly>
);

export default LazyPeakMapPreview;
